import '../../app/api_client.dart';
import '../../app/api_session_store.dart';
import '../../app/backend_config.dart';
import 'bunny_upload_models.dart';

class BunnyUploadBackend {
  BunnyUploadBackend(this._config);

  final BackendConfig _config;

  Future<BunnyUploadTicket> createUpload({
    required String courseId,
    required String title,
  }) async {
    final sessionStore = await ApiSessionStore.create();
    final session = await sessionStore.load();
    final apiClient = ApiClient(baseUrl: _config.apiBaseUrl!);
    apiClient.setToken(session?.token);
    final result = await apiClient.postJson(
      '/v1/admin/videos/bunny/create-upload',
      authenticated: true,
      body: {
        'courseId': courseId,
        'title': title,
      },
    );
    return BunnyUploadTicket.fromJson(result);
  }
}
