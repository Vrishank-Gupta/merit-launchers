import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

enum AppEnvironment { demo, dev, prod }

enum PaymentMode { mock, live }

class BackendConfig {
  BackendConfig({
    required this.environment,
    required this.apiBaseUrl,
    required this.paymentMode,
    required this.googleWebClientId,
    required this.googleAndroidServerClientId,
    required this.googleIosClientId,
  });

  final AppEnvironment environment;
  final String? apiBaseUrl;
  final PaymentMode paymentMode;
  final String? googleWebClientId;
  final String? googleAndroidServerClientId;
  final String? googleIosClientId;

  String get environmentLabel => environment.name.toUpperCase();
  bool get isDemo => environment == AppEnvironment.demo;
  bool get hasApi => apiBaseUrl != null && apiBaseUrl!.isNotEmpty;
  bool get useMockPayments => environment != AppEnvironment.prod || paymentMode == PaymentMode.mock;
  bool get studentWebEnabled => environment != AppEnvironment.prod;

  static AppEnvironment currentEnvironment() {
    const value = String.fromEnvironment('APP_ENV', defaultValue: 'demo');
    return switch (value.toLowerCase()) {
      'prod' => AppEnvironment.prod,
      'dev' => AppEnvironment.dev,
      _ => AppEnvironment.demo,
    };
  }

  static String envFileFor(AppEnvironment environment) {
    return switch (environment) {
      AppEnvironment.demo => '.env.demo',
      AppEnvironment.dev => '.env.dev',
      AppEnvironment.prod => '.env.prod',
    };
  }

  static Future<BackendConfig> load() async {
    final environment = currentEnvironment();
    await dotenv.load(fileName: envFileFor(environment));

    final paymentMode = (dotenv.env['PAYMENT_MODE'] ?? 'mock').toLowerCase() == 'live'
        ? PaymentMode.live
        : PaymentMode.mock;
    final configuredApiBaseUrl = _nonEmpty(dotenv.env['API_BASE_URL']);
    final apiBaseUrl = _resolveApiBaseUrl(
      environment: environment,
      configuredApiBaseUrl: configuredApiBaseUrl,
    );

    if (environment != AppEnvironment.demo && apiBaseUrl == null) {
      throw StateError('API_BASE_URL is missing for ${environment.name}.');
    }

    return BackendConfig(
      environment: environment,
      apiBaseUrl: apiBaseUrl,
      paymentMode: paymentMode,
      googleWebClientId: _nonEmpty(dotenv.env['GOOGLE_WEB_CLIENT_ID']),
      googleAndroidServerClientId: _nonEmpty(dotenv.env['GOOGLE_ANDROID_SERVER_CLIENT_ID']),
      googleIosClientId: _nonEmpty(dotenv.env['GOOGLE_IOS_CLIENT_ID']),
    );
  }

  static String? _nonEmpty(String? value) {
    if (value == null) {
      return null;
    }
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  static String? _resolveApiBaseUrl({
    required AppEnvironment environment,
    required String? configuredApiBaseUrl,
  }) {
    if (environment == AppEnvironment.demo) {
      return configuredApiBaseUrl;
    }

    if (kIsWeb) {
      return '/api';
    }

    return configuredApiBaseUrl;
  }
}
