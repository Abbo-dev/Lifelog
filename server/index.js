import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import admin from "firebase-admin";
import createApp from "./app.js";

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

const app = createApp({
  env: process.env,
  fetchImpl: fetch,
  verifyFirebaseToken,
  db,
  FieldValue,
});

const port = Number(process.env.PORT || 4242);
app.listen(port, () => {
  console.log(`LifeLog server listening on :${port}`);
});
