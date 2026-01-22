import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import createApp from "./app.js";

const buildEnv = (overrides = {}) => ({
  APP_URL: "http://localhost:3000",
  PADDLE_API_KEY: "test-key",
  PADDLE_WEBHOOK_SECRET: "whsec_test",
  PADDLE_PRICE_ID_MONTHLY: "price_monthly",
  PADDLE_PRICE_ID_ANNUAL: "price_annual",
  ...overrides,
});

const FieldValue = {
  serverTimestamp: () => "server-ts",
};

const noopFetch = async () => ({
  ok: true,
  async json() {
    return {};
  },
});

const createFakeDb = (seed = {}) => {
  const store = new Map(Object.entries(seed));
  return {
    _store: store,
    collection(name) {
      return {
        doc(id) {
          const key = `${name}/${id}`;
          return {
            async get() {
              const data = store.get(key);
              return {
                exists: data !== undefined,
                data: () => data,
              };
            },
            async set(data, { merge } = {}) {
              if (merge && store.has(key)) {
                store.set(key, { ...store.get(key), ...data });
              } else {
                store.set(key, data);
              }
            },
          };
        },
      };
    },
  };
};

const startServer = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });

const jsonFetch = async (url, options) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
};

test("health endpoint returns ok", async (t) => {
  const db = createFakeDb();
  const app = createApp({
    env: buildEnv(),
    verifyFirebaseToken: async () => ({ uid: "user-1" }),
    db,
    FieldValue,
    fetchImpl: noopFetch,
  });

  const { server, baseUrl } = await startServer(app);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const response = await fetch(`${baseUrl}/health`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(data, { ok: true });
});

test("checkout session returns 401 when auth fails", async (t) => {
  const db = createFakeDb();
  const verifyFirebaseToken = async () => {
    const error = new Error("Missing Authorization header.");
    error.statusCode = 401;
    throw error;
  };
  const app = createApp({
    env: buildEnv(),
    verifyFirebaseToken,
    db,
    FieldValue,
    fetchImpl: noopFetch,
  });

  const { server, baseUrl } = await startServer(app);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { response, data } = await jsonFetch(
    `${baseUrl}/create-checkout-session`,
    {
      method: "POST",
      body: JSON.stringify({ billingCycle: "monthly" }),
    }
  );

  assert.equal(response.status, 401);
  assert.equal(data.error, "Missing Authorization header.");
});

test("checkout session returns checkout url on success", async (t) => {
  const db = createFakeDb();
  const verifyFirebaseToken = async () => ({
    uid: "user-1",
    email: "user@example.com",
  });
  const fetchImpl = async () => ({
    ok: true,
    async json() {
      return { data: { checkout: { url: "https://checkout.test/session" } } };
    },
  });
  const app = createApp({
    env: buildEnv(),
    verifyFirebaseToken,
    db,
    FieldValue,
    fetchImpl,
  });

  const { server, baseUrl } = await startServer(app);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { response, data } = await jsonFetch(
    `${baseUrl}/create-checkout-session`,
    {
      method: "POST",
      body: JSON.stringify({ billingCycle: "monthly" }),
    }
  );

  assert.equal(response.status, 200);
  assert.equal(data.url, "https://checkout.test/session");
});

test("billing portal returns portal url when customer exists", async (t) => {
  const db = createFakeDb({
    "users/user-123": { paddleCustomerId: "cust_123" },
  });
  const verifyFirebaseToken = async () => ({ uid: "user-123" });
  const fetchImpl = async () => ({
    ok: true,
    async json() {
      return { data: { url: "https://portal.test/session" } };
    },
  });
  const app = createApp({
    env: buildEnv(),
    verifyFirebaseToken,
    db,
    FieldValue,
    fetchImpl,
  });

  const { server, baseUrl } = await startServer(app);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { response, data } = await jsonFetch(`${baseUrl}/billing/portal`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 200);
  assert.equal(data.url, "https://portal.test/session");
});

test("webhook updates subscription data without wiping customer id", async (t) => {
  const db = createFakeDb({
    "users/user-999": { paddleCustomerId: "cust_existing" },
  });
  const app = createApp({
    env: buildEnv({ PADDLE_WEBHOOK_SECRET: "whsec_live" }),
    verifyFirebaseToken: async () => ({ uid: "unused" }),
    db,
    FieldValue,
    fetchImpl: noopFetch,
  });

  const event = {
    event_type: "subscription.updated",
    data: {
      id: "sub_123",
      status: "active",
      custom_data: { firebaseUid: "user-999" },
    },
  };
  const rawBody = JSON.stringify(event);
  const ts = Math.floor(Date.now() / 1000);
  const base = `${ts}:${rawBody}`;
  const h1 = crypto.createHmac("sha256", "whsec_live").update(base).digest("hex");
  const signatureHeader = `ts=${ts}; h1=${h1}`;

  const { server, baseUrl } = await startServer(app);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const response = await fetch(`${baseUrl}/webhook/paddle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Paddle-Signature": signatureHeader,
    },
    body: rawBody,
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.received, true);

  const userDoc = db._store.get("users/user-999");
  assert.equal(userDoc.paddleCustomerId, "cust_existing");
  assert.equal(userDoc.plan, "premium");
});

test("webhook ignores duplicate event ids", async (t) => {
  const db = createFakeDb({
    "users/user-777": { paddleCustomerId: "cust_existing" },
  });
  const app = createApp({
    env: buildEnv({ PADDLE_WEBHOOK_SECRET: "whsec_live" }),
    verifyFirebaseToken: async () => ({ uid: "unused" }),
    db,
    FieldValue,
    fetchImpl: noopFetch,
  });

  const event = {
    event_id: "evt_123",
    event_type: "subscription.updated",
    data: {
      id: "sub_123",
      status: "active",
      custom_data: { firebaseUid: "user-777" },
    },
  };
  const rawBody = JSON.stringify(event);
  const ts = Math.floor(Date.now() / 1000);
  const base = `${ts}:${rawBody}`;
  const h1 = crypto.createHmac("sha256", "whsec_live").update(base).digest("hex");
  const signatureHeader = `ts=${ts}; h1=${h1}`;

  const { server, baseUrl } = await startServer(app);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const firstResponse = await fetch(`${baseUrl}/webhook/paddle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Paddle-Signature": signatureHeader,
    },
    body: rawBody,
  });
  const firstPayload = await firstResponse.json();

  const secondResponse = await fetch(`${baseUrl}/webhook/paddle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Paddle-Signature": signatureHeader,
    },
    body: rawBody,
  });
  const secondPayload = await secondResponse.json();

  assert.equal(firstResponse.status, 200);
  assert.equal(firstPayload.received, true);
  assert.equal(secondResponse.status, 200);
  assert.equal(secondPayload.duplicate, true);
  assert.ok(db._store.get("paddleEvents/evt_123"));
});
