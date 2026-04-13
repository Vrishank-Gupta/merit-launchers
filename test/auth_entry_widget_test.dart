import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merit_launchers/app/app.dart';
import 'package:merit_launchers/app/app_controller.dart';
import 'package:merit_launchers/app/backend_config.dart';
import 'package:shared_preferences/shared_preferences.dart';

BackendConfig _demoConfig() {
  return BackendConfig(
    environment: AppEnvironment.demo,
    apiBaseUrl: null,
    paymentMode: PaymentMode.mock,
    googleWebClientId: null,
    googleAndroidServerClientId: null,
    googleIosClientId: null,
  );
}

Future<void> _pumpScoped(WidgetTester tester, Widget child) async {
  await tester.binding.setSurfaceSize(const Size(1280, 1000));
  addTearDown(() async => tester.binding.setSurfaceSize(null));
  SharedPreferences.setMockInitialValues({});
  final config = _demoConfig();
  final controller = await AppController.create(config);
  await tester.pumpWidget(
    AppScope(
      controller: controller,
      backendConfig: config,
      child: MaterialApp(theme: ThemeData(useMaterial3: true), home: child),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Auth entry screens', () {
    testWidgets(
      'student portal exposes email/password create and sign-in controls',
      (tester) async {
        await _pumpScoped(tester, const StudentAuthScreen());

        expect(
          find.textContaining('sign in', findRichText: true),
          findsWidgets,
        );
        expect(find.text('Sign in with email'), findsOneWidget);
        expect(find.text('Create account'), findsOneWidget);
        expect(find.byType(TextField), findsAtLeastNWidgets(2));
        expect(find.text('Forgot password?'), findsOneWidget);
        expect(find.text('Resend verification email'), findsOneWidget);
      },
    );

    testWidgets('admin portal exposes password login and reset controls', (
      tester,
    ) async {
      await _pumpScoped(tester, const AdminEntryScreen());

      expect(find.text('Admin Sign In'), findsOneWidget);
      expect(find.widgetWithText(TextField, 'Email'), findsOneWidget);
      expect(find.widgetWithText(TextField, 'Password'), findsOneWidget);
      expect(find.text('Sign In'), findsOneWidget);
      expect(find.text('Forgot password?'), findsOneWidget);
    });

    testWidgets(
      'student email form shows user-facing validation instead of silently doing nothing',
      (tester) async {
        await _pumpScoped(tester, const StudentAuthScreen());

        final signInButton = find.text('Sign in').last;
        await tester.ensureVisible(signInButton);
        await tester.tap(signInButton);
        await tester.pumpAndSettle();

        expect(find.text('Email and password are required.'), findsOneWidget);
      },
    );

    testWidgets('admin reset flow tells the admin to enter an email first', (
      tester,
    ) async {
      await _pumpScoped(tester, const AdminEntryScreen());

      await tester.tap(find.text('Forgot password?'));
      await tester.pumpAndSettle();

      expect(
        find.text('Enter your email above before requesting a reset.'),
        findsOneWidget,
      );
    });
  });
}
