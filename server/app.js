import cors from "cors";
import express from "express";
import crypto from "crypto";
import {
  extractUidFromPaddlePayload,
  isPremiumStatus,
  resolveNextBilledAt,
  resolvePaddleEventId,
  resolvePaddleEventType,
  resolvePaddleResource,
  safeJsonParse,
  verifyPaddleWebhook,
} from "./lib/paddle.js";

const createApp = ({
  env = process.env,
  fetchImpl = fetch,
  verifyFirebaseToken,
  db,
  FieldValue,
} = {}) => {
  if (!env) {
    throw new Error("Missing env configuration.");
  }
  if (typeof verifyFirebaseToken !== "function") {
    throw new Error("verifyFirebaseToken must be provided.");
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("fetchImpl must be provided.");
  }
  if (!db || !FieldValue) {
    throw new Error("Firestore dependencies must be provided.");
  }

  const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  const toNonNegativeNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  const buildExpiryDate = (days) =>
    days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

  const buildIdempotencyKey = () => {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return crypto.randomBytes(16).toString("hex");
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchWithTimeout = async (url, options, timeoutMs) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const isRetryableStatus = (status) => status >= 500 || status === 429;

  const requestWithRetry = async (url, options, { idempotencyKey } = {}) => {
    const timeoutMs = toNumber(env.PADDLE_REQUEST_TIMEOUT_MS, 10_000);
    const retries = toNonNegativeNumber(env.PADDLE_REQUEST_RETRIES, 1);
    const baseDelay = toNumber(env.PADDLE_REQUEST_RETRY_DELAY_MS, 300);
    const headers = { ...(options?.headers || {}) };
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    let attempt = 0;
    let lastError;

    while (attempt <= retries) {
      try {
        const response = await fetchWithTimeout(
          url,
          { ...options, headers },
          timeoutMs
        );
        if (
          response.ok ||
          !isRetryableStatus(response.status) ||
          attempt === retries
        ) {
          return response;
        }
        lastError = new Error(`Paddle responded with ${response.status}`);
      } catch (error) {
        lastError = error;
      }

      attempt += 1;
      if (attempt <= retries) {
        await delay(Math.min(baseDelay * 2 ** (attempt - 1), 2000));
      }
    }

    throw lastError || new Error("Paddle request failed.");
  };

  const logCollection = env.SERVER_LOG_COLLECTION || "serverEvents";
  const logTtlDays = toNonNegativeNumber(env.SERVER_LOG_TTL_DAYS, 30);
  const alertWebhookUrl = env.ALERT_WEBHOOK_URL || "";
  const alertTimeoutMs = toNumber(env.ALERT_WEBHOOK_TIMEOUT_MS, 4000);

  const logServerEvent = async ({ level, message, context }) => {
    if (!logCollection) return;
    const eventId = buildIdempotencyKey();
    const payload = {
      level,
      message,
      context,
      createdAt: FieldValue.serverTimestamp(),
    };
    const expiresAt = buildExpiryDate(logTtlDays);
    if (expiresAt) {
      payload.expiresAt = expiresAt;
    }

    try {
      await db.collection(logCollection).doc(eventId).set(payload);
    } catch (error) {
      console.error("Failed to write server log", error);
    }
  };

  const sendAlert = async ({ title, message, context }) => {
    if (!alertWebhookUrl) return;
    const text = [
      `[LifeLog] ${title}`,
      message,
      context ? JSON.stringify(context) : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await fetchWithTimeout(
        alertWebhookUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        },
        alertTimeoutMs
      );
    } catch (error) {
      console.error("Failed to send alert", error);
    }
  };

  const reportError = (title, context, { alert = false } = {}) => {
    console.error(title, context);
    void logServerEvent({ level: "error", message: title, context });
    if (alert) {
      void sendAlert({ title, message: title, context });
    }
  };

  const reportWarn = (title, context) => {
    console.warn(title, context);
    void logServerEvent({ level: "warn", message: title, context });
  };

  const createRateLimiter = ({ windowMs, max, message }) => {
    const hits = new Map();
    const cleanup = (now) => {
      for (const [key, entry] of hits.entries()) {
        if (entry.resetAt <= now) {
          hits.delete(key);
        }
      }
    };

    return (req, res, next) => {
      const now = Date.now();
      if (hits.size > 10_000) {
        cleanup(now);
      }

      const key = req.ip || "unknown";
      const entry = hits.get(key);

      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return next();
      }

      if (entry.count >= max) {
        return res.status(429).json({ error: message });
      }

      entry.count += 1;
      return next();
    };
  };

  const checkoutLimiter = createRateLimiter({
    windowMs: toNumber(env.CHECKOUT_RATE_WINDOW_MS, 5 * 60 * 1000),
    max: toNumber(env.CHECKOUT_RATE_MAX, 15),
    message: "Too many checkout attempts. Please wait and try again.",
  });
  const portalLimiter = createRateLimiter({
    windowMs: toNumber(env.PORTAL_RATE_WINDOW_MS, 5 * 60 * 1000),
    max: toNumber(env.PORTAL_RATE_MAX, 20),
    message: "Too many portal requests. Please wait and try again.",
  });
  const webhookLimiter = createRateLimiter({
    windowMs: toNumber(env.WEBHOOK_RATE_WINDOW_MS, 60 * 1000),
    max: toNumber(env.WEBHOOK_RATE_MAX, 200),
    message: "Too many webhook requests.",
  });

  const paddleApiBaseUrl =
    env.PADDLE_API_BASE_URL?.replace(/\/+$/, "") || "https://api.paddle.com";

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  const normalizeOrigin = (value) =>
    typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
  const allowedOrigins = [env.APP_URL, env.APP_URL_LOCAL]
    .map(normalizeOrigin)
    .filter(Boolean);
  const corsOrigin = (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  };

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  );

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.post("/create-checkout-session", checkoutLimiter, express.json(), async (req, res) => {
    let uid = null;
    try {
      const decoded = await verifyFirebaseToken(req);
      uid = decoded.uid;
      const email = decoded.email || "";

      const billingCycle = req.body?.billingCycle === "annual" ? "annual" : "monthly";
      const priceId =
        billingCycle === "annual"
          ? env.PADDLE_PRICE_ID_ANNUAL
          : env.PADDLE_PRICE_ID_MONTHLY;

      const idempotencyKey = buildIdempotencyKey();
      const response = await requestWithRetry(`${paddleApiBaseUrl}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ price_id: priceId, quantity: 1 }],
          customer: email ? { email } : undefined,
          custom_data: { firebaseUid: uid, plan: "premium", billingCycle },
          checkout: {
            success_url: `${env.APP_URL}/pricing?success=1`,
            cancel_url: `${env.APP_URL}/pricing?canceled=1`,
          },
        }),
      }, { idempotencyKey });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        reportError(
          "Paddle create transaction failed",
          { status: response.status, uid, payload },
          { alert: true }
        );
        return res
          .status(502)
          .json({ error: "Paddle checkout could not be created." });
      }

      const checkoutUrl =
        payload?.data?.checkout?.url ||
        payload?.data?.checkout_url ||
        payload?.data?.url ||
        payload?.checkout?.url ||
        payload?.checkout_url;

      if (!checkoutUrl) {
        reportError(
          "Paddle response missing checkout url",
          { uid, payload },
          { alert: true }
        );
        return res.status(502).json({ error: "Checkout URL missing from Paddle." });
      }

      res.json({ url: checkoutUrl });
    } catch (error) {
      const shouldAlert = !error.statusCode || error.statusCode >= 500;
      reportError(
        "Failed to create checkout session",
        { message: error.message, statusCode: error.statusCode || null, uid },
        { alert: shouldAlert }
      );
      res
        .status(error.statusCode || 500)
        .json({ error: error.message || "Unable to create checkout session." });
    }
  });

  app.post("/billing/portal", portalLimiter, express.json(), async (req, res) => {
    let uid = null;
    try {
      const decoded = await verifyFirebaseToken(req);
      uid = decoded.uid;

      const userSnap = await db.collection("users").doc(uid).get();
      const customerId = userSnap.exists ? userSnap.data()?.paddleCustomerId : null;
      if (!customerId) {
        return res.status(404).json({ error: "No billing customer found for this account." });
      }

      const subscriptionId = userSnap.exists
        ? userSnap.data()?.paddleSubscriptionId
        : null;
      const requestBody = subscriptionId
        ? { subscription_ids: [subscriptionId] }
        : null;

      const idempotencyKey = buildIdempotencyKey();
      const response = await requestWithRetry(
        `${paddleApiBaseUrl}/customers/${encodeURIComponent(customerId)}/portal-sessions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.PADDLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: requestBody ? JSON.stringify(requestBody) : undefined,
        },
        { idempotencyKey }
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        reportError(
          "Paddle portal session failed",
          { status: response.status, uid, payload, subscriptionId },
          { alert: true }
        );
        return res
          .status(502)
          .json({ error: "Paddle portal could not be created." });
      }

      const portalUrl =
        payload?.data?.urls?.general?.overview ||
        payload?.data?.url ||
        payload?.data?.portal_url ||
        payload?.data?.portalUrl;

      if (!portalUrl) {
        reportError(
          "Paddle portal response missing url",
          { uid, payload },
          { alert: true }
        );
        return res.status(502).json({ error: "Portal URL missing from Paddle." });
      }

      res.json({ url: portalUrl });
    } catch (error) {
      const shouldAlert = !error.statusCode || error.statusCode >= 500;
      reportError(
        "Failed to create billing portal session",
        { message: error.message, statusCode: error.statusCode || null, uid },
        { alert: shouldAlert }
      );
      res
        .status(error.statusCode || 500)
        .json({ error: error.message || "Unable to open billing portal." });
    }
  });

  app.post("/webhook/paddle", webhookLimiter, express.raw({ type: "*/*" }), async (req, res) => {
    const signatureHeader =
      req.headers["paddle-signature"] || req.headers["Paddle-Signature"];
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";

    const verification = verifyPaddleWebhook({
      rawBody,
      signatureHeader,
      secret: env.PADDLE_WEBHOOK_SECRET,
    });
    if (!verification.ok) {
      reportWarn("Paddle webhook signature verification failed", {
        reason: verification.reason,
      });
      return res.status(400).send("Invalid signature.");
    }

    const event = safeJsonParse(rawBody);
    if (!event) {
      return res.status(400).send("Invalid payload.");
    }

    try {
      const eventType = resolvePaddleEventType(event);
      const eventId = resolvePaddleEventId(event);
      const eventRef = eventId
        ? db.collection("paddleEvents").doc(String(eventId))
        : null;
      if (eventRef) {
        const eventSnap = await eventRef.get();
        if (eventSnap.exists) {
          return res.json({ received: true, duplicate: true });
        }
      }
      const resource = resolvePaddleResource(event);

      const subscriptionId = resource?.id || resource?.subscription_id;
      const customerId =
        resource?.customer_id || resource?.customer?.id || resource?.customerId || null;
      const status = resource?.status || resource?.subscription_status || "unknown";
      const nextBilledAt = resolveNextBilledAt(resource);

      let uid = extractUidFromPaddlePayload(event);

      if (!uid && subscriptionId) {
        const mappingSnap = await db
          .collection("paddleSubscriptions")
          .doc(String(subscriptionId))
          .get();
        uid = mappingSnap.exists ? mappingSnap.data()?.uid : null;
      }

      if (!uid) {
        console.warn("Paddle webhook missing firebase uid", { eventType });
        return res.json({ received: true });
      }

      const isSubscriptionEvent = String(eventType).startsWith("subscription.");
      const shouldBePremium = isSubscriptionEvent ? isPremiumStatus(status) : null;

      const userRef = db.collection("users").doc(uid);
      const userUpdate = {
        paddleLastEventType: eventType || null,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (customerId) {
        userUpdate.paddleCustomerId = customerId;
      }

      if (isSubscriptionEvent) {
        userUpdate.plan = shouldBePremium ? "premium" : "free";
        userUpdate.paddleSubscriptionId = subscriptionId || null;
        userUpdate.paddleSubscriptionStatus = status;
        userUpdate.paddleNextBilledAt = nextBilledAt;
      }

      await userRef.set(userUpdate, { merge: true });

      if (subscriptionId) {
        const mappingUpdate = {
          uid,
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (customerId) {
          mappingUpdate.customerId = customerId;
        }
        await db
          .collection("paddleSubscriptions")
          .doc(String(subscriptionId))
          .set(mappingUpdate, { merge: true });
      }

      if (eventRef) {
        const eventTtlDays = toNonNegativeNumber(env.PADDLE_EVENT_TTL_DAYS, 30);
        const expiresAt = buildExpiryDate(eventTtlDays);
        const eventPayload = {
          eventType: eventType || null,
          receivedAt: FieldValue.serverTimestamp(),
        };
        if (expiresAt) {
          eventPayload.expiresAt = expiresAt;
        }
        await eventRef.set(
          eventPayload,
          { merge: true }
        );
      }

      res.json({ received: true });
    } catch (err) {
      reportError(
        "Paddle webhook handler failed",
        { message: err.message, eventId: resolvePaddleEventId(event) },
        { alert: true }
      );
      res.status(500).send("Webhook handler failed.");
    }
  });

  return app;
};

export default createApp;
