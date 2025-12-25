export const createBillingPortalSession = async ({ apiBaseUrl, token }) => {
  if (!apiBaseUrl) {
    throw new Error("Billing portal not configured.");
  }

  const response = await fetch(`${apiBaseUrl}/billing/portal`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Unable to open billing portal.");
  }

  if (!payload?.url) {
    throw new Error("Portal URL missing from server response.");
  }

  return payload.url;
};
