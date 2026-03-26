import 'package:flutter/foundation.dart';

import 'api_client.dart';
import 'api_session.dart';
import 'api_session_store.dart';

class ApiAuthClient {
  ApiAuthClient({
    required ApiClient apiClient,
    required ApiSessionStore sessionStore,
  })  : _apiClient = apiClient,
        _sessionStore = sessionStore;

  final ApiClient _apiClient;
  final ApiSessionStore _sessionStore;

  String? get token => _apiClient.token;
  ApiClient get rawClient => _apiClient;

  String get _platform => kIsWeb ? 'web' : 'android';

  Future<ApiSession> signInWithGoogle({
    required String idToken,
    required bool admin,
  }) async {
    final response = await _apiClient.postJson(
      '/v1/auth/google',
      body: {
        'idToken': idToken,
        'role': admin ? 'admin' : 'student',
        'platform': _platform,
      },
    );
    final session = ApiSession.fromJson(response);
    _apiClient.setToken(session.token);
    await _sessionStore.save(session);
    return session;
  }

  Future<ApiSession> signInWithGoogleAccessToken({
    required String accessToken,
    required bool admin,
  }) async {
    final response = await _apiClient.postJson(
      '/v1/auth/google',
      body: {
        'accessToken': accessToken,
        'role': admin ? 'admin' : 'student',
        'platform': _platform,
      },
    );
    final session = ApiSession.fromJson(response);
    _apiClient.setToken(session.token);
    await _sessionStore.save(session);
    return session;
  }

  Future<void> requestOtp({
    required String phone,
    required bool admin,
  }) async {
    await _apiClient.postJson(
      '/v1/auth/otp/request',
      body: {
        'phone': phone,
        'role': admin ? 'admin' : 'student',
      },
    );
  }

  Future<ApiSession> verifyOtp({
    required String phone,
    required String code,
    required bool admin,
  }) async {
    final response = await _apiClient.postJson(
      '/v1/auth/otp/verify',
      body: {
        'phone': phone,
        'code': code,
        'role': admin ? 'admin' : 'student',
        'platform': _platform,
      },
    );
    final session = ApiSession.fromJson(response);
    _apiClient.setToken(session.token);
    await _sessionStore.save(session);
    return session;
  }

  Future<ApiSession> passwordLogin({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.postJson(
      '/v1/auth/password-login',
      body: {'email': email, 'password': password},
    );
    final session = ApiSession.fromJson(response);
    _apiClient.setToken(session.token);
    await _sessionStore.save(session);
    return session;
  }

  Future<ApiSession> devLogin({
    required bool admin,
  }) async {
    final response = await _apiClient.postJson(
      '/v1/auth/dev-login',
      body: {
        'role': admin ? 'admin' : 'student',
      },
    );
    final session = ApiSession.fromJson(response);
    _apiClient.setToken(session.token);
    await _sessionStore.save(session);
    return session;
  }

  Future<void> requestProfilePhoneOtp({required String phone}) async {
    await _apiClient.postJson(
      '/v1/me/phone/request-otp',
      body: {'phone': phone},
      authenticated: true,
    );
  }

  Future<ApiSession> verifyProfilePhoneOtp({
    required String phone,
    required String code,
  }) async {
    final response = await _apiClient.postJson(
      '/v1/me/phone/verify-otp',
      body: {'phone': phone, 'code': code},
      authenticated: true,
    );
    final session = ApiSession.fromJson(response);
    _apiClient.setToken(session.token);
    await _sessionStore.save(session);
    return session;
  }

  Future<ApiSession> saveProfileEmail({required String email}) async {
    final response = await _apiClient.putJson(
      '/v1/me/email',
      body: {'email': email},
      authenticated: true,
    );
    final session = ApiSession.fromJson(response);
    _apiClient.setToken(session.token);
    await _sessionStore.save(session);
    return session;
  }

  Future<ApiSession?> restoreSession() async {
    final session = await _sessionStore.load();
    _apiClient.setToken(session?.token);
    return session;
  }

  Future<void> discardStoredSession() async {
    _apiClient.setToken(null);
    await _sessionStore.clear();
  }

  Future<void> clearSession() async {
    try {
      await _apiClient.postJson('/v1/auth/logout', authenticated: true);
    } catch (_) {
      // Best-effort — proceed with local logout even if server call fails
    }
    _apiClient.setToken(null);
    await _sessionStore.clear();
  }
}
