import 'bunny_upload_models.dart';
import 'bunny_upload_service_stub.dart'
    if (dart.library.js_util) 'bunny_upload_service_web.dart' as impl;

abstract class BunnyUploadService {
  const BunnyUploadService();

  bool get supported;

  Future<BunnyUploadResult?> pickAndUpload(BunnyUploadTicket ticket);
}

BunnyUploadService createBunnyUploadService() => impl.createBunnyUploadService();
