# MediVault Flutter Mobile App (iOS & Android)

Ultra-luxury cross-platform mobile application for **MediVault**, built with **Flutter 3.x & Dart 3.x**. Designed with **Apple/Linear/Vercel-level aesthetic standards**, featuring 3D perspective matrix transforms, glassmorphic floating navigation, animated radial health score gauges, longitudinal biomarker trends, offline vault caching, and complete REST/OCR API integration.

---

## 📱 Features

- **Cross-Platform Compatibility**: Full, native support for **iOS** (iPhone/iPad) and **Android**.
- **Interactive 3D Perspective Tilt**: Dynamic `Matrix4` 3D perspective cards responding to touch gestures with physics spring feedback.
- **Glassmorphic Floating Bottom Navigation**: Frosted glass navigation capsule (`BackdropFilter` Gaussian blur + gradient border).
- **Dual Authentication**: Sign in via Mobile Number + Password or instant 6-digit Mobile OTP.
- **Unified Health Timeline**: Dynamic health score calculation (0–100), attention indicators, and lab distribution.
- **Medical Reports Hub**: Live search, category filtering (Hematology, Metabolic, Lipid, Endocrine), and clinical marker breakdowns with reference range comparisons.
- **Secure Doctor Share**: Instant revocable 7-day share link generator with native iOS & Android share sheet integration (`share_plus`).
- **AI Report Scanner & Upload**: Direct camera scanning (`image_picker`) and PDF document upload (`file_picker`) with multi-step OCR extraction progress.
- **Longitudinal Biomarker Trends**: Smooth bezier line graphs (`fl_chart`) tracking Hemoglobin, Fasting Blood Sugar, Cholesterol, Platelets, and TSH over time.
- **Family Vault Profiles**: Multi-profile management (Self, Father, Mother, Spouse), active switcher, and automatic clinic mobile number matching.
- **Offline-First & Live API Dual Engine**: Works out-of-the-box in offline/demo mode with pre-populated realistic Indian medical records, plus live synchronization with the MediVault backend.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
If Flutter is not yet installed on your Mac, install it via Homebrew:
```bash
brew install --cask flutter
```
Verify the installation:
```bash
flutter doctor
```

### 2. Install Dependencies
Navigate to the `medivault_flutter` directory and run:
```bash
cd medivault_flutter
flutter pub get
```

### 3. Run on iOS
To launch in the iOS Simulator:
```bash
open -a Simulator
flutter run -d iPhone
```
Or open the Xcode workspace:
```bash
open ios/Runner.xcworkspace
```

### 4. Run on Android
To launch in an Android Emulator or connected physical device:
```bash
flutter run -d android
```
Or open the `android` folder in **Android Studio**.

---

## 🛠️ Project Structure

```
medivault_flutter/
├── android/                         # Android native config & permissions
│   ├── app/src/main/AndroidManifest.xml
│   └── app/build.gradle
├── ios/                             # iOS native config & permissions
│   ├── Runner/Info.plist
│   └── Podfile
├── lib/
│   ├── main.dart                    # App bootstrap & MultiProvider
│   ├── core/
│   │   ├── constants/
│   │   │   ├── api_constants.dart   # API routes
│   │   │   └── app_colors.dart      # Luxury emerald & deep teal palette
│   │   ├── services/
│   │   │   ├── api_service.dart     # Dio HTTP client with JWT interceptor
│   │   │   └── storage_service.dart # Secure storage & cache
│   │   └── theme/
│   │       └── app_theme.dart       # Material 3 typography & themes
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── family_member_model.dart
│   │   ├── report_model.dart
│   │   └── trend_point_model.dart
│   ├── providers/
│   │   ├── auth_provider.dart       # Auth state & OTP logic
│   │   └── vault_provider.dart      # Profiles, reports & trend state
│   ├── screens/
│   │   ├── auth/login_screen.dart
│   │   ├── dashboard/dashboard_screen.dart
│   │   ├── reports/reports_screen.dart
│   │   ├── reports/report_detail_screen.dart
│   │   ├── upload/upload_screen.dart
│   │   ├── trends/trends_screen.dart
│   │   ├── family/family_screen.dart
│   │   ├── privacy/privacy_screen.dart
│   │   └── main_navigation_screen.dart
│   └── widgets/
│       ├── tilt_card.dart           # 3D matrix transform card
│       ├── glass_container.dart     # Glassmorphic container
│       ├── health_score_gauge.dart  # Radial animated score gauge
│       ├── status_badge.dart        # Clinical status pill
│       └── custom_app_bar.dart      # Luxury frosted header
└── pubspec.yaml
```

---

## 🔑 Demo Credentials
The app is pre-configured with demo fallback data:
- **Mobile Number**: `9876543210`
- **OTP**: `123456`
- **Password**: `password123`
