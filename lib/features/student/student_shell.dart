import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:video_player/video_player.dart';

import '../../app/app.dart';
import '../../app/models.dart';
import '../../app/payments/payment_gateway.dart';
import '../../app/payments/payment_models.dart';
import '../../app/theme.dart';
import '../../widgets/rich_math_content.dart';

class StudentShell extends StatefulWidget {
  const StudentShell({super.key});

  @override
  State<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends State<StudentShell> with WidgetsBindingObserver {
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
    final pages = [
      const StudentHomePage(),
      const StudentSupportPage(),
      const StudentProfilePage(),
      const StudentLibraryPage(),
    ];

    return Scaffold(
      key: _scaffoldKey,
      drawer: const _StudentMenuDrawer(),
      appBar: AppBar(
        backgroundColor: MeritTheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          icon: const Icon(Icons.menu_rounded),
        ),
        titleSpacing: 4,
        title: const Text('Meritlaunchers'),
        actions: [
          IconButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notifications will appear here.')),
              );
            },
            icon: const Icon(Icons.notifications_none_rounded),
          ),
        ],
      ),
      body: IndexedStack(
        index: controller.studentTabIndex,
        children: pages,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: controller.studentTabIndex,
        onDestinationSelected: controller.setStudentTab,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.support_agent_outlined), label: 'Support'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
          NavigationDestination(icon: Icon(Icons.library_books_outlined), label: 'Library'),
        ],
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
    final purchasedCourses = controller
        .purchasesForStudent(controller.currentStudent.id)
        .map((purchase) => controller.courseById(purchase.courseId))
        .whereType<Course>()
        .toList();
    final featuredCourses = controller.courses.take(6).toList();
    final promoCourses = controller.courses.where((course) => !controller.isCourseUnlocked(course.id)).toList();

    return RefreshIndicator(
      onRefresh: controller.refreshContent,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(0, 0, 0, 120),
        children: [
          _StudentHeroBanner(studentName: controller.currentStudent.name),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
            child: _SectionHeader(
              title: 'Purchased Courses',
              actionLabel: purchasedCourses.isEmpty ? null : 'See all',
              onActionTap: purchasedCourses.isEmpty ? null : () => controller.setStudentTab(3),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: purchasedCourses.isEmpty
                ? const _EmptyPurchasedCoursesCard()
                : Column(
                    children: purchasedCourses
                        .map((course) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _PurchasedCourseTile(course: course),
                            ))
                        .toList(),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
            child: Text(
              'What are you looking for?',
              style: theme.textTheme.headlineSmall?.copyWith(fontSize: 20),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: featuredCourses.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                childAspectRatio: 1.08,
              ),
              itemBuilder: (context, index) => _CategoryCourseCard(course: featuredCourses[index]),
            ),
          ),
          if (promoCourses.isNotEmpty) ...[
            const SizedBox(height: 20),
            _PromoCarousel(courses: promoCourses),
          ],
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

    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: MeritTheme.primarySoft,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.person_outline_rounded, size: 36, color: MeritTheme.secondary),
                  ),
                  const SizedBox(height: 16),
                  Text(student.name, style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 6),
                  Text(student.contact, style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 6),
                  Text(
                    'Referral code: ${student.referralCode ?? 'Not set'}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _DrawerItem(
                    icon: Icons.home_outlined,
                    label: 'Home',
                    onTap: () {
                      Navigator.pop(context);
                      controller.setStudentTab(0);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.support_agent_outlined,
                    label: 'Support chat',
                    onTap: () {
                      Navigator.pop(context);
                      controller.setStudentTab(1);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.person_outline_rounded,
                    label: 'Profile',
                    onTap: () {
                      Navigator.pop(context);
                      controller.setStudentTab(2);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.receipt_long_outlined,
                    label: 'Payments and receipts',
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
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: controller.logout,
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Sign out'),
                ),
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
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: MeritTheme.secondary),
      title: Text(label),
      onTap: onTap,
    );
  }
}

class _StudentHeroBanner extends StatelessWidget {
  const _StudentHeroBanner({required this.studentName});

  final String studentName;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 340,
      margin: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFF6F7F2),
            Color(0xFFFFFFFF),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            top: -18,
            left: -8,
            right: -8,
            child: SizedBox(
              height: 110,
              child: CustomPaint(
                painter: _LeafBorderPainter(),
              ),
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
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome back, ${studentName.split(' ').first}',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Test yourself to become your best self.',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(fontSize: 26),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Open free papers, continue purchased courses, and keep your preparation moving every day.',
                    style: Theme.of(context).textTheme.bodyMedium,
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
          child: Text(title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontSize: 20)),
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
      child: const Text('No purchased courses yet. Unlock a course below and it will appear here.'),
    );
  }
}

class _PurchasedCourseTile extends StatelessWidget {
  const _PurchasedCourseTile({required this.course});

  final Course course;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => CourseDetailsPage(course: course)),
          );
        },
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: MeritTheme.border),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: Container(
                  width: 92,
                  height: 92,
                  color: MeritTheme.primarySoft,
                  padding: const EdgeInsets.all(12),
                  child: Image.asset('assets/branding/logo.png', fit: BoxFit.contain),
                ),
              ),
              const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(course.title.toUpperCase(), style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 8),
                      Text(course.subtitle, style: Theme.of(context).textTheme.bodyMedium),
                      const SizedBox(height: 14),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: SizedBox(
                          width: 170,
                          child: ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(builder: (_) => CourseDetailsPage(course: course)),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: MeritTheme.primary,
                            minimumSize: const Size.fromHeight(46),
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                            child: const FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text('Start Learning'),
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
            MaterialPageRoute<void>(builder: (_) => CourseDetailsPage(course: course)),
          );
        },
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFFD9F9E3),
                Color(0xFFAED2FF),
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 18,
                offset: const Offset(0, 10),
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
                        unlocked ? Icons.lock_open_rounded : Icons.auto_stories_rounded,
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
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PromoCarousel extends StatefulWidget {
  const _PromoCarousel({required this.courses});

  final List<Course> courses;

  @override
  State<_PromoCarousel> createState() => _PromoCarouselState();
}

class _PromoCarouselState extends State<_PromoCarousel> {
  late final PageController _pageController;
  int _activeIndex = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.88);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 22),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFF32215C),
            Color(0xFF5B33A3),
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'You are almost there!',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: Colors.white),
          ),
          const SizedBox(height: 4),
          const Text(
            'Buy your course now and start your preparation.',
            style: TextStyle(color: Colors.white70),
          ),
            const SizedBox(height: 18),
            SizedBox(
              height: 290,
              child: PageView.builder(
                controller: _pageController,
                itemCount: widget.courses.length,
              onPageChanged: (index) => setState(() => _activeIndex = index),
              itemBuilder: (context, index) => Padding(
                padding: const EdgeInsets.only(right: 12),
                child: _PromoCourseCard(course: widget.courses[index]),
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
                  color: index == _activeIndex ? MeritTheme.secondary : Colors.white70,
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
  const _PromoCourseCard({required this.course});

  final Course course;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
      ),
        child: Column(
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
                    child: Image.asset('assets/branding/logo.png', fit: BoxFit.contain),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: course.highlights
                        .take(2)
                        .map((item) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                              color: const Color(0xFFF3F5F8),
                              child: Text(
                                item.toUpperCase(),
                                style: Theme.of(context).textTheme.bodySmall,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ))
                        .toList(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              course.title.toUpperCase(),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontSize: 18),
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
                    MaterialPageRoute<void>(builder: (_) => CourseDetailsPage(course: course)),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: MeritTheme.primary,
                  minimumSize: const Size.fromHeight(48),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text('Buy Now'),
                ),
              ),
            ),
          ],
        ),
    );
  }
}

class _LeafBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..color = const Color(0xFFBFD4BA)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    final fill = Paint()
      ..color = const Color(0xFFDCEAD7);

    void drawStem(double x, bool flip) {
      final path = Path()
        ..moveTo(x, 0)
        ..quadraticBezierTo(x + (flip ? -8 : 8), 24, x + (flip ? -18 : 18), 54)
        ..quadraticBezierTo(x + (flip ? -24 : 24), 72, x + (flip ? -30 : 30), 96);
      canvas.drawPath(path, stroke);

      for (var i = 0; i < 4; i++) {
        final y = 18.0 + (i * 18);
        final leaf = Path();
        final direction = (i.isEven ? 1 : -1) * (flip ? -1 : 1);
        leaf.moveTo(x + (direction * 2), y);
        leaf.quadraticBezierTo(x + (direction * 14), y - 6, x + (direction * 18), y + 8);
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
  if (normalized.contains('pyp')) return Icons.keyboard_double_arrow_left_rounded;
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
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: MeritTheme.primarySoft,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(course.heroLabel),
                ),
                const Spacer(),
                Icon(
                  unlocked ? Icons.lock_open_rounded : Icons.lock_outline_rounded,
                  color: unlocked ? MeritTheme.success : MeritTheme.secondaryMuted,
                  size: 20,
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(course.title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            Text(course.subtitle, style: Theme.of(context).textTheme.bodyMedium),
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

class CourseDetailsPage extends StatelessWidget {
  const CourseDetailsPage({super.key, required this.course});

  final Course course;

  Future<void> _startPayment(BuildContext context) async {
    final controller = AppScope.of(context);
    final backend = AppScope.backendOf(context);
    final messenger = ScaffoldMessenger.of(context);

    messenger.showSnackBar(
      const SnackBar(content: Text('Creating order and opening checkout...')),
    );

    final result = await PaymentGateway(backend).payForCourse(
      course: course,
      student: controller.currentStudent,
    );

    if (!context.mounted) {
      return;
    }

    switch (result.status) {
      case PaymentResultStatus.success:
        await controller.purchaseCourse(
          course,
          paymentId: result.paymentId,
          paymentOrderId: result.orderId,
          paymentSignature: result.signature,
          verifiedPurchase: result.purchase,
        );
        messenger.showSnackBar(
          SnackBar(
            content: Text(
              '${course.title} unlocked. Payment ${result.paymentId ?? ''} verified successfully.',
            ),
          ),
        );
      case PaymentResultStatus.cancelled:
      case PaymentResultStatus.unsupported:
      case PaymentResultStatus.failed:
        messenger.showSnackBar(
          SnackBar(content: Text(result.message ?? 'Unable to complete payment.')),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final unlocked = controller.isCourseUnlocked(course.id);
    final visiblePapers = controller.accessiblePapersForCourse(course.id);
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
                            _MetaChip(label: course.heroLabel),
                            const SizedBox(height: 12),
                            Text(course.title, style: theme.textTheme.headlineMedium),
                            const SizedBox(height: 8),
                            Text(course.subtitle, style: theme.textTheme.titleMedium),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: unlocked ? const Color(0xFFE9F8F2) : Colors.white,
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
                              'Rs ${course.price.toStringAsFixed(0)}',
                              style: theme.textTheme.titleLarge,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Text(course.description),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      _CourseFactPill(icon: Icons.library_books_outlined, label: '${visiblePapers.length} papers'),
                      _CourseFactPill(icon: Icons.calendar_month_outlined, label: '${course.validityDays} days access'),
                      _CourseFactPill(
                        icon: unlocked ? Icons.lock_open_rounded : Icons.lock_outline_rounded,
                        label: unlocked ? 'Unlocked' : 'Locked',
                      ),
                    ],
                  ),
                  if (course.highlights.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text('Included in this course', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: course.highlights.map((highlight) => _MetaChip(label: highlight)).toList(),
                    ),
                  ],
                  if (!unlocked) ...[
                    const SizedBox(height: 22),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _startPayment(context),
                        icon: const Icon(Icons.workspace_premium_outlined),
                        label: Text('Unlock for Rs ${course.price.toStringAsFixed(0)}'),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (course.introVideoUrl != null && course.introVideoUrl!.trim().isNotEmpty) ...[
            const SizedBox(height: 18),
            _StudentPanel(
              title: 'Course video',
              subtitle: 'Stream the latest lesson or orientation video directly in the app.',
              child: CourseVideoCard(videoUrl: course.introVideoUrl),
            ),
          ],
          const SizedBox(height: 18),
          _StudentPanel(
            title: 'Available papers',
            subtitle: 'Move between free previews and premium tests without leaving the course.',
            child: Column(
              children: visiblePapers
                  .map(
                    (paper) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _StudentActionCard(
                        icon: paper.isFreePreview ? Icons.auto_stories_outlined : Icons.quiz_outlined,
                        title: paper.title,
                        subtitle:
                            '${paper.durationMinutes} min • ${paper.questions.length} questions${paper.isFreePreview ? ' • Free preview' : ''}',
                        trailingLabel: 'Open',
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => ExamIntroPage(course: course, paper: paper),
                            ),
                          );
                        },
                      ),
                    ),
                  )
                  .toList(),
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
    final theme = Theme.of(context);
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
                Text('Ready when you are', style: theme.textTheme.titleMedium?.copyWith(color: Colors.white70)),
                const SizedBox(height: 8),
                Text(
                  paper.title,
                  style: theme.textTheme.headlineMedium?.copyWith(color: Colors.white),
                ),
                const SizedBox(height: 8),
                Text(
                  course.title,
                  style: theme.textTheme.bodyLarge?.copyWith(color: Colors.white70),
                ),
                const SizedBox(height: 18),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _DarkInfoPill(icon: Icons.schedule_outlined, label: '${paper.durationMinutes} min'),
                    _DarkInfoPill(icon: Icons.ballot_outlined, label: '${paper.questions.length} questions'),
                    _DarkInfoPill(icon: Icons.trending_up_outlined, label: '+3 / -1 marking'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          _StudentPanel(
            title: 'Before you begin',
            subtitle: 'A calm start reduces mistakes. Review these once, then start in one tap.',
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
                          child: const Icon(Icons.check_rounded, size: 14, color: MeritTheme.secondary),
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
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => ExamPlayerPage(course: course, paper: paper),
                        ),
                      );
                    },
                    icon: const Icon(Icons.play_arrow_rounded),
                    label: const Text('Start exam'),
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
  const ExamPlayerPage({super.key, required this.course, required this.paper});

  final Course course;
  final Paper paper;

  @override
  State<ExamPlayerPage> createState() => _ExamPlayerPageState();
}

class _ExamPlayerPageState extends State<ExamPlayerPage> {
  late int _remainingSeconds;
  late Timer _timer;
  final Map<String, int> _answers = {};
  int _currentIndex = 0;
  bool _submitted = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.paper.durationMinutes * 60;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds == 0) {
        _submit();
      } else {
        setState(() {
          _remainingSeconds--;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  Future<bool> _confirmExit() async {
    if (_submitted) {
      return true;
    }
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Exit ongoing exam?'),
            content: const Text(
              'The timer is running. If you leave now, this attempt will be lost.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Stay'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Exit'),
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
        builder: (context) => ResultDialog(
          attempt: attempt,
          paper: widget.paper,
          course: widget.course,
          student: controller.currentStudent,
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _submitting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to submit exam: $error')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final question = widget.paper.questions[_currentIndex];
    final progress = (_currentIndex + 1) / widget.paper.questions.length;
    final time = Duration(seconds: _remainingSeconds);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        final shouldExit = !didPop && await _confirmExit();
        if (!context.mounted) {
          return;
        }
        if (shouldExit) {
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
              Text('Question ${_currentIndex + 1} of ${widget.paper.questions.length}'),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: _MetaChip(label: question.section),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView(
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: RichMathContentView(
                          rawText: question.prompt,
                          segments: question.promptSegments,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...List.generate(question.options.length, (index) {
                      final selected = _answers[question.id] == index;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(20),
                          onTap: () {
                            setState(() {
                              _answers[question.id] = index;
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: selected ? MeritTheme.primarySoft : Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: selected ? MeritTheme.primary : MeritTheme.border,
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: selected
                                      ? MeritTheme.secondary
                                      : MeritTheme.primarySoft,
                                  foregroundColor: selected
                                      ? Colors.white
                                      : MeritTheme.secondary,
                                  child: Text(String.fromCharCode(65 + index)),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: RichMathContentView(
                                    rawText: question.options[index],
                                    segments: question.optionSegments?[index],
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
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _currentIndex == 0
                              ? null
                              : () => setState(() => _currentIndex--),
                          child: const Text('Previous'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _submitting
                              ? null
                              : _currentIndex == widget.paper.questions.length - 1
                                  ? _submit
                                  : () => setState(() => _currentIndex++),
                          child: Text(
                            _submitting
                                ? 'Submitting...'
                                : _currentIndex == widget.paper.questions.length - 1
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

  Future<void> _printReport() async {
    final document = pw.Document();
    document.addPage(
      pw.Page(
        build: (context) {
          return pw.Padding(
            padding: const pw.EdgeInsets.all(24),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  'Merit Launchers',
                  style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
                ),
                pw.SizedBox(height: 8),
                pw.Text('${course.title} - ${paper.title}'),
                pw.SizedBox(height: 8),
                pw.Text('Score: ${attempt.score} / ${attempt.maxScore}'),
                pw.Text(
                  'Submitted: ${DateFormat('dd MMM yyyy, hh:mm a').format(attempt.submittedAt)}',
                ),
                pw.Text('Student: ${student.name}'),
                pw.SizedBox(height: 16),
                pw.Text(
                  'Section scores',
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                ),
                pw.SizedBox(height: 8),
                ...attempt.sectionScores.entries.map(
                  (entry) => pw.Text('${entry.key}: ${entry.value}'),
                ),
              ],
            ),
          );
        },
      ),
    );

    await Printing.layoutPdf(onLayout: (format) => document.save());
  }

  @override
  Widget build(BuildContext context) {
    final percentage = attempt.maxScore == 0
        ? 0.0
        : (attempt.score / attempt.maxScore).clamp(0.0, 1.0).toDouble();
    final attemptedCount = attempt.answers.length;
    final correctAnswers = attempt.answers.entries.where((entry) {
      final question = paper.questions.firstWhere(
        (question) => question.id == entry.key,
        orElse: () => paper.questions.first,
      );
      return entry.value == question.correctIndex;
    }).length;

    return AlertDialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
      titlePadding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
      contentPadding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
      actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      title: const Text('Exam submitted'),
      content: SizedBox(
        width: 440,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFE9F7FC), Color(0xFFF7FBFD)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: MeritTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${course.title} • ${paper.title}'),
                    const SizedBox(height: 10),
                    Text('${attempt.score} / ${attempt.maxScore}', style: Theme.of(context).textTheme.displaySmall),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: percentage,
                        minHeight: 12,
                        backgroundColor: Colors.white,
                        color: MeritTheme.secondary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text('${(percentage * 100).round()}% overall score'),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _ResultStatCard(label: 'Attempted', value: '$attemptedCount/${paper.questions.length}')),
                  const SizedBox(width: 12),
                  Expanded(child: _ResultStatCard(label: 'Correct', value: '$correctAnswers')),
                ],
              ),
              const SizedBox(height: 16),
              Text('Section performance', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              ...attempt.sectionScores.entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _SectionScoreTile(
                    label: entry.key,
                    value: entry.value,
                    maxValue: paper.questions
                        .where((question) => question.section == entry.key)
                        .fold<int>(0, (sum, question) => sum + question.marks),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: _printReport, child: const Text('Download PDF')),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop();
            Navigator.of(context).pop();
            Navigator.of(context).pop();
          },
          child: const Text('Back to course'),
        ),
      ],
    );
  }
}

class StudentLibraryPage extends StatelessWidget {
  const StudentLibraryPage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final purchases = controller.purchasesForStudent(controller.currentStudent.id);
    final attempts = controller.attemptsForStudent(controller.currentStudent.id);
    final recentAttempts = attempts.take(8).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
      children: [
        _StudentPanel(
          title: 'Your library',
          subtitle: 'Everything you have purchased, attempted, or paid for is grouped here for quick access.',
          child: Row(
            children: [
              Expanded(
                child: _ResultStatCard(label: 'Active courses', value: '${purchases.length}'),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ResultStatCard(label: 'Recent attempts', value: '${attempts.length}'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        _StudentPanel(
          title: 'Purchased courses',
          subtitle: 'Open receipts, check validity, and jump back into paid material.',
          child: purchases.isEmpty
              ? const _StudentEmptyState(
                  icon: Icons.workspace_premium_outlined,
                  title: 'No purchases yet',
                  message: 'As soon as you unlock a course, it will appear here with its receipt and access details.',
                )
              : Column(
                  children: purchases.map((purchase) {
                    final course = controller.courseById(purchase.courseId)!;
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
                              builder: (_) => ReceiptPage(
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
          child: recentAttempts.isEmpty
              ? const _StudentEmptyState(
                  icon: Icons.quiz_outlined,
                  title: 'No attempts yet',
                  message: 'Start a paper and your latest scores will appear here automatically.',
                )
              : Column(
                  children: recentAttempts.map((attempt) {
                    final paper = controller.paperById(attempt.paperId)!;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _StudentActionCard(
                        icon: Icons.insights_outlined,
                        title: paper.title,
                        subtitle:
                            '${attempt.score}/${attempt.maxScore} • ${DateFormat('dd MMM yyyy, hh:mm a').format(attempt.submittedAt)}',
                      ),
                    );
                  }).toList(),
                ),
        ),
      ],
    );
  }
}

class StudentProfilePage extends StatelessWidget {
  const StudentProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final student = controller.currentStudent;
    final attempts = controller.attemptsForStudent(student.id);
    final purchases = controller.purchasesForStudent(student.id);
    final unlockedCourseIds = purchases.map((purchase) => purchase.courseId).toSet();

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
                    child: const Icon(Icons.person_outline_rounded, size: 34, color: MeritTheme.secondary),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(student.name, style: Theme.of(context).textTheme.headlineSmall),
                        const SizedBox(height: 4),
                        Text(student.contact),
                        const SizedBox(height: 4),
                        Text(student.city),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(child: _ResultStatCard(label: 'Courses', value: '${unlockedCourseIds.length}')),
                  const SizedBox(width: 12),
                  Expanded(child: _ResultStatCard(label: 'Attempts', value: '${attempts.length}')),
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
                    Text('Referral code', style: Theme.of(context).textTheme.labelLarge),
                    const SizedBox(height: 6),
                    Text(student.referralCode ?? 'Not provided', style: Theme.of(context).textTheme.titleLarge),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        _StudentPanel(
          title: 'Attempt history',
          subtitle: 'Every test attempt across all courses and papers in one place.',
          child: attempts.isEmpty
              ? const _StudentEmptyState(
                  icon: Icons.history_toggle_off_outlined,
                  title: 'No attempts recorded',
                  message: 'Once you submit a test, it will appear here with course, paper, and score.',
                )
              : Column(
                  children: attempts.map((attempt) {
                    final paper = controller.paperById(attempt.paperId);
                    final course = paper == null ? null : controller.courseById(paper.courseId);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _AttemptSummaryTile(attempt: attempt, paper: paper, course: course),
                    );
                  }).toList(),
                ),
        ),
        const SizedBox(height: 18),
        _StudentPanel(
          title: 'Payment history',
          subtitle: 'All receipts stay available here whenever you need to review or download them.',
          child: purchases.isEmpty
              ? const _StudentEmptyState(
                  icon: Icons.receipt_long_outlined,
                  title: 'No payments yet',
                  message: 'Your receipt history will appear here after the first course purchase.',
                )
              : Column(
                  children: purchases.map((purchase) {
                    final course = controller.courseById(purchase.courseId)!;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _StudentActionCard(
                        icon: Icons.account_balance_wallet_outlined,
                        title: '${course.title} • Rs ${purchase.amount.toStringAsFixed(0)}',
                        subtitle: purchase.paymentId == null
                            ? 'Receipt ${purchase.receiptNumber}'
                            : 'Receipt ${purchase.receiptNumber} • ${purchase.paymentId}',
                        trailingLabel: DateFormat('dd MMM').format(purchase.purchasedAt),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => ReceiptPage(
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

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: _StudentPanel(
            title: 'Student support',
            subtitle: 'Quick help for access, payments, exam issues, and anything blocking your progress.',
            child: const Row(
              children: [
                Icon(Icons.mail_outline_rounded),
                SizedBox(width: 12),
                Expanded(child: Text('Reach us directly at info@meritlaunchers.com')),
              ],
            ),
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 18),
            children: app.supportMessages.map((message) {
              final isStudent = message.sender == SenderRole.student;
              return Align(
                alignment: isStudent ? Alignment.centerRight : Alignment.centerLeft,
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
                        isStudent ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                    children: [
                      Text(
                        isStudent ? 'You' : 'Merit Launchers support',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                              color: isStudent ? Colors.white70 : MeritTheme.secondaryMuted,
                            ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        message.message,
                        style: TextStyle(color: isStudent ? Colors.white : MeritTheme.secondary),
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
                    decoration: const InputDecoration(
                      hintText: 'Ask about access, payments, results, or exam issues',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  height: 56,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      await app.addSupportMessage(SenderRole.student, _controller.text);
                      _controller.clear();
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

  Future<void> _downloadReceipt() async {
    final document = _buildReceiptDocument(
      purchase: purchase,
      course: course,
      student: student,
    );

    await Printing.layoutPdf(onLayout: (format) => document.save());
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
                            Text('Merit Launchers', style: Theme.of(context).textTheme.headlineSmall),
                            const SizedBox(height: 6),
                            Text('Course access invoice', style: Theme.of(context).textTheme.bodyMedium),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                        decoration: BoxDecoration(
                          color: purchase.paymentId == null ? MeritTheme.primarySoft : const Color(0xFFE9F8F2),
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
                    value: DateFormat('dd MMM yyyy, hh:mm a').format(purchase.purchasedAt),
                  ),
                  _ReceiptRow(
                    label: 'Validity',
                    value: purchase.validUntil == null
                        ? '1 year from purchase'
                        : DateFormat('dd MMM yyyy').format(purchase.validUntil!),
                  ),
                  _ReceiptRow(label: 'Payment provider', value: purchase.paymentProvider),
                  _ReceiptRow(label: 'Payment ID', value: purchase.paymentId ?? 'Demo payment'),
                  _ReceiptRow(label: 'Order ID', value: purchase.paymentOrderId ?? 'Demo order'),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _downloadReceipt,
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
      return _VideoPlaceholder(
        message: 'No course video uploaded yet.',
      );
    }

    if (_initializing) {
      return const _VideoPlaceholder(
        message: 'Loading course video...',
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null || _controller == null || !_controller!.value.isInitialized) {
      return _VideoPlaceholder(
        message: _error ?? 'Video is not available.',
      );
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
  const _VideoPlaceholder({
    required this.message,
    this.child,
  });

  final String message;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 210,
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
              Text(
                message,
                textAlign: TextAlign.center,
              ),
            ],
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
  });

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: MeritTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.025),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 6),
          Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 16),
          child,
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
                    Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
              if (trailingLabel != null) ...[
                const SizedBox(width: 12),
                Text(
                  trailingLabel!,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(color: MeritTheme.primary),
                ),
              ],
              if (onTap != null) ...[
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right_rounded, color: MeritTheme.secondaryMuted),
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
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: MeritTheme.primarySoft,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        children: [
          Icon(icon, size: 32, color: MeritTheme.secondary),
          const SizedBox(height: 10),
          Text(title, style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
          const SizedBox(height: 6),
          Text(message, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _CourseFactPill extends StatelessWidget {
  const _CourseFactPill({
    required this.icon,
    required this.label,
  });

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
  const _DarkInfoPill({
    required this.icon,
    required this.label,
  });

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
            style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.white),
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
  });

  final ExamAttempt attempt;
  final Paper? paper;
  final Course? course;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(paper?.title ?? 'Paper ${attempt.paperId}', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(course?.title ?? 'Course', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 12),
          Row(
            children: [
              _MetaChip(label: 'Score ${attempt.score}/${attempt.maxScore}'),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  DateFormat('dd MMM yyyy, hh:mm a').format(attempt.submittedAt),
                  textAlign: TextAlign.right,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ReceiptHighlightCard extends StatelessWidget {
  const _ReceiptHighlightCard({
    required this.label,
    required this.value,
  });

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
  const _ReceiptRow({
    required this.label,
    required this.value,
  });

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
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
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
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: MeritTheme.secondary,
                ),
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
    final normalized = maxValue <= 0 ? 0.0 : (value / maxValue).clamp(0.0, 1.0).toDouble();
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
              Expanded(child: Text(label, style: Theme.of(context).textTheme.titleSmall)),
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
      build: (context) {
        return pw.Padding(
          padding: const pw.EdgeInsets.all(24),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(
                'Merit Launchers',
                style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
              ),
              pw.SizedBox(height: 4),
              pw.Text('Course Access Invoice'),
              pw.SizedBox(height: 16),
              pw.Container(
                padding: const pw.EdgeInsets.all(16),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('Receipt number: ${purchase.receiptNumber}'),
                    pw.SizedBox(height: 8),
                    pw.Text('Course: ${course.title}'),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      'Amount paid: Rs ${purchase.amount.toStringAsFixed(0)}',
                      style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 18),
              pw.Text('Student: ${student.name}'),
              pw.Text('Contact: ${student.contact}'),
              pw.Text(
                'Purchased on: ${DateFormat('dd MMM yyyy, hh:mm a').format(purchase.purchasedAt)}',
              ),
              pw.Text(
                'Validity until: ${purchase.validUntil == null ? '1 year from purchase' : DateFormat('dd MMM yyyy').format(purchase.validUntil!)}',
              ),
              pw.Text('Payment provider: ${purchase.paymentProvider}'),
              pw.Text('Payment ID: ${purchase.paymentId ?? 'Demo payment'}'),
              pw.Text('Order ID: ${purchase.paymentOrderId ?? 'Demo order'}'),
            ],
          ),
        );
      },
    ),
  );
  return document;
}
