import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_colors.dart';
import 'core/services/api_service.dart';
import 'core/services/storage_service.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/vault_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Edge to edge immersive system navigation for clinical light theme
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarBrightness: Brightness.light, // iOS: dark text / icons on light background
      statusBarIconBrightness: Brightness.dark, // Android: dark text / icons on light background
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  final storageService = StorageService();
  await storageService.init();

  final apiService = ApiService(storageService: storageService);

  runApp(
    MediVaultApp(
      apiService: apiService,
      storageService: storageService,
    ),
  );
}

class MediVaultApp extends StatelessWidget {
  final StorageService? storageService;
  final ApiService? apiService;

  const MediVaultApp({
    super.key,
    this.storageService,
    this.apiService,
  });

  @override
  Widget build(BuildContext context) {
    final storage = storageService ?? StorageService();
    final api = apiService ?? ApiService(storageService: storage);

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider(
            apiService: api,
            storageService: storage,
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => VaultProvider(
            apiService: api,
            storageService: storage,
          ),
        ),
      ],
      child: MaterialApp(
        title: 'MediVault',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.light,
        home: const _AppRoot(),
      ),
    );
  }
}

class _AppRoot extends StatelessWidget {
  const _AppRoot();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoading) {
      return Scaffold(
        backgroundColor: AppColors.backgroundLight,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.strokeLight),
                ),
                child: const Icon(
                  Icons.shield_outlined,
                  color: AppColors.primary,
                  size: 32,
                ),
              ),
              const SizedBox(height: 18),
              const CircularProgressIndicator(
                color: AppColors.primary,
                strokeWidth: 2.5,
              ),
            ],
          ),
        ),
      );
    }

    if (auth.isAuthenticated) {
      return const MainNavigationScreen();
    }

    return const LoginScreen();
  }
}
