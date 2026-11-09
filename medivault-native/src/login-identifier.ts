export function normalizeLoginIdentifier(value: string) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  if (!/^[+\d\s()-]+$/.test(trimmed)) return "";
  const digits = trimmed.replace(/\D/g, "");
  const national = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return national.length === 10 ? `+91${national}` : "";
}

export function isValidLoginIdentifier(value: string) {
  const normalized = normalizeLoginIdentifier(value);
  return normalized.includes("@")
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    : /^\+91[6-9]\d{9}$/.test(normalized);
}
