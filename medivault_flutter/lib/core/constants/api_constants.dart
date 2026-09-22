class ApiConstants {
  // Configured default base URL (can be overridden via environment or settings)
  static const String defaultBaseUrl = "https://mr.yogeshaihub.in/api";
  static const String localBaseUrl = "http://10.0.2.2:3000/api"; // Android emulator localhost

  // Authentication endpoints
  static const String loginMobile = "/auth/mobile";
  static const String requestOtp = "/auth/request-otp";
  static const String session = "/auth/session";
  static const String logout = "/auth/logout";

  // Vault endpoints
  static const String vault = "/vault";

  // Storage and AI Extraction endpoints
  static const String files = "/files";
  static const String analyzeReport = "/analyze-report";

  // Doctor Share endpoints
  static const String shares = "/shares";
}
