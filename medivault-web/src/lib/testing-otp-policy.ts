// Production test access is opt-in, phone-scoped, and login-only.
// Never enable this for an account containing real patient data.
export function testingOtpAllowed(phone: string, purpose: string, env: Record<string, string | undefined> = process.env) {
  if (env.NODE_ENV === "development") return true;
  if (purpose !== "login" || env.AUTH_TEST_LOGIN_ENABLED !== "true") return false;
  const normalize = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  };
  const normalized = normalize(phone);
  if (!/^[6-9]\d{9}$/.test(normalized)) return false;
  return (env.AUTH_TEST_PHONE_NUMBERS || "").split(",").map(normalize)
    .filter((number) => /^[6-9]\d{9}$/.test(number)).includes(normalized);
}
