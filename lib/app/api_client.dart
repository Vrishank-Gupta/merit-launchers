import 'dart:convert';

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

  String? get token => _token;

  void setToken(String? token) {
    _token = token;
  }

  Future<Map<String, dynamic>> getJson(
    String path, {
    Map<String, String>? headers,
    bool authenticated = false,
  }) async {
    final response = await _client.get(
      _uri(path),
      headers: _headers(headers, authenticated: authenticated),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> postJson(
    String path, {
    Map<String, String>? headers,
    Object? body,
    bool authenticated = false,
  }) async {
    final response = await _client.post(
      _uri(path),
      headers: _headers(headers, authenticated: authenticated),
      body: body == null ? null : jsonEncode(body),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> putJson(
    String path, {
    Map<String, String>? headers,
    Object? body,
    bool authenticated = false,
  }) async {
    final response = await _client.put(
      _uri(path),
      headers: _headers(headers, authenticated: authenticated),
      body: body == null ? null : jsonEncode(body),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> deleteJson(
    String path, {
    Map<String, String>? headers,
    Object? body,
    bool authenticated = false,
  }) async {
    final request = http.Request('DELETE', _uri(path))
      ..headers.addAll(_headers(headers, authenticated: authenticated));
    if (body != null) {
      request.body = jsonEncode(body);
    }
    final streamed = await _client.send(request);
    final response = await http.Response.fromStream(streamed);
    return _decode(response);
  }

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
      throw ApiException(
        map['message'] as String? ?? 'Request failed.',
        statusCode: response.statusCode,
        data: map,
      );
    }
    return map;
  }
}
