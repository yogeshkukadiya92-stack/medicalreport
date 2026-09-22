import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/report_model.dart';
import '../../models/family_member_model.dart';

class StorageService {
  static const String _tokenKey = 'medivault_access_token';
  static const String _vaultCacheKey = 'medivault_vault_cache_v1';
  static const String _activeMemberKey = 'medivault_active_member_id';

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  // Token management (Secure Keyring / Keystore)
  Future<void> saveToken(String token) async {
    try {
      await _secureStorage.write(key: _tokenKey, value: token);
    } catch (_) {}
  }

  Future<String?> getToken() async {
    try {
      return await _secureStorage.read(key: _tokenKey);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearToken() async {
    try {
      await _secureStorage.delete(key: _tokenKey);
    } catch (_) {}
  }

  // Vault snapshot caching for instant offline availability
  Future<void> saveVaultCache({
    required String? activeMemberId,
    required List<FamilyMemberModel> familyMembers,
    required List<AppReportModel> reports,
  }) async {
    await init();
    final data = {
      'activeMemberId': activeMemberId,
      'familyMembers': familyMembers.map((m) => m.toJson()).toList(),
      'reports': reports.map((r) => r.toJson()).toList(),
    };
    await _prefs!.setString(_vaultCacheKey, jsonEncode(data));
  }

  Future<Map<String, dynamic>?> getVaultCache() async {
    await init();
    final raw = _prefs!.getString(_vaultCacheKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // Active Member ID
  Future<void> saveActiveMemberId(String memberId) async {
    await init();
    await _prefs!.setString(_activeMemberKey, memberId);
  }

  Future<String?> getActiveMemberId() async {
    await init();
    return _prefs!.getString(_activeMemberKey);
  }
}
