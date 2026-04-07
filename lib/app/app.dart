import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

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
      AppStage.phoneVerification => const PhoneVerificationScreen(),
      AppStage.emailCollection => const EmailCollectionScreen(),
      AppStage.onboarding => const OnboardingScreen(),
      AppStage.student => const StudentWebShell(),
      AppStage.admin => const StudentWebShell(),
      _ => const StudentAuthScreen(),
    };
  }

  Widget _mobileHome() {
    return switch (controller.stage) {
      AppStage.phoneVerification => const PhoneVerificationScreen(),
      AppStage.emailCollection => const EmailCollectionScreen(),
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

Future<void> openMeritHomePage() async {
  final destination = kIsWeb ? Uri.parse('${Uri.base.origin}/') : Uri.parse('https://meritlaunchers.com/');
  await launchUrl(destination, webOnlyWindowName: '_self');
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
  final _referralController = TextEditingController();

  @override
  void dispose() {
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
      _StudentEmailAuthCard(
        controller: controller,
        referralController: _referralController,
      ),
      if (controller.canUseDevBypass)
        _AuthActionCard(
          title: 'Local development sign in',
          subtitle: 'Bypass Google while testing against the local API.',
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
                              compact: false,
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
                            compact: true,
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
      return Container(
        padding: const EdgeInsets.fromLTRB(22, 22, 22, 24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF17345C), Color(0xFF23B9EA)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF17345C).withValues(alpha: 0.18),
              blurRadius: 28,
              offset: const Offset(0, 18),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                InkWell(
                  borderRadius: BorderRadius.circular(18),
                  onTap: openMeritHomePage,
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
                    ),
                    child: Image.asset('assets/branding/logo.png', width: 38, height: 38),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Merit Launchers',
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Student portal',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.82),
                        ),
                      ),
                    ],
                  ),
                ),
                _EnvBadge(label: backend.environmentLabel),
              ],
            ),
            const SizedBox(height: 22),
            Text(
              'Practice smart. Perform better. Launch your merit.',
              style: theme.textTheme.headlineMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                height: 1.08,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Access mock tests, structured courses, analytics, and progress tracking from one student workspace.',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: Colors.white.withValues(alpha: 0.84),
                height: 1.5,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 18),
            const Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _CompactAuthPill(label: 'Mock tests'),
                _CompactAuthPill(label: 'Results'),
                _CompactAuthPill(label: 'Rankings'),
              ],
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Main Heading
          RichText(
            text: TextSpan(
              style: theme.textTheme.displaySmall?.copyWith(
                fontWeight: FontWeight.w900,
                height: 1.15,
              ),
              children: [
                const TextSpan(text: 'Practice Smart.\n'),
                const TextSpan(text: 'Perform Better.\n'),
                TextSpan(
                  text: 'Launch Your Merit.',
                  style: TextStyle(color: const Color(0xFF23B9EA)),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Description
          Text(
            "India's comprehensive mock test platform for CUET, CLAT, SSC & more.\nGet instant results, deep analytics, and structured preparation.",
            style: theme.textTheme.titleMedium?.copyWith(
              color: const Color(0xFF5F7088),
              height: 1.6,
              fontWeight: FontWeight.w500,
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Stats Section
          Wrap(
            spacing: 40,
            runSpacing: 24,
            children: const [
              _StatBlock(value: '50K+', label: 'Students'),
              _StatBlock(value: '95%', label: 'Success'),
              _StatBlock(value: '10K+', label: 'Tests'),
            ],
          ),
          
          const SizedBox(height: 32),
          
          // CTA Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF26C1EE),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 2,
              ),
              onPressed: () {
                // Could navigate to free test or scroll to login
              },
              child: const Text(
                'Take Free Mock Test',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StudentAuthPanel extends StatelessWidget {
  const _StudentAuthPanel({
    required this.controller,
    required this.cards,
    required this.referralController,
    this.compact = false,
  });

  final AppController controller;
  final List<Widget> cards;
  final TextEditingController referralController;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          compact ? 'Choose a sign-in method' : 'Student Login',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontSize: compact ? 26 : 32,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          compact
              ? 'Use Google for the fastest path, or sign in with email and password.'
              : 'Continue with Google or email-password to open your student workspace',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: const Color(0xFF6C7C92),
            fontWeight: FontWeight.w500,
            height: 1.45,
          ),
        ),
        const SizedBox(height: 24),
        for (var i = 0; i < cards.length; i++) ...[
          cards[i],
          if (i != cards.length - 1) const SizedBox(height: 12),
        ],
        if (controller.authError != null) ...[
          const SizedBox(height: 12),
          _AuthStatusBanner(message: controller.authError!),
        ],
        if (controller.authNotice != null) ...[
          const SizedBox(height: 12),
          _AuthNoticeBanner(message: controller.authNotice!),
        ],
      ],
    );

    if (!compact) {
      return SingleChildScrollView(child: content);
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: MeritTheme.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF123252).withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: content,
    );
  }
}

class _CompactAuthPill extends StatelessWidget {
  const _CompactAuthPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final normalized = label.trim().toUpperCase();
    if (normalized == 'PROD' || normalized == 'PRODUCTION' || normalized == 'LIVE') {
      return const SizedBox.shrink();
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelLarge?.copyWith(
          color: Colors.white,
          fontWeight: FontWeight.w600,
        ),
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
                InkWell(
                  borderRadius: BorderRadius.circular(22),
                  onTap: openMeritHomePage,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: MeritTheme.primarySoft,
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: Image.asset('assets/branding/logo.png', width: 52, height: 52),
                  ),
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
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: openMeritHomePage,
                        child: Image.asset('assets/branding/logo.png', width: 56, height: 56),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: Text('Admin Sign In', style: theme.textTheme.headlineSmall),
                    ),
                    const SizedBox(height: 28),
                    AutofillGroup(
                      child: Column(
                        children: [
                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            autofillHints: const [AutofillHints.username, AutofillHints.email],
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
                            autofillHints: const [AutofillHints.password],
                            decoration: InputDecoration(
                              labelText: 'Password',
                              prefixIcon: const Icon(Icons.lock_outline),
                              border: const OutlineInputBorder(),
                              suffixIcon: IconButton(
                                icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                                onPressed: () => setState(() => _obscure = !_obscure),
                              ),
                            ),
                            onSubmitted: (_) {
                              TextInput.finishAutofillContext();
                              controller.signInAdminWithPassword(
                                _emailController.text.trim(), _passwordController.text);
                            },
                          ),
                        ],
                      ),
                    ),
                    if (controller.authError != null) ...[
                      const SizedBox(height: 12),
                      _AuthStatusBanner(message: controller.authError!),
                    ],
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: controller.authBusy ? null : () {
                          TextInput.finishAutofillContext();
                          controller.signInAdminWithPassword(
                            _emailController.text.trim(), _passwordController.text);
                        },
                        child: controller.authBusy
                            ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Sign In'),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: controller.authBusy
                            ? null
                            : () {
                                final email = _emailController.text.trim();
                                if (email.isEmpty) {
                                  controller.showAuthError(
                                    'Enter your email above before requesting a reset.',
                                  );
                                  return;
                                }
                                controller.requestPasswordReset(
                                  email: email,
                                  audience: 'admin',
                                );
                              },
                        child: const Text('Forgot password?'),
                      ),
                    ),
                    if (controller.authNotice != null) ...[
                      const SizedBox(height: 8),
                      _AuthNoticeBanner(message: controller.authNotice!),
                    ],
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
                'Use allowlisted Google access to open the employee referral dashboard and manage new codes.',
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

class PhoneVerificationScreen extends StatefulWidget {
  const PhoneVerificationScreen({super.key});

  @override
  State<PhoneVerificationScreen> createState() => _PhoneVerificationScreenState();
}

class _PhoneVerificationScreenState extends State<PhoneVerificationScreen> {
  final _phoneController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final theme = Theme.of(context);
    final busy = controller.phoneVerificationBusy;
    final error = controller.phoneVerificationError;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add your mobile number'),
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Add your mobile number', style: theme.textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text(
                      'This helps us personalise your account, receipts, and support access.',
                      style: theme.textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Mobile number',
                        hintText: '10-digit Indian mobile number',
                        prefixText: '+91 ',
                      ),
                    ),
                    if (error != null) ...[
                      const SizedBox(height: 10),
                      Text(error, style: TextStyle(color: theme.colorScheme.error, fontSize: 13)),
                    ],
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: busy
                            ? null
                            : () async {
                                final phone = _phoneController.text.trim();
                                final digits = phone.replaceAll(RegExp(r'[^0-9]'), '');
                                if (digits.length < 10) {
                                  controller.setPhoneVerificationError('Enter a valid 10-digit mobile number.');
                                  return;
                                }
                                await controller.saveProfilePhone(phone);
                              },
                        child: Text(busy ? 'Saving...' : 'Continue'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class EmailCollectionScreen extends StatefulWidget {
  const EmailCollectionScreen({super.key});

  @override
  State<EmailCollectionScreen> createState() => _EmailCollectionScreenState();
}

class _EmailCollectionScreenState extends State<EmailCollectionScreen> {
  final _emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final theme = Theme.of(context);
    final busy = controller.emailCollectionBusy;
    final error = controller.emailCollectionError;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add your email'),
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
                      Text('Add your email address', style: theme.textTheme.headlineSmall),
                      const SizedBox(height: 8),
                      Text(
                        'This helps us send you receipts and updates.',
                        style: theme.textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 24),
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(labelText: 'Email address'),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) return 'Enter an email';
                          if (!value.contains('@')) return 'Enter a valid email';
                          return null;
                        },
                      ),
                      if (error != null) ...[
                        const SizedBox(height: 10),
                        Text(error, style: TextStyle(color: theme.colorScheme.error, fontSize: 13)),
                      ],
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: busy
                              ? null
                              : () async {
                                  if (_formKey.currentState!.validate()) {
                                    await controller.saveProfileEmail(_emailController.text.trim());
                                  }
                                },
                          child: Text(busy ? 'Saving...' : 'Continue'),
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

class _StatBlock extends StatelessWidget {
  const _StatBlock({
    required this.value,
    required this.label,
  });

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: Color(0xFF23B9EA),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF6C7C92),
          ),
        ),
      ],
    );
  }
}

class _AuthActionCard extends StatefulWidget {
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
  State<_AuthActionCard> createState() => _AuthActionCardState();
}

class _AuthActionCardState extends State<_AuthActionCard>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _buttonHoverController;
  late Animation<double> _scaleAnimation;
  bool _isHovering = false;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _buttonHoverController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeOutCubic),
    );
    _scaleController.forward();
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _buttonHoverController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: FadeTransition(
        opacity: _scaleAnimation,
        child: MouseRegion(
          onEnter: (_) {
            setState(() => _isHovering = true);
            _buttonHoverController.forward();
          },
          onExit: (_) {
            setState(() => _isHovering = false);
            _buttonHoverController.reverse();
          },
          child: Card(
            elevation: _isHovering ? 8 : 2,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _isHovering
                      ? Theme.of(context).primaryColor.withValues(alpha: 0.5)
                      : Colors.transparent,
                  width: 2,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.subtitle,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: widget.loading || widget.onPressed == null
                            ? null
                            : () => widget.onPressed!(),
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: widget.loading
                            ? SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Theme.of(context).primaryColor,
                                  ),
                                ),
                              )
                            : Center(
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text(
                                    widget.buttonLabel,
                                    maxLines: 1,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 16,
                                    ),
                                  ),
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
      ),
    );
  }
}

class _StudentEmailAuthCard extends StatefulWidget {
  const _StudentEmailAuthCard({
    required this.controller,
    required this.referralController,
  });

  final AppController controller;
  final TextEditingController referralController;

  @override
  State<_StudentEmailAuthCard> createState() => _StudentEmailAuthCardState();
}

class _StudentEmailAuthCardState extends State<_StudentEmailAuthCard> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _createAccount = false;
  bool _obscure = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      widget.controller.showAuthError('Email and password are required.');
      return;
    }
    widget.controller.setPendingReferralCode(widget.referralController.text);
    if (_createAccount) {
      await widget.controller.signUpStudentWithEmail(email, password);
    } else {
      await widget.controller.signInStudentWithPassword(email, password);
    }
  }

  Future<void> _forgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      widget.controller.showAuthError(
        'Enter your email first so we know where to send the reset link.',
      );
      return;
    }
    await widget.controller.requestPasswordReset(email: email, audience: 'student');
  }

  Future<void> _resendVerification() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      widget.controller.showAuthError(
        'Enter your email first so we can resend the verification link.',
      );
      return;
    }
    await widget.controller.resendStudentVerification(email);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _createAccount ? 'Create account with email' : 'Sign in with email',
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _createAccount
                  ? 'We�ll email you a verification link before the first sign-in. If this email already belongs to your Google account, we�ll link the password to the same student profile.'
                  : 'Use your verified student email and password.',
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
            ),
            const SizedBox(height: 16),
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment<bool>(value: false, label: Text('Sign in')),
                ButtonSegment<bool>(value: true, label: Text('Create account')),
              ],
              selected: {_createAccount},
              onSelectionChanged: (selection) {
                setState(() => _createAccount = selection.first);
                widget.controller.clearAuthFeedback();
              },
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email address',
                prefixIcon: Icon(Icons.mail_outline),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passwordController,
              obscureText: _obscure,
              decoration: InputDecoration(
                labelText: _createAccount ? 'Create password' : 'Password',
                prefixIcon: const Icon(Icons.lock_outline),
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
              onSubmitted: (_) => _submit(),
            ),
            if (_createAccount) ...[
              const SizedBox(height: 12),
              TextField(
                controller: widget.referralController,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  labelText: 'Referral code',
                  helperText: 'Optional',
                  prefixIcon: Icon(Icons.confirmation_number_outlined),
                  border: OutlineInputBorder(),
                ),
                onChanged: widget.controller.setPendingReferralCode,
              ),
            ],
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: widget.controller.authBusy ? null : _submit,
                child: widget.controller.authBusy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(_createAccount ? 'Create account' : 'Sign in'),
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                TextButton(
                  onPressed: widget.controller.authBusy ? null : _forgotPassword,
                  child: const Text('Forgot password?'),
                ),
                TextButton(
                  onPressed: widget.controller.authBusy ? null : _resendVerification,
                  child: const Text('Resend verification email'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AuthStatusBanner extends StatefulWidget {
  const _AuthStatusBanner({required this.message});

  final String message;

  @override
  State<_AuthStatusBanner> createState() => _AuthStatusBannerState();
}

class _AuthStatusBannerState extends State<_AuthStatusBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _slideController;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(-1, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _slideController, curve: Curves.easeOut));
    _slideController.forward();
  }

  @override
  void dispose() {
    _slideController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _slideController,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFFDECEC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFF6C7C5),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFF6C7C5).withValues(alpha: 0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(
                Icons.error_outline,
                color: Color(0xFF8E2F28),
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  widget.message,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF8E2F28),
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AuthNoticeBanner extends StatelessWidget {
  const _AuthNoticeBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFE9F8EF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFB7E6C3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline, color: Color(0xFF1C6A3E), size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF1C6A3E),
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StudentFeatureStrip extends StatefulWidget {
  const _StudentFeatureStrip();

  @override
  State<_StudentFeatureStrip> createState() => _StudentFeatureStripState();
}

class _StudentFeatureStripState extends State<_StudentFeatureStrip>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _animations;
  final items = const [
    'Locked and unlocked papers',
    'Timed mock exams',
    'Receipts and payment history',
    'Support chat access',
  ];

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      items.length,
      (index) => AnimationController(
        duration: const Duration(milliseconds: 500),
        vsync: this,
      ),
    );
    _animations = _controllers.map((controller) {
      return Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: controller, curve: Curves.easeOut),
      );
    }).toList();

    // Stagger animations
    for (int i = 0; i < _controllers.length; i++) {
      Future.delayed(Duration(milliseconds: i * 100), () {
        if (mounted) {
          _controllers[i].forward();
        }
      });
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: List.generate(
        items.length,
        (index) => ScaleTransition(
          scale: _animations[index],
          child: FadeTransition(
            opacity: _animations[index],
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.blue.shade50,
                    Colors.blue.shade100,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: Colors.blue.shade200,
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.blue.shade200.withValues(alpha: 0.4),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _getIconForItem(items[index]),
                    size: 16,
                    color: Colors.blue.shade700,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    items[index],
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.blue.shade900,
                          fontWeight: FontWeight.w500,
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

  IconData _getIconForItem(String item) {
    if (item.contains('paper')) return Icons.description;
    if (item.contains('exam')) return Icons.timer;
    if (item.contains('Receipt')) return Icons.receipt;
    if (item.contains('chat')) return Icons.chat_bubble;
    return Icons.check_circle;
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
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: openMeritHomePage,
                      child: Image.asset('assets/branding/logo.png', width: 56, height: 56),
                    ),
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

