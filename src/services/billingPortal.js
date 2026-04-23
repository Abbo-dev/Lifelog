const PORTAL_TIMEOUT_MS = 30_000;

export const createBillingPortalSession = async ({ apiBaseUrl, token }) => {
  if (!apiBaseUrl) {
    throw new Error("Billing portal not configured.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PORTAL_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/billing/portal`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(
        "The billing server is waking up — please try again in a moment."
      );
    }
    throw new Error("Unable to reach the billing server. Please try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Unable to open billing portal.");
  }

  if (!payload?.url) {
    throw new Error("Portal URL missing from server response.");
  }

  return payload.url;
};
