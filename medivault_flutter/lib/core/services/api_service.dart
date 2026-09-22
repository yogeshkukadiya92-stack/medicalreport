import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../../models/user_model.dart';
import 'storage_service.dart';

class ApiService {
  final Dio _dio;
  final StorageService _storageService;

  ApiService({
    required StorageService storageService,
    String? baseUrl,
  })  : _storageService = storageService,
        _dio = Dio(BaseOptions(
          baseUrl: (baseUrl ?? ApiConstants.defaultBaseUrl).replaceAll(RegExp(r'/$'), ''),
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 25),
          headers: {'Content-Type': 'application/json'},
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storageService.getToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ));
  }

  void updateBaseUrl(String newUrl) {
    _dio.options.baseUrl = newUrl.replaceAll(RegExp(r'/$'), '');
  }

  // --- AUTHENTICATION ---
  Future<Map<String, dynamic>> login({
    required String phone,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.loginMobile,
        data: {
          'action': 'login',
          'phone': phone,
          'password': password,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> loginWithOtp({
    required String phone,
    required String otp,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.loginMobile,
        data: {
          'action': 'otp_login',
          'phone': phone,
          'otp': otp,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<String> requestOtp({required String phone}) async {
    try {
      final response = await _dio.post(
        ApiConstants.requestOtp,
        data: {
          'phone': phone,
          'purpose': 'login',
        },
      );
      return response.data['message']?.toString() ?? 'OTP sent successfully.';
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<UserModel> fetchSession() async {
    try {
      final response = await _dio.get(ApiConstants.session);
      return UserModel.fromJson(response.data['user']);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post(ApiConstants.logout);
    } catch (_) {
      // Ignore network errors on logout
    }
  }

  // --- VAULT ---
  Future<Map<String, dynamic>> getVault() async {
    try {
      final response = await _dio.get(ApiConstants.vault);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<void> updateVault(Map<String, dynamic> payload) async {
    try {
      await _dio.put(ApiConstants.vault, data: payload);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // --- FILE UPLOAD & AI OCR EXTRACTION ---
  Future<Map<String, dynamic>> uploadFile({
    required String filePath,
    required String fileName,
    required String mimeType,
  }) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          filePath,
          filename: fileName,
        ),
      });

      final response = await _dio.post(
        ApiConstants.files,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> analyzeReport({
    required String fileName,
    required String mimeType,
    required String memberName,
    required String lab,
    required String title,
    required String kind,
    List<String>? fileDataUrls,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.analyzeReport,
        data: {
          'fileName': fileName,
          'mimeType': mimeType,
          'originalMimeType': mimeType,
          'memberName': memberName,
          'lab': lab,
          'title': title,
          'reportKind': kind,
          if (fileDataUrls != null && fileDataUrls.isNotEmpty)
            'fileDataUrls': fileDataUrls,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // --- DOCTOR SHARE ---
  Future<String> createDoctorShare({
    required String reportId,
    required String recipientLabel,
    int expiresInHours = 168, // 7 days
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.shares,
        data: {
          'reportId': reportId,
          'recipientLabel': recipientLabel,
          'expiresInHours': expiresInHours,
        },
      );
      return response.data['url']?.toString() ?? '';
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  String _handleDioError(DioException error) {
    if (error.response?.data is Map) {
      final msg = error.response?.data['error'] ?? error.response?.data['message'];
      if (msg != null) return msg.toString();
    }
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
        return "Connection timed out. Please check your internet connection.";
      case DioExceptionType.connectionError:
        return "Unable to reach MediVault server. Check your network.";
      default:
        return error.message ?? "An unexpected network error occurred.";
    }
  }
}
