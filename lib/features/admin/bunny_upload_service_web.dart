// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;
import 'dart:js_util' as js_util;

import 'bunny_upload_models.dart';
import 'bunny_upload_service.dart';

class _WebBunnyUploadService extends BunnyUploadService {
  const _WebBunnyUploadService();

  @override
  bool get supported => true;

  @override
  Future<BunnyUploadResult?> pickAndUpload(BunnyUploadTicket ticket) async {
    final maybeBunny = js_util.getProperty<Object?>(html.window, 'meritBunny');
    if (maybeBunny == null) {
      throw StateError('Bunny web helper is unavailable.');
    }
    final meritBunny = maybeBunny;

    final promise = js_util.callMethod<Object>(
      meritBunny,
      'pickAndUpload',
      [js_util.jsify(ticket.toJson())],
    );
    final result = await js_util.promiseToFuture<Object?>(promise);
    if (result == null) {
      return null;
    }

    final json = Map<String, dynamic>.from(js_util.dartify(result)! as Map);
    return BunnyUploadResult.fromJson(json);
  }
}

BunnyUploadService createBunnyUploadService() => const _WebBunnyUploadService();
