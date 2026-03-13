import 'package:flutter/material.dart';

import 'app/app.dart';
import 'app/app_controller.dart';
import 'app/backend_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
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
                'Startup failed: $error',
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
