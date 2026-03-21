import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'api_session.dart';

class ApiSessionStore {
  ApiSessionStore._(this._preferences);

  final SharedPreferences _preferences;
  static const _key = 'api_session_v1';

  static Future<ApiSessionStore> create() async {
    final preferences = await SharedPreferences.getInstance();
    return ApiSessionStore._(preferences);
  }

  Future<ApiSession?> load() async {
    final raw = _preferences.getString(_key);
    if (raw == null || raw.isEmpty) {
      return null;
    }
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        return null;
      }
      return ApiSession.fromJson(Map<String, dynamic>.from(decoded));
    } catch (_) {
      await clear();
      return null;
    }
  }

  Future<void> save(ApiSession session) async {
    await _preferences.setString(_key, jsonEncode(session.toJson()));
  }

  Future<void> clear() async {
    await _preferences.remove(_key);
  }
}
