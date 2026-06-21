# MediVault Phase 6 — Mobile App Implementation (Flutter/Android)

**Status:** Implementation Ready
**Duration:** 6-8 weeks
**Team Size:** 3-4 developers
**Platform:** Android (Flutter)

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Project Structure](#2-project-structure)
3. [Pages & Navigation](#3-pages--navigation)
4. [API Integration](#4-api-integration)
5. [Local Database](#5-local-database)
6. [Authentication](#6-authentication)
7. [File Upload](#7-file-upload)
8. [Notifications](#8-notifications)
9. [State Management](#9-state-management)
10. [Design System](#10-design-system)
11. [Offline Functionality](#11-offline-functionality)
12. [Sprint Breakdown](#12-sprint-breakdown)
13. [Testing Strategy](#13-testing-strategy)
14. [Deployment Checklist](#14-deployment-checklist)

---

## 1. Architecture

### Tech Stack

```yaml
Framework: Flutter 3.10+
Language: Dart 3.0+
State Management: Provider + Riverpod
Local Database: SQLite (Drift)
API Communication: Dio (HTTP client)
Authentication: JWT
Local Storage: SharedPreferences, Hive
Notifications: Firebase Cloud Messaging
Analytics: Firebase Analytics
Crash Reporting: Firebase Crashlytics
```

### Architecture Diagram

```
┌─────────────────────────────────────┐
│        Presentation Layer           │
│  (Screens, Widgets, Pages)         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Business Logic Layer           │
│  (Providers, State Management)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Data & Repository Layer       │
│  (APIs, Local DB, SharedPrefs)     │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    ┌───▼──┐   ┌────▼────┐
    │Remote│   │ Local   │
    │APIs  │   │Storage  │
    └──────┘   └─────────┘
```

---

## 2. Project Structure

```
medivault-mobile/
│
├── lib/
│   ├── main.dart                    # Entry point
│   ├── config/
│   │   ├── constants.dart           # App constants
│   │   ├── theme.dart               # Theme & colors
│   │   ├── routes.dart              # Route definitions
│   │   └── environment.dart         # Environment config
│   │
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── family_member_model.dart
│   │   ├── medical_report_model.dart
│   │   ├── extracted_value_model.dart
│   │   └── health_score_model.dart
│   │
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   ├── user_provider.dart
│   │   ├── family_provider.dart
│   │   ├── report_provider.dart
│   │   ├── analytics_provider.dart
│   │   └── connectivity_provider.dart
│   │
│   ├── services/
│   │   ├── api_service.dart         # HTTP client
│   │   ├── local_storage_service.dart
│   │   ├── notification_service.dart
│   │   ├── camera_service.dart
│   │   └── file_service.dart
│   │
│   ├── repositories/
│   │   ├── auth_repository.dart
│   │   ├── user_repository.dart
│   │   ├── report_repository.dart
│   │   └── analytics_repository.dart
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   ├── otp_verification_screen.dart
│   │   │   └── consent_screen.dart
│   │   │
│   │   ├── main/
│   │   │   ├── home_screen.dart
│   │   │   ├── dashboard_screen.dart
│   │   │   ├── analytics_screen.dart
│   │   │   ├── reports_screen.dart
│   │   │   ├── family_screen.dart
│   │   │   └── settings_screen.dart
│   │   │
│   │   ├── reports/
│   │   │   ├── upload_report_screen.dart
│   │   │   ├── camera_capture_screen.dart
│   │   │   ├── report_preview_screen.dart
│   │   │   ├── report_list_screen.dart
│   │   │   └── report_detail_screen.dart
│   │   │
│   │   └── analytics/
│   │       ├── analytics_dashboard_screen.dart
│   │       ├── parameter_trend_screen.dart
│   │       ├── health_score_screen.dart
│   │       └── family_summary_screen.dart
│   │
│   ├── widgets/
│   │   ├── common/
│   │   │   ├── app_bar.dart
│   │   │   ├── bottom_nav.dart
│   │   │   ├── loading_widget.dart
│   │   │   ├── error_widget.dart
│   │   │   └── empty_state_widget.dart
│   │   │
│   │   ├── cards/
│   │   │   ├── stat_card.dart
│   │   │   ├── report_card.dart
│   │   │   ├── parameter_card.dart
│   │   │   └── family_member_card.dart
│   │   │
│   │   └── charts/
│   │       ├── line_chart_widget.dart
│   │       ├── bar_chart_widget.dart
│   │       └── gauge_chart_widget.dart
│   │
│   ├── utils/
│   │   ├── date_formatter.dart
│   │   ├── validators.dart
│   │   ├── helpers.dart
│   │   └── constants.dart
│   │
│   ├── database/
│   │   ├── app_database.dart        # Drift database
│   │   ├── tables/
│   │   │   ├── users_table.dart
│   │   │   ├── reports_table.dart
│   │   │   └── cache_table.dart
│   │   └── migrations/
│   │
│   └── l10n/
│       ├── app_en.arb
│       └── app_hi.arb
│
├── pubspec.yaml                     # Dependencies
├── pubspec.lock
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/
│   │       └── main/
│   │           ├── kotlin/
│   │           └── AndroidManifest.xml
│   └── gradle.properties
│
├── ios/ (optional for future)
│
├── test/
│   ├── widget_test.dart
│   ├── unit_test.dart
│   └── integration_test/
│
└── README.md
```

---

## 3. Pages & Navigation

### Bottom Navigation (Main Screens)

```dart
// 5 main tabs
0. Home / Dashboard
1. Upload Report
2. Analytics
3. Family Members
4. Settings / Profile

// Additional screens (push navigation)
- Login
- OTP Verification
- Consent
- Report Detail
- Parameter Trends
- Health Score
- etc.
```

### Screen Hierarchy

```
SplashScreen
    ↓
LoginScreen (OTP)
    ↓
ConsentScreen
    ↓
ProfileSetupScreen
    ↓
MainScreen (with BottomNavBar)
    ├── DashboardScreen
    ├── UploadReportScreen
    ├── AnalyticsScreen
    ├── FamilyScreen
    └── SettingsScreen
        ├── ProfileScreen
        ├── AppSettingsScreen
        └── AboutScreen

Nested Routes:
- ReportListScreen → ReportDetailScreen
- ParameterTrendsScreen
- HealthScoreScreen
- FamilySummaryScreen
- CameraCaptureScreen
```

---

## 4. API Integration

### Dio Setup (API Client)

```dart
// lib/services/api_service.dart

class ApiService {
  final Dio dio;
  static const String baseUrl = 'https://api.medivault.com/v1';
  static const Duration timeoutDuration = Duration(seconds: 30);

  ApiService({Dio? dio})
      : dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: baseUrl,
                connectTimeout: timeoutDuration,
                receiveTimeout: timeoutDuration,
              ),
            ) {
    _initializeInterceptors();
  }

  void _initializeInterceptors() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add JWT token
          final token = await _getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401, refresh token, retry
          if (error.response?.statusCode == 401) {
            return _handleTokenRefresh(error, handler);
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Auth APIs
  Future<LoginResponse> sendOTP(String phone) async {
    final response = await dio.post('/auth/otp/send', data: {'phone': phone});
    return LoginResponse.fromJson(response.data);
  }

  Future<LoginResponse> verifyOTP(String phone, String otp) async {
    final response = await dio.post(
      '/auth/otp/verify',
      data: {'phone': phone, 'otp': otp},
    );
    return LoginResponse.fromJson(response.data);
  }

  // Report APIs
  Future<List<MedicalReport>> getReports({int limit = 50, int offset = 0}) async {
    final response = await dio.get(
      '/reports',
      queryParameters: {'limit': limit, 'offset': offset},
    );
    return (response.data['reports'] as List)
        .map((r) => MedicalReport.fromJson(r))
        .toList();
  }

  Future<MedicalReport> getReportDetail(String reportId) async {
    final response = await dio.get('/reports/$reportId');
    return MedicalReport.fromJson(response.data);
  }

  // Analytics APIs
  Future<AnalyticsDashboard> getDashboard(String familyMemberId) async {
    final response = await dio.get(
      '/analytics/dashboard',
      queryParameters: {'family_member_id': familyMemberId},
    );
    return AnalyticsDashboard.fromJson(response.data);
  }

  Future<HealthScore> getHealthScore(String familyMemberId) async {
    final response = await dio.get(
      '/analytics/health-tracking-score',
      queryParameters: {'family_member_id': familyMemberId},
    );
    return HealthScore.fromJson(response.data);
  }

  // File upload
  Future<String> uploadFile(File file, String familyMemberId) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        file.path,
        filename: file.path.split('/').last,
      ),
      'family_member_id': familyMemberId,
    });

    final response = await dio.post(
      '/files/upload',
      data: formData,
      onSendProgress: (int sent, int total) {
        // Progress callback
      },
    );
    return response.data['file_id'];
  }
}
```

---

## 5. Local Database (SQLite with Drift)

```dart
// lib/database/app_database.dart

import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'app_database.g.dart';

class Users extends Table {
  TextColumn get id => text()();
  TextColumn get phone => text()();
  TextColumn get name => text().nullable()();
  TextColumn get email => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  
  @override
  Set<Column> get primaryKey => {id};
}

class Reports extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get familyMemberId => text()();
  TextColumn get reportType => text()();
  DateTimeColumn get reportDate => dateTime()();
  TextColumn get labName => text().nullable()();
  TextColumn get doctorName => text().nullable()();
  IntColumn get parameterCount => integer().withDefault(const Constant(0))();
  TextColumn get localPath => text().nullable()();  // Local file path
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  
  @override
  Set<Column> get primaryKey => {id};
}

class ExtractedValues extends Table {
  TextColumn get id => text()();
  TextColumn get reportId => text()();
  TextColumn get parameterName => text()();
  TextColumn get value => text().nullable()();
  TextColumn get unit => text().nullable()();
  TextColumn get status => text()();  // normal, high, low
  IntColumn get confidence => integer()();
  DateTimeColumn get createdAt => dateTime()();
  
  @override
  Set<Column> get primaryKey => {id};
}

class CachedData extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();  // JSON string
  DateTimeColumn get expiresAt => dateTime()();
  DateTimeColumn get createdAt => dateTime()();
  
  @override
  Set<Column> get primaryKey => {key};
}

@DriftDatabase(tables: [Users, Reports, ExtractedValues, CachedData])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  // Queries
  Future<List<Report>> getAllReports() => select(reports).get();
  
  Future<List<ExtractedValue>> getReportValues(String reportId) =>
      (select(extractedValues)..where((t) => t.reportId.equals(reportId)))
          .get();

  Future<void> insertReport(ReportsCompanion report) =>
      into(reports).insert(report);

  Future<void> insertValues(List<ExtractedValuesCompanion> values) =>
      batch((b) => b.insertAll(extractedValues, values));
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File('${dbFolder.path}/db.sqlite');
    return openConnection(file);
  });
}
```

---

## 6. Authentication

### Auth Provider (Riverpod)

```dart
// lib/providers/auth_provider.dart

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(apiServiceProvider));
});

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService apiService;

  AuthNotifier(this.apiService) : super(const AuthState.unauthenticated());

  Future<void> sendOTP(String phone) async {
    state = const AuthState.loading();
    try {
      await apiService.sendOTP(phone);
      state = const AuthState.otpSent();
    } catch (e) {
      state = AuthState.error(e.toString());
    }
  }

  Future<void> verifyOTP(String phone, String otp) async {
    state = const AuthState.loading();
    try {
      final response = await apiService.verifyOTP(phone, otp);
      
      // Save token
      await _saveToken(response.accessToken);
      
      state = AuthState.authenticated(response.user);
    } catch (e) {
      state = AuthState.error(e.toString());
    }
  }

  Future<void> logout() async {
    await _clearToken();
    state = const AuthState.unauthenticated();
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', token);
  }

  Future<void> _clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
  }
}

@freezed
class AuthState with _$AuthState {
  const factory AuthState.unauthenticated() = _Unauthenticated;
  const factory AuthState.loading() = _Loading;
  const factory AuthState.otpSent() = _OtpSent;
  const factory AuthState.authenticated(User user) = _Authenticated;
  const factory AuthState.error(String message) = _Error;
}
```

---

## 7. File Upload

### Camera & File Upload

```dart
// lib/services/file_service.dart

class FileService {
  final ImagePicker imagePicker = ImagePicker();
  final ApiService apiService;

  FileService(this.apiService);

  // Capture from camera
  Future<File?> captureFromCamera() async {
    try {
      final photo = await imagePicker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
      );
      if (photo != null) {
        return File(photo.path);
      }
    } catch (e) {
      rethrow;
    }
    return null;
  }

  // Pick from gallery
  Future<File?> pickFromGallery() async {
    try {
      final photo = await imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );
      if (photo != null) {
        return File(photo.path);
      }
    } catch (e) {
      rethrow;
    }
    return null;
  }

  // Upload with progress
  Future<String> uploadReport(
    File file,
    String familyMemberId,
    Function(double) onProgress,
  ) async {
    try {
      final fileId = await apiService.uploadFile(file, familyMemberId);
      
      // Save to local database
      await _saveToLocalDB(fileId, file, familyMemberId);
      
      return fileId;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> _saveToLocalDB(
    String fileId,
    File file,
    String familyMemberId,
  ) async {
    // Copy file to app documents directory
    final appDir = await getApplicationDocumentsDirectory();
    final fileName = '${fileId}_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final savedFile = await file.copy('${appDir.path}/$fileName');
    
    // Save metadata to local DB
    // ... save to database
  }
}
```

---

## 8. Notifications

### Firebase Cloud Messaging

```dart
// lib/services/notification_service.dart

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();

  factory NotificationService() {
    return _instance;
  }

  NotificationService._internal();

  late FirebaseMessaging messaging;

  Future<void> init() async {
    messaging = FirebaseMessaging.instance;

    // Request permission
    await messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carryforward: true,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showNotification(message);
    });

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }

  void _showNotification(RemoteMessage message) {
    // Show local notification
    // ... implement notification display
  }

  static Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    // Handle notification when app is in background
  }

  Future<String?> getDeviceToken() async {
    return await messaging.getToken();
  }
}
```

---

## 9. State Management

### Provider Examples

```dart
// Reports Provider
final reportsProvider = FutureProvider.family<List<MedicalReport>, int>(
  (ref, limit) async {
    final api = ref.watch(apiServiceProvider);
    return api.getReports(limit: limit);
  },
);

// Selected Family Member
final selectedFamilyMemberProvider = StateProvider<String>((ref) {
  return ''; // default value
});

// Analytics Dashboard
final analyticsDashboardProvider = FutureProvider.family<AnalyticsDashboard, String>(
  (ref, familyMemberId) async {
    final api = ref.watch(apiServiceProvider);
    return api.getDashboard(familyMemberId);
  },
);

// Health Score
final healthScoreProvider = FutureProvider.family<HealthScore, String>(
  (ref, familyMemberId) async {
    final api = ref.watch(apiServiceProvider);
    return api.getHealthScore(familyMemberId);
  },
);

// Connectivity
final connectivityProvider = StreamProvider<ConnectivityResult>((ref) {
  return Connectivity().onConnectivityChanged;
});
```

---

## 10. Design System

### Theme

```dart
// lib/config/theme.dart

ThemeData lightTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0x0D9488),  // Teal
    brightness: Brightness.light,
  ),
  scaffoldBackgroundColor: const Color(0xFFF9FAFB),
  
  // Colors
  appBarTheme: AppBarTheme(
    backgroundColor: Colors.white,
    elevation: 0,
    iconTheme: const IconThemeData(color: Color(0x111827)),
    titleTextStyle: GoogleFonts.inter(
      fontSize: 18,
      fontWeight: FontWeight.bold,
      color: const Color(0x111827),
    ),
  ),

  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    backgroundColor: Colors.white,
    selectedItemColor: const Color(0x0D9488),
    unselectedItemColor: const Color(0x6B7280),
    type: BottomNavigationBarType.fixed,
  ),

  // Text styles
  textTheme: GoogleFonts.interTextTheme(),

  // Button styles
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: const Color(0x0D9488),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
    ),
  ),
);
```

---

## 11. Offline Functionality

### Sync Manager

```dart
// lib/services/sync_service.dart

class SyncService {
  final ApiService apiService;
  final AppDatabase database;
  final Connectivity connectivity;

  SyncService({
    required this.apiService,
    required this.database,
    required this.connectivity,
  });

  Future<void> syncOfflineData() async {
    // Check connectivity
    final result = await connectivity.checkConnectivity();
    if (result == ConnectivityResult.none) {
      return;
    }

    // Sync pending reports
    final unsyncedReports = await database.getAllUnsyncedReports();
    
    for (final report in unsyncedReports) {
      try {
        // Upload report
        final file = File(report.localPath!);
        await apiService.uploadFile(file, report.familyMemberId);
        
        // Mark as synced
        await database.markReportSynced(report.id);
      } catch (e) {
        // Log error, will retry later
      }
    }
  }

  // Auto sync when connectivity returns
  void watchConnectivity() {
    connectivity.onConnectivityChanged.listen((result) {
      if (result != ConnectivityResult.none) {
        syncOfflineData();
      }
    });
  }
}
```

---

## 12. Sprint Breakdown

### Sprint 1: Project Setup & Authentication (2 weeks)
- [ ] Flutter project setup
- [ ] Dependency management
- [ ] Theme & design system
- [ ] Login screen
- [ ] OTP verification
- [ ] JWT implementation
- [ ] SharedPreferences storage
- [ ] API client setup

### Sprint 2: Navigation & Core Screens (2 weeks)
- [ ] Bottom navigation
- [ ] Dashboard screen
- [ ] Reports list screen
- [ ] Family members screen
- [ ] Settings screen
- [ ] Route configuration
- [ ] Navigation implementation

### Sprint 3: Reports & Upload (1.5 weeks)
- [ ] Report list with filters
- [ ] Report detail view
- [ ] Camera integration
- [ ] File upload with progress
- [ ] Report preview
- [ ] Local storage

### Sprint 4: Analytics & Visualization (1.5 weeks)
- [ ] Analytics dashboard
- [ ] Parameter trends screen
- [ ] Charts implementation
- [ ] Health score display
- [ ] Family summary

### Sprint 5: Local Database & Offline (1 week)
- [ ] SQLite database setup
- [ ] Data caching
- [ ] Offline functionality
- [ ] Sync manager

### Sprint 6: Notifications & Polish (1 week)
- [ ] Firebase setup
- [ ] Push notifications
- [ ] Error handling
- [ ] Loading states
- [ ] Edge cases
- [ ] Bug fixes

### Sprint 7: Testing & Release (1 week)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Build release APK
- [ ] Play Store submission
- [ ] Documentation

---

## 13. Testing Strategy

### Unit Tests
```dart
test('Auth provider verifies OTP correctly', () async {
  final authNotifier = AuthNotifier(mockApiService);
  await authNotifier.verifyOTP('9876543210', '123456');
  expect(authNotifier.state, isA<_Authenticated>());
});
```

### Widget Tests
```dart
testWidgets('Dashboard displays health score', (WidgetTester tester) async {
  await tester.pumpWidget(const MyApp());
  expect(find.text('Health Score'), findsOneWidget);
});
```

### Integration Tests
```dart
testWidgets('Full login flow works', (WidgetTester tester) async {
  // Enter phone
  // Verify OTP
  // Check dashboard appears
});
```

---

## 14. Deployment Checklist

### Pre-Release
- [ ] All tests passing
- [ ] Build APK successfully
- [ ] Test on real devices (multiple Android versions)
- [ ] Check all screens responsive
- [ ] Test offline functionality
- [ ] Review error messages
- [ ] Check app icon and splash screen
- [ ] Review app name and description

### Play Store
- [ ] Create Google Play developer account
- [ ] Create app listing
- [ ] Add screenshots (at least 4-5)
- [ ] Write app description
- [ ] Set category & content rating
- [ ] Set minimum Android version (Android 8+)
- [ ] Upload signed APK
- [ ] Submit for review

### Post-Release
- [ ] Monitor crash analytics
- [ ] Monitor user reviews
- [ ] Respond to feedback
- [ ] Plan updates

---

## pubspec.yaml

```yaml
name: medivault
description: Medical Report Storage & Analytics
publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.0
  state_notifier: ^1.0.0
  
  # HTTP & Networking
  dio: ^5.3.0
  
  # Local Database
  drift: ^2.13.0
  sqlite3_flutter_libs: ^0.5.0
  
  # Local Storage
  shared_preferences: ^2.2.0
  hive: ^2.2.0
  hive_flutter: ^1.1.0
  
  # Firebase
  firebase_core: ^2.23.0
  firebase_messaging: ^14.6.0
  firebase_analytics: ^10.6.0
  firebase_crashlytics: ^3.3.0
  
  # Image & File
  image_picker: ^1.0.0
  
  # Utilities
  intl: ^0.19.0
  uuid: ^4.0.0
  
  # UI
  google_fonts: ^6.1.0
  
  # Connectivity
  connectivity_plus: ^5.0.0
  
  # Charts
  fl_chart: ^0.64.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  
  build_runner: ^2.4.0
  drift_dev: ^2.13.0
  hive_generator: ^2.0.0
  
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
```

---

## Installation & Setup

```bash
# Create project
flutter create medivault_mobile

# Install dependencies
flutter pub get

# Generate drift database
flutter pub run build_runner build

# Run app
flutter run

# Build release APK
flutter build apk --release
```

---

**Status:** Ready for Implementation
**Estimated Duration:** 6-8 weeks
**Team Size:** 3-4 developers
**Next Phase:** Phase 7 - Real Backend Implementation
