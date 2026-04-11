import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:merit_launchers/app/api_client.dart';

class _StubHttpClient extends http.BaseClient {
  _StubHttpClient(this.handler);

  final Future<http.Response> Function(http.BaseRequest request) handler;
  final requests = <http.BaseRequest>[];

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    requests.add(request);
    final response = await handler(request);
    return http.StreamedResponse(
      Stream.value(response.bodyBytes),
      response.statusCode,
      headers: response.headers,
      request: request,
      reasonPhrase: response.reasonPhrase,
    );
  }
}

void main() {
  group('ApiClient', () {
    test('turns HTML/non-JSON responses into friendly ApiException', () async {
      final httpClient = _StubHttpClient((request) async {
        return http.Response('<!DOCTYPE html><html>nginx error</html>', 500);
      });
      final api = ApiClient(baseUrl: 'https://api.test', client: httpClient);

      expect(
        () => api.getJson('/v1/bootstrap'),
        throwsA(
          isA<ApiException>()
              .having((error) => error.statusCode, 'statusCode', 500)
              .having(
                (error) => error.message,
                'message',
                'Server returned an invalid response. Please try again.',
              ),
        ),
      );
    });

    test('sends JSON headers and bearer token for authenticated calls', () async {
      final httpClient = _StubHttpClient((request) async {
        return http.Response('{"ok":true}', 200);
      });
      final api = ApiClient(baseUrl: 'https://api.test', client: httpClient)
        ..setToken('token-123');

      await api.postJson(
        '/v1/admin/papers',
        authenticated: true,
        body: {'paper': 'payload'},
      );

      expect(httpClient.requests, hasLength(1));
      final request = httpClient.requests.single;
      expect(request.url.toString(), 'https://api.test/v1/admin/papers');
      expect(request.headers['Authorization'], 'Bearer token-123');
      expect(request.headers['Content-Type'], 'application/json');
      expect(request.headers['Accept'], 'application/json');
    });
  });
}
