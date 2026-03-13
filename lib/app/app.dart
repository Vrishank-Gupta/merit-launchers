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

class StudentAuthScreen extends StatelessWidget {
  const StudentAuthScreen({super.key});

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
              _AuthActionCard(
                title: 'Sign in with Google',
                subtitle: 'Fastest path for students using Gmail.',
                buttonLabel: 'Continue with Google',
                onPressed: controller.mockGoogleLogin,
              ),
              const SizedBox(height: 12),
              _AuthActionCard(
                title: 'Sign in with mobile OTP',
                subtitle: 'Use this when you want phone-first access.',
                buttonLabel: 'Continue with mobile OTP',
                outlined: true,
                onPressed: controller.mockOtpLogin,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class AdminEntryScreen extends StatelessWidget {
  const AdminEntryScreen({super.key});

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
                            Text('Open dashboard', style: theme.textTheme.headlineSmall),
                            const SizedBox(height: 10),
                            Text(
                              'For MVP review this uses the seeded admin session. Real role-based auth can be layered next.',
                              style: theme.textTheme.bodyMedium,
                            ),
                            const SizedBox(height: 24),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: controller.continueAsAdmin,
                                child: const Text('Enter admin dashboard'),
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
    this.outlined = false,
  });

  final String title;
  final String subtitle;
  final String buttonLabel;
  final VoidCallback onPressed;
  final bool outlined;

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
              child: outlined
                  ? OutlinedButton(onPressed: onPressed, child: Text(buttonLabel))
                  : ElevatedButton(onPressed: onPressed, child: Text(buttonLabel)),
            ),
          ],
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
