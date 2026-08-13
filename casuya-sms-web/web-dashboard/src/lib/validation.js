export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
export const STRENGTH_CLASSES = ["", "strength-weak", "strength-fair", "strength-good", "strength-strong"];

export function validateEmail(email) {
  const value = email.trim();
  if (!value) return "Email address is required.";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address.";
  return "";
}

export function validatePassword(password, requireStrength = false) {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (requireStrength) {
    if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter.";
    if (!/[a-z]/.test(password)) return "Add at least one lowercase letter.";
    if (!/[0-9]/.test(password)) return "Add at least one number.";
  }
  return "";
}

export function passwordScore(password) {
  if (!password) return 0;
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
  ].filter(Boolean).length;
}

export function extractError(err, fallback = "Something went wrong. Please try again.") {
  if (err?.code === "ERR_CANCELED") return "";
  return err?.response?.data?.error || fallback;
}
