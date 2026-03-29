import 'dart:async';
import 'package:flutter/foundation.dart';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart' as pdf;
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:video_player/video_player.dart';

import '../../app/app.dart';
import '../../app/app_controller.dart';
import '../../app/models.dart';
import '../../app/payments/payment_gateway.dart';
import '../../app/payments/payment_models.dart';
import '../../math/math_content.dart';
import '../../app/theme.dart';
import '../../widgets/math_text.dart';
import '../../widgets/rich_math_content.dart';

class StudentShell extends StatefulWidget {
  const StudentShell({super.key});

  @override
  State<StudentShell> createState() => _StudentShellState();
}

class StudentWebShell extends StatelessWidget {
  const StudentWebShell({super.key});

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width < 980) {
      return const StudentShell();
    }

    final controller = AppScope.of(context);
    final snapshot = _StudentDashboardSnapshot.fromController(controller);
    final pages = const [
      StudentHomePage(),
      StudentSupportPage(),
      StudentProfilePage(),
      StudentLibraryPage(),
    ];
    final destinations = const [
      (label: 'Home', icon: Icons.home_outlined),
      (label: 'Support', icon: Icons.support_agent_outlined),
      (label: 'Profile', icon: Icons.person_outline),
      (label: 'Library', icon: Icons.library_books_outlined),
    ];
    final pageMeta = const [
      _StudentWebPageMeta(
        eyebrow: 'Student workspace',
        title: 'Dashboard',
        subtitle:
            'Resume pending tests, review active courses, and compare what is worth unlocking next.',
      ),
      _StudentWebPageMeta(
        eyebrow: 'Student workspace',
        title: 'Support',
        subtitle:
            'Get quick help for login issues, purchases, access problems, and test-related questions.',
      ),
      _StudentWebPageMeta(
        eyebrow: 'Student workspace',
        title: 'Profile',
        subtitle:
            'Keep your details current so receipts, progress, and support requests stay accurate.',
      ),
      _StudentWebPageMeta(
        eyebrow: 'Student workspace',
        title: 'Library',
        subtitle:
            'Access your active courses, purchase records, recent attempts, and saved progress in one place.',
      ),
    ];
    final activeMeta = pageMeta[controller.studentTabIndex];

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8FC),
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF4FBFF), Color(0xFFEAF5FF), Color(0xFFFFFFFF)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 22, 24, 24),
            child: Row(
              children: [
                SizedBox(
                  width: 304,
                  child: _StudentWebSidebar(
                    controller: controller,
                    snapshot: snapshot,
                    destinations: destinations,
                  ),
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: Column(
                    children: [
                      _StudentWebHeader(
                        controller: controller,
                        snapshot: snapshot,
                        meta: activeMeta,
                      ),
                      const SizedBox(height: 20),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(36),
                          child: IndexedStack(
                            index: controller.studentTabIndex,
                            children: pages,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StudentWebPageMeta {
  const _StudentWebPageMeta({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
  });

  final String eyebrow;
  final String title;
  final String subtitle;
}

class _StudentDashboardSnapshot {
  const _StudentDashboardSnapshot({
    required this.purchases,
    required this.attempts,
    required this.pendingSessions,
    required this.purchasedCourseIds,
    required this.activeCourseIds,
    required this.purchasedCourses,
    required this.activeCourses,
  });

  factory _StudentDashboardSnapshot.fromController(AppController controller) {
    final studentId = controller.currentStudent.id;
    final purchases = controller.purchasesForStudent(studentId);
    final attempts = controller.attemptsForStudent(studentId);
    final pendingSessions = controller.sessionsForStudent(studentId);

    final purchasedCourseIds = <String>{};
    final activeCourseIds = <String>{};

    for (final purchase in purchases) {
      purchasedCourseIds.add(purchase.courseId);
      activeCourseIds.add(purchase.courseId);
    }
    for (final session in pendingSessions) {
      activeCourseIds.add(session.courseId);
    }
    for (final attempt in attempts) {
      activeCourseIds.add(attempt.courseId);
    }

    List<Course> toCourses(Set<String> ids) {
      return ids
          .map(controller.courseById)
          .whereType<Course>()
          .toList(growable: false);
    }

    return _StudentDashboardSnapshot(
      purchases: purchases,
      attempts: attempts,
      pendingSessions: pendingSessions,
      purchasedCourseIds: purchasedCourseIds,
      activeCourseIds: activeCourseIds,
      purchasedCourses: toCourses(purchasedCourseIds),
      activeCourses: toCourses(activeCourseIds),
    );
  }

  final List<Purchase> purchases;
  final List<ExamAttempt> attempts;
  final List<ExamSession> pendingSessions;
  final Set<String> purchasedCourseIds;
  final Set<String> activeCourseIds;
  final List<Course> purchasedCourses;
  final List<Course> activeCourses;
}

class _StudentWebSidebar extends StatelessWidget {
  const _StudentWebSidebar({
    required this.controller,
    required this.snapshot,
    required this.destinations,
  });

  final AppController controller;
  final _StudentDashboardSnapshot snapshot;
  final List<({String label, IconData icon})> destinations;

  @override
  Widget build(BuildContext context) {
    final student = controller.currentStudent;
    final name = student.name.trim().isEmpty ? 'Student' : student.name.trim();
    final statusLine =
        student.city.trim().isNotEmpty
            ? student.city.trim()
            : 'Merit Launchers student';

    return Container(
      padding: const EdgeInsets.fromLTRB(22, 24, 22, 20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF1A3154), Color(0xFF214A73), Color(0xFF185D86)],
        ),
        borderRadius: BorderRadius.circular(34),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0E2037).withValues(alpha: 0.18),
            blurRadius: 36,
            offset: const Offset(0, 22),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: openMeritHomePage,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF0E223D), Color(0xFF157AB0)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.all(10),
                    child: Image.asset('assets/branding/logo.png'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Merit Launchers',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Student portal',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.68),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF224E7E), Color(0xFF1882B7), Color(0xFF12B8F0)],
              ),
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF10233D).withValues(alpha: 0.18),
                  blurRadius: 28,
                  offset: const Offset(0, 16),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.14),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _initialsForName(name),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            statusLine,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.82),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  student.contact.trim().isEmpty
                      ? 'Your workspace follows your purchases, tests, and pending progress automatically.'
                      : student.contact,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: _TopStatPill(
                        icon: Icons.workspace_premium_outlined,
                        label: 'Active',
                        value: '${snapshot.activeCourseIds.length}',
                        dark: true,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _TopStatPill(
                        icon: Icons.play_circle_outline_rounded,
                        label: 'Pending',
                        value: '${snapshot.pendingSessions.length}',
                        dark: true,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                Text(
                  'Navigate',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(height: 10),
                ...List.generate(destinations.length, (index) {
                  final selected = controller.studentTabIndex == index;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _StudentSidebarNavTile(
                      icon: destinations[index].icon,
                      label: destinations[index].label,
                      selected: selected,
                      onTap: () => controller.setStudentTab(index),
                    ),
                  );
                }),
                const SizedBox(height: 10),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => controller.setStudentTab(1),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: Colors.white.withValues(alpha: 0.06),
                    side: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
                  ),
                  icon: const Icon(Icons.support_agent_outlined),
                  label: const Text('Support'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: controller.logout,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: MeritTheme.secondary,
                  ),
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Sign out'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StudentSidebarNavTile extends StatelessWidget {
  const _StudentSidebarNavTile({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          decoration: BoxDecoration(
            color: selected ? Colors.white.withValues(alpha: 0.12) : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? Colors.white.withValues(alpha: 0.16) : Colors.transparent,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color:
                      selected
                          ? Colors.white.withValues(alpha: 0.14)
                          : Colors.white.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: Icon(
                  icon,
                  color:
                      selected
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.62),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: selected ? Colors.white : Colors.white.withValues(alpha: 0.72),
                  ),
                ),
              ),
              if (selected)
                Icon(
                  Icons.arrow_forward_rounded,
                  color: Colors.white.withValues(alpha: 0.88),
                  size: 18,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StudentWebHeader extends StatelessWidget {
  const _StudentWebHeader({
    required this.controller,
    required this.snapshot,
    required this.meta,
  });

  final AppController controller;
  final _StudentDashboardSnapshot snapshot;
  final _StudentWebPageMeta meta;

  @override
  Widget build(BuildContext context) {
    final studentName =
        controller.currentStudent.name.trim().isEmpty
            ? 'Student'
            : controller.currentStudent.name.trim();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.74),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF123252).withValues(alpha: 0.06),
            blurRadius: 28,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  meta.eyebrow,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: MeritTheme.primary,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${meta.title} for $studentName',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontSize: 26,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  meta.subtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: MeritTheme.secondaryMuted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 18),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 720),
            child: Wrap(
              alignment: WrapAlignment.end,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 10,
              runSpacing: 10,
              children: [
                _HeaderMetricCard(
                  icon: Icons.workspace_premium_outlined,
                  label: 'Active',
                  value: '${snapshot.activeCourseIds.length}',
                ),
                _HeaderMetricCard(
                  icon: Icons.receipt_long_outlined,
                  label: 'Purchases',
                  value: '${snapshot.purchases.length}',
                ),
                _HeaderMetricCard(
                  icon: Icons.play_circle_outline_rounded,
                  label: 'Pending',
                  value: '${snapshot.pendingSessions.length}',
                ),
                OutlinedButton.icon(
                  onPressed: controller.refreshContent,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Refresh'),
                ),
                OutlinedButton.icon(
                  onPressed: () => controller.setStudentTab(1),
                  icon: const Icon(Icons.support_agent_outlined),
                  label: const Text('Support'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StudentShellState extends State<StudentShell>
    with WidgetsBindingObserver {
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && mounted) {
      AppScope.of(context).refreshContent();
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final snapshot = _StudentDashboardSnapshot.fromController(controller);
    final tabTitles = const ['Dashboard', 'Support', 'Profile', 'Library'];
    final tabSubtitles = const [
      'Continue tests, unlock courses, and track progress',
      'Resolve access, payment, and exam issues',
      'Keep your student details up to date',
      'Review courses, purchases, and results',
    ];
    final pages = [
      const StudentHomePage(),
      const StudentSupportPage(),
      const StudentProfilePage(),
      const StudentLibraryPage(),
    ];

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF5F8FC),
      drawer: const _StudentMenuDrawer(),
      appBar: AppBar(
        toolbarHeight: 84,
        backgroundColor: const Color(0xFFF5F8FC),
        foregroundColor: MeritTheme.secondary,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          style: IconButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: MeritTheme.secondary,
            side: const BorderSide(color: MeritTheme.border),
            fixedSize: const Size(44, 44),
          ),
          icon: const Icon(Icons.menu_rounded),
        ),
        titleSpacing: 4,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Student workspace',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: MeritTheme.primary,
                letterSpacing: 0.4,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              tabTitles[controller.studentTabIndex],
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(
                color: MeritTheme.secondary,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              tabSubtitles[controller.studentTabIndex],
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: MeritTheme.secondaryMuted,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: MeritTheme.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.workspace_premium_outlined,
                        size: 16,
                        color: MeritTheme.primary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${snapshot.activeCourseIds.length} active',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: MeritTheme.secondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: controller.refreshContent,
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: MeritTheme.secondary,
                    side: const BorderSide(color: MeritTheme.border),
                    fixedSize: const Size(44, 44),
                  ),
                  icon: const Icon(Icons.refresh_rounded, size: 20),
                ),
              ],
            ),
          ),
        ],
      ),
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF7FAFD), Color(0xFFEAF2F8), Color(0xFFF8FBFD)],
          ),
        ),
        child: IndexedStack(
          index: controller.studentTabIndex,
          children: pages,
        ),
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.98),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: MeritTheme.border),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF102544).withValues(alpha: 0.08),
                blurRadius: 34,
                offset: const Offset(0, 18),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(30),
            child: NavigationBar(
              backgroundColor: Colors.transparent,
              selectedIndex: controller.studentTabIndex,
              onDestinationSelected: controller.setStudentTab,
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.home_outlined),
                  selectedIcon: Icon(Icons.home_rounded),
                  label: 'Home',
                ),
                NavigationDestination(
                  icon: Icon(Icons.support_agent_outlined),
                  selectedIcon: Icon(Icons.support_agent_rounded),
                  label: 'Support',
                ),
                NavigationDestination(
                  icon: Icon(Icons.person_outline),
                  selectedIcon: Icon(Icons.person_rounded),
                  label: 'Profile',
                ),
                NavigationDestination(
                  icon: Icon(Icons.library_books_outlined),
                  selectedIcon: Icon(Icons.library_books_rounded),
                  label: 'Library',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class StudentHomePage extends StatelessWidget {
  const StudentHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final theme = Theme.of(context);
    final snapshot = _StudentDashboardSnapshot.fromController(controller);
    final activeCourses = snapshot.activeCourses;
    final purchasedCourseIds = snapshot.purchasedCourseIds;
    final pendingSessions = snapshot.pendingSessions;
    final featuredCourses = controller.courses.take(6).toList();
    final spotlightCourse =
        activeCourses.isNotEmpty
            ? activeCourses.first
            : (featuredCourses.isNotEmpty ? featuredCourses.first : null);
    final promoCourses =
        controller.courses
            .where((course) => !purchasedCourseIds.contains(course.id))
            .toList();
    final attempts = snapshot.attempts;
    final conceptProgress = _aggregateConceptProgress(
      attempts,
      controller.papers,
    );
    final isWide = _isWideStudentLayout(context);

    return RefreshIndicator(
      onRefresh: controller.refreshContent,
      child: ListView(
        padding: EdgeInsets.fromLTRB(0, 0, 0, isWide ? 32 : 120),
        children: [
          _StudentPageViewport(
            child: Column(
              children: [
                if (!isWide)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
                    child: _MobileHomeOverviewCard(
                      studentName: controller.currentStudent.name,
                      activeCount: activeCourses.length,
                      purchaseCount: snapshot.purchases.length,
                      pendingCount: pendingSessions.length,
                      attemptsCount: attempts.length,
                    ),
                  ),
                if (isWide)
                  _StudentDesktopHomeLayout(
                    controller: controller,
                    snapshot: snapshot,
                    attemptsCount: attempts.length,
                    spotlightCourse: spotlightCourse,
                    featuredCourses: featuredCourses,
                    promoCourses: promoCourses,
                    activeCourses: activeCourses,
                    purchasedCourseIds: purchasedCourseIds,
                    pendingSessions: pendingSessions,
                    attempts: attempts,
                    conceptProgress: conceptProgress,
                  )
                else ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
                    child: _SectionHeader(
                      title: 'Resume your tests',
                      actionLabel: pendingSessions.isEmpty ? null : 'Library',
                      onActionTap:
                          pendingSessions.isEmpty
                              ? null
                              : () => controller.setStudentTab(3),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child:
                        pendingSessions.isEmpty
                            ? const _StudentEmptyState(
                              icon: Icons.pause_circle_outline_rounded,
                              title: 'No tests in progress',
                              message:
                                  'Start a test from your library. It will appear here until you submit.',
                            )
                            : Column(
                              children:
                                  pendingSessions
                                      .map(
                                        (session) => Padding(
                                          padding: const EdgeInsets.only(
                                            bottom: 12,
                                          ),
                                          child: _PendingExamCard(
                                            session: session,
                                          ),
                                        ),
                                      )
                                      .toList(),
                            ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
                    child: _SectionHeader(
                      title: 'Continue your courses',
                      actionLabel: activeCourses.isEmpty ? null : 'See all',
                      onActionTap:
                          activeCourses.isEmpty
                              ? null
                              : () => controller.setStudentTab(3),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child:
                        activeCourses.isEmpty
                            ? const _EmptyPurchasedCoursesCard()
                            : Column(
                              children:
                                  activeCourses
                                      .map(
                                        (course) => Padding(
                                          padding: const EdgeInsets.only(
                                            bottom: 12,
                                          ),
                                          child: _StudentCourseTile(
                                            course: course,
                                            isPurchased: purchasedCourseIds
                                                .contains(course.id),
                                            attemptCount:
                                                attempts
                                                    .where(
                                                      (item) =>
                                                          item.courseId ==
                                                          course.id,
                                                    )
                                                    .length,
                                            hasPendingSession: pendingSessions
                                                .any(
                                                  (item) =>
                                                      item.courseId == course.id,
                                                ),
                                          ),
                                        ),
                                      )
                                      .toList(),
                            ),
                  ),
                ],
                if (!isWide && conceptProgress.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 22, 16, 0),
                    child: _SectionHeader(
                      title: 'Progress by concept',
                      actionLabel: 'Profile',
                      onActionTap: () => controller.setStudentTab(2),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Column(
                      children:
                          conceptProgress
                              .take(4)
                              .map(
                                (item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: _ConceptInsightTile(item: item),
                                ),
                              )
                              .toList(),
                    ),
                  ),
                ],
                if (!isWide) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 22, 16, 0),
                    child: Text(
                      'Browse courses',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontSize: 20,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                    child:
                        featuredCourses.isEmpty
                            ? const _StudentEmptyState(
                              icon: Icons.school_outlined,
                              title: 'No courses yet',
                              message:
                                  'Courses will appear here once they are added.',
                            )
                            : Column(
                              children:
                                  featuredCourses
                                      .map(
                                        (course) => Padding(
                                          padding: const EdgeInsets.only(
                                            bottom: 12,
                                          ),
                                          child: _MobileFeaturedCourseCard(
                                            course: course,
                                          ),
                                        ),
                                      )
                                      .toList(),
                            ),
                  ),
                ],
                if (!isWide && promoCourses.isNotEmpty) ...[
                  const SizedBox(height: 22),
                  _PromoCarousel(courses: promoCourses, isWide: isWide),
                ],
                const SizedBox(height: 8),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StudentMenuDrawer extends StatelessWidget {
  const _StudentMenuDrawer();

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final student = controller.currentStudent;
    final snapshot = _StudentDashboardSnapshot.fromController(controller);

    return Drawer(
      backgroundColor: const Color(0xFFF5F8FC),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.fromLTRB(18, 18, 18, 14),
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF102544),
                    Color(0xFF17638F),
                    Color(0xFF11A4CF),
                  ],
                ),
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF102544).withValues(alpha: 0.18),
                    blurRadius: 28,
                    offset: const Offset(0, 16),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Student workspace',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.74),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.14),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.18),
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          _initialsForName(
                            student.name.trim().isEmpty
                                ? 'Student'
                                : student.name,
                          ),
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              student.name.trim().isEmpty
                                  ? 'Student'
                                  : student.name,
                              style: Theme.of(context).textTheme.headlineSmall
                                  ?.copyWith(color: Colors.white),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              student.contact,
                              style: Theme.of(
                                context,
                              ).textTheme.bodyMedium?.copyWith(
                                color: Colors.white.withValues(alpha: 0.84),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.14),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Snapshot',
                          style: Theme.of(
                            context,
                          ).textTheme.labelLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.78),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _DarkInfoPill(
                              icon: Icons.workspace_premium_outlined,
                              label:
                                  '${snapshot.activeCourseIds.length} active',
                            ),
                            _DarkInfoPill(
                              icon: Icons.receipt_long_outlined,
                              label: '${snapshot.purchases.length} purchases',
                            ),
                            _DarkInfoPill(
                              icon: Icons.play_circle_outline_rounded,
                              label:
                                  '${snapshot.pendingSessions.length} pending',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 18),
              child: Divider(height: 1),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
                children: [
                  _DrawerItem(
                    icon: Icons.home_outlined,
                    label: 'Home',
                    selected: controller.studentTabIndex == 0,
                    onTap: () {
                      Navigator.pop(context);
                      controller.setStudentTab(0);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.support_agent_outlined,
                    label: 'Support',
                    selected: controller.studentTabIndex == 1,
                    onTap: () {
                      Navigator.pop(context);
                      controller.setStudentTab(1);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.person_outline_rounded,
                    label: 'Profile',
                    selected: controller.studentTabIndex == 2,
                    onTap: () {
                      Navigator.pop(context);
                      controller.setStudentTab(2);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.library_books_outlined,
                    label: 'Library',
                    selected: controller.studentTabIndex == 3,
                    onTap: () {
                      Navigator.pop(context);
                      controller.setStudentTab(3);
                    },
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        controller.setStudentTab(1);
                      },
                      icon: const Icon(Icons.support_agent_outlined),
                      label: const Text('Support'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: controller.logout,
                      icon: const Icon(Icons.logout_rounded),
                      label: const Text('Sign out'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.selected = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: onTap,
          child: Ink(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: selected ? MeritTheme.primarySoft : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: selected ? MeritTheme.primary : MeritTheme.border,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: selected ? Colors.white : MeritTheme.primarySoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    icon,
                    color:
                        selected
                            ? MeritTheme.secondary
                            : MeritTheme.secondaryMuted,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    label,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: selected ? MeritTheme.secondary : null,
                    ),
                  ),
                ),
                Icon(
                  selected
                      ? Icons.arrow_forward_rounded
                      : Icons.chevron_right_rounded,
                  color:
                      selected ? MeritTheme.primary : MeritTheme.secondaryMuted,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ignore: unused_element
class _StudentHeroBanner extends StatelessWidget {
  const _StudentHeroBanner({
    required this.studentName,
    required this.activeCount,
    required this.purchaseCount,
    required this.attemptsCount,
    required this.pendingCount,
    required this.isWide,
  });

  final String studentName;
  final int activeCount;
  final int purchaseCount;
  final int attemptsCount;
  final int pendingCount;
  final bool isWide;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: isWide ? 320 : 360,
      margin: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF102B46), Color(0xFF15496F), Color(0xFF0FA2CA)],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF102544).withValues(alpha: 0.14),
            blurRadius: 34,
            offset: const Offset(0, 18),
          ),
        ],
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -40,
            top: 30,
            child: Container(
              width: 180,
              height: 180,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [Color(0x3311A4CF), Color(0x0011A4CF)],
                ),
              ),
            ),
          ),
          Positioned(
            top: -18,
            left: -8,
            right: -8,
            child: SizedBox(
              height: 110,
              child: CustomPaint(painter: _LeafBorderPainter()),
            ),
          ),
          Positioned(
            left: 22,
            right: 22,
            bottom: 22,
            child: Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.94),
                borderRadius: BorderRadius.circular(26),
                border: Border.all(color: MeritTheme.border),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF102544).withValues(alpha: 0.06),
                    blurRadius: 22,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child:
                  isWide
                      ? Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Welcome back, ${studentName.split(' ').first}',
                                  style: Theme.of(context).textTheme.titleLarge
                                      ?.copyWith(color: Colors.white),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Pick up your momentum.',
                                  style: Theme.of(
                                    context,
                                  ).textTheme.displaySmall?.copyWith(
                                    fontSize: 34,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'Browse free papers, access your courses, and track your progress — all in one place.',
                                  style: Theme.of(context).textTheme.bodyLarge,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 20),
                          SizedBox(
                            width: 250,
                            child: Column(
                              children: [
                                _HeroStatCard(
                                  title: 'Active courses',
                                  value: '$activeCount',
                                  accent: MeritTheme.primary,
                                ),
                                const SizedBox(height: 12),
                                _HeroStatCard(
                                  title: 'Purchases',
                                  value: '$purchaseCount',
                                  accent: MeritTheme.success,
                                ),
                                const SizedBox(height: 12),
                                _HeroStatCard(
                                  title: 'Recorded attempts',
                                  value: '$attemptsCount',
                                  accent: MeritTheme.accent,
                                ),
                                const SizedBox(height: 12),
                                _HeroStatCard(
                                  title: 'Tests in progress',
                                  value: '$pendingCount',
                                  accent: Colors.white,
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                      : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Welcome back, ${studentName.split(' ').first}',
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(color: Colors.white),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Pick up your momentum.',
                            style: Theme.of(context).textTheme.displaySmall
                                ?.copyWith(fontSize: 26, color: Colors.white),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Browse free papers, access your courses, and track your progress — all in one place.',
                            style: Theme.of(
                              context,
                            ).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.82),
                            ),
                          ),
                          const SizedBox(height: 18),
                          Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: [
                              _TopStatPill(
                                icon: Icons.workspace_premium_outlined,
                                label: 'Active',
                                value: '$activeCount',
                              ),
                              _TopStatPill(
                                icon: Icons.receipt_long_outlined,
                                label: 'Purchases',
                                value: '$purchaseCount',
                              ),
                              _TopStatPill(
                                icon: Icons.play_circle_outline_rounded,
                                label: 'Pending',
                                value: '$pendingCount',
                              ),
                            ],
                          ),
                        ],
                      ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    this.actionLabel,
    this.onActionTap,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onActionTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Student experience',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: MeritTheme.primary,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.headlineSmall?.copyWith(fontSize: 20),
              ),
            ],
          ),
        ),
        if (actionLabel != null)
          TextButton.icon(
            onPressed: onActionTap,
            iconAlignment: IconAlignment.end,
            icon: const Icon(Icons.arrow_forward_rounded, size: 18),
            label: Text(actionLabel!),
          ),
      ],
    );
  }
}

class _StudentDesktopHero extends StatelessWidget {
  const _StudentDesktopHero({
    required this.controller,
    required this.snapshot,
    required this.attemptsCount,
    required this.spotlightCourse,
  });

  final AppController controller;
  final _StudentDashboardSnapshot snapshot;
  final int attemptsCount;
  final Course? spotlightCourse;

  @override
  Widget build(BuildContext context) {
    final studentName =
        controller.currentStudent.name.trim().isEmpty
            ? 'Student'
            : controller.currentStudent.name.trim().split(' ').first;
    final theme = Theme.of(context);
    final activeCount = snapshot.activeCourseIds.length;
    final pendingCount = snapshot.pendingSessions.length;
    final purchaseCount = snapshot.purchases.length;
    final spotlightTitle =
        spotlightCourse == null
            ? 'Build your first serious prep stack.'
            : spotlightCourse!.title;
    final spotlightSubtitle =
        spotlightCourse == null
            ? 'Explore free previews, compare course coverage, and start a cleaner study journey from your library.'
            : spotlightCourse!.subtitle;

    return Container(
      padding: const EdgeInsets.all(26),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A3154), Color(0xFF225C8E), Color(0xFF12B8F0)],
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0D1E33).withValues(alpha: 0.16),
            blurRadius: 42,
            offset: const Offset(0, 24),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 8,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
                  ),
                  child: Text(
                    'Launchpad',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.86),
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  'Good evening, $studentName.',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white.withValues(alpha: 0.82),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your prep command center, tuned for momentum.',
                  style: theme.textTheme.displaySmall?.copyWith(
                    color: Colors.white,
                    fontSize: 42,
                    height: 1.04,
                  ),
                ),
                const SizedBox(height: 14),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 700),
                  child: Text(
                    'Pick up pending tests, review your active courses, and move into the library without fighting through a dated dashboard.',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.82),
                      height: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: () => controller.setStudentTab(3),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: MeritTheme.secondary,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                      ),
                      icon: const Icon(Icons.library_books_outlined),
                      label: const Text('Open library'),
                    ),
                    const SizedBox(width: 12),
                    OutlinedButton.icon(
                      onPressed: controller.refreshContent,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        backgroundColor: Colors.white.withValues(alpha: 0.06),
                        side: BorderSide(color: Colors.white.withValues(alpha: 0.16)),
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                      ),
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Refresh data'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 24),
          Expanded(
            flex: 5,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _HeroInsightCard(
                        label: 'Active courses',
                        value: '$activeCount',
                        icon: Icons.workspace_premium_outlined,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _HeroInsightCard(
                        label: 'Pending tests',
                        value: '$pendingCount',
                        icon: Icons.play_circle_outline_rounded,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _HeroInsightCard(
                        label: 'Attempts',
                        value: '$attemptsCount',
                        icon: Icons.auto_graph_rounded,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _HeroInsightCard(
                        label: 'Purchases',
                        value: '$purchaseCount',
                        icon: Icons.receipt_long_outlined,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        snapshot.activeCourses.isEmpty ? 'Recommended next move' : 'Current spotlight',
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: Colors.white.withValues(alpha: 0.72),
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        spotlightTitle,
                        style: theme.textTheme.titleLarge?.copyWith(color: Colors.white),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        spotlightSubtitle,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.78),
                          height: 1.45,
                        ),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () => controller.setStudentTab(3),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            backgroundColor: Colors.white.withValues(alpha: 0.06),
                            side: BorderSide(color: Colors.white.withValues(alpha: 0.16)),
                          ),
                          icon: const Icon(Icons.arrow_forward_rounded),
                          label: Text(
                            snapshot.activeCourses.isEmpty ? 'Explore courses' : 'Open study library',
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroInsightCard extends StatelessWidget {
  const _HeroInsightCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            alignment: Alignment.center,
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(height: 18),
          Text(
            value,
            style: theme.textTheme.headlineMedium?.copyWith(color: Colors.white),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.74),
            ),
          ),
        ],
      ),
    );
  }
}

class _StudentDesktopHomeLayout extends StatelessWidget {
  const _StudentDesktopHomeLayout({
    required this.controller,
    required this.snapshot,
    required this.attemptsCount,
    required this.spotlightCourse,
    required this.featuredCourses,
    required this.promoCourses,
    required this.activeCourses,
    required this.purchasedCourseIds,
    required this.pendingSessions,
    required this.attempts,
    required this.conceptProgress,
  });

  final AppController controller;
  final _StudentDashboardSnapshot snapshot;
  final int attemptsCount;
  final Course? spotlightCourse;
  final List<Course> featuredCourses;
  final List<Course> promoCourses;
  final List<Course> activeCourses;
  final Set<String> purchasedCourseIds;
  final List<ExamSession> pendingSessions;
  final List<ExamAttempt> attempts;
  final List<_ConceptPerformance> conceptProgress;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
      child: Column(
        children: [
          _StudentDesktopHero(
            controller: controller,
            snapshot: snapshot,
            spotlightCourse: spotlightCourse,
            attemptsCount: attemptsCount,
          ),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 7,
                child: Column(
                  children: [
                    _StudentPanel(
                      title: 'Resume your tests',
                      subtitle:
                          pendingSessions.isEmpty
                              ? 'Nothing is live right now. Your next started test will surface here automatically.'
                              : 'Pick up exactly where you left off with time and answers preserved.',
                      eyebrow: 'Live workspace',
                      actionLabel:
                          pendingSessions.isEmpty ? 'Library' : 'Open library',
                      onActionTap: () => controller.setStudentTab(3),
                      child:
                          pendingSessions.isEmpty
                              ? const _StudentEmptyState(
                                icon: Icons.pause_circle_outline_rounded,
                                title: 'No tests in progress',
                                message:
                                    'Start a test from your library. It will appear here until you submit.',
                              )
                              : GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: pendingSessions.length,
                                gridDelegate:
                                    const SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: 2,
                                      crossAxisSpacing: 14,
                                      mainAxisSpacing: 14,
                                      childAspectRatio: 1.28,
                                    ),
                                itemBuilder:
                                    (context, index) => _PendingExamCard(
                                      session: pendingSessions[index],
                                    ),
                              ),
                    ),
                    const SizedBox(height: 18),
                    _StudentPanel(
                      title: 'Explore what to unlock next',
                      subtitle:
                          'Free previews and flagship courses sit together here so the decision path feels obvious.',
                      eyebrow: 'Discover',
                      actionLabel: 'View all',
                      onActionTap: () => controller.setStudentTab(3),
                      child:
                          featuredCourses.isEmpty
                              ? const _StudentEmptyState(
                                icon: Icons.school_outlined,
                                title: 'No courses yet',
                                message:
                                    'Courses will appear here once they are added.',
                              )
                              : GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: featuredCourses.length,
                                gridDelegate:
                                    const SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: 2,
                                      crossAxisSpacing: 14,
                                      mainAxisSpacing: 14,
                                      childAspectRatio: 1.36,
                                    ),
                                itemBuilder:
                                    (context, index) => _CategoryCourseCard(
                                      course: featuredCourses[index],
                                    ),
                              ),
                    ),
                    if (promoCourses.isNotEmpty) ...[
                      const SizedBox(height: 18),
                      _PromoCarousel(courses: promoCourses, isWide: true),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                flex: 4,
                child: Column(
                  children: [
                    _StudentPanel(
                      title: 'Active courses',
                      subtitle:
                          activeCourses.isEmpty
                              ? 'Purchased courses and activity-linked courses appear here.'
                              : 'The courses that currently define your study momentum.',
                      eyebrow: 'Study stack',
                      actionLabel: activeCourses.isEmpty ? null : 'See all',
                      onActionTap:
                          activeCourses.isEmpty
                              ? null
                              : () => controller.setStudentTab(3),
                      child:
                          activeCourses.isEmpty
                              ? const _EmptyPurchasedCoursesCard()
                              : Column(
                                children:
                                    activeCourses
                                        .take(4)
                                        .map(
                                          (course) => Padding(
                                            padding: const EdgeInsets.only(
                                              bottom: 12,
                                            ),
                                            child: _StudentCourseTile(
                                              course: course,
                                              isPurchased: purchasedCourseIds
                                                  .contains(course.id),
                                              attemptCount:
                                                  attempts
                                                      .where(
                                                        (item) =>
                                                            item.courseId ==
                                                            course.id,
                                                      )
                                                      .length,
                                              hasPendingSession: pendingSessions
                                                  .any(
                                                    (item) =>
                                                        item.courseId ==
                                                        course.id,
                                                  ),
                                              compact: true,
                                            ),
                                          ),
                                        )
                                        .toList(),
                              ),
                    ),
                    if (conceptProgress.isNotEmpty) ...[
                      const SizedBox(height: 18),
                      _StudentPanel(
                        title: 'Progress by concept',
                        subtitle:
                            'A quick read on where recent attempts are compounding or slipping.',
                        eyebrow: 'Signals',
                        actionLabel: 'Profile',
                        onActionTap: () => controller.setStudentTab(2),
                        child: Column(
                          children:
                              conceptProgress
                                  .take(4)
                                  .map(
                                    (item) => Padding(
                                      padding: const EdgeInsets.only(
                                        bottom: 12,
                                      ),
                                      child: _ConceptInsightTile(item: item),
                                    ),
                                  )
                                  .toList(),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyPurchasedCoursesCard extends StatelessWidget {
  const _EmptyPurchasedCoursesCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: MeritTheme.border),
      ),
      child: const Text(
        'No active courses yet. Start a free preview or unlock a course to build your study workspace.',
      ),
    );
  }
}

class _StudentCourseTile extends StatelessWidget {
  const _StudentCourseTile({
    required this.course,
    required this.isPurchased,
    required this.attemptCount,
    required this.hasPendingSession,
    this.compact = false,
  });

  final Course course;
  final bool isPurchased;
  final int attemptCount;
  final bool hasPendingSession;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => CourseDetailsPage(course: course),
            ),
          );
        },
        child: Container(
          padding: EdgeInsets.all(compact ? 16 : 18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFFFFFF), Color(0xFFF6FAFD), Color(0xFFF2F8FD)],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF102544).withValues(alpha: 0.05),
                blurRadius: 28,
                offset: const Offset(0, 14),
              ),
            ],
          ),
          child:
              compact
                  ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 46,
                            height: 46,
                            decoration: BoxDecoration(
                              color: MeritTheme.secondary,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            alignment: Alignment.center,
                            child: Icon(
                              _iconForCourse(course.title),
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                _MetaChip(label: course.heroLabel),
                                if (hasPendingSession)
                                  const _MetaChip(label: 'Resume'),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text(
                        course.title,
                        style: Theme.of(context).textTheme.titleLarge,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        course.subtitle,
                        style: Theme.of(context).textTheme.bodyMedium,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              isPurchased ? 'Open course' : 'Preview + unlock',
                              style: Theme.of(context).textTheme.labelLarge
                                  ?.copyWith(color: MeritTheme.primary),
                            ),
                          ),
                          Text(
                            '$attemptCount attempts',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: MeritTheme.secondaryMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  )
                  : Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(18),
                        child: Container(
                          width: 92,
                          height: 92,
                          color: MeritTheme.primarySoft,
                          padding: const EdgeInsets.all(12),
                          child: Image.asset(
                            'assets/branding/logo.png',
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                _MetaChip(label: course.heroLabel),
                                _MetaChip(
                                  label: isPurchased ? 'Purchased' : 'Preview active',
                                ),
                                if (hasPendingSession)
                                  const _MetaChip(label: 'Resume available'),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              course.title,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              course.subtitle,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                _MetaChip(label: '${course.validityDays} days access'),
                                _MetaChip(label: '$attemptCount attempts'),
                                _MetaChip(
                                  label:
                                      course.price <= 0
                                          ? 'Free preview'
                                          : _formatCoursePrice(course.price),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: SizedBox(
                                width: 190,
                                child: ElevatedButton(
                                  onPressed: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute<void>(
                                        builder:
                                            (_) => CourseDetailsPage(course: course),
                                      ),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor:
                                        hasPendingSession
                                            ? MeritTheme.secondary
                                            : MeritTheme.primary,
                                    foregroundColor: Colors.white,
                                    minimumSize: const Size.fromHeight(46),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 18,
                                      vertical: 12,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                  child: FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      hasPendingSession
                                          ? 'Resume course'
                                          : isPurchased
                                          ? 'Open course'
                                          : 'View course',
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
        ),
      ),
    );
  }
}

class _PendingExamCard extends StatelessWidget {
  const _PendingExamCard({required this.session, this.compact = false});

  final ExamSession session;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final paper = controller.paperById(session.paperId);
    final course = controller.courseById(session.courseId);
    if (paper == null || course == null) {
      return const SizedBox.shrink();
    }

    final remainingQuestions = (paper.questions.length - session.answers.length)
        .clamp(0, paper.questions.length);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => ExamIntroPage(course: course, paper: paper),
            ),
          );
        },
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFFFFFF), Color(0xFFF7FBFD), Color(0xFFEFF8FD)],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF102544).withValues(alpha: 0.05),
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
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _MetaChip(label: course.heroLabel),
                            const _MetaChip(label: 'In progress'),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          paper.title,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          course.title,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: MeritTheme.secondary,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.play_arrow_rounded,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value:
                      paper.questions.isEmpty
                          ? 0
                          : session.answers.length / paper.questions.length,
                  minHeight: 8,
                  backgroundColor: MeritTheme.primarySoft,
                  color: MeritTheme.primary,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _MetaChip(
                    label:
                        '${session.answers.length}/${paper.questions.length} answered',
                  ),
                  _MetaChip(label: '$remainingQuestions left'),
                  _MetaChip(
                    label: _formatClock(
                      Duration(seconds: session.remainingSeconds),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                compact
                    ? 'Resume from question ${session.currentQuestionIndex + 1}. Your timer and answers are preserved.'
                    : 'Resume from question ${session.currentQuestionIndex + 1} with the same remaining time on web or app.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed:
                          () => controller.discardExamSession(session.id),
                      child: const Text('Discard'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder:
                                (_) => ExamPlayerPage(
                                  course: course,
                                  paper: paper,
                                  initialSession: session,
                                ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.play_arrow_rounded),
                      label: const Text('Resume'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryCourseCard extends StatelessWidget {
  const _CategoryCourseCard({required this.course});

  final Course course;

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final unlocked = controller.isCourseUnlocked(course.id);
    final title = course.title.toUpperCase();
    final shortTitle = title.length > 14 ? '${title.substring(0, 14)}…' : title;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => CourseDetailsPage(course: course),
            ),
          );
        },
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFF7FBFE), Color(0xFFDDF6F6), Color(0xFFCFE0FF)],
            ),
            border: Border.all(color: Colors.white.withValues(alpha: 0.7)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF102544).withValues(alpha: 0.06),
                blurRadius: 24,
                offset: const Offset(0, 14),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Icon(
                      unlocked
                          ? Icons.lock_open_rounded
                          : Icons.auto_stories_rounded,
                      color: MeritTheme.secondary,
                      size: 20,
                    ),
                  ],
                ),
                const Spacer(),
                Icon(
                  _iconForCourse(course.title),
                  size: 44,
                  color: MeritTheme.secondary,
                ),
                const SizedBox(height: 14),
                Text(
                  shortTitle,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  unlocked ? 'Open now' : 'Preview + unlock',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: MeritTheme.secondary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PromoCarousel extends StatefulWidget {
  const _PromoCarousel({required this.courses, required this.isWide});

  final List<Course> courses;
  final bool isWide;

  @override
  State<_PromoCarousel> createState() => _PromoCarouselState();
}

class _PromoCarouselState extends State<_PromoCarousel> {
  late final PageController _pageController;
  int _activeIndex = 0;

  void _goToPage(int nextIndex) {
    if (!_pageController.hasClients) return;
    _pageController.animateToPage(
      nextIndex.clamp(0, widget.courses.length - 1),
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  void initState() {
    super.initState();
    _pageController = PageController(
      viewportFraction: widget.isWide ? 0.38 : 0.88,
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
      padding: EdgeInsets.fromLTRB(
        widget.isWide ? 24 : 16,
        24,
        widget.isWide ? 24 : 16,
        22,
      ),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF13345D), Color(0xFF155A88), Color(0xFF1EBBEA)],
        ),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF13345D).withValues(alpha: 0.18),
            blurRadius: 34,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Continue with the right course',
                      style: Theme.of(
                        context,
                      ).textTheme.headlineSmall?.copyWith(color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Browse the courses that match your exam plan and jump into details without leaving the portal.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),
              if (widget.courses.length > 1)
                Row(
                  children: [
                    _CarouselControlButton(
                      icon: Icons.arrow_back_rounded,
                      onTap: () => _goToPage(_activeIndex - 1),
                    ),
                    const SizedBox(width: 8),
                    _CarouselControlButton(
                      icon: Icons.arrow_forward_rounded,
                      onTap: () => _goToPage(_activeIndex + 1),
                    ),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            height: widget.isWide ? 320 : 360,
            child: PageView.builder(
              controller: _pageController,
              itemCount: widget.courses.length,
              onPageChanged: (index) => setState(() => _activeIndex = index),
              itemBuilder:
                  (context, index) => Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: _PromoCourseCard(
                      course: widget.courses[index],
                      compact: !widget.isWide,
                    ),
                  ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              widget.courses.length.clamp(0, 5),
              (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 10,
                height: 10,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: index == _activeIndex ? Colors.white : Colors.white70,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PromoCourseCard extends StatelessWidget {
  const _PromoCourseCard({required this.course, this.compact = false});

  final Course course;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
      ),
      child: compact ? _buildCompact(context) : _buildWide(context),
    );
  }

  Widget _buildCompact(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: 68,
                height: 68,
                color: MeritTheme.primarySoft,
                padding: const EdgeInsets.all(10),
                child: Image.asset(
                  'assets/branding/logo.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Wrap(
                spacing: 6,
                runSpacing: 6,
                children: course.highlights.take(2).map((item) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F6FA),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      item,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          course.title,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontSize: 22),
        ),
        const SizedBox(height: 8),
        Text(
          course.subtitle,
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.45),
        ),
        const Spacer(),
        Row(
          children: [
            Expanded(
              child: Text(
                'Rs ${course.price.toStringAsFixed(0)}/-',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => CourseDetailsPage(course: course),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: MeritTheme.primary,
                  minimumSize: const Size.fromHeight(52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text('View course'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildWide(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: 88,
                height: 88,
                color: MeritTheme.primarySoft,
                padding: const EdgeInsets.all(12),
                child: Image.asset(
                  'assets/branding/logo.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children:
                        course.highlights
                            .take(2)
                            .map(
                              (item) => Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 5,
                                ),
                                color: const Color(0xFFF3F5F8),
                                child: Text(
                                  item.toUpperCase(),
                                  style:
                                      Theme.of(context).textTheme.bodySmall,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            )
                            .toList(),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    course.subtitle,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          course.title.toUpperCase(),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontSize: 18),
        ),
        const SizedBox(height: 8),
        Text(
          'Rs ${course.price.toStringAsFixed(0)}/-',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => CourseDetailsPage(course: course),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: MeritTheme.primary,
              minimumSize: const Size.fromHeight(48),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const FittedBox(
              fit: BoxFit.scaleDown,
              child: Text('Buy Now'),
            ),
          ),
        ),
      ],
    );
  }
}

class _CarouselControlButton extends StatelessWidget {
  const _CarouselControlButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Ink(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.12),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
        ),
        child: Icon(icon, color: Colors.white),
      ),
    );
  }
}

class _LeafBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final stroke =
        Paint()
          ..color = const Color(0xFFBFD4BA)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2;
    final fill = Paint()..color = const Color(0xFFDCEAD7);

    void drawStem(double x, bool flip) {
      final path =
          Path()
            ..moveTo(x, 0)
            ..quadraticBezierTo(
              x + (flip ? -8 : 8),
              24,
              x + (flip ? -18 : 18),
              54,
            )
            ..quadraticBezierTo(
              x + (flip ? -24 : 24),
              72,
              x + (flip ? -30 : 30),
              96,
            );
      canvas.drawPath(path, stroke);

      for (var i = 0; i < 4; i++) {
        final y = 18.0 + (i * 18);
        final leaf = Path();
        final direction = (i.isEven ? 1 : -1) * (flip ? -1 : 1);
        leaf.moveTo(x + (direction * 2), y);
        leaf.quadraticBezierTo(
          x + (direction * 14),
          y - 6,
          x + (direction * 18),
          y + 8,
        );
        leaf.quadraticBezierTo(x + (direction * 10), y + 10, x, y + 4);
        canvas.drawPath(leaf, fill);
        canvas.drawPath(leaf, stroke);
      }
    }

    drawStem(34, false);
    drawStem(size.width - 34, true);

    for (final dx in [size.width * 0.35, size.width * 0.58]) {
      canvas.drawCircle(Offset(dx, 30), 10, fill);
      canvas.drawCircle(Offset(dx + 18, 42), 11, fill);
      canvas.drawCircle(Offset(dx - 16, 46), 9, fill);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

IconData _iconForCourse(String title) {
  final normalized = title.toLowerCase();
  if (normalized.contains('cuet')) return Icons.menu_book_rounded;
  if (normalized.contains('clat')) return Icons.gavel_rounded;
  if (normalized.contains('ipmat')) return Icons.work_outline_rounded;
  if (normalized.contains('jee')) return Icons.settings_rounded;
  if (normalized.contains('neet')) return Icons.edit_note_rounded;
  if (normalized.contains('ssc')) return Icons.account_balance_rounded;
  if (normalized.contains('free')) return Icons.school_outlined;
  if (normalized.contains('pyp')) {
    return Icons.keyboard_double_arrow_left_rounded;
  }
  return Icons.auto_stories_rounded;
}

class CourseCard extends StatelessWidget {
  const CourseCard({super.key, required this.course});

  final Course course;

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final unlocked = controller.isCourseUnlocked(course.id);
    final papers = controller.papersForCourse(course.id);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: MeritTheme.primarySoft,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(course.heroLabel),
                ),
                const Spacer(),
                Icon(
                  unlocked
                      ? Icons.lock_open_rounded
                      : Icons.lock_outline_rounded,
                  color:
                      unlocked ? MeritTheme.success : MeritTheme.secondaryMuted,
                  size: 20,
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(course.title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            Text(
              course.subtitle,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),
            Text(course.description),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _MetaChip(label: '${papers.length} papers'),
                _MetaChip(label: '${course.validityDays} days'),
                _MetaChip(label: unlocked ? 'Unlocked' : 'Locked'),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Rs ${course.price.toStringAsFixed(0)}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => CourseDetailsPage(course: course),
                    ),
                  );
                },
                child: Text(unlocked ? 'Open course' : 'View course'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CourseDetailsPage extends StatefulWidget {
  const CourseDetailsPage({super.key, required this.course});

  final Course course;

  @override
  State<CourseDetailsPage> createState() => _CourseDetailsPageState();
}

class _CourseDetailsPageState extends State<CourseDetailsPage> {
  bool _paymentInProgress = false;

  Future<void> _startPayment(BuildContext context) async {
    if (_paymentInProgress) return;
    setState(() => _paymentInProgress = true);

    final controller = AppScope.of(context);
    final backend = AppScope.backendOf(context);
    final messenger = ScaffoldMessenger.of(context);

    try {
      final result = await PaymentGateway(
        backend,
      ).payForCourse(course: widget.course, student: controller.currentStudent);

      if (!context.mounted) return;

      switch (result.status) {
        case PaymentResultStatus.success:
          await controller.purchaseCourse(
            widget.course,
            paymentId: result.paymentId,
            paymentOrderId: result.orderId,
            paymentSignature: result.signature,
            verifiedPurchase: result.purchase,
          );
          if (context.mounted) {
            messenger.showSnackBar(
              SnackBar(
                content: Text('${widget.course.title} unlocked successfully.'),
              ),
            );
          }
          break;
        case PaymentResultStatus.cancelled:
          messenger.showSnackBar(
            SnackBar(content: Text(result.message ?? 'Payment was cancelled.')),
          );
          break;
        case PaymentResultStatus.unsupported:
        case PaymentResultStatus.failed:
          messenger.showSnackBar(
            SnackBar(
              content: Text(result.message ?? 'Unable to complete payment.'),
            ),
          );
          break;
      }
    } catch (e) {
      if (context.mounted) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Payment failed. Please try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _paymentInProgress = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final unlocked = controller.isCourseUnlocked(widget.course.id);
    final subjects = controller.subjectsForCourse(widget.course.id);
    final totalPapers = controller.papersForCourse(widget.course.id);
    final visiblePapers = controller.accessiblePapersForCourse(
      widget.course.id,
    );
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Course overview')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFF9FCFE), Color(0xFFE8F5FB)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(32),
              border: Border.all(color: MeritTheme.border),
            ),
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _MetaChip(label: widget.course.heroLabel),
                            const SizedBox(height: 12),
                            Text(
                              widget.course.title,
                              style: theme.textTheme.headlineMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              widget.course.subtitle,
                              style: theme.textTheme.titleMedium,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color:
                              unlocked ? const Color(0xFFE9F8F2) : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: MeritTheme.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              unlocked ? 'Active access' : 'Premium access',
                              style: theme.textTheme.labelLarge,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Rs ${widget.course.price.toStringAsFixed(0)}',
                              style: theme.textTheme.titleLarge,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Text(widget.course.description),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      _CourseFactPill(
                        icon: Icons.library_books_outlined,
                        label: '${totalPapers.length} papers',
                      ),
                      _CourseFactPill(
                        icon: Icons.calendar_month_outlined,
                        label: '${widget.course.validityDays} days access',
                      ),
                      _CourseFactPill(
                        icon:
                            unlocked
                                ? Icons.lock_open_rounded
                                : Icons.lock_outline_rounded,
                        label: unlocked ? 'Unlocked' : 'Locked',
                      ),
                    ],
                  ),
                  if (widget.course.highlights.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text(
                      'Included in this course',
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children:
                          widget.course.highlights
                              .map((highlight) => _MetaChip(label: highlight))
                              .toList(),
                    ),
                  ],
                  if (!unlocked) ...[
                    const SizedBox(height: 22),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed:
                            _paymentInProgress
                                ? null
                                : () => _startPayment(context),
                        icon:
                            _paymentInProgress
                                ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                                : const Icon(Icons.workspace_premium_outlined),
                        label: Text(
                          _paymentInProgress
                              ? 'Processing...'
                              : 'Unlock for Rs ${widget.course.price.toStringAsFixed(0)}',
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (widget.course.introVideoUrl != null &&
              widget.course.introVideoUrl!.trim().isNotEmpty) ...[
            const SizedBox(height: 18),
            _StudentPanel(
              title: 'Course video',
              subtitle:
                  'Stream the latest lesson or orientation video directly in the app.',
              child: CourseVideoCard(videoUrl: widget.course.introVideoUrl),
            ),
          ],
          const SizedBox(height: 18),
          _StudentPanel(
            title: subjects.isEmpty ? 'Available papers' : 'Subjects and papers',
            subtitle:
                subjects.isEmpty
                    ? 'Move between free previews and premium tests without leaving the course.'
                    : 'Open a subject first, then choose the right paper inside it.',
            child: Column(
              children: [
                if (subjects.isEmpty)
                  ...visiblePapers.map((paper) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _StudentActionCard(
                          icon: paper.isFreePreview
                              ? Icons.auto_stories_outlined
                              : Icons.quiz_outlined,
                          title: paper.title,
                          subtitle:
                              '${paper.durationMinutes} min • ${paper.questions.length} questions${paper.isFreePreview ? ' • Free preview' : ''}',
                          trailingLabel: 'Open',
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => ExamIntroPage(
                                  course: widget.course,
                                  paper: paper,
                                ),
                              ),
                            );
                          },
                        ),
                      ))
                else
                  ...subjects.map((subject) {
                    final subjectPapers = controller.accessiblePapersForSubject(
                      widget.course.id,
                      subject.id,
                    );
                    final totalSubjectPapers = controller.papersForSubject(subject.id);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: MeritTheme.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        subject.title,
                                        style: theme.textTheme.titleMedium,
                                      ),
                                      if (subject.description.trim().isNotEmpty) ...[
                                        const SizedBox(height: 6),
                                        Text(subject.description),
                                      ],
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                _MetaChip(label: '${totalSubjectPapers.length} papers'),
                              ],
                            ),
                            const SizedBox(height: 12),
                            if (subjectPapers.isEmpty)
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: MeritTheme.background,
                                  borderRadius: BorderRadius.circular(18),
                                ),
                                child: Text(
                                  unlocked
                                      ? 'No papers have been added to this subject yet.'
                                      : 'Unlock this course to see premium papers inside this subject.',
                                ),
                              )
                            else
                              ...subjectPapers.map((paper) => Padding(
                                    padding: const EdgeInsets.only(bottom: 10),
                                    child: _StudentActionCard(
                                      icon: paper.isFreePreview
                                          ? Icons.auto_stories_outlined
                                          : Icons.quiz_outlined,
                                      title: paper.title,
                                      subtitle:
                                          '${paper.durationMinutes} min • ${paper.questions.length} questions${paper.isFreePreview ? ' • Free preview' : ''}',
                                      trailingLabel: 'Open',
                                      onTap: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute<void>(
                                            builder: (_) => ExamIntroPage(
                                              course: widget.course,
                                              paper: paper,
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  )),
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ExamIntroPage extends StatelessWidget {
  const ExamIntroPage({super.key, required this.course, required this.paper});

  final Course course;
  final Paper paper;

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final theme = Theme.of(context);
    final activeSession = controller.sessionForPaper(paper.id);
    final answeredCount = activeSession?.answers.length ?? 0;
    final remainingQuestions =
        activeSession == null
            ? paper.questions.length
            : (paper.questions.length - answeredCount).clamp(
              0,
              paper.questions.length,
            );
    final remainingDuration = Duration(
      seconds: activeSession?.remainingSeconds ?? paper.durationMinutes * 60,
    );
    return Scaffold(
      appBar: AppBar(title: const Text('Exam briefing')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
        children: [
          Container(
            decoration: BoxDecoration(
              color: MeritTheme.secondary,
              borderRadius: BorderRadius.circular(30),
            ),
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Ready when you are',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  paper.title,
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  course.title,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 18),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _DarkInfoPill(
                      icon: Icons.schedule_outlined,
                      label: '${paper.durationMinutes} min',
                    ),
                    _DarkInfoPill(
                      icon: Icons.ballot_outlined,
                      label: '${paper.questions.length} questions',
                    ),
                    _DarkInfoPill(
                      icon: Icons.trending_up_outlined,
                      label: '+3 / -1 marking',
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (activeSession != null) ...[
            const SizedBox(height: 18),
            _StudentPanel(
              title: 'Resume available',
              subtitle:
                  'This paper is already in progress and can be resumed on this device or the other platform.',
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _ResultStatCard(
                          label: 'Answered',
                          value: '$answeredCount/${paper.questions.length}',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _ResultStatCard(
                          label: 'Time left',
                          value: _formatClock(remainingDuration),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () async {
                            try {
                              await controller.discardExamSession(
                                activeSession.id,
                              );
                            } catch (_) {
                              // Best effort — proceed even if discard fails
                            }
                            if (context.mounted) {
                              Navigator.of(context).pushReplacement(
                                MaterialPageRoute<void>(
                                  builder:
                                      (_) => ExamPlayerPage(
                                        course: course,
                                        paper: paper,
                                      ),
                                ),
                              );
                            }
                          },
                          child: const Text('Start over'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder:
                                    (_) => ExamPlayerPage(
                                      course: course,
                                      paper: paper,
                                      initialSession: activeSession,
                                    ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.play_arrow_rounded),
                          label: Text('Resume ($remainingQuestions left)'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 18),
          _StudentPanel(
            title: 'Before you begin',
            subtitle:
                'A calm start reduces mistakes. Review these once, then start in one tap.',
            child: Column(
              children: [
                ...paper.instructions.map(
                  (instruction) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          margin: const EdgeInsets.only(top: 3),
                          width: 22,
                          height: 22,
                          decoration: const BoxDecoration(
                            color: MeritTheme.primarySoft,
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.check_rounded,
                            size: 14,
                            color: MeritTheme.secondary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Text(instruction)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      try {
                        final session = controller.startOrResumeExamSession(
                          paper,
                        );
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder:
                                (_) => ExamPlayerPage(
                                  course: course,
                                  paper: paper,
                                  initialSession: session,
                                ),
                          ),
                        );
                      } catch (_) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Failed to start exam. Please try again.',
                            ),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.play_arrow_rounded),
                    label: Text(
                      activeSession == null
                          ? 'Start exam'
                          : 'Continue on this device',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ExamPlayerPage extends StatefulWidget {
  const ExamPlayerPage({
    super.key,
    required this.course,
    required this.paper,
    this.initialSession,
  });

  final Course course;
  final Paper paper;
  final ExamSession? initialSession;

  @override
  State<ExamPlayerPage> createState() => _ExamPlayerPageState();
}

class _ExamPlayerPageState extends State<ExamPlayerPage>
    with WidgetsBindingObserver {
  late int _remainingSeconds;
  late Timer _timer;
  final Map<String, int> _answers = {};
  ExamSession? _session;
  int _currentIndex = 0;
  bool _submitted = false;
  bool _submitting = false;
  int _lastPersistTick = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _session = widget.initialSession;
    _remainingSeconds =
        _session?.remainingSeconds ?? widget.paper.durationMinutes * 60;
    _answers.addAll(_session?.answers ?? const {});
    final questionCount = widget.paper.questions.length;
    _currentIndex =
        questionCount == 0
            ? 0
            : (_session?.currentQuestionIndex ?? 0).clamp(0, questionCount - 1);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds == 0) {
        _submit();
      } else {
        setState(() {
          _remainingSeconds--;
        });
        _lastPersistTick++;
        if (_lastPersistTick >= 15) {
          _lastPersistTick = 0;
          unawaited(_persistSession());
        }
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer.cancel();
    if (!_submitted) {
      unawaited(_persistSession());
    }
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive ||
        state == AppLifecycleState.detached) {
      unawaited(_persistSession());
    }
  }

  Future<void> _persistSession() async {
    if (_submitted) {
      return;
    }
    final controller = AppScope.of(context);
    final base = _session ?? controller.startOrResumeExamSession(widget.paper);
    final updated = base.copyWith(
      answers: Map<String, int>.from(_answers),
      remainingSeconds: _remainingSeconds,
      currentQuestionIndex: _currentIndex,
      updatedAt: DateTime.now(),
    );
    _session = updated;
    await controller.saveExamSession(updated);
  }

  Future<bool> _confirmExit() async {
    if (_submitted) {
      return true;
    }
    return await showDialog<bool>(
          context: context,
          builder:
              (context) => AlertDialog(
                title: const Text('Leave and resume later?'),
                content: const Text(
                  'Your progress will be saved with the remaining time so you can resume this test on the app or the website.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Stay'),
                  ),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    child: const Text('Save and exit'),
                  ),
                ],
              ),
        ) ??
        false;
  }

  Future<void> _submit() async {
    if (_submitted || _submitting) {
      return;
    }
    setState(() {
      _submitting = true;
    });
    _timer.cancel();
    try {
      final controller = AppScope.of(context);
      final attempt = await controller.submitAttempt(
        paper: widget.paper,
        answers: Map.of(_answers),
        sessionId: _session?.id,
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _submitted = true;
        _submitting = false;
      });

      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder:
            (context) => ResultDialog(
              attempt: attempt,
              paper: widget.paper,
              course: widget.course,
              student: controller.currentStudent,
            ),
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _submitting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Failed to submit. Please check your connection and try again.',
          ),
          duration: Duration(seconds: 5),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.paper.questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.paper.title)),
        body: const Center(child: Text('This paper has no questions.')),
      );
    }
    final question = widget.paper.questions[_currentIndex];
    final progress = (_currentIndex + 1) / widget.paper.questions.length;
    final time = Duration(seconds: _remainingSeconds);
    final answeredCount = _answers.length;
    final promptStyle = Theme.of(
      context,
    ).textTheme.titleMedium?.copyWith(height: 1.55, fontSize: 17);
    final optionStyle = Theme.of(
      context,
    ).textTheme.bodyLarge?.copyWith(height: 1.5, fontSize: 15.5);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        final shouldExit = !didPop && await _confirmExit();
        if (!context.mounted) {
          return;
        }
        if (shouldExit) {
          await _persistSession();
          if (!context.mounted) {
            return;
          }
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.paper.title),
          leading: IconButton(
            onPressed: () async {
              final shouldExit = await _confirmExit();
              if (!context.mounted) {
                return;
              }
              if (shouldExit) {
                await _persistSession();
                if (!context.mounted) {
                  return;
                }
                Navigator.of(context).pop();
              }
            },
            icon: const Icon(Icons.close),
          ),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text(
                  '${time.inHours.toString().padLeft(2, '0')}:'
                  '${(time.inMinutes % 60).toString().padLeft(2, '0')}:'
                  '${(time.inSeconds % 60).toString().padLeft(2, '0')}',
                ),
              ),
            ),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(8),
            child: LinearProgressIndicator(value: progress),
          ),
        ),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Question ${_currentIndex + 1} of ${widget.paper.questions.length}',
                    ),
                  ),
                  _MetaChip(label: '$answeredCount answered'),
                ],
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: _MetaChip(label: question.section),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: KeyedSubtree(
                  key: ValueKey(
                    'exam-question-pane-${question.id}-$_currentIndex',
                  ),
                  child: ListView(
                    key: ValueKey(
                      'exam-question-list-${question.id}-$_currentIndex',
                    ),
                    children: [
                      Card(
                        key: ValueKey('exam-question-card-${question.id}'),
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: RichMathContentView(
                            key: ValueKey(
                              'exam-prompt-${question.id}-${question.prompt}',
                            ),
                            rawText: question.prompt,
                            segments: question.promptSegments,
                            allowExpand: true,
                            preferProvidedSegments: true,
                            style: promptStyle,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      ...List.generate(question.options.length, (index) {
                        final selected = _answers[question.id] == index;
                        return Padding(
                          key: ValueKey(
                            'exam-option-padding-${question.id}-$index-${question.options[index]}',
                          ),
                          padding: const EdgeInsets.only(bottom: 12),
                          child: InkWell(
                            key: ValueKey(
                              'exam-option-ink-${question.id}-$index-${question.options[index]}',
                            ),
                            borderRadius: BorderRadius.circular(20),
                            onTap: () {
                              setState(() {
                                _answers[question.id] = index;
                              });
                              unawaited(_persistSession());
                            },
                            child: Container(
                              key: ValueKey(
                                'exam-option-box-${question.id}-$index-${question.options[index]}-$selected',
                              ),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color:
                                    selected
                                        ? MeritTheme.primarySoft
                                        : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color:
                                      selected
                                          ? MeritTheme.primary
                                          : MeritTheme.border,
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor:
                                        selected
                                            ? MeritTheme.secondary
                                            : MeritTheme.primarySoft,
                                    foregroundColor:
                                        selected
                                            ? Colors.white
                                            : MeritTheme.secondary,
                                    child: Text(
                                      String.fromCharCode(65 + index),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: RichMathContentView(
                                      key: ValueKey(
                                        'exam-option-${question.id}-$index-${question.options[index]}',
                                      ),
                                      rawText: question.options[index],
                                      segments:
                                          question.optionSegments != null &&
                                                  index <
                                                      question
                                                          .optionSegments!
                                                          .length
                                              ? question.optionSegments![index]
                                              : null,
                                      allowExpand: true,
                                      preferProvidedSegments: true,
                                      compact: true,
                                      style: optionStyle,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed:
                              _currentIndex == 0
                                  ? null
                                  : () {
                                    setState(() => _currentIndex--);
                                    unawaited(_persistSession());
                                  },
                          child: const Text('Previous'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed:
                              _submitting
                                  ? null
                                  : _currentIndex ==
                                      widget.paper.questions.length - 1
                                  ? _submit
                                  : () {
                                    setState(() => _currentIndex++);
                                    unawaited(_persistSession());
                                  },
                          child: Text(
                            _submitting
                                ? 'Submitting...'
                                : _currentIndex ==
                                    widget.paper.questions.length - 1
                                ? 'Submit exam'
                                : 'Next',
                          ),
                        ),
                      ),
                    ],
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

class ResultDialog extends StatelessWidget {
  const ResultDialog({
    super.key,
    required this.attempt,
    required this.paper,
    required this.course,
    required this.student,
  });

  final ExamAttempt attempt;
  final Paper paper;
  final Course course;
  final StudentProfile student;

  Future<void> _printReport(BuildContext context) async {
    final controller = AppScope.of(context);
    final studentAttempts = controller.attemptsForStudent(student.id);
    final conceptGrowth =
        _aggregateConceptProgress(
          studentAttempts,
          controller.papers,
        ).take(6).toList();
    final recommendedPaper = _recommendedNextPaper(
      controller: controller,
      currentPaper: paper,
      attempt: attempt,
      focusConcepts:
          _conceptPerformanceForPaper(
            paper,
            attempt,
          ).where((item) => item.wrong > 0).take(4).toList(),
    );
    final attemptedCount = attempt.answers.length;
    final correctAnswers =
        attempt.answers.entries.where((entry) {
          final matches = paper.questions.where((q) => q.id == entry.key);
          if (matches.isEmpty) return false;
          return entry.value == matches.first.correctIndex;
        }).length;
    final accuracy =
        attemptedCount == 0 ? 0.0 : correctAnswers / attemptedCount;
    final incorrectAnswers = attemptedCount - correctAnswers;
    final skippedAnswers = paper.questions.length - attemptedCount;
    final percentage =
        attempt.maxScore == 0
            ? 0.0
            : (attempt.score / attempt.maxScore).clamp(0.0, 1.0).toDouble();
    final conceptPerformance = _conceptPerformanceForPaper(paper, attempt);
    final strongConcepts =
        conceptPerformance
            .where((item) => item.correct > 0 && item.wrong == 0)
            .take(4)
            .toList();
    final focusConcepts =
        conceptPerformance.where((item) => item.wrong > 0).take(4).toList();
    final mentorSummary = _buildMentorSummary(
      course: course,
      paper: paper,
      attempt: attempt,
      correctAnswers: correctAnswers,
      skippedAnswers: skippedAnswers,
      strongConcepts: strongConcepts,
      focusConcepts: focusConcepts,
    );

    final document = pw.Document();
    document.addPage(
      pw.MultiPage(
        margin: const pw.EdgeInsets.all(28),
        pageTheme: const pw.PageTheme(margin: pw.EdgeInsets.all(28)),
        header:
            (context) => pw.Container(
              padding: const pw.EdgeInsets.only(bottom: 12),
              decoration: const pw.BoxDecoration(
                border: pw.Border(
                  bottom: pw.BorderSide(color: pdf.PdfColors.grey300, width: 1),
                ),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Merit Launchers',
                        style: pw.TextStyle(
                          fontSize: 22,
                          fontWeight: pw.FontWeight.bold,
                          color: pdf.PdfColors.blueGrey900,
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        'Exam Performance Report',
                        style: pw.TextStyle(
                          fontSize: 11,
                          color: pdf.PdfColors.blueGrey600,
                        ),
                      ),
                    ],
                  ),
                  pw.Text(
                    DateFormat(
                      'dd MMM yyyy, hh:mm a',
                    ).format(attempt.submittedAt),
                    style: pw.TextStyle(
                      fontSize: 10,
                      color: pdf.PdfColors.blueGrey600,
                    ),
                  ),
                ],
              ),
            ),
        footer:
            (context) => pw.Align(
              alignment: pw.Alignment.centerRight,
              child: pw.Text(
                'Page ${context.pageNumber} of ${context.pagesCount}',
                style: pw.TextStyle(
                  fontSize: 10,
                  color: pdf.PdfColors.blueGrey500,
                ),
              ),
            ),
        build: (context) {
          return [
            pw.SizedBox(height: 6),
            pw.Text(
              paper.title,
              style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
            ),
            pw.SizedBox(height: 4),
            pw.Text(
              '${course.title} - ${student.name}',
              style: pw.TextStyle(
                fontSize: 12,
                color: pdf.PdfColors.blueGrey700,
              ),
            ),
            pw.SizedBox(height: 18),
            pw.Container(
              padding: const pw.EdgeInsets.all(18),
              decoration: pw.BoxDecoration(
                color: pdf.PdfColors.blue50,
                borderRadius: pw.BorderRadius.circular(16),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'Mentor summary',
                    style: pw.TextStyle(
                      fontSize: 14,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 8),
                  pw.Text(
                    mentorSummary,
                    style: const pw.TextStyle(fontSize: 11, lineSpacing: 3),
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 18),
            pw.Row(
              children: [
                _pdfMetricCard(
                  label: 'Score',
                  value: '${attempt.score}/${attempt.maxScore}',
                  accent: pdf.PdfColors.blue700,
                ),
                pw.SizedBox(width: 10),
                _pdfMetricCard(
                  label: 'Accuracy',
                  value: '${(accuracy * 100).round()}%',
                  accent: pdf.PdfColors.green700,
                ),
                pw.SizedBox(width: 10),
                _pdfMetricCard(
                  label: 'Completion',
                  value: '$attemptedCount/${paper.questions.length}',
                  accent: pdf.PdfColors.orange700,
                ),
                pw.SizedBox(width: 10),
                _pdfMetricCard(
                  label: 'Overall',
                  value: '${(percentage * 100).round()}%',
                  accent: pdf.PdfColors.indigo700,
                ),
              ],
            ),
            pw.SizedBox(height: 10),
            pw.Row(
              children: [
                _pdfMetricCard(
                  label: 'Correct',
                  value: '$correctAnswers',
                  accent: pdf.PdfColors.green600,
                ),
                pw.SizedBox(width: 10),
                _pdfMetricCard(
                  label: 'Incorrect',
                  value: '$incorrectAnswers',
                  accent: pdf.PdfColors.red600,
                ),
                pw.SizedBox(width: 10),
                _pdfMetricCard(
                  label: 'Skipped',
                  value: '$skippedAnswers',
                  accent: pdf.PdfColors.amber700,
                ),
                pw.SizedBox(width: 10),
                _pdfMetricCard(
                  label: 'Duration',
                  value: '${paper.durationMinutes} min',
                  accent: pdf.PdfColors.blueGrey700,
                ),
              ],
            ),
            if (strongConcepts.isNotEmpty || focusConcepts.isNotEmpty) ...[
              pw.SizedBox(height: 20),
              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  if (strongConcepts.isNotEmpty)
                    pw.Expanded(
                      child: _pdfTagSection(
                        title: 'Strong concepts',
                        tags: strongConcepts.map((item) => item.label).toList(),
                        background: pdf.PdfColors.green50,
                        textColor: pdf.PdfColors.green900,
                      ),
                    ),
                  if (strongConcepts.isNotEmpty && focusConcepts.isNotEmpty)
                    pw.SizedBox(width: 12),
                  if (focusConcepts.isNotEmpty)
                    pw.Expanded(
                      child: _pdfTagSection(
                        title: 'Needs another pass',
                        tags: focusConcepts.map((item) => item.label).toList(),
                        background: pdf.PdfColors.orange50,
                        textColor: pdf.PdfColors.deepOrange900,
                      ),
                    ),
                ],
              ),
            ],
            if (attempt.sectionScores.isNotEmpty) ...[
              pw.SizedBox(height: 20),
              _pdfSectionTitle('Section performance'),
              pw.SizedBox(height: 10),
              ...attempt.sectionScores.entries.map((entry) {
                final maxValue = paper.questions
                    .where((question) => question.section == entry.key)
                    .fold<int>(0, (sum, question) => sum + question.marks);
                final ratio =
                    maxValue <= 0
                        ? 0.0
                        : (entry.value / maxValue).clamp(0.0, 1.0);
                return pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 10),
                  child: pw.Container(
                    padding: const pw.EdgeInsets.all(12),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: pdf.PdfColors.grey300),
                      borderRadius: pw.BorderRadius.circular(12),
                    ),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text(
                              entry.key,
                              style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold,
                              ),
                            ),
                            pw.Text('${entry.value}/$maxValue'),
                          ],
                        ),
                        pw.SizedBox(height: 8),
                        pw.Container(
                          height: 8,
                          decoration: pw.BoxDecoration(
                            color: pdf.PdfColors.grey200,
                            borderRadius: pw.BorderRadius.circular(999),
                          ),
                          child: pw.Row(
                            children: [
                              pw.Expanded(
                                flex: (ratio * 1000).round().clamp(0, 1000),
                                child: pw.Container(
                                  decoration: pw.BoxDecoration(
                                    color: pdf.PdfColors.blue600,
                                    borderRadius: pw.BorderRadius.circular(999),
                                  ),
                                ),
                              ),
                              pw.Expanded(
                                flex:
                                    1000 -
                                    (ratio * 1000).round().clamp(0, 1000),
                                child: pw.SizedBox(),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
            if (conceptPerformance.isNotEmpty) ...[
              pw.SizedBox(height: 16),
              _pdfSectionTitle('Concept insights'),
              pw.SizedBox(height: 8),
              ...conceptPerformance
                  .take(8)
                  .map(
                    (item) => pw.Padding(
                      padding: const pw.EdgeInsets.only(bottom: 10),
                      child: pw.Container(
                        padding: const pw.EdgeInsets.all(12),
                        decoration: pw.BoxDecoration(
                          color: pdf.PdfColors.grey50,
                          borderRadius: pw.BorderRadius.circular(12),
                          border: pw.Border.all(color: pdf.PdfColors.grey300),
                        ),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Row(
                              mainAxisAlignment:
                                  pw.MainAxisAlignment.spaceBetween,
                              children: [
                                pw.Expanded(
                                  child: pw.Text(
                                    item.label,
                                    style: pw.TextStyle(
                                      fontWeight: pw.FontWeight.bold,
                                    ),
                                  ),
                                ),
                                pw.Text(
                                  '${(item.accuracy * 100).round()}% accurate',
                                ),
                              ],
                            ),
                            pw.SizedBox(height: 6),
                            pw.Text(
                              'Attempted ${item.attempted}  |  Correct ${item.correct}  |  Wrong ${item.wrong}  |  Score ${item.scoreDelta}',
                              style: pw.TextStyle(
                                fontSize: 10,
                                color: pdf.PdfColors.blueGrey700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
            ],
            if (conceptGrowth.isNotEmpty) ...[
              pw.SizedBox(height: 16),
              _pdfSectionTitle('Concept growth across attempts'),
              pw.SizedBox(height: 8),
              ...conceptGrowth.map(
                (item) => pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 10),
                  child: pw.Container(
                    padding: const pw.EdgeInsets.all(12),
                    decoration: pw.BoxDecoration(
                      color: pdf.PdfColors.blue50,
                      borderRadius: pw.BorderRadius.circular(12),
                      border: pw.Border.all(color: pdf.PdfColors.blue100),
                    ),
                    child: pw.Row(
                      children: [
                        pw.Expanded(
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Text(
                                item.label,
                                style: pw.TextStyle(
                                  fontWeight: pw.FontWeight.bold,
                                ),
                              ),
                              pw.SizedBox(height: 4),
                              pw.Text(
                                '${item.attempted} attempts  |  ${(item.accuracy * 100).round()}% accuracy  |  Score delta ${item.scoreDelta}',
                                style: pw.TextStyle(
                                  fontSize: 10,
                                  color: pdf.PdfColors.blueGrey700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
            if (recommendedPaper != null) ...[
              pw.SizedBox(height: 16),
              _pdfSectionTitle('Recommended next test'),
              pw.SizedBox(height: 8),
              pw.Container(
                padding: const pw.EdgeInsets.all(14),
                decoration: pw.BoxDecoration(
                  color: pdf.PdfColors.indigo50,
                  borderRadius: pw.BorderRadius.circular(14),
                  border: pw.Border.all(color: pdf.PdfColors.indigo100),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      recommendedPaper.title,
                      style: pw.TextStyle(
                        fontSize: 14,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      'Course: ${course.title}  |  Duration: ${recommendedPaper.durationMinutes} min',
                      style: pw.TextStyle(
                        fontSize: 10.5,
                        color: pdf.PdfColors.blueGrey700,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      _recommendationReason(
                        currentPaper: paper,
                        recommendedPaper: recommendedPaper,
                        focusConcepts: focusConcepts,
                      ),
                      style: const pw.TextStyle(fontSize: 11, lineSpacing: 2),
                    ),
                  ],
                ),
              ),
            ],
            pw.SizedBox(height: 18),
            _pdfSectionTitle('Question review'),
            pw.SizedBox(height: 8),
            ...paper.questions.asMap().entries.map((entry) {
              final index = entry.key;
              final question = entry.value;
              final selected = attempt.answers[question.id];
              final status =
                  selected == null
                      ? 'Skipped'
                      : selected == question.correctIndex
                      ? 'Correct'
                      : 'Incorrect';
              final selectedLabel =
                  selected == null ? '-' : String.fromCharCode(65 + selected);
              final correctLabel = String.fromCharCode(
                65 + question.correctIndex,
              );
              return pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 10),
                child: pw.Container(
                  padding: const pw.EdgeInsets.all(12),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: pdf.PdfColors.grey300),
                    borderRadius: pw.BorderRadius.circular(12),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Expanded(
                            child: pw.Text(
                              'Q${index + 1} - ${question.section}',
                              style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold,
                              ),
                            ),
                          ),
                          pw.Text(status),
                        ],
                      ),
                      pw.SizedBox(height: 6),
                      _pdfMathBlock(
                        question.prompt,
                        providedSegments: question.promptSegments,
                        fontSize: 10.5,
                      ),
                      pw.SizedBox(height: 6),
                      _pdfSelectionSummary(
                        question: question,
                        selectedIndex: selected,
                        selectedLabel: selectedLabel,
                        correctLabel: correctLabel,
                      ),
                    ],
                  ),
                ),
              );
            }),
          ];
        },
      ),
    );

    try {
      final bytes = await document.save();
      if (kIsWeb) {
        await Printing.sharePdf(
          bytes: bytes,
          filename: '${paper.title.replaceAll(' ', '_')}_report.pdf',
        );
      } else {
        await Printing.layoutPdf(onLayout: (_) async => bytes);
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not generate PDF. Please try again.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final percentage =
        attempt.maxScore == 0
            ? 0.0
            : (attempt.score / attempt.maxScore).clamp(0.0, 1.0).toDouble();
    final attemptedCount = attempt.answers.length;
    final correctAnswers =
        attempt.answers.entries.where((entry) {
          final matches = paper.questions.where((q) => q.id == entry.key);
          if (matches.isEmpty) return false;
          return entry.value == matches.first.correctIndex;
        }).length;
    final accuracy =
        attemptedCount == 0 ? 0.0 : correctAnswers / attemptedCount;
    final incorrectAnswers = attemptedCount - correctAnswers;
    final skippedAnswers = paper.questions.length - attemptedCount;
    final conceptPerformance = _conceptPerformanceForPaper(paper, attempt);
    final strongConcepts =
        conceptPerformance
            .where((item) => item.correct > 0 && item.wrong == 0)
            .take(3)
            .toList();
    final focusConcepts =
        conceptPerformance.where((item) => item.wrong > 0).take(3).toList();
    final mentorSummary = _buildMentorSummary(
      course: course,
      paper: paper,
      attempt: attempt,
      correctAnswers: correctAnswers,
      skippedAnswers: skippedAnswers,
      strongConcepts: strongConcepts,
      focusConcepts: focusConcepts,
    );

    return AlertDialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
      titlePadding: EdgeInsets.zero,
      contentPadding: EdgeInsets.zero,
      actionsPadding: EdgeInsets.zero,
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      content: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxWidth: 560),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(32),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF102544).withValues(alpha: 0.16),
              blurRadius: 34,
              offset: const Offset(0, 18),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 22),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF102544),
                    Color(0xFF16598A),
                    Color(0xFF11A4CF),
                  ],
                ),
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 7,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: const Text(
                          'Exam completed',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        DateFormat(
                          'dd MMM, hh:mm a',
                        ).format(attempt.submittedAt),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    paper.title,
                    style: Theme.of(
                      context,
                    ).textTheme.headlineMedium?.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${course.title} · ${student.name}',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.84),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: _HeroResultMetric(
                          label: 'Score',
                          value: '${attempt.score}/${attempt.maxScore}',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _HeroResultMetric(
                          label: 'Accuracy',
                          value: '${(accuracy * 100).round()}%',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _HeroResultMetric(
                          label: 'Completion',
                          value: '$attemptedCount/${paper.questions.length}',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: percentage,
                        minHeight: 12,
                        backgroundColor: MeritTheme.primarySoft,
                        color: MeritTheme.secondary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      '${(percentage * 100).round()}% overall score',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      mentorSummary,
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: _ResultStatCard(
                            label: 'Correct',
                            value: '$correctAnswers',
                            accent: MeritTheme.success,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _ResultStatCard(
                            label: 'Incorrect',
                            value: '$incorrectAnswers',
                            accent: Colors.orange,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _ResultStatCard(
                            label: 'Skipped',
                            value: '$skippedAnswers',
                            accent: MeritTheme.accent,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    _StudentPanel(
                      title: 'Mentor summary',
                      subtitle:
                          'A quick read on how this attempt moved your preparation.',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (strongConcepts.isNotEmpty) ...[
                            Text(
                              'Strongest concepts',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children:
                                  strongConcepts
                                      .map(
                                        (item) => _MetaChip(label: item.label),
                                      )
                                      .toList(),
                            ),
                            const SizedBox(height: 14),
                          ],
                          if (focusConcepts.isNotEmpty) ...[
                            Text(
                              'Needs another pass',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children:
                                  focusConcepts
                                      .map(
                                        (item) => _MetaChip(label: item.label),
                                      )
                                      .toList(),
                            ),
                          ] else
                            Text(
                              'You kept mistakes under control across the main concepts in this paper.',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                        ],
                      ),
                    ),
                    if (attempt.sectionScores.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Section performance',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 10),
                      ...attempt.sectionScores.entries.map(
                        (entry) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _SectionScoreTile(
                            label: entry.key,
                            value: entry.value,
                            maxValue: paper.questions
                                .where(
                                  (question) => question.section == entry.key,
                                )
                                .fold<int>(
                                  0,
                                  (sum, question) => sum + question.marks,
                                ),
                          ),
                        ),
                      ),
                    ],
                    if (conceptPerformance.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        'Concept insights',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 10),
                      ...conceptPerformance
                          .take(5)
                          .map(
                            (item) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _ConceptInsightTile(item: item),
                            ),
                          ),
                    ],
                    if (incorrectAnswers > 0 || skippedAnswers > 0) ...[
                      const SizedBox(height: 6),
                      _StudentPanel(
                        title: 'Next best action',
                        subtitle:
                            'Keep momentum with one focused improvement move.',
                        child: Text(
                          focusConcepts.isNotEmpty
                              ? 'Revisit ${focusConcepts.map((item) => item.label).join(', ')} first, then reattempt this paper or a similar one while the pattern is still fresh.'
                              : 'Review the skipped questions first, then attempt a similar paper again while the pattern is still fresh.',
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _printReport(context),
                      child: const Text('Download PDF'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        Navigator.of(context).pop();
                        Navigator.of(context).pop();
                      },
                      child: const Text('Back to course'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class StudentLibraryPage extends StatelessWidget {
  const StudentLibraryPage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final student = controller.currentStudent;
    final snapshot = _StudentDashboardSnapshot.fromController(controller);
    final purchases = snapshot.purchases;
    final attempts = snapshot.attempts;
    final pendingSessions = snapshot.pendingSessions;
    final recentAttempts = attempts.take(8).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
      children: [
        _StudentPanel(
          title: 'Your library',
          subtitle:
              'Everything you have purchased, attempted, or paid for is grouped here for quick access.',
          child: Row(
            children: [
              Expanded(
                child: _ResultStatCard(
                  label: 'Active courses',
                  value: '${snapshot.activeCourseIds.length}',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ResultStatCard(
                  label: 'Pending tests',
                  value: '${pendingSessions.length}',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        _StudentPanel(
          title: 'Resume pending tests',
          subtitle:
              'Any paper you leave midway stays here with time left and questions remaining, ready on both app and web.',
          child:
              pendingSessions.isEmpty
                  ? const _StudentEmptyState(
                    icon: Icons.pause_circle_outline_rounded,
                    title: 'Nothing waiting',
                    message:
                        'Pending papers will appear here automatically as soon as you leave a test before submission.',
                  )
                  : Column(
                    children:
                        pendingSessions
                            .map(
                              (session) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _PendingExamCard(
                                  session: session,
                                  compact: true,
                                ),
                              ),
                            )
                            .toList(),
                  ),
        ),
        const SizedBox(height: 18),
        _StudentPanel(
          title: 'Enrolled courses',
          subtitle:
              'View your active enrolments, access course material, and download receipts.',
          child:
              purchases.isEmpty
                  ? const _StudentEmptyState(
                    icon: Icons.workspace_premium_outlined,
                    title: 'No purchases yet',
                    message:
                        'As soon as you unlock a course, it will appear here with its receipt and access details.',
                  )
                  : Column(
                    children:
                        purchases.map((purchase) {
                          final course = controller.courseById(
                            purchase.courseId,
                          );
                          if (course == null) return const SizedBox.shrink();
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _StudentActionCard(
                              icon: Icons.receipt_long_outlined,
                              title: course.title,
                              subtitle:
                                  'Purchased ${DateFormat('dd MMM yyyy').format(purchase.purchasedAt)} • Receipt ${purchase.receiptNumber}',
                              trailingLabel: 'Receipt',
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder:
                                        (_) => ReceiptPage(
                                          purchase: purchase,
                                          course: course,
                                          student: controller.currentStudent,
                                        ),
                                  ),
                                );
                              },
                            ),
                          );
                        }).toList(),
                  ),
        ),
        const SizedBox(height: 18),
        _StudentPanel(
          title: 'Recent attempts',
          subtitle: 'Your latest submissions with score and submission time.',
          child:
              recentAttempts.isEmpty
                  ? const _StudentEmptyState(
                    icon: Icons.quiz_outlined,
                    title: 'No attempts yet',
                    message:
                        'Start a paper and your latest scores will appear here automatically.',
                  )
                  : Column(
                    children:
                        recentAttempts.map((attempt) {
                          final paper = controller.paperById(attempt.paperId);
                          if (paper == null) return const SizedBox.shrink();
                          final course = controller.courseById(paper.courseId);
                          if (course == null) return const SizedBox.shrink();
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _StudentActionCard(
                              icon: Icons.insights_outlined,
                              title: paper.title,
                              subtitle:
                                  '${attempt.score}/${attempt.maxScore} • ${DateFormat('dd MMM yyyy, hh:mm a').format(attempt.submittedAt)}',
                              trailingLabel: 'Report',
                              onTap:
                                  () => _openAttemptReportDialog(
                                    context,
                                    attempt: attempt,
                                    paper: paper,
                                    course: course,
                                    student: student,
                                  ),
                            ),
                          );
                        }).toList(),
                  ),
        ),
      ],
    );
  }
}

pw.Widget _pdfMetricCard({
  required String label,
  required String value,
  required pdf.PdfColor accent,
}) {
  return pw.Expanded(
    child: pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        borderRadius: pw.BorderRadius.circular(12),
        color: pdf.PdfColors.white,
        border: pw.Border.all(color: pdf.PdfColors.grey300),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Container(
            width: 26,
            height: 4,
            decoration: pw.BoxDecoration(
              color: accent,
              borderRadius: pw.BorderRadius.circular(999),
            ),
          ),
          pw.SizedBox(height: 10),
          pw.Text(
            value,
            style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold),
          ),
          pw.SizedBox(height: 4),
          pw.Text(
            label,
            style: pw.TextStyle(fontSize: 10, color: pdf.PdfColors.blueGrey700),
          ),
        ],
      ),
    ),
  );
}

pw.Widget _pdfTagSection({
  required String title,
  required List<String> tags,
  required pdf.PdfColor background,
  required pdf.PdfColor textColor,
}) {
  return pw.Container(
    padding: const pw.EdgeInsets.all(12),
    decoration: pw.BoxDecoration(
      color: background,
      borderRadius: pw.BorderRadius.circular(12),
    ),
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          title,
          style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: textColor),
        ),
        pw.SizedBox(height: 8),
        ...tags.map(
          (tag) => pw.Padding(
            padding: const pw.EdgeInsets.only(bottom: 6),
            child: pw.Bullet(
              text: tag,
              style: pw.TextStyle(fontSize: 10.5, color: textColor),
            ),
          ),
        ),
      ],
    ),
  );
}

pw.Widget _pdfSectionTitle(String title) {
  return pw.Text(
    title,
    style: pw.TextStyle(fontSize: 15, fontWeight: pw.FontWeight.bold),
  );
}

String _pdfText(String input) {
  return MathFormatter.format(input).replaceAll('\n\n', '\n').trim();
}

pw.Widget _pdfSelectionSummary({
  required Question question,
  required int? selectedIndex,
  required String selectedLabel,
  required String correctLabel,
}) {
  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      if (selectedIndex != null)
        pw.Wrap(
          spacing: 6,
          runSpacing: 4,
          crossAxisAlignment: pw.WrapCrossAlignment.center,
          children: [
            pw.Text(
              'Selected ($selectedLabel):',
              style: pw.TextStyle(
                fontSize: 10,
                color: pdf.PdfColors.blueGrey700,
              ),
            ),
            _pdfMathInline(
              selectedIndex < question.options.length
                  ? question.options[selectedIndex]
                  : '?',
              providedSegments:
                  (question.optionSegments != null &&
                          selectedIndex < question.optionSegments!.length)
                      ? question.optionSegments![selectedIndex]
                      : null,
              fontSize: 10,
            ),
          ],
        )
      else
        pw.Text(
          'Selected: -',
          style: pw.TextStyle(fontSize: 10, color: pdf.PdfColors.blueGrey700),
        ),
      pw.SizedBox(height: 4),
      pw.Wrap(
        spacing: 6,
        runSpacing: 4,
        crossAxisAlignment: pw.WrapCrossAlignment.center,
        children: [
          pw.Text(
            'Correct ($correctLabel):',
            style: pw.TextStyle(fontSize: 10, color: pdf.PdfColors.blueGrey700),
          ),
          _pdfMathInline(
            question.correctIndex < question.options.length
                ? question.options[question.correctIndex]
                : '?',
            providedSegments:
                (question.optionSegments != null &&
                        question.correctIndex < question.optionSegments!.length)
                    ? question.optionSegments![question.correctIndex]
                    : null,
            fontSize: 10,
          ),
        ],
      ),
    ],
  );
}

pw.Widget _pdfMathInline(
  String rawText, {
  List<MathContentSegment>? providedSegments,
  double fontSize = 10,
}) {
  return pw.Container(
    constraints: const pw.BoxConstraints(maxWidth: 420),
    child: _pdfMathBlock(
      rawText,
      providedSegments: providedSegments,
      fontSize: fontSize,
    ),
  );
}

pw.Widget _pdfMathBlock(
  String rawText, {
  List<MathContentSegment>? providedSegments,
  double fontSize = 11,
}) {
  final segments = _resolvePdfSegments(rawText, providedSegments);
  final textStyle = pw.TextStyle(
    fontSize: fontSize,
    lineSpacing: 2,
    color: pdf.PdfColors.blueGrey900,
  );
  final blockWidgets = <pw.Widget>[];
  final inlineChildren = <pw.Widget>[];

  void flushInline() {
    if (inlineChildren.isEmpty) {
      return;
    }
    blockWidgets.add(
      pw.Wrap(
        spacing: 2,
        runSpacing: 4,
        crossAxisAlignment: pw.WrapCrossAlignment.center,
        children: List<pw.Widget>.from(inlineChildren),
      ),
    );
    inlineChildren.clear();
  }

  for (final segment in segments) {
    if (!segment.isMath) {
      final lines = segment.value.split('\n');
      for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        final line = lines[lineIndex];
        if (line.isNotEmpty) {
          inlineChildren.addAll(_pdfInlineTextWidgets(line, textStyle));
        }
        if (lineIndex != lines.length - 1) {
          flushInline();
        }
      }
      continue;
    }

    final mathWidget = _pdfMathWidget(
      segment.value,
      svg: segment.svg,
      display: segment.display,
      fontSize: fontSize,
    );
    if (segment.display) {
      flushInline();
      blockWidgets.add(mathWidget);
    } else {
      inlineChildren.add(mathWidget);
    }
  }

  flushInline();

  if (blockWidgets.isEmpty) {
    return pw.Text(_pdfText(rawText), style: textStyle);
  }

  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      for (var i = 0; i < blockWidgets.length; i++) ...[
        blockWidgets[i],
        if (i != blockWidgets.length - 1) pw.SizedBox(height: 4),
      ],
    ],
  );
}

List<pw.Widget> _pdfInlineTextWidgets(String text, pw.TextStyle style) {
  final matches = RegExp(r'\S+\s*').allMatches(text);
  if (matches.isEmpty) {
    return [pw.Text(text, style: style)];
  }

  return matches
      .map((match) => pw.Text(match.group(0)!, style: style))
      .toList();
}

List<MathContentSegment> _resolvePdfSegments(
  String rawText,
  List<MathContentSegment>? providedSegments,
) {
  final parsed = MathContentParser.parse(rawText);
  if (providedSegments == null || providedSegments.isEmpty) {
    return parsed;
  }

  final providedMath =
      providedSegments.where((segment) => segment.isMath).toList();
  var cursor = 0;

  return parsed.map((segment) {
    if (!segment.isMath) {
      return segment;
    }

    final normalizedValue =
        MathContentParser.normalizeSourceText(segment.value).trim();
    while (cursor < providedMath.length) {
      final candidate = providedMath[cursor];
      cursor++;
      final normalizedCandidate =
          MathContentParser.normalizeSourceText(candidate.value).trim();
      if (normalizedCandidate == normalizedValue) {
        return segment.copyWith(svg: candidate.svg ?? segment.svg);
      }
    }
    return segment;
  }).toList();
}

pw.Widget _pdfMathWidget(
  String math, {
  required String? svg,
  required bool display,
  required double fontSize,
}) {
  if (svg != null && svg.isNotEmpty) {
    final height = display ? fontSize * 3.2 : fontSize * 1.45;
    final width = _pdfSvgWidth(svg, height);
    return pw.Padding(
      padding: pw.EdgeInsets.only(top: display ? 4 : 0),
      child: pw.SvgImage(svg: svg, width: width, height: height),
    );
  }

  return pw.Text(
    MathFormatter.format(math),
    style: pw.TextStyle(fontSize: fontSize, color: pdf.PdfColors.blueGrey900),
  );
}

double _pdfSvgWidth(String svg, double fallbackHeight) {
  final viewBoxMatch = RegExp(
    r'viewBox="(-?[0-9.]+)\s+(-?[0-9.]+)\s+([0-9.]+)\s+([0-9.]+)"',
  ).firstMatch(svg);
  if (viewBoxMatch != null) {
    final width = double.tryParse(viewBoxMatch.group(3) ?? '');
    final height = double.tryParse(viewBoxMatch.group(4) ?? '');
    if (width != null && height != null && height > 0) {
      return (width * fallbackHeight / height).clamp(16.0, 460.0);
    }
  }

  return fallbackHeight * 2.4;
}

Paper? _recommendedNextPaper({
  required AppController controller,
  required Paper currentPaper,
  required ExamAttempt attempt,
  required List<_ConceptPerformance> focusConcepts,
}) {
  final attemptsByPaperId = {
    for (final item in controller.attemptsForStudent(
      controller.currentStudent.id,
    ))
      item.paperId: item,
  };
  final papers = controller.accessiblePapersForCourse(currentPaper.courseId);

  if (focusConcepts.isNotEmpty) {
    final labels =
        focusConcepts.map((item) => item.label.trim().toLowerCase()).toSet();
    final candidate =
        papers
            .where((paper) {
              if (paper.id == currentPaper.id) {
                return false;
              }
              final questions = paper.questions;
              return questions.any((question) {
                final questionLabels = <String>{
                  question.section.trim().toLowerCase(),
                  if ((question.topic ?? '').trim().isNotEmpty)
                    question.topic!.trim().toLowerCase(),
                  ...question.concepts.map((item) => item.trim().toLowerCase()),
                };
                return questionLabels.any(labels.contains);
              });
            })
            .where((paper) => !attemptsByPaperId.containsKey(paper.id))
            .toList();

    if (candidate.isNotEmpty) {
      candidate.sort((a, b) => a.title.compareTo(b.title));
      return candidate.first;
    }
  }

  final freshPaper = papers.firstWhere(
    (paper) =>
        paper.id != currentPaper.id && !attemptsByPaperId.containsKey(paper.id),
    orElse: () => currentPaper,
  );
  return freshPaper;
}

String _recommendationReason({
  required Paper currentPaper,
  required Paper recommendedPaper,
  required List<_ConceptPerformance> focusConcepts,
}) {
  if (recommendedPaper.id == currentPaper.id) {
    return 'Retake this paper after reviewing the weak areas. A second timed pass should help convert the mistakes you already exposed.';
  }

  if (focusConcepts.isNotEmpty) {
    return 'This paper is the best next step because it can reinforce ${focusConcepts.map((item) => item.label).join(', ')} without repeating the exact same question set.';
  }

  return 'This is a good follow-up paper in the same course to build consistency after this attempt.';
}

class StudentProfilePage extends StatelessWidget {
  const StudentProfilePage({super.key});

  Future<void> _openProfileEditor(
    BuildContext context,
    AppController controller,
  ) async {
    final student = controller.currentStudent;
    final nameController = TextEditingController(text: student.name);
    final cityController = TextEditingController(text: student.city);
    final referralController = TextEditingController(
      text: student.referralCode ?? '',
    );
    var submitting = false;
    String? errorText;

    await showDialog<void>(
      context: context,
      builder:
          (dialogContext) => StatefulBuilder(
            builder:
                (dialogContext, setDialogState) => AlertDialog(
                  title: const Text('Update profile'),
                  content: SizedBox(
                    width: double.infinity,
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 420),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          TextField(
                            controller: nameController,
                            decoration: const InputDecoration(
                              labelText: 'Full name',
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: cityController,
                            decoration: const InputDecoration(
                              labelText: 'City',
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: referralController,
                            textCapitalization: TextCapitalization.characters,
                            decoration: const InputDecoration(
                              labelText: 'Referral code',
                              helperText:
                                  'Enter the referral code from your enrollment partner, if applicable.',
                            ),
                          ),
                          if (errorText != null) ...[
                            const SizedBox(height: 12),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: Text(
                                errorText!,
                                style: Theme.of(dialogContext)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(color: Colors.red.shade700),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed:
                          submitting
                              ? null
                              : () => Navigator.of(dialogContext).pop(),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      onPressed:
                          submitting
                              ? null
                              : () async {
                                if (nameController.text.trim().isEmpty ||
                                    cityController.text.trim().isEmpty) {
                                  setDialogState(
                                    () =>
                                        errorText =
                                            'Name and city are required.',
                                  );
                                  return;
                                }
                                final referral = referralController.text.trim();
                                if (referral.isNotEmpty &&
                                    !RegExp(
                                      r'^[A-Z0-9]{4,20}$',
                                    ).hasMatch(referral)) {
                                  setDialogState(
                                    () =>
                                        errorText =
                                            'Referral code must be 4–20 uppercase letters/numbers.',
                                  );
                                  return;
                                }
                                setDialogState(() {
                                  submitting = true;
                                  errorText = null;
                                });
                                try {
                                  await controller.updateCurrentStudentProfile(
                                    name: nameController.text.trim(),
                                    city: cityController.text.trim(),
                                    referralCode:
                                        referralController.text.trim(),
                                  );
                                  if (dialogContext.mounted) {
                                    Navigator.of(dialogContext).pop();
                                  }
                                } catch (error) {
                                  setDialogState(() {
                                    errorText = error.toString().replaceFirst(
                                      'Exception: ',
                                      '',
                                    );
                                    submitting = false;
                                  });
                                }
                              },
                      child: Text(submitting ? 'Saving...' : 'Save changes'),
                    ),
                  ],
                ),
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final student = controller.currentStudent;
    final snapshot = _StudentDashboardSnapshot.fromController(controller);
    final attempts = snapshot.attempts;
    final purchases = snapshot.purchases;
    final conceptProgress = _aggregateConceptProgress(
      attempts,
      controller.papers,
    );
    final activeCourseIds = snapshot.activeCourseIds;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: MeritTheme.border),
          ),
          padding: const EdgeInsets.all(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 70,
                    height: 70,
                    decoration: const BoxDecoration(
                      color: MeritTheme.primarySoft,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.person_outline_rounded,
                      size: 34,
                      color: MeritTheme.secondary,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          student.name,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 4),
                        Text(student.contact),
                        const SizedBox(height: 4),
                        Text(student.city),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Edit profile',
                    onPressed: () => _openProfileEditor(context, controller),
                    icon: const Icon(Icons.edit_outlined),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: _ResultStatCard(
                      label: 'Courses',
                      value: '${activeCourseIds.length}',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ResultStatCard(
                      label: 'Attempts',
                      value: '${attempts.length}',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: MeritTheme.primarySoft,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Referral code',
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      student.referralCode ?? 'Not provided',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      student.referralCode == null ||
                              student.referralCode!.isEmpty
                          ? 'Enter a referral code if you were introduced by a partner or affiliate.'
                          : 'This code links your account to your referral partner.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: MeritTheme.secondaryMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        _StudentPanel(
          title: 'Attempt history',
          subtitle: 'A complete record of all your test attempts and scores.',
          child:
              attempts.isEmpty
                  ? const _StudentEmptyState(
                    icon: Icons.history_toggle_off_outlined,
                    title: 'No attempts recorded',
                    message:
                        'Once you submit a test, it will appear here with course, paper, and score.',
                  )
                  : Column(
                    children:
                        attempts.map((attempt) {
                          final paper = controller.paperById(attempt.paperId);
                          final course =
                              paper == null
                                  ? null
                                  : controller.courseById(paper.courseId);
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _AttemptSummaryTile(
                              attempt: attempt,
                              paper: paper,
                              course: course,
                              student: student,
                            ),
                          );
                        }).toList(),
                  ),
        ),
        if (conceptProgress.isNotEmpty) ...[
          const SizedBox(height: 18),
          _StudentPanel(
            title: 'Concept growth',
            subtitle:
                'A chapter-by-chapter view of what is becoming consistent and what still needs deliberate practice.',
            child: Column(
              children:
                  conceptProgress
                      .take(8)
                      .map(
                        (item) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _ConceptInsightTile(item: item),
                        ),
                      )
                      .toList(),
            ),
          ),
        ],
        const SizedBox(height: 18),
        _StudentPanel(
          title: 'Payment history',
          subtitle:
              'All receipts stay available here whenever you need to review or download them.',
          child:
              purchases.isEmpty
                  ? const _StudentEmptyState(
                    icon: Icons.receipt_long_outlined,
                    title: 'No payments yet',
                    message:
                        'Your receipt history will appear here after the first course purchase.',
                  )
                  : Column(
                    children:
                        purchases.map((purchase) {
                          final course = controller.courseById(
                            purchase.courseId,
                          );
                          if (course == null) return const SizedBox.shrink();
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _StudentActionCard(
                              icon: Icons.account_balance_wallet_outlined,
                              title:
                                  '${course.title} • Rs ${purchase.amount.toStringAsFixed(0)}',
                              subtitle:
                                  purchase.paymentId == null
                                      ? 'Receipt ${purchase.receiptNumber}'
                                      : 'Receipt ${purchase.receiptNumber} • ${purchase.paymentId}',
                              trailingLabel: DateFormat(
                                'dd MMM',
                              ).format(purchase.purchasedAt),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder:
                                        (_) => ReceiptPage(
                                          purchase: purchase,
                                          course: course,
                                          student: student,
                                        ),
                                  ),
                                );
                              },
                            ),
                          );
                        }).toList(),
                  ),
        ),
      ],
    );
  }
}

class StudentSupportPage extends StatefulWidget {
  const StudentSupportPage({super.key});

  @override
  State<StudentSupportPage> createState() => _StudentSupportPageState();
}

class _StudentSupportPageState extends State<StudentSupportPage> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  int _lastMessageCount = 0;

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final messageCount = app.supportMessages.length;
    if (messageCount != _lastMessageCount) {
      _lastMessageCount = messageCount;
      _scrollToBottom();
    }
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: _StudentPanel(
            title: 'Student support',
            subtitle:
                'Reach us for help with your account, payments, or exam access.',
            child: const Row(
              children: [
                Icon(Icons.mail_outline_rounded),
                SizedBox(width: 12),
                Expanded(
                  child: Text('Reach us directly at info@meritlaunchers.com'),
                ),
              ],
            ),
          ),
        ),
        Expanded(
          child: ListView(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 18),
            children:
                app.supportMessages.map((message) {
                  final isStudent = message.sender == SenderRole.student;
                  return Align(
                    alignment:
                        isStudent
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      constraints: const BoxConstraints(maxWidth: 440),
                      decoration: BoxDecoration(
                        color: isStudent ? MeritTheme.secondary : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: MeritTheme.border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 18,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment:
                            isStudent
                                ? CrossAxisAlignment.end
                                : CrossAxisAlignment.start,
                        children: [
                          Text(
                            isStudent ? 'You' : 'Merit Launchers support',
                            style: Theme.of(
                              context,
                            ).textTheme.labelLarge?.copyWith(
                              color:
                                  isStudent
                                      ? Colors.white70
                                      : MeritTheme.secondaryMuted,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            message.message,
                            style: TextStyle(
                              color:
                                  isStudent
                                      ? Colors.white
                                      : MeritTheme.secondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    minLines: 1,
                    maxLines: 4,
                    maxLength: 2000,
                    decoration: const InputDecoration(
                      hintText:
                          'Ask about access, payments, results, or exam issues',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  height: 56,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final text = _controller.text.trim();
                      if (text.isEmpty) return;
                      try {
                        await app.addSupportMessage(SenderRole.student, text);
                        _controller.clear();
                      } catch (_) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Failed to send message. Please try again.',
                              ),
                            ),
                          );
                        }
                      }
                    },
                    icon: const Icon(Icons.send_rounded),
                    label: const Text('Send'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class ReceiptPage extends StatelessWidget {
  const ReceiptPage({
    super.key,
    required this.purchase,
    required this.course,
    required this.student,
  });

  final Purchase purchase;
  final Course course;
  final StudentProfile student;

  Future<void> _downloadReceipt(BuildContext context) async {
    final document = _buildReceiptDocument(
      purchase: purchase,
      course: course,
      student: student,
    );

    try {
      final bytes = await document.save();
      if (kIsWeb) {
        await Printing.sharePdf(
          bytes: bytes,
          filename: 'receipt_${purchase.receiptNumber}.pdf',
        );
      } else {
        await Printing.layoutPdf(onLayout: (_) async => bytes);
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not generate PDF. Please try again.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Receipt')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFF7FBFD), Colors.white],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: MeritTheme.border),
            ),
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Merit Launchers',
                              style: Theme.of(context).textTheme.headlineSmall,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Course access invoice',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 9,
                        ),
                        decoration: BoxDecoration(
                          color:
                              purchase.paymentId == null
                                  ? MeritTheme.primarySoft
                                  : const Color(0xFFE9F8F2),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          purchase.paymentId == null ? 'DEMO' : 'PAID',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: _ReceiptHighlightCard(
                          label: 'Amount paid',
                          value: 'Rs ${purchase.amount.toStringAsFixed(0)}',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _ReceiptHighlightCard(
                          label: 'Receipt number',
                          value: purchase.receiptNumber,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  _ReceiptRow(label: 'Student', value: student.name),
                  _ReceiptRow(label: 'Contact', value: student.contact),
                  _ReceiptRow(label: 'Course', value: course.title),
                  _ReceiptRow(
                    label: 'Purchased on',
                    value: DateFormat(
                      'dd MMM yyyy, hh:mm a',
                    ).format(purchase.purchasedAt),
                  ),
                  _ReceiptRow(
                    label: 'Validity',
                    value:
                        purchase.validUntil == null
                            ? '1 year from purchase'
                            : DateFormat(
                              'dd MMM yyyy',
                            ).format(purchase.validUntil!),
                  ),
                  _ReceiptRow(
                    label: 'Payment provider',
                    value: purchase.paymentProvider,
                  ),
                  _ReceiptRow(
                    label: 'Payment ID',
                    value: purchase.paymentId ?? 'Demo payment',
                  ),
                  _ReceiptRow(
                    label: 'Order ID',
                    value: purchase.paymentOrderId ?? 'Demo order',
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _downloadReceipt(context),
                      icon: const Icon(Icons.download_rounded),
                      label: const Text('Download PDF receipt'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CourseVideoCard extends StatefulWidget {
  const CourseVideoCard({super.key, required this.videoUrl});

  final String? videoUrl;

  @override
  State<CourseVideoCard> createState() => _CourseVideoCardState();
}

class _CourseVideoCardState extends State<CourseVideoCard> {
  VideoPlayerController? _controller;
  bool _initializing = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  @override
  void didUpdateWidget(covariant CourseVideoCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoUrl != widget.videoUrl) {
      _disposeController();
      _initialize();
    }
  }

  Future<void> _initialize() async {
    final url = widget.videoUrl;
    if (url == null || url.trim().isEmpty) {
      return;
    }

    setState(() {
      _initializing = true;
      _error = null;
    });

    try {
      final controller = VideoPlayerController.networkUrl(Uri.parse(url));
      await controller.initialize();
      await controller.setLooping(false);
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() {
        _controller = controller;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = 'Video could not be loaded from the configured stream URL.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _initializing = false;
        });
      }
    }
  }

  Future<void> _disposeController() async {
    final controller = _controller;
    _controller = null;
    if (controller != null) {
      await controller.dispose();
    }
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.videoUrl == null || widget.videoUrl!.trim().isEmpty) {
      return _VideoPlaceholder(message: 'No course video uploaded yet.');
    }

    if (_initializing) {
      return const _VideoPlaceholder(
        message: 'Loading course video...',
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null ||
        _controller == null ||
        !_controller!.value.isInitialized) {
      return _VideoPlaceholder(message: _error ?? 'Video is not available.');
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: _controller!.value.aspectRatio,
            child: VideoPlayer(_controller!),
          ),
          Container(
            color: MeritTheme.secondary,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                IconButton(
                  onPressed: () {
                    setState(() {
                      if (_controller!.value.isPlaying) {
                        _controller!.pause();
                      } else {
                        _controller!.play();
                      }
                    });
                  },
                  icon: Icon(
                    _controller!.value.isPlaying
                        ? Icons.pause_circle_filled_rounded
                        : Icons.play_circle_fill_rounded,
                    color: Colors.white,
                  ),
                ),
                Expanded(
                  child: VideoProgressIndicator(
                    _controller!,
                    allowScrubbing: true,
                    colors: const VideoProgressColors(
                      playedColor: MeritTheme.primary,
                      backgroundColor: Colors.white24,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VideoPlaceholder extends StatelessWidget {
  const _VideoPlaceholder({required this.message, this.child});

  final String message;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Container(
        decoration: BoxDecoration(
          color: MeritTheme.primarySoft,
          borderRadius: BorderRadius.circular(22),
        ),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (child != null) child!,
                if (child != null) const SizedBox(height: 12),
                Text(message, textAlign: TextAlign.center),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StudentPanel extends StatelessWidget {
  const _StudentPanel({
    required this.title,
    required this.subtitle,
    required this.child,
    this.eyebrow,
    this.actionLabel,
    this.onActionTap,
  });

  final String title;
  final String subtitle;
  final Widget child;
  final String? eyebrow;
  final String? actionLabel;
  final VoidCallback? onActionTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFFFFF), Color(0xFFF9FBFE)],
        ),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF102544).withValues(alpha: 0.06),
            blurRadius: 30,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (eyebrow != null) ...[
                      Text(
                        eyebrow!,
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: MeritTheme.primary,
                          letterSpacing: 0.4,
                        ),
                      ),
                      const SizedBox(height: 6),
                    ],
                    Text(
                      title,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 6),
                    Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
              if (actionLabel != null) ...[
                const SizedBox(width: 16),
                TextButton.icon(
                  onPressed: onActionTap,
                  iconAlignment: IconAlignment.end,
                  icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                  label: Text(actionLabel!),
                ),
              ],
            ],
          ),
          const SizedBox(height: 18),
          child,
        ],
      ),
    );
  }
}

bool _isWideStudentLayout(BuildContext context) {
  return MediaQuery.sizeOf(context).width >= 1100;
}

class _StudentPageViewport extends StatelessWidget {
  const _StudentPageViewport({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final maxWidth =
        width >= 1400
            ? 1240.0
            : width >= 1100
            ? 1100.0
            : 760.0;
    final horizontalPadding = width >= 1100 ? 28.0 : 16.0;

    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
          child: child,
        ),
      ),
    );
  }
}

class _TopStatPill extends StatelessWidget {
  const _TopStatPill({
    required this.icon,
    required this.label,
    required this.value,
    this.dark = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: dark ? Colors.white.withValues(alpha: 0.1) : const Color(0xFFF7FAFD),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: dark ? Colors.white.withValues(alpha: 0.12) : MeritTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: dark ? Colors.white.withValues(alpha: 0.12) : MeritTheme.primarySoft,
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Icon(icon, size: 16, color: dark ? Colors.white : MeritTheme.primary),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    value,
                    style: Theme.of(
                      context,
                    ).textTheme.titleMedium?.copyWith(color: dark ? Colors.white : MeritTheme.secondary),
                  ),
                ),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    label,
                    maxLines: 1,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: dark ? Colors.white.withValues(alpha: 0.72) : MeritTheme.secondaryMuted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MobileHomeOverviewCard extends StatelessWidget {
  const _MobileHomeOverviewCard({
    required this.studentName,
    required this.activeCount,
    required this.purchaseCount,
    required this.pendingCount,
    required this.attemptsCount,
  });

  final String studentName;
  final int activeCount;
  final int purchaseCount;
  final int pendingCount;
  final int attemptsCount;

  @override
  Widget build(BuildContext context) {
    final firstName = studentName.trim().isEmpty
        ? 'Student'
        : studentName.trim().split(' ').first;
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A3154), Color(0xFF216398), Color(0xFF12B8F0)],
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF102544).withValues(alpha: 0.16),
            blurRadius: 28,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Student workspace',
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.white.withValues(alpha: 0.76),
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Welcome back, $firstName',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Resume pending tests, review active courses, and decide what to unlock next.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.82),
              height: 1.45,
            ),
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.55,
            children: [
              _MobileMetricTile(
                label: 'Active courses',
                value: '$activeCount',
                icon: Icons.workspace_premium_outlined,
                accent: MeritTheme.primary,
              ),
              _MobileMetricTile(
                label: 'Purchases',
                value: '$purchaseCount',
                icon: Icons.receipt_long_outlined,
                accent: MeritTheme.success,
              ),
              _MobileMetricTile(
                label: 'Pending tests',
                value: '$pendingCount',
                icon: Icons.play_circle_outline_rounded,
                accent: MeritTheme.accent,
              ),
              _MobileMetricTile(
                label: 'Attempts',
                value: '$attemptsCount',
                icon: Icons.auto_graph_rounded,
                accent: Colors.white,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MobileMetricTile extends StatelessWidget {
  const _MobileMetricTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.accent,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: accent == Colors.white ? Colors.white.withValues(alpha: 0.18) : accent.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Icon(
              icon,
              size: 18,
              color: accent == Colors.white ? Colors.white : accent,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w900,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.8),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _MobileFeaturedCourseCard extends StatelessWidget {
  const _MobileFeaturedCourseCard({required this.course});

  final Course course;

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final unlocked = controller.isCourseUnlocked(course.id);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => CourseDetailsPage(course: course),
            ),
          );
        },
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: MeritTheme.border),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFFFFFF), Color(0xFFF6FBFE)],
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: MeritTheme.primarySoft,
                  borderRadius: BorderRadius.circular(18),
                ),
                alignment: Alignment.center,
                child: Icon(
                  _iconForCourse(course.title),
                  color: MeritTheme.secondary,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      course.title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      course.subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: MeritTheme.secondaryMuted,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Text(
                          'Rs ${course.price.toStringAsFixed(0)}',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w900),
                        ),
                        const Spacer(),
                        Text(
                          unlocked ? 'Open now' : 'Preview + unlock',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: MeritTheme.primary,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroStatCard extends StatelessWidget {
  const _HeroStatCard({
    required this.title,
    required this.value,
    required this.accent,
  });

  final String title;
  final String value;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 14,
            height: 48,
            decoration: BoxDecoration(
              color: accent,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: 4),
                Text(value, style: Theme.of(context).textTheme.headlineSmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderMetricCard extends StatelessWidget {
  const _HeaderMetricCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F8FC),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: MeritTheme.primarySoft,
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Icon(icon, color: MeritTheme.primary, size: 18),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: MeritTheme.secondary,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: MeritTheme.secondaryMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StudentActionCard extends StatelessWidget {
  const _StudentActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.trailingLabel,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String? trailingLabel;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: MeritTheme.border),
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: MeritTheme.primarySoft,
                  borderRadius: BorderRadius.circular(16),
                ),
                alignment: Alignment.center,
                child: Icon(icon, color: MeritTheme.secondary),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              if (trailingLabel != null) ...[
                const SizedBox(width: 12),
                Text(
                  trailingLabel!,
                  style: Theme.of(
                    context,
                  ).textTheme.labelLarge?.copyWith(color: MeritTheme.primary),
                ),
              ],
              if (onTap != null) ...[
                const SizedBox(width: 8),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: MeritTheme.secondaryMuted,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StudentEmptyState extends StatelessWidget {
  const _StudentEmptyState({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF6FAFD), Color(0xFFEAF4FB)],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
            ),
            alignment: Alignment.center,
            child: Icon(icon, size: 28, color: MeritTheme.secondary),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(message, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

Future<void> _openAttemptReportDialog(
  BuildContext context, {
  required ExamAttempt attempt,
  required Paper paper,
  required Course course,
  required StudentProfile student,
}) {
  return showDialog<void>(
    context: context,
    builder:
        (_) => ResultDialog(
          attempt: attempt,
          paper: paper,
          course: course,
          student: student,
        ),
  );
}

class _HeroResultMetric extends StatelessWidget {
  const _HeroResultMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.white.withValues(alpha: 0.78),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _CourseFactPill extends StatelessWidget {
  const _CourseFactPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: MeritTheme.secondary),
          const SizedBox(width: 8),
          Text(label, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}

class _DarkInfoPill extends StatelessWidget {
  const _DarkInfoPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white24),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.white),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelLarge?.copyWith(color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _AttemptSummaryTile extends StatelessWidget {
  const _AttemptSummaryTile({
    required this.attempt,
    required this.paper,
    required this.course,
    required this.student,
  });

  final ExamAttempt attempt;
  final Paper? paper;
  final Course? course;
  final StudentProfile student;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap:
            paper == null || course == null
                ? null
                : () => _openAttemptReportDialog(
                  context,
                  attempt: attempt,
                  paper: paper!,
                  course: course!,
                  student: student,
                ),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: MeritTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      paper?.title ?? 'Paper ${attempt.paperId}',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  Text(
                    'Report',
                    style: Theme.of(
                      context,
                    ).textTheme.labelLarge?.copyWith(color: MeritTheme.primary),
                  ),
                  const SizedBox(width: 6),
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: MeritTheme.secondaryMuted,
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                course?.title ?? 'Course',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _MetaChip(
                    label: 'Score ${attempt.score}/${attempt.maxScore}',
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      DateFormat(
                        'dd MMM yyyy, hh:mm a',
                      ).format(attempt.submittedAt),
                      textAlign: TextAlign.right,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReceiptHighlightCard extends StatelessWidget {
  const _ReceiptHighlightCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MeritTheme.primarySoft,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 6),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  const _ReceiptRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 4),
          Text(value),
        ],
      ),
    );
  }
}

class _ResultStatCard extends StatelessWidget {
  const _ResultStatCard({
    required this.label,
    required this.value,
    this.accent = MeritTheme.secondary,
  });

  final String label;
  final String value;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: MeritTheme.border),
        boxShadow: [
          BoxShadow(
            color: accent.withValues(alpha: 0.08),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 6,
            decoration: BoxDecoration(
              color: accent,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(color: accent),
          ),
          const SizedBox(height: 4),
          Text(label),
        ],
      ),
    );
  }
}

class _SectionScoreTile extends StatelessWidget {
  const _SectionScoreTile({
    required this.label,
    required this.value,
    required this.maxValue,
  });

  final String label;
  final int value;
  final int maxValue;

  @override
  Widget build(BuildContext context) {
    final normalized =
        maxValue <= 0 ? 0.0 : (value / maxValue).clamp(0.0, 1.0).toDouble();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
              Text('$value/$maxValue'),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: normalized,
              minHeight: 8,
              backgroundColor: MeritTheme.primarySoft,
              color: value < 0 ? Colors.red.shade400 : MeritTheme.secondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _ConceptPerformance {
  const _ConceptPerformance({
    required this.label,
    required this.attempted,
    required this.correct,
    required this.wrong,
    required this.scoreDelta,
  });

  final String label;
  final int attempted;
  final int correct;
  final int wrong;
  final int scoreDelta;

  double get accuracy => attempted == 0 ? 0 : correct / attempted;
}

class _ConceptInsightTile extends StatelessWidget {
  const _ConceptInsightTile({required this.item});

  final _ConceptPerformance item;

  @override
  Widget build(BuildContext context) {
    final progressColor =
        item.wrong == 0
            ? MeritTheme.success
            : item.accuracy >= 0.6
            ? MeritTheme.primary
            : Colors.orange.shade700;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.label,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              _MetaChip(label: '${(item.accuracy * 100).round()}% accurate'),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: item.accuracy,
              minHeight: 8,
              backgroundColor: MeritTheme.primarySoft,
              color: progressColor,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            '${item.correct} correct • ${item.wrong} incorrect • score delta ${item.scoreDelta >= 0 ? '+' : ''}${item.scoreDelta}',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

List<_ConceptPerformance> _conceptPerformanceForPaper(
  Paper paper,
  ExamAttempt attempt,
) {
  final aggregates = <String, _MutableConceptPerformance>{};
  for (final question in paper.questions) {
    final selected = attempt.answers[question.id];
    final wasAttempted = selected != null;
    final isCorrect = wasAttempted && selected == question.correctIndex;
    final delta =
        wasAttempted
            ? (isCorrect ? question.marks : -question.negativeMarks)
            : 0;
    final labels = <String>{
      if ((question.topic ?? '').trim().isNotEmpty) question.topic!.trim(),
      ...question.concepts
          .where((item) => item.trim().isNotEmpty)
          .map((item) => item.trim()),
      if ((question.section).trim().isNotEmpty) question.section.trim(),
    };

    for (final label in labels.take(4)) {
      final bucket = aggregates.putIfAbsent(
        label,
        () => _MutableConceptPerformance(label),
      );
      if (wasAttempted) {
        bucket.attempted += 1;
        if (isCorrect) {
          bucket.correct += 1;
        } else {
          bucket.wrong += 1;
        }
      }
      bucket.scoreDelta += delta;
    }
  }

  final items =
      aggregates.values
          .map((item) => item.freeze())
          .where((item) => item.attempted > 0)
          .toList();
  items.sort((a, b) {
    final strengthCompare = b.wrong.compareTo(a.wrong);
    if (strengthCompare != 0) {
      return strengthCompare;
    }
    return a.label.compareTo(b.label);
  });
  return items;
}

List<_ConceptPerformance> _aggregateConceptProgress(
  List<ExamAttempt> attempts,
  List<Paper> papers,
) {
  final papersById = {for (final paper in papers) paper.id: paper};
  final combined = <String, _MutableConceptPerformance>{};
  for (final attempt in attempts) {
    final paper = papersById[attempt.paperId];
    if (paper == null) {
      continue;
    }
    for (final item in _conceptPerformanceForPaper(paper, attempt)) {
      final bucket = combined.putIfAbsent(
        item.label,
        () => _MutableConceptPerformance(item.label),
      );
      bucket.attempted += item.attempted;
      bucket.correct += item.correct;
      bucket.wrong += item.wrong;
      bucket.scoreDelta += item.scoreDelta;
    }
  }

  final items =
      combined.values
          .map((item) => item.freeze())
          .where((item) => item.attempted > 0)
          .toList();
  items.sort((a, b) {
    final attemptCompare = b.attempted.compareTo(a.attempted);
    if (attemptCompare != 0) {
      return attemptCompare;
    }
    final accuracyCompare = a.accuracy.compareTo(b.accuracy);
    if (accuracyCompare != 0) {
      return accuracyCompare;
    }
    return a.label.compareTo(b.label);
  });
  return items;
}

String _buildMentorSummary({
  required Course course,
  required Paper paper,
  required ExamAttempt attempt,
  required int correctAnswers,
  required int skippedAnswers,
  required List<_ConceptPerformance> strongConcepts,
  required List<_ConceptPerformance> focusConcepts,
}) {
  final scorePercent =
      attempt.maxScore == 0
          ? 0
          : ((attempt.score / attempt.maxScore) * 100).round();
  final tone =
      scorePercent >= 70
          ? 'Strong attempt.'
          : scorePercent >= 45
          ? 'Solid base, but there is room to convert more marks.'
          : 'This paper exposed a few gaps, which is useful while you still have time to fix them.';
  final strengths =
      strongConcepts.isEmpty
          ? ''
          : ' You looked comfortable in ${strongConcepts.map((item) => item.label).join(', ')}.';
  final focus =
      focusConcepts.isEmpty
          ? (skippedAnswers > 0
              ? ' The main gain now is reducing skipped questions.'
              : '')
          : ' Focus next on ${focusConcepts.map((item) => item.label).join(', ')}.';
  return '$tone In ${course.title} - ${paper.title}, you got $correctAnswers correct and left $skippedAnswers unanswered.$strengths$focus';
}

class _MutableConceptPerformance {
  _MutableConceptPerformance(this.label);

  final String label;
  int attempted = 0;
  int correct = 0;
  int wrong = 0;
  int scoreDelta = 0;

  _ConceptPerformance freeze() {
    return _ConceptPerformance(
      label: label,
      attempted: attempted,
      correct: correct,
      wrong: wrong,
      scoreDelta: scoreDelta,
    );
  }
}

String _formatClock(Duration duration) {
  final hours = duration.inHours.toString().padLeft(2, '0');
  final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
  final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
  return '$hours:$minutes:$seconds';
}

String _initialsForName(String value) {
  final parts =
      value
          .trim()
          .split(RegExp(r'\s+'))
          .where((part) => part.isNotEmpty)
          .toList();
  if (parts.isEmpty) {
    return 'S';
  }
  final first = parts.first.substring(0, 1).toUpperCase();
  final second =
      parts.length > 1 ? parts.last.substring(0, 1).toUpperCase() : '';
  return '$first$second';
}

String _formatCoursePrice(double value) {
  if (value <= 0) {
    return 'Free';
  }
  if (value == value.roundToDouble()) {
    return 'Rs ${value.toStringAsFixed(0)}';
  }
  return 'Rs ${value.toStringAsFixed(2)}';
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: MeritTheme.primarySoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label, style: Theme.of(context).textTheme.labelLarge),
    );
  }
}

pw.Document _buildReceiptDocument({
  required Purchase purchase,
  required Course course,
  required StudentProfile student,
}) {
  final document = pw.Document();
  document.addPage(
    pw.Page(
      margin: const pw.EdgeInsets.all(28),
      build: (context) {
        return pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Container(
              padding: const pw.EdgeInsets.all(20),
              decoration: pw.BoxDecoration(
                gradient: const pw.LinearGradient(
                  colors: [
                    pdf.PdfColor.fromInt(0xFF163A6A),
                    pdf.PdfColor.fromInt(0xFF2C82D1),
                  ],
                ),
                borderRadius: pw.BorderRadius.circular(24),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Merit Launchers',
                        style: pw.TextStyle(
                          fontSize: 24,
                          fontWeight: pw.FontWeight.bold,
                          color: pdf.PdfColors.white,
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        'Course access receipt',
                        style: pw.TextStyle(
                          fontSize: 11,
                          color: pdf.PdfColors.white,
                        ),
                      ),
                    ],
                  ),
                  pw.Container(
                    padding: const pw.EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: pw.BoxDecoration(
                      color: pdf.PdfColors.white,
                      borderRadius: pw.BorderRadius.circular(999),
                    ),
                    child: pw.Text(
                      'PAID',
                      style: pw.TextStyle(
                        fontSize: 10,
                        fontWeight: pw.FontWeight.bold,
                        color: pdf.PdfColors.green800,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 18),
            pw.Row(
              children: [
                _pdfMetricCard(
                  label: 'Amount paid',
                  value: 'Rs ${purchase.amount.toStringAsFixed(0)}',
                  accent: pdf.PdfColors.green700,
                ),
                pw.SizedBox(width: 12),
                _pdfMetricCard(
                  label: 'Receipt no.',
                  value: purchase.receiptNumber,
                  accent: pdf.PdfColors.blue700,
                ),
                pw.SizedBox(width: 12),
                _pdfMetricCard(
                  label: 'Provider',
                  value: purchase.paymentProvider,
                  accent: pdf.PdfColors.indigo700,
                ),
              ],
            ),
            pw.SizedBox(height: 18),
            pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Expanded(
                  child: _pdfReceiptPanel(
                    title: 'Student details',
                    lines: [
                      'Name: ${student.name}',
                      'Contact: ${student.contact}',
                      'Student ID: ${student.id}',
                    ],
                  ),
                ),
                pw.SizedBox(width: 14),
                pw.Expanded(
                  child: _pdfReceiptPanel(
                    title: 'Purchase details',
                    lines: [
                      'Course: ${course.title}',
                      'Purchased on: ${DateFormat('dd MMM yyyy, hh:mm a').format(purchase.purchasedAt)}',
                      'Validity: ${purchase.validUntil == null ? '1 year from purchase' : DateFormat('dd MMM yyyy').format(purchase.validUntil!)}',
                    ],
                  ),
                ),
              ],
            ),
            pw.SizedBox(height: 18),
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.all(18),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: pdf.PdfColors.grey300),
                borderRadius: pw.BorderRadius.circular(18),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'Payment ledger',
                    style: pw.TextStyle(
                      fontSize: 13,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 12),
                  _pdfKeyValueRow(
                    'Payment ID',
                    purchase.paymentId ?? 'Demo payment',
                  ),
                  _pdfKeyValueRow(
                    'Order ID',
                    purchase.paymentOrderId ?? 'Demo order',
                  ),
                  _pdfKeyValueRow(
                    'Access type',
                    course.price <= 0 ? 'Free preview course' : 'Paid course',
                  ),
                  _pdfKeyValueRow('Status', 'Access unlocked successfully'),
                ],
              ),
            ),
            pw.SizedBox(height: 18),
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.all(16),
              decoration: pw.BoxDecoration(
                color: pdf.PdfColors.blue50,
                borderRadius: pw.BorderRadius.circular(16),
              ),
              child: pw.Text(
                'Keep this receipt for your records. It can be used to verify purchase details, access history, and payment references for any support request.',
                style: const pw.TextStyle(fontSize: 10.5, lineSpacing: 2),
              ),
            ),
          ],
        );
      },
    ),
  );
  return document;
}

pw.Widget _pdfReceiptPanel({
  required String title,
  required List<String> lines,
}) {
  return pw.Container(
    padding: const pw.EdgeInsets.all(16),
    decoration: pw.BoxDecoration(
      color: pdf.PdfColors.grey50,
      borderRadius: pw.BorderRadius.circular(18),
      border: pw.Border.all(color: pdf.PdfColors.grey300),
    ),
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          title,
          style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold),
        ),
        pw.SizedBox(height: 10),
        ...lines.map(
          (line) => pw.Padding(
            padding: const pw.EdgeInsets.only(bottom: 6),
            child: pw.Text(line, style: const pw.TextStyle(fontSize: 10.5)),
          ),
        ),
      ],
    ),
  );
}

pw.Widget _pdfKeyValueRow(String label, String value) {
  return pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 8),
    child: pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.SizedBox(
          width: 92,
          child: pw.Text(
            label,
            style: pw.TextStyle(
              fontSize: 10.5,
              color: pdf.PdfColors.blueGrey700,
            ),
          ),
        ),
        pw.Expanded(
          child: pw.Text(
            value,
            style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold),
          ),
        ),
      ],
    ),
  );
}
