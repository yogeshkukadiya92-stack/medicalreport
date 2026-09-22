import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:medivault_flutter/core/services/api_service.dart';
import 'package:medivault_flutter/core/services/storage_service.dart';
import 'package:medivault_flutter/main.dart';
import 'package:medivault_flutter/providers/auth_provider.dart';
import 'package:medivault_flutter/screens/auth/login_screen.dart';

void main() {
  setUp(() {
    TestWidgetsFlutterBinding.ensureInitialized();
    FlutterSecureStorage.setMockInitialValues({});
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('MediVaultApp startup and dashboard smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const MediVaultApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    // Verify main navigation & dashboard widgets
    expect(find.text('Yogesh Kukadiya'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Reports'), findsOneWidget);
    expect(find.text('Upload'), findsOneWidget);
    expect(find.text('Analytics'), findsOneWidget);
    expect(find.text('Family'), findsOneWidget);
  });

  testWidgets('LoginScreen smoke test with default OTP 1111', (WidgetTester tester) async {
    final storage = StorageService();
    final api = ApiService(storageService: storage);
    final auth = AuthProvider(apiService: api, storageService: storage);

    await tester.pumpWidget(
      MaterialApp(
        home: ChangeNotifierProvider<AuthProvider>.value(
          value: auth,
          child: const LoginScreen(),
        ),
      ),
    );
    await tester.pump();

    // Verify brand and header
    expect(find.text('MediVault'), findsOneWidget);
    expect(find.text('Secure Clinical Health Vault'), findsOneWidget);
    expect(find.text('Secure health login'), findsOneWidget);

    // Verify default OTP login mode and pre-filled values
    expect(find.text('+91'), findsWidgets);
    expect(find.text('9876543210'), findsWidgets);
    expect(find.text('1111'), findsWidgets);
    expect(find.text('Get OTP'), findsOneWidget);

    // Tap Password tab
    await tester.tap(find.text('Password'));
    await tester.pump();

    // Verify Password field is displayed
    expect(find.text('Password'), findsWidgets);
  });
}
