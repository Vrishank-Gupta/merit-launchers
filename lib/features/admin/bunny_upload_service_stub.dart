import 'bunny_upload_models.dart';
import 'bunny_upload_service.dart';

class _UnsupportedBunnyUploadService extends BunnyUploadService {
  const _UnsupportedBunnyUploadService();

  @override
  bool get supported => false;

  @override
  Future<BunnyUploadResult?> pickAndUpload(BunnyUploadTicket ticket) {
    throw UnsupportedError('Bunny upload is supported only on the admin web dashboard.');
  }
}

BunnyUploadService createBunnyUploadService() => const _UnsupportedBunnyUploadService();
