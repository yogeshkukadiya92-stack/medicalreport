import 'package:flutter/material.dart';

/// Exact MediVault Web Palette (medivault-web / MobileShell design standard)
/// Features the Forest Teal (#0d5c46), Jade Green (#0a7d6e), and Sage Mint palette.
class AppColors {
  // Web Canvas & Clean Surfaces
  static const Color darkBackground = Color(0xFFEEF3F1); // Web body background #eef3f1
  static const Color darkCanvas = Color(0xFFFBFDFC);     // Web shell container #fbfdfc
  static const Color darkSurface = Color(0xFFFFFFFF);    // Crisp Card White
  static const Color darkCard = Color(0xFFFFFFFF);

  // Authoritative Web Primary Accents (Forest Teal & Jade Green)
  static const Color primary = Color(0xFF0D5C46);         // #0d5c46 Web Primary Forest Teal
  static const Color primaryLight = Color(0xFF0A7D6E);    // #0a7d6e Web Upload & Action Jade
  static const Color primaryDark = Color(0xFF07382A);
  static const Color primaryGlow = Color(0xFF0D5C46);
  static const Color primarySoft = Color(0xFFEAF9F2);     // #eaf9f2 Soft Mint Pill
  static const Color primaryMint = Color(0xFFBDF5E8);     // #bdf5e8 Live Sync Banner
  static const Color primaryMintText = Color(0xFF0B5F52); // #0b5f52 Sync Banner Text
  static const Color accentTeal = Color(0xFF14B8A6);      // #14b8a6 Teal

  // Backward-compatible aliases
  static const Color neonMint = Color(0xFF0D5C46);
  static const Color neonTeal = Color(0xFF0A7D6E);
  static const Color emeraldGlow = Color(0xFF15966F);
  static const Color deepEmerald = Color(0xFF0D5C46);
  static const Color mintAccent = Color(0xFFEAF9F2);

  // Clinical Status Badges & Indicators (Matching Web resultColors & statusClass)
  static const Color critical = Color(0xFFB8443B);        // #b8443b Coral High/Low Text
  static const Color criticalGlow = Color(0xFFD9534F);    // #d9534f Border-left accent
  static const Color criticalSoft = Color(0xFFFFF0EC);    // #fff0ec Coral Badge Background
  static const Color warning = Color(0xFF8A6500);         // #8a6500 Amber Watch Text
  static const Color warningGlow = Color(0xFFD9A514);     // #d9a514 Border-left accent
  static const Color warningSoft = Color(0xFFFFF8DC);     // #fff8dc Amber Badge Background
  static const Color normal = Color(0xFF087766);          // #087766 Mint Normal Text
  static const Color normalGlow = Color(0xFF15966F);      // #15966f Border-left accent
  static const Color normalSoft = Color(0xFFEAF9F2);      // #eaf9f2 Mint Badge Background
  static const Color processing = Color(0xFF4167A8);      // #4167a8 Processing Text
  static const Color processingSoft = Color(0xFFEEF5FF);  // #eef5ff Processing Soft

  // Typography (Matching Web Deep Charcoal & Muted Slate)
  static const Color textPrimary = Color(0xFF17222B);    // #17222b Deep Slate Heading
  static const Color textSecondary = Color(0xFF71817D);  // #71817d Subtitles & dates
  static const Color textMuted = Color(0xFF879590);      // #879590 Micro labels
  static const Color ink = Color(0xFF17222B);
  static const Color muted = Color(0xFF71817D);
  static const Color inkDark = Color(0xFF17222B);
  static const Color mutedDark = Color(0xFF71817D);

  // Background & Surfaces
  static const Color backgroundLight = Color(0xFFEEF3F1); // #eef3f1
  static const Color canvasLight = Color(0xFFFBFDFC);     // #fbfdfc
  static const Color cardLight = Color(0xFFFFFFFF);       // #ffffff
  static const Color strokeLight = Color(0xFFDBE6E3);     // #dbe6e3 Web Card Border
  static const Color borderSecondary = Color(0xFFCFDED9); // #cfded9
  static const Color borderSubtle = Color(0xFFE7EFED);    // #e7efed Row divider
  static const Color backgroundDark = Color(0xFFEEF3F1);
  static const Color cardDark = Color(0xFFFFFFFF);
  static const Color strokeDark = Color(0xFFDBE6E3);

  // Glassmorphic Borders & Highlights
  static const Color glassBorder = Color(0xFFDBE6E3);
  static const Color glassHighlight = Color(0x1A0D5C46);
  static const Color glassSurface = Color(0xFFFFFFFF);

  // Web Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF0D5C46), Color(0xFF0A7D6E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGlowGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFFBFDFC)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient neonMintGradient = LinearGradient(
    colors: [Color(0xFF0D5C46), Color(0xFF0A7D6E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient luxuryCardGradient = LinearGradient(
    colors: [
      Color(0xFFFFFFFF),
      Color(0xFFFBFDFC),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient glassBorderGradient = LinearGradient(
    colors: [
      Color(0xFFDBE6E3),
      Color(0xFFCFDED9),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Ambient Forest/Mint Mesh Wash
  static const RadialGradient orbGradient1 = RadialGradient(
    colors: [Color(0x140D5C46), Color(0x000D5C46)],
    radius: 0.85,
  );

  static const RadialGradient orbGradient2 = RadialGradient(
    colors: [Color(0x100A7D6E), Color(0x000A7D6E)],
    radius: 0.85,
  );
}
