const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "lowercase",
    label: "1 lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "uppercase",
    label: "1 uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "number",
    label: "1 number",
    test: (value) => /\d/.test(value),
  },
  {
    id: "symbol",
    label: "1 symbol",
    test: (value) => /[^a-zA-Z0-9]/.test(value),
  },
];

export const getPasswordRuleResults = (value = "") =>
  PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(value),
  }));

export const getPasswordValidation = (value = "") => {
  const results = getPasswordRuleResults(value);
  const isValid = results.every((rule) => rule.met);
  const message = isValid
    ? ""
    : "Password must be at least 8 characters and include uppercase and lowercase letters, a number, and a symbol.";
  return { isValid, results, message };
};
