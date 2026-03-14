import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../features/admin/admin_shell.dart';
import '../features/student/student_shell.dart';
import 'app_controller.dart';
import 'backend_config.dart';
import 'models.dart';
import 'theme.dart';

class MeritLaunchersApp extends StatelessWidget {
  const MeritLaunchersApp({
    super.key,
    required this.controller,
    required this.backendConfig,
  });

  final AppController controller;
  final BackendConfig backendConfig;

  @override
  Widget build(BuildContext context) {
    return AppScope(
      controller: controller,
      backendConfig: backendConfig,
      child: AnimatedBuilder(
        animation: controller,
        builder: (context, _) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            title: kIsWeb ? 'Merit Launchers Admin' : 'Merit Launchers',
            theme: MeritTheme.lightTheme(),
            home: kIsWeb ? _webHome() : _mobileHome(),
          );
        },
      ),
    );
  }

  Widget _webHome() {
    return switch (controller.stage) {
      AppStage.admin => const AdminShell(),
      _ => const AdminEntryScreen(),
    };
  }

  Widget _mobileHome() {
    return switch (controller.stage) {
      AppStage.onboarding => const OnboardingScreen(),
      AppStage.student => const StudentShell(),
      _ => const StudentAuthScreen(),
    };
  }
}

class AppScope extends InheritedNotifier<AppController> {
  const AppScope({
    super.key,
    required AppController controller,
    required this.backendConfig,
    required super.child,
  }) : super(notifier: controller);

  final BackendConfig backendConfig;

  static AppController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppScope>();
    assert(scope != null, 'AppScope not found in context');
    return scope!.notifier!;
  }

  static BackendConfig backendOf(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppScope>();
    assert(scope != null, 'AppScope not found in context');
    return scope!.backendConfig;
  }
}

class StudentAuthScreen extends StatefulWidget {
  const StudentAuthScreen({super.key});

  @override
  State<StudentAuthScreen> createState() => _StudentAuthScreenState();
}

class _StudentAuthScreenState extends State<StudentAuthScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final backend = AppScope.backendOf(context);
    final theme = Theme.of(context);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF3F8FC), Color(0xFFE7F6FB)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: MeritTheme.border),
                ),
                child: Row(
                  children: [
                    Image.asset('assets/branding/logo.png', width: 52, height: 52),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text('Merit Launchers', style: theme.textTheme.headlineSmall),
                    ),
                    _EnvBadge(label: backend.environmentLabel),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              Text(
                'Practice papers, without the clutter.',
                style: theme.textTheme.displaySmall,
              ),
              const SizedBox(height: 12),
              Text(
                'Access exam packs, attempt timed papers, track receipts, and keep your preparation organized in one focused app.',
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: 24),
              const _StudentFeatureStrip(),
              const SizedBox(height: 28),
              if (controller.canUseGoogleSignIn) ...[
                _AuthActionCard(
                  title: 'Sign in with Google',
                  subtitle: 'Fastest path for students using Gmail.',
                  buttonLabel: 'Continue with Google',
                  loading: controller.authBusy,
                  onPressed: controller.signInStudentWithGoogle,
                ),
                const SizedBox(height: 12),
              ],
              _OtpAuthCard(
                title: 'Sign in with mobile OTP',
                subtitle: 'Use your phone number for SMS-based access.',
                phoneController: _phoneController,
                otpController: _otpController,
                otpRequested: controller.studentOtpRequested,
                loading: controller.authBusy,
                onRequestOtp: () => controller.requestStudentOtp(_phoneController.text),
                onVerifyOtp: () => controller.verifyStudentOtp(_otpController.text),
              ),
              if (controller.canUseDevBypass) ...[
                const SizedBox(height: 12),
                _AuthActionCard(
                  title: 'Local development sign in',
                  subtitle: 'Bypass Google and OTP while testing against the local API.',
                  buttonLabel: 'Continue as test student',
                  loading: controller.authBusy,
                  onPressed: controller.signInStudentWithDevBypass,
                ),
              ],
              if (controller.authError != null) ...[
                const SizedBox(height: 12),
                _AuthStatusBanner(message: controller.authError!),
              ],
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class AdminEntryScreen extends StatefulWidget {
  const AdminEntryScreen({super.key});

  @override
  State<AdminEntryScreen> createState() => _AdminEntryScreenState();
}

class _AdminEntryScreenState extends State<AdminEntryScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final backend = AppScope.backendOf(context);
    final theme = Theme.of(context);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF4F7FB), Color(0xFFEAF2F8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1120),
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Row(
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 40),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Image.asset('assets/branding/logo.png', width: 64, height: 64),
                              const SizedBox(width: 16),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Merit Launchers', style: theme.textTheme.headlineMedium),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Admin console',
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      color: MeritTheme.secondaryMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 28),
                          Text(
                            'Run content, students, affiliates, and revenue from a single web dashboard.',
                            style: theme.textTheme.displaySmall,
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'This web surface is separate from the student app. It is designed for content publishing, student support, and operational visibility.',
                            style: theme.textTheme.bodyLarge,
                          ),
                          const SizedBox(height: 24),
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: [
                              _AdminCapability(label: 'Course publishing'),
                              _AdminCapability(label: 'Paper authoring'),
                              _AdminCapability(label: 'Affiliate tracking'),
                              _AdminCapability(label: 'Revenue visibility'),
                              _AdminCapability(label: backend.environmentLabel),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 360,
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(28),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Admin sign in', style: theme.textTheme.headlineSmall),
                            const SizedBox(height: 10),
                              Text(
                                'Only allowlisted Google accounts or phone numbers should be able to enter the admin console.',
                                style: theme.textTheme.bodyMedium,
                              ),
                              const SizedBox(height: 24),
                              if (controller.canUseDevBypass) ...[
                                _AuthActionCard(
                                  title: 'Local development sign in',
                                  subtitle: 'Use this for local API testing without Google or OTP.',
                                  buttonLabel: 'Continue as test admin',
                                  loading: controller.authBusy,
                                  onPressed: controller.signInAdminWithDevBypass,
                                ),
                                const SizedBox(height: 12),
                              ],
                              if (controller.canUseGoogleSignIn) ...[
                                _AuthActionCard(
                                  title: 'Continue with Google',
                                  subtitle: 'Best option for admin users with a known Gmail account.',
                                  buttonLabel: 'Sign in with Google',
                                loading: controller.authBusy,
                                onPressed: controller.signInAdminWithGoogle,
                              ),
                              const SizedBox(height: 12),
                            ],
                            _OtpAuthCard(
                              title: 'Continue with phone OTP',
                              subtitle: 'Use this only for allowlisted admin phone numbers.',
                              phoneController: _phoneController,
                              otpController: _otpController,
                              otpRequested: controller.adminOtpRequested,
                              loading: controller.authBusy,
                                onRequestOtp: () => controller.requestAdminOtp(_phoneController.text),
                                onVerifyOtp: () => controller.verifyAdminOtp(_otpController.text),
                              ),
                              if (controller.authError != null) ...[
                                const SizedBox(height: 12),
                                _AuthStatusBanner(message: controller.authError!),
                              ],
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton(
                                onPressed: backend.isDemo ? controller.continueAsAdmin : null,
                                child: const Text('Enter demo dashboard'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
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

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _nameController = TextEditingController(text: 'Aarav Sharma');
  final _cityController = TextEditingController(text: 'Delhi');
  final _referralController = TextEditingController(text: 'AFF-CAMPUS-11');
  final _formKey = GlobalKey<FormState>();
  bool _submitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    _referralController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Student onboarding'),
        leading: IconButton(
          onPressed: controller.logout,
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Complete your profile', style: theme.textTheme.headlineSmall),
                      const SizedBox(height: 10),
                      Text(
                        'Keep this short: name, city, and referral code if you were referred by an affiliate.',
                        style: theme.textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 24),
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(labelText: 'Full name'),
                        validator: (value) =>
                            value == null || value.trim().isEmpty ? 'Enter a name' : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        initialValue: controller.currentStudent.contact,
                        enabled: false,
                        decoration: const InputDecoration(labelText: 'Login contact'),
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _cityController,
                        decoration: const InputDecoration(labelText: 'City'),
                        validator: (value) =>
                            value == null || value.trim().isEmpty ? 'Enter a city' : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _referralController,
                        decoration: const InputDecoration(
                          labelText: 'Referral code',
                          helperText: 'Optional. Used for affiliate attribution.',
                        ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _submitting
                              ? null
                              : () async {
                                  if (_formKey.currentState!.validate()) {
                                    setState(() => _submitting = true);
                                    await controller.completeOnboarding(
                                      name: _nameController.text.trim(),
                                      city: _cityController.text.trim(),
                                      referralCode: _referralController.text.trim(),
                                    );
                                    if (mounted) {
                                      setState(() => _submitting = false);
                                    }
                                  }
                                },
                          child: Text(_submitting ? 'Saving...' : 'Enter app'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AuthActionCard extends StatelessWidget {
  const _AuthActionCard({
    required this.title,
    required this.subtitle,
    required this.buttonLabel,
    required this.onPressed,
    this.loading = false,
  });

  final String title;
  final String subtitle;
  final String buttonLabel;
  final Future<void> Function()? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            Text(subtitle),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: loading || onPressed == null ? null : () => onPressed!(),
                child: Text(loading ? 'Please wait...' : buttonLabel),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OtpAuthCard extends StatelessWidget {
  const _OtpAuthCard({
    required this.title,
    required this.subtitle,
    required this.phoneController,
    required this.otpController,
    required this.otpRequested,
    required this.loading,
    required this.onRequestOtp,
    required this.onVerifyOtp,
  });

  final String title;
  final String subtitle;
  final TextEditingController phoneController;
  final TextEditingController otpController;
  final bool otpRequested;
  final bool loading;
  final Future<void> Function() onRequestOtp;
  final Future<void> Function() onVerifyOtp;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            Text(subtitle),
            const SizedBox(height: 16),
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone number',
                hintText: '+91 9876543210',
              ),
            ),
            if (otpRequested) ...[
              const SizedBox(height: 12),
              TextField(
                controller: otpController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'OTP code',
                  hintText: 'Enter the SMS code',
                ),
              ),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: loading
                    ? null
                    : () => otpRequested ? onVerifyOtp() : onRequestOtp(),
                child: Text(
                  loading
                      ? 'Please wait...'
                      : otpRequested
                          ? 'Verify OTP'
                          : 'Send OTP',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AuthStatusBanner extends StatelessWidget {
  const _AuthStatusBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFDECEC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF6C7C5)),
      ),
      child: Text(
        message,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: const Color(0xFF8E2F28),
            ),
      ),
    );
  }
}

class _StudentFeatureStrip extends StatelessWidget {
  const _StudentFeatureStrip();

  @override
  Widget build(BuildContext context) {
    final items = const [
      'Locked and unlocked papers',
      'Timed mock exams',
      'Receipts and payment history',
      'Support chat access',
    ];

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: items.map((item) => Chip(label: Text(item))).toList(),
    );
  }
}

class _AdminCapability extends StatelessWidget {
  const _AdminCapability({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Text(label),
    );
  }
}

class _EnvBadge extends StatelessWidget {
  const _EnvBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: MeritTheme.primarySoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: MeritTheme.secondary,
            ),
      ),
    );
  }
}
