export function normalizeLoginIdentifier(value: string) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, "").slice(-10);
  return digits ? `+91${digits}` : "";
}

export function isValidLoginIdentifier(value: string) {
  const normalized = normalizeLoginIdentifier(value);
  return normalized.includes("@")
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    : /^\+91\d{10}$/.test(normalized);
}
