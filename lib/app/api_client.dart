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

  Future<Map<String, dynamic>> postMultipart(
    String path, {
    Map<String, String>? headers,
    Map<String, String>? fields,
    List<http.MultipartFile>? files,
    bool authenticated = false,
  }) =>
      wrapNetworkErrors(() => _requestWithLocalhostFallback(
            method: 'POST',
            path: path,
            authenticated: authenticated,
            send: (uri) async {
              final request = http.MultipartRequest('POST', uri)
                ..headers.addAll(_multipartHeaders(headers, authenticated: authenticated));
              if (fields != null) {
                request.fields.addAll(fields);
              }
              if (files != null) {
                request.files.addAll(files);
              }
              final streamed = await _client.send(request).timeout(_timeout);
              return http.Response.fromStream(streamed);
            },
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

  Map<String, String> _multipartHeaders(
    Map<String, String>? headers, {
    required bool authenticated,
  }) {
    final merged = <String, String>{
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

  Future<Map<String, dynamic>> _requestWithLocalhostFallback({
    required String method,
    required String path,
    required bool authenticated,
    required Future<http.Response> Function(Uri uri) send,
  }) async {
    Object? lastNetworkError;
    final candidates = _candidateUris(path);
    final hasMultipleConfiguredBases = _baseUrls().length > 1;
    for (var index = 0; index < candidates.length; index++) {
      final uri = candidates[index];
      try {
        if (kDebugMode) {
          debugPrint(
            '[ApiClient] ${index == 0 ? 'primary' : 'fallback'} $method $uri auth=$authenticated',
          );
        }
        final response = await send(uri).timeout(
          _timeoutForCandidate(uri, hasMultipleConfiguredBases: hasMultipleConfiguredBases),
        );
        if (kDebugMode) {
          debugPrint('[ApiClient] $method $uri -> ${response.statusCode}');
        }
        return _decode(response);
      } on SocketException catch (error) {
        lastNetworkError = error;
        if (kDebugMode) {
          debugPrint('[ApiClient] SocketException for $uri: $error');
        }
      } on TimeoutException catch (error) {
        lastNetworkError = error;
        if (kDebugMode) {
          debugPrint('[ApiClient] TimeoutException for $uri: $error');
        }
      }
    }

    if (lastNetworkError case final TimeoutException error) {
      throw error;
    }
    if (lastNetworkError case final SocketException error) {
      throw error;
    }
    throw const SocketException('No reachable API base URL.');
  }

  List<Uri> _candidateUris(String path) {
    final uris = <Uri>[];
    final seen = <String>{};
    for (final base in _baseUrls()) {
      final primary = _uriForBase(path, base);
      if (seen.add(primary.toString())) {
        uris.add(primary);
      }
      final localhostFallback = _localhostFallbackUri(path, base);
      if (localhostFallback != null && seen.add(localhostFallback.toString())) {
        uris.add(localhostFallback);
      }
    }
    return uris;
  }

  List<String> _baseUrls() {
    return baseUrl
        .split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList(growable: false);
  }

  Uri? _localhostFallbackUri(String path, String baseUrlValue) {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      return null;
    }
    final base = Uri.tryParse(baseUrlValue);
    if (base == null || (base.host != 'localhost' && base.host != '127.0.0.1')) {
      return null;
    }
    return _uriForBase(path, base.replace(host: '10.0.2.2').toString());
  }

  Uri _uriForBase(String path, String base) {
    final normalizedBase = base.endsWith('/') ? base.substring(0, base.length - 1) : base;
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$normalizedBase$normalizedPath');
  }

  Duration _timeoutForCandidate(
    Uri uri, {
    required bool hasMultipleConfiguredBases,
  }) {
    if (defaultTargetPlatform == TargetPlatform.android && hasMultipleConfiguredBases) {
      final host = uri.host.toLowerCase();
      if (host == 'localhost' || host == '127.0.0.1' || host == '10.0.2.2') {
        return const Duration(seconds: 4);
      }
    }
    return _timeout;
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
