import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode, this.data});

  final String message;
  final int? statusCode;
  final Map<String, dynamic>? data;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({required this.baseUrl, http.Client? client}) : _client = client ?? http.Client();

  final String baseUrl;
  final http.Client _client;
  String? _token;
  void Function()? onUnauthorized;

  static const _timeout = Duration(seconds: 30);

  String? get token => _token;

  void setToken(String? token) {
    _token = token;
  }

  Future<Map<String, dynamic>> getJson(
    String path, {
    Map<String, String>? headers,
    bool authenticated = false,
  }) =>
      wrapNetworkErrors(() => _requestWithLocalhostFallback(
            method: 'GET',
            path: path,
            authenticated: authenticated,
            send: (uri) => _client
                .get(uri, headers: _headers(headers, authenticated: authenticated))
                .timeout(_timeout),
          ));

  Future<Map<String, dynamic>> postJson(
    String path, {
    Map<String, String>? headers,
    Object? body,
    bool authenticated = false,
  }) =>
      wrapNetworkErrors(() => _requestWithLocalhostFallback(
            method: 'POST',
            path: path,
            authenticated: authenticated,
            send: (uri) => _client
                .post(
                  uri,
                  headers: _headers(headers, authenticated: authenticated),
                  body: body == null ? null : jsonEncode(body),
                )
                .timeout(_timeout),
          ));

  Future<Map<String, dynamic>> putJson(
    String path, {
    Map<String, String>? headers,
    Object? body,
    bool authenticated = false,
  }) =>
      wrapNetworkErrors(() => _requestWithLocalhostFallback(
            method: 'PUT',
            path: path,
            authenticated: authenticated,
            send: (uri) => _client
                .put(
                  uri,
                  headers: _headers(headers, authenticated: authenticated),
                  body: body == null ? null : jsonEncode(body),
                )
                .timeout(_timeout),
          ));

  Future<Map<String, dynamic>> deleteJson(
    String path, {
    Map<String, String>? headers,
    Object? body,
    bool authenticated = false,
  }) =>
      wrapNetworkErrors(() => _requestWithLocalhostFallback(
            method: 'DELETE',
            path: path,
            authenticated: authenticated,
            send: (uri) async {
              final request = http.Request('DELETE', uri)
                ..headers.addAll(_headers(headers, authenticated: authenticated));
              if (body != null) {
                request.body = jsonEncode(body);
              }
              final streamed = await _client.send(request).timeout(_timeout);
              return http.Response.fromStream(streamed);
            },
          ));

  Uri _uri(String path) {
    final normalizedBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$normalizedBase$normalizedPath');
  }

  Map<String, String> _headers(
    Map<String, String>? headers, {
    required bool authenticated,
  }) {
    final merged = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...?headers,
    };
    if (authenticated && _token != null && _token!.isNotEmpty) {
      merged['Authorization'] = 'Bearer $_token';
    }
    return merged;
  }

  Map<String, dynamic> _decode(http.Response response) {
    final raw = response.body;
    final json = raw.isEmpty ? <String, dynamic>{} : jsonDecode(raw);
    final map = json is Map ? Map<String, dynamic>.from(json) : <String, dynamic>{'data': json};
    if (response.statusCode >= 400) {
      if (response.statusCode == 401) {
        onUnauthorized?.call();
      }
      throw ApiException(
        map['message'] as String? ?? map['error'] as String? ?? 'Request failed.',
        statusCode: response.statusCode,
        data: map,
      );
    }
    return map;
  }

  void _debugLog(String method, String path, {required bool authenticated}) {
    if (!kDebugMode) {
      return;
    }
    debugPrint('[ApiClient] $method ${_uri(path)} auth=$authenticated');
  }

  void _debugResponse(String method, String path, int statusCode) {
    if (!kDebugMode) {
      return;
    }
    debugPrint('[ApiClient] $method ${_uri(path)} -> $statusCode');
  }

  Future<Map<String, dynamic>> _requestWithLocalhostFallback({
    required String method,
    required String path,
    required bool authenticated,
    required Future<http.Response> Function(Uri uri) send,
  }) async {
    final primaryUri = _uri(path);
    _debugLog('primary $method', path, authenticated: authenticated);
    try {
      final response = await send(primaryUri);
      _debugResponse(method, path, response.statusCode);
      return _decode(response);
    } on SocketException catch (error) {
      final fallbackUri = _localhostFallbackUri(path);
      if (fallbackUri == null) {
        rethrow;
      }
      if (kDebugMode) {
        debugPrint('[ApiClient] Primary SocketException for $primaryUri: $error');
        debugPrint('[ApiClient] Retrying with $fallbackUri');
      }
      final response = await send(fallbackUri);
      _debugResponse('$method fallback', path, response.statusCode);
      return _decode(response);
    } on TimeoutException catch (error) {
      final fallbackUri = _localhostFallbackUri(path);
      if (fallbackUri == null) {
        rethrow;
      }
      if (kDebugMode) {
        debugPrint('[ApiClient] Primary TimeoutException for $primaryUri: $error');
        debugPrint('[ApiClient] Retrying with $fallbackUri');
      }
      final response = await send(fallbackUri);
      _debugResponse('$method fallback', path, response.statusCode);
      return _decode(response);
    }
  }

  Uri? _localhostFallbackUri(String path) {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      return null;
    }
    final base = Uri.tryParse(baseUrl);
    if (base == null) {
      return null;
    }
    if (base.host != 'localhost' && base.host != '127.0.0.1') {
      return null;
    }
    return _uriForBase(path, base.replace(host: '10.0.2.2').toString());
  }

  Uri _uriForBase(String path, String base) {
    final normalizedBase = base.endsWith('/') ? base.substring(0, base.length - 1) : base;
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$normalizedBase$normalizedPath');
  }

  static Future<T> wrapNetworkErrors<T>(Future<T> Function() call) async {
    try {
      return await call();
    } on SocketException catch (error) {
      if (kDebugMode) {
        debugPrint('[ApiClient] SocketException: $error');
      }
      throw const ApiException('No internet connection. Please check your network.');
    } on TimeoutException catch (error) {
      if (kDebugMode) {
        debugPrint('[ApiClient] TimeoutException: $error');
      }
      throw const ApiException('Request timed out. Please try again.');
    }
  }
}
