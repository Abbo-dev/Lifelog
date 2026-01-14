export const getUserPhotoUrl = (user) => {
  if (!user) return "";
  const direct =
    typeof user.photoURL === "string" ? user.photoURL.trim() : "";
  if (direct) return direct;

  if (!Array.isArray(user.providerData)) return "";
  const providerPhoto = user.providerData
    .map((provider) =>
      typeof provider?.photoURL === "string" ? provider.photoURL.trim() : ""
    )
    .find(Boolean);

  return providerPhoto || "";
};
