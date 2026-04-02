import 'dart:async';

import 'package:flutter/material.dart';

import 'app/app.dart';
import 'app/app_controller.dart';
import 'app/backend_config.dart';

class _StartupPayload {
  const _StartupPayload({
    required this.backendConfig,
    required this.controller,
  });

  final BackendConfig backendConfig;
  final AppController controller;
}

class _StartupApp extends StatefulWidget {
  const _StartupApp();

  @override
  State<_StartupApp> createState() => _StartupAppState();
}

class _StartupAppState extends State<_StartupApp> {
  late Future<_StartupPayload> _startupFuture;

  @override
  void initState() {
    super.initState();
    _startupFuture = _initialize();
  }

  Future<_StartupPayload> _initialize() async {
    final backendConfig = await BackendConfig.load();
    final controllerFuture = AppController.create(backendConfig);
    final controller = await controllerFuture;
    return _StartupPayload(
      backendConfig: backendConfig,
      controller: controller,
    );
  }

  void _retry() {
    setState(() {
      _startupFuture = _initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Merit Launchers',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1F4D8C),
          background: const Color(0xFFF4F8FD),
        ),
        scaffoldBackgroundColor: const Color(0xFFF4F8FD),
        useMaterial3: true,
      ),
      home: FutureBuilder<_StartupPayload>(
        future: _startupFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const _StartupLoadingScreen();
          }
          if (snapshot.hasError) {
            return _StartupErrorScreen(
              message: _formatStartupError(snapshot.error!),
              onRetry: _retry,
            );
          }
          final payload = snapshot.requireData;
          return MeritLaunchersApp(
            controller: payload.controller,
            backendConfig: payload.backendConfig,
          );
        },
      ),
    );
  }
}

class _StartupLoadingScreen extends StatelessWidget {
  const _StartupLoadingScreen();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF4F8FD), Color(0xFFE8F1FB)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Container(
              margin: const EdgeInsets.all(24),
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 26),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.94),
                borderRadius: BorderRadius.circular(28),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x150F2A4A),
                    blurRadius: 28,
                    offset: Offset(0, 18),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(22),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1F4D8C), Color(0xFF27B1E6)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: const Icon(
                      Icons.school_rounded,
                      color: Colors.white,
                      size: 34,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'Merit Launchers',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF183B6B),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Loading your workspace, courses, and latest access.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: const Color(0xFF5D7090),
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const SizedBox(
                    width: 34,
                    height: 34,
                    child: CircularProgressIndicator(strokeWidth: 3.2),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StartupErrorScreen extends StatelessWidget {
  const _StartupErrorScreen({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

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
                onPressed: onRetry,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
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
  runApp(const _StartupApp());
}
