import "dotenv/config";
import cors from "cors";
import express from "express";
import crypto from "crypto";
import admin from "firebase-admin";

const requiredEnv = [
  "APP_URL",
  "PADDLE_API_KEY",
  "PADDLE_WEBHOOK_SECRET",
  "PADDLE_PRICE_ID_MONTHLY",
  "PADDLE_PRICE_ID_ANNUAL",
  "FIREBASE_SERVICE_ACCOUNT_JSON",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  throw new Error(
    `Missing server env vars: ${missingEnv.join(
      ", "
    )}. Create server/.env (see server/.env.example).`
  );
}

const paddleApiBaseUrl =
  process.env.PADDLE_API_BASE_URL?.replace(/\/+$/, "") || "https://api.paddle.com";

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (error) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON (service account key)."
  );
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.APP_URL,
    credentials: true,
  })
);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const parsePaddleSignature = (headerValue) => {
  const raw = String(headerValue || "").trim();
  if (!raw) return null;

  const parts = raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  const map = {};
  for (const part of parts) {
    const [key, value] = part.split("=").map((valuePart) => valuePart?.trim());
    if (!key || !value) continue;
    map[key] = value;
  }

  if (!map.ts || !map.h1) return null;
  return { ts: map.ts, h1: map.h1 };
};

const timingSafeEqual = (a, b) => {
  if (!a || !b) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const verifyPaddleWebhook = ({ rawBody, signatureHeader, secret }) => {
  const signature = parsePaddleSignature(signatureHeader);
  if (!signature) return { ok: false, reason: "missing_signature" };

  const tsNumber = Number(signature.ts);
  if (!Number.isFinite(tsNumber)) return { ok: false, reason: "bad_timestamp" };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const skew = Math.abs(nowSeconds - tsNumber);
  if (skew > 5 * 60) return { ok: false, reason: "timestamp_skew" };

  const base = `${signature.ts}:${rawBody}`;

  const hex = crypto.createHmac("sha256", secret).update(base).digest("hex");
  const base64 = crypto.createHmac("sha256", secret).update(base).digest("base64");

  const expected =
    signature.h1.length === hex.length ? hex : signature.h1.length === base64.length ? base64 : hex;

  const ok = timingSafeEqual(expected, signature.h1);
  return ok ? { ok: true } : { ok: false, reason: "bad_signature" };
};

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractUidFromPaddlePayload = (event) => {
  const data = event?.data || event?.data?.object || {};

  const fromCustomData =
    data?.custom_data?.firebaseUid ||
    data?.custom_data?.uid ||
    event?.custom_data?.firebaseUid ||
    event?.custom_data?.uid;
  if (typeof fromCustomData === "string" && fromCustomData) return fromCustomData;

  const passthroughRaw =
    data?.passthrough || data?.checkout?.passthrough || event?.passthrough;
  if (typeof passthroughRaw === "string" && passthroughRaw) {
    const parsed = safeJsonParse(passthroughRaw);
    const passthroughUid = parsed?.firebaseUid || parsed?.uid;
    if (typeof passthroughUid === "string" && passthroughUid) return passthroughUid;
  }

  return null;
};

const resolvePaddleEventType = (event) =>
  event?.event_type || event?.type || event?.eventType || "";

const resolvePaddleResource = (event) => event?.data || event?.data?.object || event?.data?.data || {};

const normalizeSubscriptionStatus = (status) => String(status || "").toLowerCase();

const isPremiumStatus = (status) => {
  const s = normalizeSubscriptionStatus(status);
  return s === "active" || s === "trialing" || s === "past_due";
};

const verifyFirebaseToken = async (req) => {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    const error = new Error("Missing Authorization header.");
    error.statusCode = 401;
    throw error;
  }

  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (err) {
    const error = new Error("Invalid auth token.");
    error.statusCode = 401;
    error.cause = err;
    throw error;
  }
};

app.post("/create-checkout-session", express.json(), async (req, res) => {
  try {
    const decoded = await verifyFirebaseToken(req);
    const uid = decoded.uid;
    const email = decoded.email || "";

    const billingCycle = req.body?.billingCycle === "annual" ? "annual" : "monthly";
    const priceId =
      billingCycle === "annual"
        ? process.env.PADDLE_PRICE_ID_ANNUAL
        : process.env.PADDLE_PRICE_ID_MONTHLY;

    const response = await fetch(`${paddleApiBaseUrl}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        customer: email ? { email } : undefined,
        custom_data: { firebaseUid: uid, plan: "premium", billingCycle },
        checkout: {
          success_url: `${process.env.APP_URL}/pricing?success=1`,
          cancel_url: `${process.env.APP_URL}/pricing?canceled=1`,
        },
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Paddle create transaction failed", payload);
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
      console.error("Paddle response missing checkout url", payload);
      return res.status(502).json({ error: "Checkout URL missing from Paddle." });
    }

    res.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Failed to create checkout session", error);
    res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Unable to create checkout session." });
  }
});

app.post(
  "/webhook/paddle",
  express.raw({ type: "*/*" }),
  async (req, res) => {
    const signatureHeader =
      req.headers["paddle-signature"] || req.headers["Paddle-Signature"];
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";

    const verification = verifyPaddleWebhook({
      rawBody,
      signatureHeader,
      secret: process.env.PADDLE_WEBHOOK_SECRET,
    });
    if (!verification.ok) {
      console.error("Paddle webhook signature verification failed", verification.reason);
      return res.status(400).send("Invalid signature.");
    }

    const event = safeJsonParse(rawBody);
    if (!event) {
      return res.status(400).send("Invalid payload.");
    }

    try {
      const eventType = resolvePaddleEventType(event);
      const resource = resolvePaddleResource(event);

      const subscriptionId = resource?.id || resource?.subscription_id;
      const customerId =
        resource?.customer_id || resource?.customer?.id || resource?.customerId || null;
      const status = resource?.status || resource?.subscription_status || "unknown";

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
      const shouldBePremium = isSubscriptionEvent ? isPremiumStatus(status) : true;

      const userRef = db.collection("users").doc(uid);
      await userRef.set(
        {
          plan: shouldBePremium ? "premium" : "free",
          paddleCustomerId: customerId,
          paddleSubscriptionId: subscriptionId || null,
          paddleSubscriptionStatus: status,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (subscriptionId) {
        await db
          .collection("paddleSubscriptions")
          .doc(String(subscriptionId))
          .set(
            {
              uid,
              customerId,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Paddle webhook handler failed", err);
      res.status(500).send("Webhook handler failed.");
    }
  }
);

const port = Number(process.env.PORT || 4242);
app.listen(port, () => {
  console.log(`LifeLog server listening on :${port}`);
});
