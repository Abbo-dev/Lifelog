import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import express from "express";
import admin from "firebase-admin";
import {
  extractUidFromPaddlePayload,
  isPremiumStatus,
  resolveNextBilledAt,
  resolvePaddleEventType,
  resolvePaddleResource,
  safeJsonParse,
  verifyPaddleWebhook,
} from "./lib/paddle.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

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

app.post("/billing/portal", express.json(), async (req, res) => {
  try {
    const decoded = await verifyFirebaseToken(req);
    const uid = decoded.uid;

    const userSnap = await db.collection("users").doc(uid).get();
    const customerId = userSnap.exists ? userSnap.data()?.paddleCustomerId : null;
    if (!customerId) {
      return res.status(404).json({ error: "No billing customer found for this account." });
    }

    const returnUrl =
      process.env.PADDLE_PORTAL_RETURN_URL ||
      `${process.env.APP_URL}/profile?billing=1`;

    const response = await fetch(
      `${paddleApiBaseUrl}/customers/${encodeURIComponent(customerId)}/portal-sessions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ return_url: returnUrl }),
      }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Paddle portal session failed", payload);
      return res
        .status(502)
        .json({ error: "Paddle portal could not be created." });
    }

    const portalUrl =
      payload?.data?.url || payload?.data?.portal_url || payload?.data?.portalUrl;

    if (!portalUrl) {
      console.error("Paddle portal response missing url", payload);
      return res.status(502).json({ error: "Portal URL missing from Paddle." });
    }

    res.json({ url: portalUrl });
  } catch (error) {
    console.error("Failed to create billing portal session", error);
    res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Unable to open billing portal." });
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
        paddleCustomerId: customerId,
        paddleLastEventType: eventType || null,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (isSubscriptionEvent) {
        userUpdate.plan = shouldBePremium ? "premium" : "free";
        userUpdate.paddleSubscriptionId = subscriptionId || null;
        userUpdate.paddleSubscriptionStatus = status;
        userUpdate.paddleNextBilledAt = nextBilledAt;
      }

      await userRef.set(userUpdate, { merge: true });

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
