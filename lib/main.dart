import 'package:flutter/material.dart';
import 'package:flutter_tex/flutter_tex.dart';

import 'app/app.dart';
import 'app/app_controller.dart';
import 'app/backend_config.dart';

Future<void>? _teXStartupFuture;

class _StartupErrorScreen extends StatelessWidget {
  const _StartupErrorScreen({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () async {
                  try {
                    await _runBootstrap();
                  } catch (e) {
                    runApp(MaterialApp(
                      home: _StartupErrorScreen(message: _formatStartupError(e)),
                    ));
                  }
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> _runBootstrap() async {
  await _ensureTeXRenderingServerStarted();
  final backendConfig = await BackendConfig.load();
  debugPrint(
    '[Startup] env=${backendConfig.environment.name} apiBaseUrl=${backendConfig.apiBaseUrl} paymentMode=${backendConfig.paymentMode.name}',
  );
  final controller = await AppController.create(backendConfig);
  runApp(
    MeritLaunchersApp(
      controller: controller,
      backendConfig: backendConfig,
    ),
  );
}

Future<void> _ensureTeXRenderingServerStarted() {
  return _teXStartupFuture ??= _startTeXRenderingServer();
}

Future<void> _startTeXRenderingServer() async {
  try {
    await TeXRenderingServer.start();
  } catch (error) {
    final message = error.toString().toLowerCase();
    if (!message.contains('server already started')) {
      rethrow;
    }
  }
}

String _formatStartupError(Object error) {
  final message = error.toString();
  if (message.contains('10.0.2.2:8080') ||
      (message.contains('localhost:8080') &&
          (message.contains('SocketException') || message.contains('Failed to fetch')))) {
    return 'Startup failed: the local API is not reachable.\n\n'
        'For Android emulator:\n'
        '1. Start the local backend with `docker compose up -d --build api nginx`\n'
        '2. Make sure API_BASE_URL in .env.dev is `http://localhost:8080`\n'
        '3. Launch the app again.\n\n'
        'For Android on a real device:\n'
        '1. Start the local backend with `docker compose up -d --build api nginx`\n'
        '2. Run `adb reverse tcp:8080 tcp:8080`\n'
        '3. Launch the app again.\n\n'
        'If you are not using adb reverse, point API_BASE_URL in .env.dev to your laptop LAN IP.';
  }
  if (message.contains('localhost:8080') ||
      message.contains('10.0.2.2:8080') ||
      message.contains('No internet connection. Please check your network.')) {
    return 'Startup failed: the local API is not reachable.\n\n'
        'For Android emulator:\n'
        '1. Start the local backend with `docker compose up -d --build api nginx`\n'
        '2. Make sure API_BASE_URL in .env.dev is `http://localhost:8080`\n'
        '3. Launch the app again.\n\n'
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
    await _runBootstrap();
  } catch (error) {
    runApp(
      MaterialApp(
        home: _StartupErrorScreen(message: _formatStartupError(error)),
      ),
    );
  }
}
