import 'package:flutter/material.dart';
import 'package:flutter_tex/flutter_tex.dart';

import 'app/app.dart';
import 'app/app_controller.dart';
import 'app/backend_config.dart';

String _formatStartupError(Object error) {
  final message = error.toString();
  if (message.contains('localhost:8080') &&
      (message.contains('SocketException') || message.contains('Failed to fetch'))) {
    return 'Startup failed: the local API is not reachable.\n\n'
        'For Android on a real device:\n'
        '1. Start the local backend with `docker compose up -d --build api nginx`\n'
        '2. Run `adb reverse tcp:8080 tcp:8080`\n'
        '3. Launch the app again.\n\n'
        'If you are not using adb reverse, point API_BASE_URL in .env.dev to your laptop LAN IP.';
  }
  return 'Startup failed: $message';
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await TeXRenderingServer.start();
    final backendConfig = await BackendConfig.load();
    final controller = await AppController.create(backendConfig);
    runApp(
      MeritLaunchersApp(
        controller: controller,
        backendConfig: backendConfig,
      ),
    );
  } catch (error) {
    runApp(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                _formatStartupError(error),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
