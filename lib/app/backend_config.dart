import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

enum AppEnvironment { demo, dev, prod }

class BackendConfig {
  BackendConfig({
    required this.environment,
    required this.supabaseUrl,
    required this.supabaseAnonKey,
    required this.razorpayKeyId,
  });

  final AppEnvironment environment;
  final String? supabaseUrl;
  final String? supabaseAnonKey;
  final String? razorpayKeyId;

  String get environmentLabel => environment.name.toUpperCase();
  bool get hasRazorpay => razorpayKeyId != null && razorpayKeyId!.isNotEmpty;
  bool get isDemo => environment == AppEnvironment.demo;

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

    final url = dotenv.env['SUPABASE_URL'];
    final anonKey = dotenv.env['SUPABASE_ANON_KEY'];
    final razorpayKeyId = dotenv.env['RAZORPAY_KEY_ID'];

    if (environment == AppEnvironment.demo) {
      return BackendConfig(
        environment: environment,
        supabaseUrl: url,
        supabaseAnonKey: anonKey,
        razorpayKeyId: razorpayKeyId,
      );
    }

    if (url == null || url.isEmpty || anonKey == null || anonKey.isEmpty) {
      throw StateError('Supabase environment values are missing for ${environment.name}.');
    }

    await Supabase.initialize(
      url: url,
      anonKey: anonKey,
      debug: kDebugMode,
    );

    return BackendConfig(
      environment: environment,
      supabaseUrl: url,
      supabaseAnonKey: anonKey,
      razorpayKeyId: razorpayKeyId,
    );
  }
}
