import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../features/admin/admin_shell.dart';
import '../features/marketing/marketing_shell.dart';
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
    final webSurface = _resolveWebSurface();
    return AppScope(
      controller: controller,
      backendConfig: backendConfig,
      child: AnimatedBuilder(
        animation: controller,
        builder: (context, _) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            title: switch (webSurface) {
              _WebSurface.admin => 'Merit Launchers Admin',
              _WebSurface.marketing => 'Merit Launchers Marketing',
              _ => 'Merit Launchers',
            },
            theme: MeritTheme.lightTheme(),
            home: kIsWeb ? _webHome(webSurface) : _mobileHome(),
          );
        },
      ),
    );
  }

  Widget _webHome(_WebSurface surface) {
    if (surface == _WebSurface.admin) {
      return switch (controller.stage) {
        AppStage.admin => const AdminShell(),
        _ => const AdminEntryScreen(),
      };
    }

    if (surface == _WebSurface.marketing) {
      return switch (controller.stage) {
        AppStage.admin => const MarketingShell(),
        _ => const MarketingEntryScreen(),
      };
    }

    if (!backendConfig.studentWebEnabled) {
      return const _StudentPortalUnavailable();
    }

    return switch (controller.stage) {
      AppStage.onboarding => const OnboardingScreen(),
      AppStage.student => const StudentWebShell(),
      AppStage.admin => const StudentWebShell(),
      _ => const StudentAuthScreen(),
    };
  }

  Widget _mobileHome() {
    return switch (controller.stage) {
      AppStage.onboarding => const OnboardingScreen(),
      AppStage.student => const StudentShell(),
      _ => const StudentAuthScreen(),
    };
  }

  _WebSurface _resolveWebSurface() {
    if (!kIsWeb) {
      return _WebSurface.student;
    }

    final firstSegment = Uri.base.pathSegments.isEmpty ? '' : Uri.base.pathSegments.first;
    return switch (firstSegment.toLowerCase()) {
      'admin' => _WebSurface.admin,
      'marketing' => _WebSurface.marketing,
      _ => _WebSurface.student,
    };
  }
}

enum _WebSurface {
  admin,
  marketing,
  student,
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
  final _referralController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _referralController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final backend = AppScope.backendOf(context);
    final theme = Theme.of(context);
    final width = MediaQuery.sizeOf(context).width;
    final isWide = width >= 980;
    if (_referralController.text != (controller.capturedReferralCode ?? '')) {
      _referralController.text = controller.capturedReferralCode ?? '';
      _referralController.selection = TextSelection.collapsed(offset: _referralController.text.length);
    }
    final loginCards = [
      if (controller.canUseGoogleSignIn)
        _AuthActionCard(
          title: 'Sign in with Google',
          subtitle: 'Fastest path for students using Gmail.',
          buttonLabel: 'Continue with Google',
          loading: controller.authBusy,
          onPressed: controller.signInStudentWithGoogle,
        ),
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
      if (controller.canUseDevBypass)
        _AuthActionCard(
          title: 'Local development sign in',
          subtitle: 'Bypass Google and OTP while testing against the local API.',
          buttonLabel: 'Continue as test student',
          loading: controller.authBusy,
          onPressed: controller.signInStudentWithDevBypass,
        ),
    ];

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF6FBFF), Color(0xFFEBF5FB)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1180),
              child: Padding(
                padding: EdgeInsets.fromLTRB(isWide ? 28 : 18, 20, isWide ? 28 : 18, 20),
                child: isWide
                    ? Row(
                        children: [
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(right: 26),
                              child: _StudentAuthHero(theme: theme, backend: backend),
                            ),
                          ),
                          Expanded(
                            child: _StudentAuthPanel(
                              controller: controller,
                              cards: loginCards,
                              referralController: _referralController,
                            ),
                          ),
                        ],
                      )
                    : ListView(
                        children: [
                          _StudentAuthHero(theme: theme, backend: backend, compact: true),
                          const SizedBox(height: 18),
                          _StudentAuthPanel(
                            controller: controller,
                            cards: loginCards,
                            referralController: _referralController,
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StudentAuthHero extends StatelessWidget {
  const _StudentAuthHero({
    required this.theme,
    required this.backend,
    this.compact = false,
  });

  final ThemeData theme;
  final BackendConfig backend;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: MeritTheme.primarySoft,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Image.asset('assets/branding/logo.png', width: 40, height: 40),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Merit Launchers', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 2),
                  Text(
                    'Mock tests · Results · Rankings',
                    style: theme.textTheme.bodyMedium?.copyWith(color: MeritTheme.secondaryMuted),
                  ),
                ],
              ),
            ),
            _EnvBadge(label: backend.environmentLabel),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(36),
        border: Border.all(color: MeritTheme.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10395F).withValues(alpha: 0.08),
            blurRadius: 26,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: MeritTheme.primarySoft,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Image.asset('assets/branding/logo.png', width: 58, height: 58),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Merit Launchers', style: theme.textTheme.headlineSmall),
                      const SizedBox(height: 6),
                      Text(
                        'Student portal',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: MeritTheme.secondaryMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                _EnvBadge(label: backend.environmentLabel),
              ],
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: MeritTheme.primarySoft,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                'Timed papers, synced progress, results that actually help',
                style: theme.textTheme.labelLarge?.copyWith(color: MeritTheme.secondary),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'Practice smarter. Track every attempt. Resume anywhere.',
              style: theme.textTheme.displaySmall,
            ),
            const SizedBox(height: 12),
            Text(
              'Attempt full-length mocks, pause and resume across devices, download receipts and result reports, and keep your preparation organized in one focused workspace.',
              style: theme.textTheme.bodyLarge?.copyWith(height: 1.55),
            ),
            const SizedBox(height: 22),
            const _StudentFeatureStrip(),
            const SizedBox(height: 24),
            Wrap(
              spacing: 14,
              runSpacing: 14,
              children: const [
                _StudentHeroMetric(value: 'Cross-device', label: 'Resume tests'),
                _StudentHeroMetric(value: 'Instant', label: 'Result analytics'),
                _StudentHeroMetric(value: 'Clean', label: 'Receipts & history'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StudentAuthPanel extends StatelessWidget {
  const _StudentAuthPanel({
    required this.controller,
    required this.cards,
    required this.referralController,
  });

  final AppController controller;
  final List<Widget> cards;
  final TextEditingController referralController;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: MeritTheme.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF102C47).withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: SingleChildScrollView(
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sign in to continue', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            'Your purchased courses, pending tests, support history, and receipts will be available right after sign in.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: MeritTheme.secondaryMuted,
                  height: 1.5,
                ),
          ),
          const SizedBox(height: 18),
          for (var i = 0; i < cards.length; i++) ...[
            cards[i],
            if (i != cards.length - 1) const SizedBox(height: 12),
          ],
          if (controller.authError != null) ...[
            const SizedBox(height: 12),
            _AuthStatusBanner(message: controller.authError!),
          ],
        ],
      ),
      ),
    );
  }
}

class _StudentHeroMetric extends StatelessWidget {
  const _StudentHeroMetric({
    required this.value,
    required this.label,
  });

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 170,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FBFF),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 6),
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _MarketingAccessHero extends StatelessWidget {
  const _MarketingAccessHero({
    required this.theme,
    required this.backend,
  });

  final ThemeData theme;
  final BackendConfig backend;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: MeritTheme.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF102C47).withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: MeritTheme.primarySoft,
                  borderRadius: BorderRadius.circular(22),
                ),
                child: Image.asset('assets/branding/logo.png', width: 52, height: 52),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Marketing performance', style: theme.textTheme.headlineSmall),
                    const SizedBox(height: 4),
                    Text(
                      'Referral operations console',
                      style: theme.textTheme.bodyMedium?.copyWith(color: MeritTheme.secondaryMuted),
                    ),
                  ],
                ),
              ),
              _EnvBadge(label: backend.environmentLabel),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'Track every employee code from signup to paid revenue.',
            style: theme.textTheme.displaySmall,
          ),
          const SizedBox(height: 12),
          Text(
            'Your marketing head can create employee referral codes, watch who signed up through each code, track paid conversions, and measure revenue contribution without touching the core admin console.',
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: const [
              _AdminCapability(label: 'Employee code allotment'),
              _AdminCapability(label: 'Signup tracking'),
              _AdminCapability(label: 'Paid conversion tracking'),
              _AdminCapability(label: 'Revenue attribution'),
            ],
          ),
        ],
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
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
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
          child: SizedBox(
            width: 400,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Image.asset('assets/branding/logo.png', width: 56, height: 56),
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: Text('Admin Sign In', style: theme.textTheme.headlineSmall),
                    ),
                    const SizedBox(height: 28),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.mail_outline),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline),
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      onSubmitted: (_) => controller.signInAdminWithPassword(
                        _emailController.text.trim(), _passwordController.text),
                    ),
                    if (controller.authError != null) ...[
                      const SizedBox(height: 12),
                      _AuthStatusBanner(message: controller.authError!),
                    ],
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: controller.authBusy ? null : () => controller.signInAdminWithPassword(
                          _emailController.text.trim(), _passwordController.text),
                        child: controller.authBusy
                            ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Sign In'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class MarketingEntryScreen extends StatefulWidget {
  const MarketingEntryScreen({super.key});

  @override
  State<MarketingEntryScreen> createState() => _MarketingEntryScreenState();
}

class _MarketingEntryScreenState extends State<MarketingEntryScreen> {
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
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 980;

    final loginCard = SizedBox(
      width: compact ? double.infinity : 380,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Marketing head sign in', style: theme.textTheme.headlineSmall),
              const SizedBox(height: 10),
              Text(
                'Use allowlisted Google or OTP access to open the employee referral dashboard and manage new codes.',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              if (controller.canUseDevBypass) ...[
                _AuthActionCard(
                  title: 'Local development sign in',
                  subtitle: 'Use this to test the marketing dashboard against the local API.',
                  buttonLabel: 'Continue as marketing head',
                  loading: controller.authBusy,
                  onPressed: controller.signInAdminWithDevBypass,
                ),
                const SizedBox(height: 12),
              ],
              if (controller.canUseGoogleSignIn) ...[
                _AuthActionCard(
                  title: 'Continue with Google',
                  subtitle: 'Best for your marketing lead when using an allowlisted Gmail account.',
                  buttonLabel: 'Sign in with Google',
                  loading: controller.authBusy,
                  onPressed: controller.signInAdminWithGoogle,
                ),
                const SizedBox(height: 12),
              ],
              _OtpAuthCard(
                title: 'Continue with phone OTP',
                subtitle: 'Use this only for allowlisted marketing-lead phone numbers.',
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
    );

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF4F7FB), Color(0xFFEAF2F8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1180),
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: compact
                    ? ListView(
                        children: [
                          _MarketingAccessHero(theme: theme, backend: backend),
                          const SizedBox(height: 18),
                          loginCard,
                        ],
                      )
                    : Row(
                        children: [
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(right: 28),
                              child: _MarketingAccessHero(theme: theme, backend: backend),
                            ),
                          ),
                          loginCard,
                        ],
                      ),
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
  final _nameController = TextEditingController();
  final _cityController = TextEditingController();
  final _referralController = TextEditingController();
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
    final student = controller.currentStudent;

    if (_nameController.text != student.name) {
      _nameController.text = student.name;
      _nameController.selection = TextSelection.collapsed(offset: _nameController.text.length);
    }
    if (_cityController.text != student.city) {
      _cityController.text = student.city;
      _cityController.selection = TextSelection.collapsed(offset: _cityController.text.length);
    }
    final effectiveReferral = student.referralCode ?? controller.capturedReferralCode ?? '';
    if (_referralController.text != effectiveReferral) {
      _referralController.text = effectiveReferral;
      _referralController.selection = TextSelection.collapsed(offset: _referralController.text.length);
    }

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

class _StudentPortalUnavailable extends StatelessWidget {
  const _StudentPortalUnavailable();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF6FBFF), Color(0xFFEBF5FB)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: MeritTheme.primarySoft,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Image.asset('assets/branding/logo.png', width: 56, height: 56),
                  ),
                  const SizedBox(height: 28),
                  Text('Merit Launchers', style: theme.textTheme.headlineMedium),
                  const SizedBox(height: 12),
                  Text(
                    'The student app is coming soon.',
                    style: theme.textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Practice papers, timed tests, and result analytics will be available here shortly. Stay tuned.',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: MeritTheme.secondaryMuted,
                      height: 1.55,
                    ),
                    textAlign: TextAlign.center,
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
