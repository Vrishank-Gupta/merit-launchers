import 'dart:convert';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:flutter_quill/flutter_quill.dart' as quill;
import 'package:flutter_quill_delta_from_html/flutter_quill_delta_from_html.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app/app.dart';
import '../../app/app_controller.dart';
import '../../app/api_client.dart';
import '../../app/models.dart';
import '../../app/pricing.dart';
import '../../math/math_content.dart';
import '../../app/theme.dart';
import '../../rich_content/rich_content_codec.dart';
import '../../rich_content/rich_embeds.dart';
import '../../widgets/math_text.dart';
import '../../widgets/rich_question_content.dart';
import 'math_palette.dart';
import 'mathlive_composer.dart';
import 'mathlive_composer_platform.dart';
import 'paper_import_backend.dart';
import 'paper_import_parser.dart';
import 'clipboard_image_stub.dart'
    if (dart.library.html) 'clipboard_image_web.dart';

class AdminShell extends StatelessWidget {
  const AdminShell({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final width = MediaQuery.sizeOf(context).width;
    final destinations = _adminDestinations;
    final pages = _adminPages;

    if (width < 960) {
      return Scaffold(
        backgroundColor: const Color(0xFFF5F8FC),
        appBar: AppBar(
          title: Text(destinations[controller.adminTabIndex].label),
        ),
        drawer: Drawer(
          child: SafeArea(
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF183153), Color(0xFF245E8B)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Row(
                    children: [
                      InkWell(
                        borderRadius: BorderRadius.circular(18),
                        onTap: openMeritHomePage,
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Image.asset(
                            'assets/branding/logo.png',
                            width: 38,
                            height: 38,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Merit Launchers',
                              style: Theme.of(
                                context,
                              ).textTheme.titleMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Admin console',
                              style: Theme.of(
                                context,
                              ).textTheme.bodyMedium?.copyWith(
                                color: Colors.white.withValues(alpha: 0.8),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    children: [
                      for (var i = 0; i < destinations.length; i++)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: ListTile(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                            ),
                            leading: Icon(destinations[i].icon),
                            title: Text(destinations[i].label),
                            selected: controller.adminTabIndex == i,
                            selectedTileColor: MeritTheme.primarySoft,
                            onTap: () {
                              controller.setAdminTab(i);
                              Navigator.of(context).pop();
                            },
                          ),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed:
                          () => launchUrl(
                            Uri.parse('https://app.titan.email/login/'),
                            webOnlyWindowName: '_blank',
                          ),
                      icon: const Icon(Icons.email_outlined),
                      label: const Text('Info Login'),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: controller.logout,
                      icon: const Icon(Icons.logout_rounded),
                      label: const Text('Exit admin'),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        body: SafeArea(child: pages[controller.adminTabIndex]),
      );
    }

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
                  width: 288,
                  child: _AdminSidebarPanel(
                    controller: controller,
                    destinations: destinations,
                  ),
                ),
                const SizedBox(width: 24),
                Expanded(child: pages[controller.adminTabIndex]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AdminSidebarPanel extends StatelessWidget {
  const _AdminSidebarPanel({
    required this.controller,
    required this.destinations,
  });

  final AppController controller;
  final List<({String label, IconData icon})> destinations;

  @override
  Widget build(BuildContext context) {
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
          InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: openMeritHomePage,
            child: Row(
              children: [
                ClipRRect(
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
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Merit Launchers',
                        style: Theme.of(
                          context,
                        ).textTheme.titleLarge?.copyWith(color: Colors.white),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Admin portal',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.68),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Navigate',
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.white.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.zero,
              itemCount: destinations.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final destination = destinations[index];
                return _AdminSidebarNavTile(
                  icon: destination.icon,
                  label: destination.label,
                  selected: controller.adminTabIndex == index,
                  onTap: () => controller.setAdminTab(index),
                );
              },
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed:
                  () => launchUrl(
                    Uri.parse('https://app.titan.email/login/'),
                    webOnlyWindowName: '_blank',
                  ),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: BorderSide(color: Colors.white.withValues(alpha: 0.35)),
              ),
              icon: const Icon(Icons.email_outlined),
              label: const Text('Info Login'),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: controller.logout,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: MeritTheme.secondary,
              ),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Sign Out'),
            ),
          ),
        ],
      ),
    );
  }
}

class _AdminSidebarNavTile extends StatelessWidget {
  const _AdminSidebarNavTile({
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
            color:
                selected
                    ? Colors.white.withValues(alpha: 0.12)
                    : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color:
                  selected
                      ? Colors.white.withValues(alpha: 0.16)
                      : Colors.transparent,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color:
                      selected
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  icon,
                  color: selected ? MeritTheme.secondary : Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: Colors.white.withValues(alpha: selected ? 1 : 0.34),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

const _adminDestinations = <({String label, IconData icon})>[
  (label: 'Overview', icon: Icons.dashboard_outlined),
  (label: 'Content', icon: Icons.edit_note_outlined),
  (label: 'Students', icon: Icons.groups_outlined),
  (label: 'Affiliates', icon: Icons.diversity_3_outlined),
  (label: 'Blog', icon: Icons.article_outlined),
  (label: 'Support', icon: Icons.support_agent_outlined),
  (label: 'Settings', icon: Icons.settings_outlined),
];

const _adminPages = <Widget>[
  AdminOverviewPage(),
  AdminContentPage(),
  AdminStudentsPage(),
  AdminAffiliatesPage(),
  AdminBlogPage(),
  AdminSupportPage(),
  AdminSettingsPage(),
];

class AdminOverviewPage extends StatelessWidget {
  const AdminOverviewPage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final estimate = _PlatformQuotaEstimate.fromController(controller);
    final compact = MediaQuery.sizeOf(context).width < 900;
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          'Dashboard overview',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 20),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            _MetricCard(
              title: 'Revenue',
              value: 'Rs ${controller.totalRevenue.toStringAsFixed(0)}',
            ),
            _MetricCard(
              title: 'Paid users',
              value: controller.paidUsers.toString(),
            ),
            _MetricCard(
              title: 'Active users',
              value: controller.activeUsers.toString(),
            ),
            _MetricCard(
              title: 'Attempts logged',
              value: controller.attempts.length.toString(),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                compact
                    ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Service consumption watch',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Estimated from the stack you are actually running now: Ubuntu VM, PostgreSQL, Gemini paper parsing, Google sign-in, Razorpay, hosted video URLs, receipts, and retained result reports.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color:
                                estimate.projectedBillableMetrics == 0
                                    ? MeritTheme.success.withValues(alpha: 0.12)
                                    : const Color(0xFFFFF3E0),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                estimate.projectedBillableMetrics == 0
                                    ? 'Healthy footprint'
                                    : 'Watch list',
                                style: Theme.of(context).textTheme.labelLarge,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                estimate.projectedBillableMetrics == 0
                                    ? 'Within current baseline'
                                    : '${estimate.projectedBillableMetrics} area${estimate.projectedBillableMetrics == 1 ? '' : 's'} worth reviewing',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                    : Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Service consumption watch',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Estimated from the stack you are actually running now: Ubuntu VM, PostgreSQL, Gemini paper parsing, Google sign-in, Razorpay, hosted video URLs, receipts, and retained result reports.',
                                style: Theme.of(context).textTheme.bodyMedium,
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
                                estimate.projectedBillableMetrics == 0
                                    ? MeritTheme.success.withValues(alpha: 0.12)
                                    : const Color(0xFFFFF3E0),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                estimate.projectedBillableMetrics == 0
                                    ? 'Healthy footprint'
                                    : 'Watch list',
                                style: Theme.of(context).textTheme.labelLarge,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                estimate.projectedBillableMetrics == 0
                                    ? 'Within current baseline'
                                    : '${estimate.projectedBillableMetrics} area${estimate.projectedBillableMetrics == 1 ? '' : 's'} worth reviewing',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                const SizedBox(height: 18),
                Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  children:
                      estimate.items
                          .map((item) => _QuotaCard(item: item))
                          .toList(),
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: MeritTheme.primarySoft,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'How this stays cheap',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Results, receipts, and support stay in your own stack. Google sign-in is low-cost, Gemini is used only for paper ingestion, Razorpay is charged only on successful payments, and video URLs point to your own hosted files.',
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Course enrollment snapshot',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                ...controller.courses.map((course) {
                  final count = controller.courseEnrollments[course.id] ?? 0;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        Expanded(child: Text(course.title)),
                        Text('$count enrolled'),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class AdminContentPage extends StatefulWidget {
  const AdminContentPage({super.key});

  @override
  State<AdminContentPage> createState() => _AdminContentPageState();
}

class _AdminContentPageState extends State<AdminContentPage> {
  final Map<String, String?> _selectedSubjectIds = {};
  final Map<String, TextEditingController> _paperSearchControllers = {};
  final Map<String, String> _paperSearchQueries = {};

  TextEditingController _paperSearchControllerFor(String courseId) {
    return _paperSearchControllers.putIfAbsent(courseId, () {
      final controller = TextEditingController(
        text: _paperSearchQueries[courseId] ?? '',
      );
      controller.addListener(() {
        if (!mounted) return;
        setState(
          () =>
              _paperSearchQueries[courseId] =
                  controller.text.trim().toLowerCase(),
        );
      });
      return controller;
    });
  }

  @override
  void dispose() {
    for (final controller in _paperSearchControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  static const _mathSnippets = <_MathSnippet>[
    _MathSnippet('Fraction', 'numerator / denominator', category: 'General'),
    _MathSnippet('Square root', '\u221A', category: 'General'),
    _MathSnippet('Bevelled fraction', 'a / b', category: 'General'),
    _MathSnippet('Nth root', '\u221A[n]', category: 'General'),
    _MathSnippet('Superscript', 'x\u00B2', category: 'General'),
    _MathSnippet('Subscript', 'x\u2081', category: 'General'),
    _MathSnippet('Parentheses', '(  )', category: 'General'),
    _MathSnippet('Square brackets', '[  ]', category: 'General'),
    _MathSnippet('Vertical bars', '|  |', category: 'General'),
    _MathSnippet('Curly brackets', '{  }', category: 'General'),
    _MathSnippet('Plus sign', '+', category: 'General'),
    _MathSnippet('Forward slash', '/', category: 'General'),
    _MathSnippet('Multiplication sign', '\u00D7', category: 'General'),
    _MathSnippet('Plus-minus sign', '\u00B1', category: 'General'),
    _MathSnippet('Minus sign', '-', category: 'General'),
    _MathSnippet('Division sign', '\u00F7', category: 'General'),
    _MathSnippet('Greater-than or equal to', '\u2265', category: 'General'),
    _MathSnippet('Less-than or equal to', '\u2264', category: 'General'),
    _MathSnippet('Element of', '\u2208', category: 'General'),
    _MathSnippet('Subset of', '\u2282', category: 'General'),
    _MathSnippet('Union', '\u222A', category: 'General'),
    _MathSnippet('Intersection', '\u2229', category: 'General'),
    _MathSnippet('Empty set', '\u2205', category: 'General'),
    _MathSnippet('Infinity', '\u221E', category: 'General'),
    _MathSnippet('Number pi', '\u03C0', category: 'General'),
    _MathSnippet('Bold text', 'bold text', category: 'General'),
    _MathSnippet('Italic text', 'italic text', category: 'General'),
    _MathSnippet('Regular text', 'regular text', category: 'General'),
    _MathSnippet('Size 11px', 'small text', category: 'General'),
    _MathSnippet('Size 19px', 'large text', category: 'General'),
    _MathSnippet('Hydrogen', 'H', category: 'Chemistry'),
    _MathSnippet('Carbon', 'C', category: 'Chemistry'),
    _MathSnippet('Nitrogen', 'N', category: 'Chemistry'),
    _MathSnippet('Oxygen', 'O', category: 'Chemistry'),
    _MathSnippet('Fluorine', 'F', category: 'Chemistry'),
    _MathSnippet('Sulfur', 'S', category: 'Chemistry'),
    _MathSnippet('Degree sign', '\u00B0', category: 'Chemistry'),
    _MathSnippet('Increment', '\u25B3', category: 'Chemistry'),
    _MathSnippet('Mol', 'mol', category: 'Chemistry'),
    _MathSnippet('Bond', '-', category: 'Chemistry'),
    _MathSnippet('Double bond', '=', category: 'Chemistry'),
    _MathSnippet('Triple bond', '\u2261', category: 'Chemistry'),
    _MathSnippet('Forward reaction', '\u2192', category: 'Chemistry'),
    _MathSnippet('Equilibrium', '\u21CC', category: 'Chemistry'),
    _MathSnippet('Both directions', '\u21C4', category: 'Chemistry'),
    _MathSnippet('Reaction over text', 'above \u2192', category: 'Chemistry'),
    _MathSnippet('Reaction under text', '\u2192 below', category: 'Chemistry'),
    _MathSnippet('Angstrom', '\u212B', category: 'Chemistry'),
    _MathSnippet('Not equal', '\u2260', category: 'Symbols'),
    _MathSnippet('Approx equal', '\u2248', category: 'Symbols'),
    _MathSnippet('Equivalent', '\u2261', category: 'Symbols'),
    _MathSnippet('Proportional', '\u221D', category: 'Symbols'),
    _MathSnippet('Dot product', '\u22C5', category: 'Symbols'),
    _MathSnippet('Perpendicular', '\u27C2', category: 'Symbols'),
    _MathSnippet('Parallel', '\u2225', category: 'Symbols'),
    _MathSnippet('Angle', '\u2220', category: 'Symbols'),
    _MathSnippet('Measured angle', '\u2221', category: 'Symbols'),
    _MathSnippet('Triangle', '\u25B3', category: 'Symbols'),
    _MathSnippet('Therefore', '\u2234', category: 'Symbols'),
    _MathSnippet('Because', '\u2235', category: 'Symbols'),
    _MathSnippet('Right arrow', '\u2192', category: 'Arrows'),
    _MathSnippet('Left arrow', '\u2190', category: 'Arrows'),
    _MathSnippet('Up arrow', '\u2191', category: 'Arrows'),
    _MathSnippet('Down arrow', '\u2193', category: 'Arrows'),
    _MathSnippet('Left-right arrow', '\u2194', category: 'Arrows'),
    _MathSnippet('Implies', '\u21D2', category: 'Arrows'),
    _MathSnippet('Implied by', '\u21D0', category: 'Arrows'),
    _MathSnippet('If and only if', '\u21D4', category: 'Arrows'),
    _MathSnippet('Maps to', '\u21A6', category: 'Arrows'),
    _MathSnippet('Equilibrium', '\u21CC', category: 'Arrows'),
    _MathSnippet('Reversible', '\u21C4', category: 'Arrows'),
    _MathSnippet('Alpha', '\u03B1', category: 'Greek, letters and number'),
    _MathSnippet('Beta', '\u03B2', category: 'Greek, letters and number'),
    _MathSnippet('Gamma', '\u03B3', category: 'Greek, letters and number'),
    _MathSnippet('Delta', '\u03B4', category: 'Greek, letters and number'),
    _MathSnippet('Theta', '\u03B8', category: 'Greek, letters and number'),
    _MathSnippet('Lambda', '\u03BB', category: 'Greek, letters and number'),
    _MathSnippet('Mu', '\u03BC', category: 'Greek, letters and number'),
    _MathSnippet('Pi', '\u03C0', category: 'Greek, letters and number'),
    _MathSnippet('Sigma', '\u03C3', category: 'Greek, letters and number'),
    _MathSnippet('Omega', '\u03C9', category: 'Greek, letters and number'),
    _MathSnippet(
      'Capital Delta',
      '\u0394',
      category: 'Greek, letters and number',
    ),
    _MathSnippet(
      'Capital Sigma',
      '\u03A3',
      category: 'Greek, letters and number',
    ),
    _MathSnippet(
      'Capital Omega',
      '\u03A9',
      category: 'Greek, letters and number',
    ),
    _MathSnippet(
      'Real numbers',
      '\u211D',
      category: 'Greek, letters and number',
    ),
    _MathSnippet(
      'Natural numbers',
      '\u2115',
      category: 'Greek, letters and number',
    ),
    _MathSnippet('Integers', '\u2124', category: 'Greek, letters and number'),
    _MathSnippet(
      'Rational numbers',
      '\u211A',
      category: 'Greek, letters and number',
    ),
    _MathSnippet(
      'Matrix block',
      '[matrix]',
      category: 'Matrices and elementary',
    ),
    _MathSnippet(
      'Determinant block',
      '|determinant|',
      category: 'Matrices and elementary',
    ),
    _MathSnippet('Table block', '[table]', category: 'Matrices and elementary'),
    _MathSnippet(
      'Vector',
      '\u27E8x, y\u27E9',
      category: 'Matrices and elementary',
    ),
    _MathSnippet('Belongs to', '\u2208', category: 'Matrices and elementary'),
    _MathSnippet('Not in', '\u2209', category: 'Matrices and elementary'),
    _MathSnippet('Subset', '\u2282', category: 'Matrices and elementary'),
    _MathSnippet(
      'Subset or equal',
      '\u2286',
      category: 'Matrices and elementary',
    ),
    _MathSnippet('Union', '\u222A', category: 'Matrices and elementary'),
    _MathSnippet('Intersection', '\u2229', category: 'Matrices and elementary'),
    _MathSnippet('Empty set', '\u2205', category: 'Matrices and elementary'),
    _MathSnippet(
      'Superscript and subscript',
      'x\u2099\u00B2',
      category: 'Scripts and layout',
    ),
    _MathSnippet('Superscript', 'x\u00B2', category: 'Scripts and layout'),
    _MathSnippet('Cube', 'x\u00B3', category: 'Scripts and layout'),
    _MathSnippet('Inverse', 'x\u207B\u00B9', category: 'Scripts and layout'),
    _MathSnippet('Subscript', 'x\u2081', category: 'Scripts and layout'),
    _MathSnippet(
      'Fraction template',
      'numerator / denominator',
      category: 'Scripts and layout',
    ),
    _MathSnippet('Square root', '\u221A', category: 'Scripts and layout'),
    _MathSnippet('Cube root', '\u221B', category: 'Scripts and layout'),
    _MathSnippet('Nth root', '\u221A[n]', category: 'Scripts and layout'),
    _MathSnippet('Parentheses', '(  )', category: 'Scripts and layout'),
    _MathSnippet('Square brackets', '[  ]', category: 'Scripts and layout'),
    _MathSnippet('Curly brackets', '{  }', category: 'Scripts and layout'),
    _MathSnippet('Absolute value', '|  |', category: 'Scripts and layout'),
    _MathSnippet('Overline', 'x\u0305', category: 'Decorations'),
    _MathSnippet('Vector arrow', 'x\u20D7', category: 'Decorations'),
    _MathSnippet('Hat', 'x\u0302', category: 'Decorations'),
    _MathSnippet('Bar', 'x\u0304', category: 'Decorations'),
    _MathSnippet('Dot', 'x\u0307', category: 'Decorations'),
    _MathSnippet('Double dot', 'x\u0308', category: 'Decorations'),
    _MathSnippet('Bold text', 'bold text', category: 'Decorations'),
    _MathSnippet('Regular text', 'regular text', category: 'Decorations'),
    _MathSnippet('Summation', '\u2211', category: 'Big operators'),
    _MathSnippet('Product', '\u220F', category: 'Big operators'),
    _MathSnippet('Coproduct', '\u2210', category: 'Big operators'),
    _MathSnippet('Integral', '\u222B', category: 'Big operators'),
    _MathSnippet('Double integral', '\u222B\u222B', category: 'Big operators'),
    _MathSnippet(
      'Triple integral',
      '\u222B\u222B\u222B',
      category: 'Big operators',
    ),
    _MathSnippet('Union', '\u22C3', category: 'Big operators'),
    _MathSnippet('Intersection', '\u22C2', category: 'Big operators'),
    _MathSnippet('Limit', 'lim', category: 'Calculus'),
    _MathSnippet('Limit x to a', 'lim x\u2192a', category: 'Calculus'),
    _MathSnippet('Derivative', 'd/dx', category: 'Calculus'),
    _MathSnippet('Partial derivative', '\u2202/\u2202x', category: 'Calculus'),
    _MathSnippet('Integral', '\u222B', category: 'Calculus'),
    _MathSnippet('Definite integral', '\u222B_a^b', category: 'Calculus'),
    _MathSnippet('Double integral', '\u222B\u222B', category: 'Calculus'),
    _MathSnippet('Nabla', '\u2207', category: 'Calculus'),
    _MathSnippet('Gradient', '\u2207f', category: 'Calculus'),
    _MathSnippet('Infinity limit', 'lim x\u2192\u221E', category: 'Calculus'),
  ];
  Future<void> _openCourseDialog(BuildContext context) async {
    final controller = AppScope.of(context);
    final title = TextEditingController();
    final subtitle = TextEditingController();
    final description = TextEditingController();
    final label = TextEditingController(text: 'NEW');

    await showDialog<void>(
      context: context,
      builder:
          (context) => StatefulBuilder(
            builder: (context, setDialogState) {
              final draftId = title.text.trim().toLowerCase().replaceAll(
                RegExp(r'[^a-z0-9]+'),
                '-',
              );
              final resolvedId = draftId.isEmpty ? 'new-course' : draftId;
              final purchaseMode = purchaseModeForCourseId(resolvedId);
              final basePrice = basePriceForCourseId(resolvedId);
              return AlertDialog(
                title: const Text('Create course'),
                content: SizedBox(
                  width: 480,
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextField(
                          controller: title,
                          decoration: const InputDecoration(labelText: 'Title'),
                          onChanged: (_) => setDialogState(() {}),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: subtitle,
                          decoration: const InputDecoration(
                            labelText: 'Subtitle',
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: description,
                          maxLines: 3,
                          decoration: const InputDecoration(
                            labelText: 'Description',
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: MeritTheme.background,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: MeritTheme.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Purchase rule',
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                purchaseMode == PurchaseMode.subject
                                    ? 'This course will unlock subject-by-subject.'
                                    : 'This course will unlock as one full-course purchase.',
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Display price: ${formatRupees(basePrice)}*',
                              ),
                              Text(
                                '*GST extra',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                resolvedId == 'cuet'
                                    ? 'CUET is locked to per-subject pricing automatically.'
                                    : resolvedId == 'ipmat'
                                    ? 'IPMAT is locked to full-course pricing at Rs 2,499*.'
                                    : 'All non-CUET courses are locked to full-course pricing at Rs 499*.',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: label,
                          decoration: const InputDecoration(
                            labelText: 'Hero label',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel'),
                  ),
                  ElevatedButton(
                    onPressed: () async {
                      await controller.addCourse(
                        title: title.text.trim(),
                        subtitle: subtitle.text.trim(),
                        description: description.text.trim(),
                        heroLabel:
                            label.text.trim().isEmpty
                                ? 'NEW'
                                : label.text.trim().toUpperCase(),
                        introVideoUrl: null,
                      );
                      if (!context.mounted) {
                        return;
                      }
                      Navigator.pop(context);
                    },
                    child: const Text('Save'),
                  ),
                ],
              );
            },
          ),
    );
  }

  Future<void> _setCourseVideoUrl(BuildContext context, Course course) async {
    final controller = AppScope.of(context);
    final backend = AppScope.backendOf(context);
    final videoUrl = TextEditingController(text: course.introVideoUrl ?? '');

    if (backend.isDemo) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Course video URLs can be saved only in dev or prod mode.',
          ),
        ),
      );
      return;
    }

    await showDialog<void>(
      context: context,
      builder:
          (dialogContext) => AlertDialog(
            title: Text(
              course.introVideoUrl == null
                  ? 'Attach course video'
                  : 'Replace course video',
            ),
            content: SizedBox(
              width: 520,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Paste a direct MP4/HLS playback URL from your external video host. This keeps VM network cost low.',
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: videoUrl,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Video URL',
                      hintText:
                          'https://your-video-host.example.com/course-intro.mp4',
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Recommended: host the video file on your Ubuntu VM behind your HTTPS domain and paste the final playback URL here.',
                    style: Theme.of(dialogContext).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            actions: [
              if (course.introVideoUrl != null)
                TextButton(
                  onPressed: () async {
                    await controller.updateCourseVideo(
                      courseId: course.id,
                      videoUrl: null,
                    );
                    if (dialogContext.mounted) {
                      Navigator.pop(dialogContext);
                    }
                  },
                  child: const Text('Remove video'),
                ),
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final value = videoUrl.text.trim();
                  await controller.updateCourseVideo(
                    courseId: course.id,
                    videoUrl: value.isEmpty ? null : value,
                  );
                  if (dialogContext.mounted) {
                    Navigator.pop(dialogContext);
                  }
                },
                child: const Text('Save URL'),
              ),
            ],
          ),
    );
  }

  Future<void> _openSubjectDialog(
    BuildContext context,
    Course course, {
    Subject? existingSubject,
  }) async {
    final controller = AppScope.of(context);
    final title = TextEditingController(text: existingSubject?.title ?? '');
    final description = TextEditingController(
      text: existingSubject?.description ?? '',
    );

    await showDialog<void>(
      context: context,
      builder:
          (dialogContext) => AlertDialog(
            title: Text(
              existingSubject == null
                  ? 'Add subject to ${course.title}'
                  : 'Edit subject in ${course.title}',
            ),
            content: SizedBox(
              width: 520,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: title,
                    decoration: const InputDecoration(
                      labelText: 'Subject title',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: description,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Subject description',
                      hintText:
                          'Optional short note for grouping papers cleanly.',
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              if (existingSubject != null)
                TextButton(
                  onPressed: () async {
                    final shouldDelete =
                        await showDialog<bool>(
                          context: dialogContext,
                          builder:
                              (confirmContext) => AlertDialog(
                                title: const Text('Delete subject?'),
                                content: Text(
                                  'This will delete "${existingSubject.title}" and all papers inside it.',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed:
                                        () => Navigator.pop(
                                          confirmContext,
                                          false,
                                        ),
                                    child: const Text('Cancel'),
                                  ),
                                  FilledButton(
                                    onPressed:
                                        () =>
                                            Navigator.pop(confirmContext, true),
                                    style: FilledButton.styleFrom(
                                      backgroundColor:
                                          Theme.of(context).colorScheme.error,
                                    ),
                                    child: const Text('Delete subject'),
                                  ),
                                ],
                              ),
                        ) ??
                        false;
                    if (!shouldDelete) return;
                    await controller.deleteSubject(existingSubject.id);
                    if (!mounted) return;
                    setState(() {
                      if (_selectedSubjectIds[course.id] ==
                          existingSubject.id) {
                        _selectedSubjectIds.remove(course.id);
                      }
                    });
                    if (dialogContext.mounted) {
                      Navigator.pop(dialogContext);
                    }
                  },
                  child: Text(
                    'Delete subject',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ),
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  if (existingSubject == null) {
                    await controller.addSubject(
                      courseId: course.id,
                      title: title.text.trim(),
                      description: description.text.trim(),
                    );
                  } else {
                    await controller.updateSubject(
                      subjectId: existingSubject.id,
                      courseId: course.id,
                      title: title.text.trim(),
                      description: description.text.trim(),
                      sortOrder: existingSubject.sortOrder,
                      isPublished: existingSubject.isPublished,
                    );
                  }
                  if (dialogContext.mounted) {
                    Navigator.pop(dialogContext);
                  }
                },
                child: Text(
                  existingSubject == null ? 'Save subject' : 'Save changes',
                ),
              ),
            ],
          ),
    );
  }

  Future<void> _openPaperDialog(
    BuildContext context,
    Course course, {
    Paper? existingPaper,
  }) async {
    final controller = AppScope.of(context);
    final resolvedExistingPaper =
        existingPaper == null
            ? null
            : await controller.ensurePaperLoaded(existingPaper.id, force: true);
    if (!context.mounted) {
      return;
    }
    final initialSubjects = controller.subjectsForCourse(course.id);
    final title = TextEditingController(
      text: resolvedExistingPaper?.title ?? '${course.title} New Paper',
    );
    final duration = TextEditingController(
      text: '${resolvedExistingPaper?.durationMinutes ?? 30}',
    );
    final defaultMarks = TextEditingController(
      text: '${resolvedExistingPaper?.defaultMarks ?? 3}',
    );
    final defaultNegativeMarks = TextEditingController(
      text: '${resolvedExistingPaper?.defaultNegativeMarks ?? 1}',
    );
    final instructions = TextEditingController(
      text:
          resolvedExistingPaper?.instructions.join('\n') ??
          'Read questions carefully.\nCorrect +3.\nIncorrect -1.',
    );
    quill.QuillController richController([String initial = '']) =>
        quill.QuillController(
          document: RichContentCodec.documentFromStored(initial),
          selection: const TextSelection.collapsed(offset: 0),
        );
    var questionText = richController();
    final section = TextEditingController(text: 'Quantitative Aptitude');
    var optionA = richController();
    var optionB = richController();
    var optionC = richController();
    var optionD = richController();
    final draftQuestions = <Question>[...?resolvedExistingPaper?.questions];
    var draftAttachments = <QuestionAttachment>[];
    var draftOptionAttachments = List<List<QuestionAttachment>>.generate(
      4,
      (_) => <QuestionAttachment>[],
    );
    final questionMarks = TextEditingController();
    final questionNegativeMarks = TextEditingController();
    var activeField = 'question';
    int answerIndex = -1;
    bool isFreePreview = resolvedExistingPaper?.isFreePreview ?? false;
    bool isActive = resolvedExistingPaper?.isActive ?? true;
    bool shuffleQuestions = resolvedExistingPaper?.shuffleQuestions ?? false;
    bool importing = false;
    String? uploadingImageTarget;
    double importProgress = 0;
    String? importedSourceFileUrl = resolvedExistingPaper?.sourceFileUrl;
    String? importedSourceFileName = resolvedExistingPaper?.sourceFileName;
    int? selectedDraftIndex = draftQuestions.isEmpty ? null : 0;
    int? pendingInsertIndex;
    bool showSetupDetails = false;
    bool savingPaper = false;
    String? draftStatusMessage;
    bool draftStatusIsError = false;
    ClipboardImageDisposer? disposeClipboardPasteListener;
    bool clipboardPasteListenerRegistered = false;
    final dialogScrollController = ScrollController();
    String? selectedSubjectId =
        resolvedExistingPaper?.subjectId ??
        (initialSubjects.isNotEmpty ? initialSubjects.first.id : null);

    final saveNotice = await Navigator.of(context).push<String?>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder:
            (context) => StatefulBuilder(
              builder: (context, setState) {
                quill.QuillController activeController() {
                  switch (activeField) {
                    case 'a':
                      return optionA;
                    case 'b':
                      return optionB;
                    case 'c':
                      return optionC;
                    case 'd':
                      return optionD;
                    default:
                      return questionText;
                  }
                }

                String plainEditorText(quill.QuillController controller) {
                  return controller.document.toPlainText().replaceAll(
                    quill.Embed.kObjectReplacementCharacter,
                    ' ',
                  );
                }

                quill.QuillController controllerForTarget(String fieldKey) {
                  switch (fieldKey) {
                    case 'a':
                      return optionA;
                    case 'b':
                      return optionB;
                    case 'c':
                      return optionC;
                    case 'd':
                      return optionD;
                    default:
                      return questionText;
                  }
                }

                void insertPlainText(
                  quill.QuillController controller,
                  String snippet,
                ) {
                  final selection = controller.selection;
                  final index =
                      selection.isValid
                          ? selection.start.clamp(0, controller.document.length)
                          : controller.document.length - 1;
                  final length =
                      selection.isValid && !selection.isCollapsed
                          ? selection.end - selection.start
                          : 0;
                  controller.replaceText(
                    index,
                    length,
                    snippet,
                    TextSelection.collapsed(offset: index + snippet.length),
                  );
                }

                List<List<QuestionAttachment>> emptyOptionAttachments() =>
                    List<List<QuestionAttachment>>.generate(
                      4,
                      (_) => <QuestionAttachment>[],
                    );

                void setDraftStatus(String message, {bool isError = false}) {
                  draftStatusMessage = message;
                  draftStatusIsError = isError;
                }

                int parsePositiveMark(String raw, int fallback) {
                  final parsed = int.tryParse(raw.trim());
                  if (parsed == null || parsed <= 0) {
                    return fallback;
                  }
                  return parsed;
                }

                int parseNegativeMark(String raw, int fallback) {
                  final parsed = int.tryParse(raw.trim());
                  if (parsed == null || parsed < 0) {
                    return fallback;
                  }
                  return parsed;
                }

                void applyPaperGradingDefaultsToDrafts() {
                  final paperMarks = parsePositiveMark(defaultMarks.text, 3);
                  final paperNegative = parseNegativeMark(
                    defaultNegativeMarks.text,
                    1,
                  );
                  defaultMarks.text = '$paperMarks';
                  defaultNegativeMarks.text = '$paperNegative';
                  for (var i = 0; i < draftQuestions.length; i += 1) {
                    final question = draftQuestions[i];
                    draftQuestions[i] = Question(
                      id: question.id,
                      section: question.section,
                      prompt: question.prompt,
                      options: question.options,
                      correctIndex: question.correctIndex,
                      promptSegments: question.promptSegments,
                      optionSegments: question.optionSegments,
                      explanation: question.explanation,
                      topic: question.topic,
                      concepts: question.concepts,
                      attachments: question.attachments,
                      optionAttachments: question.optionAttachments,
                      difficulty: question.difficulty,
                      marks: paperMarks,
                      negativeMarks: paperNegative,
                    );
                  }
                  questionMarks.text = '$paperMarks';
                  questionNegativeMarks.text = '$paperNegative';
                }

                void startNewQuestion({bool insertAtCurrent = false}) {
                  pendingInsertIndex =
                      insertAtCurrent && selectedDraftIndex != null
                          ? selectedDraftIndex
                          : draftQuestions.length;
                  section.text = course.title;
                  questionText = richController();
                  optionA = richController();
                  optionB = richController();
                  optionC = richController();
                  optionD = richController();
                  draftAttachments = <QuestionAttachment>[];
                  draftOptionAttachments = emptyOptionAttachments();
                  questionMarks.text =
                      '${parsePositiveMark(defaultMarks.text, 3)}';
                  questionNegativeMarks.text =
                      '${parseNegativeMark(defaultNegativeMarks.text, 1)}';
                  answerIndex = -1;
                  activeField = 'question';
                  selectedDraftIndex = null;
                  setDraftStatus(
                    draftQuestions.isEmpty
                        ? 'Ready to add the first question.'
                        : 'Ready to insert a new question at position ${(pendingInsertIndex ?? draftQuestions.length) + 1}.',
                  );
                }

                void insertInlineImageToken(
                  quill.QuillController controller,
                  String imageUrl,
                ) {
                  final selection = controller.selection;
                  final index =
                      selection.isValid
                          ? selection.start.clamp(0, controller.document.length)
                          : controller.document.length - 1;
                  final length =
                      selection.isValid && !selection.isCollapsed
                          ? selection.end - selection.start
                          : 0;
                  controller.replaceText(
                    index,
                    length,
                    quill.BlockEmbed.image(imageUrl),
                    TextSelection.collapsed(offset: index + 1),
                  );
                }

                void insertGridData(RichGridData data) {
                  final embed = RichGridEmbed.fromData(data);
                  final controller = activeController();
                  final selection = controller.selection;
                  final index =
                      selection.isValid
                          ? selection.start.clamp(0, controller.document.length)
                          : controller.document.length - 1;
                  final length =
                      selection.isValid && !selection.isCollapsed
                          ? selection.end - selection.start
                          : 0;
                  controller.replaceText(
                    index,
                    length,
                    quill.BlockEmbed.custom(embed),
                    TextSelection.collapsed(offset: index + 1),
                  );
                  setState(() {});
                }

                void insertMathExpression(String rawText) {
                  // Strip unfilled MathLive placeholder tokens.
                  final cleaned = rawText
                      .replaceAll(r'\placeholder{}', '')
                      .replaceAll(r'\placeholder{ }', '')
                      .trim();
                  if (cleaned.isEmpty) return;
                  // Wrap bare LaTeX in $...$ so the student portal renders it.
                  // Inline math uses single $, display uses $$.
                  final alreadyDelimited =
                      (cleaned.startsWith(r'$') && cleaned.endsWith(r'$')) ||
                      cleaned.startsWith(r'\(') ||
                      cleaned.startsWith(r'\[');
                  final wrapped = alreadyDelimited ? cleaned : '\$$cleaned\$';
                  insertPlainText(activeController(), wrapped);
                  setState(() {});
                }

                Future<void> openMathToolbox() async {
                  final result = await showDialog<_MathToolboxResult>(
                    context: context,
                    barrierDismissible: true,
                    builder: (dialogContext) => const _MathToolboxDialog(),
                  );
                  if (result == null) {
                    return;
                  }
                  final grid = result.grid;
                  if (grid != null) {
                    insertGridData(grid);
                    return;
                  }
                  // snippet is already wrapped in $...$ / $$...$$ by _wrapLatex;
                  // route through insertMathExpression for placeholder stripping.
                  final snippet = result.snippet?.trim();
                  if (snippet != null && snippet.isNotEmpty) {
                    insertMathExpression(snippet);
                  }
                }

                void insertSnippet(String snippet) {
                  final value = snippet.trim();
                  // LaTeX commands: wrap in $...$ so RichMathContentView renders them.
                  final isLatex =
                      value.startsWith(r'\') ||
                      (value.contains('^') && value.contains('{')) ||
                      (value.contains('_') && value.contains('{'));
                  final toInsert = isLatex ? '\$$value\$' : value;
                  insertPlainText(activeController(), toInsert);
                  setState(() {});
                }

                String buildInlineClipboardImageDataUri(Uint8List bytes) {
                  final mimeType = _detectImageMimeType(bytes);
                  final base64 = base64Encode(bytes);
                  return 'data:$mimeType;base64,$base64';
                }

                void loadDraftQuestion(int index) {
                  if (index < 0 || index >= draftQuestions.length) return;
                  final draft = draftQuestions[index];
                  final opts = draft.options;
                  section.text = draft.section;
                  questionText = richController(draft.prompt);
                  optionA = richController(opts.isNotEmpty ? opts[0] : '');
                  optionB = richController(opts.length > 1 ? opts[1] : '');
                  optionC = richController(opts.length > 2 ? opts[2] : '');
                  optionD = richController(opts.length > 3 ? opts[3] : '');
                  draftAttachments = List<QuestionAttachment>.from(
                    draft.attachments,
                  );
                  draftOptionAttachments =
                      List<List<QuestionAttachment>>.generate(
                        4,
                        (optionIndex) =>
                            optionIndex < draft.optionAttachments.length
                                ? List<QuestionAttachment>.from(
                                  draft.optionAttachments[optionIndex],
                                )
                                : <QuestionAttachment>[],
                      );
                  questionMarks.text = '${draft.marks}';
                  questionNegativeMarks.text = '${draft.negativeMarks}';
                  answerIndex = draft.correctIndex;
                  activeField = 'question';
                  selectedDraftIndex = index;
                  pendingInsertIndex = index + 1;
                  setDraftStatus('Editing question ${index + 1}.');
                }

                if (draftQuestions.isNotEmpty &&
                    selectedDraftIndex != null &&
                    plainEditorText(questionText).trim().isEmpty &&
                    plainEditorText(optionA).trim().isEmpty &&
                    plainEditorText(optionB).trim().isEmpty &&
                    plainEditorText(optionC).trim().isEmpty &&
                    plainEditorText(optionD).trim().isEmpty) {
                  loadDraftQuestion(selectedDraftIndex!);
                } else if (draftQuestions.isEmpty &&
                    plainEditorText(questionText).trim().isEmpty &&
                    plainEditorText(optionA).trim().isEmpty &&
                    plainEditorText(optionB).trim().isEmpty &&
                    plainEditorText(optionC).trim().isEmpty &&
                    plainEditorText(optionD).trim().isEmpty &&
                    section.text.isEmpty) {
                  startNewQuestion();
                }

                int? nextIncompleteDraftIndex() {
                  for (var i = 0; i < draftQuestions.length; i += 1) {
                    if (draftQuestions[i].correctIndex < 0 ||
                        draftQuestions[i].correctIndex > 3) {
                      return i;
                    }
                  }
                  return null;
                }

                Future<Question?> buildDraftQuestion({
                  bool preserveExisting = true,
                }) async {
                  final existingDraft =
                      preserveExisting && selectedDraftIndex != null
                          ? draftQuestions[selectedDraftIndex!]
                          : null;
                  final encodedPromptInput = RichContentCodec.encodeDocument(
                    questionText.document,
                  );
                  final normalizedPromptInput =
                      RichContentCodec.isEncoded(encodedPromptInput)
                          ? encodedPromptInput
                          : MathContentParser.normalizeSourceText(
                            encodedPromptInput.trim(),
                          );
                  final normalizedPrompt =
                      normalizedPromptInput.isNotEmpty
                          ? normalizedPromptInput
                          : existingDraft == null
                          ? ''
                          : MathContentParser.normalizeSourceText(
                            existingDraft.prompt,
                          );

                  String resolveOption(
                    quill.QuillController controller,
                    int index,
                  ) {
                    final encodedInput = RichContentCodec.encodeDocument(
                      controller.document,
                    );
                    final normalizedInput =
                        RichContentCodec.isEncoded(encodedInput)
                            ? encodedInput
                            : MathContentParser.normalizeSourceText(
                              encodedInput.trim(),
                            );
                    if (normalizedInput.isNotEmpty) {
                      return normalizedInput;
                    }
                    if (existingDraft != null &&
                        existingDraft.options.length > index) {
                      return MathContentParser.normalizeSourceText(
                        existingDraft.options[index],
                      );
                    }
                    return '';
                  }

                  final resolvedSection =
                      section.text.trim().isNotEmpty
                          ? section.text.trim()
                          : ((existingDraft?.section ?? '').trim().isNotEmpty
                              ? (existingDraft?.section ?? '').trim()
                              : course.title.trim());
                  final options = [
                    resolveOption(optionA, 0),
                    resolveOption(optionB, 1),
                    resolveOption(optionC, 2),
                    resolveOption(optionD, 3),
                  ];
                  final resolvedCorrectIndex =
                      answerIndex >= 0 && answerIndex <= 3
                          ? answerIndex
                          : (existingDraft?.correctIndex ?? -1);

                  if (resolvedSection.isEmpty ||
                      normalizedPrompt.isEmpty ||
                      (existingDraft == null &&
                          options.any((option) => option.isEmpty))) {
                    return null;
                  }

                  final promptSegments =
                      RichContentCodec.isEncoded(normalizedPrompt)
                          ? null
                          : MathContentParser.parse(normalizedPrompt);
                  final optionSegments = <List<MathContentSegment>>[];
                  for (final option in options) {
                    optionSegments.add(
                      RichContentCodec.isEncoded(option)
                          ? const []
                          : MathContentParser.parse(option),
                    );
                  }

                  return Question(
                    id:
                        selectedDraftIndex == null
                            ? 'admin-${DateTime.now().microsecondsSinceEpoch}'
                            : draftQuestions[selectedDraftIndex!].id,
                    section: resolvedSection,
                    prompt: normalizedPrompt,
                    options: options,
                    correctIndex: resolvedCorrectIndex,
                    promptSegments: promptSegments,
                    optionSegments: optionSegments,
                    explanation: existingDraft?.explanation,
                    topic: existingDraft?.topic,
                    concepts: existingDraft?.concepts ?? const [],
                    attachments: List<QuestionAttachment>.from(
                      draftAttachments,
                    ),
                    marks: parsePositiveMark(
                      questionMarks.text,
                      existingDraft?.marks ??
                          parsePositiveMark(defaultMarks.text, 3),
                    ),
                    difficulty: existingDraft?.difficulty ?? 'medium',
                    negativeMarks: parseNegativeMark(
                      questionNegativeMarks.text,
                      existingDraft?.negativeMarks ??
                          parseNegativeMark(defaultNegativeMarks.text, 1),
                    ),
                    optionAttachments: List<List<QuestionAttachment>>.generate(
                      4,
                      (index) => List<QuestionAttachment>.from(
                        draftOptionAttachments[index],
                      ),
                    ),
                  );
                }

                Future<void> upsertDraftQuestion() async {
                  try {
                    final editingIndex = selectedDraftIndex;
                    final draft = await buildDraftQuestion();
                    if (draft == null) {
                      if (!context.mounted) {
                        return;
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Add the question section, prompt, and four options for a brand-new question before saving it.',
                          ),
                        ),
                      );
                      setState(
                        () => setDraftStatus(
                          'This question is incomplete. Add the section, prompt, and four options first.',
                          isError: true,
                        ),
                      );
                      return;
                    }

                    setState(() {
                      if (editingIndex == null) {
                        final insertIndex = (pendingInsertIndex ??
                                draftQuestions.length)
                            .clamp(0, draftQuestions.length);
                        draftQuestions.insert(insertIndex, draft);
                        loadDraftQuestion(insertIndex);
                        setDraftStatus(
                          'Question ${insertIndex + 1} added to this paper draft.',
                        );
                      } else {
                        draftQuestions[editingIndex] = draft;
                        loadDraftQuestion(editingIndex);
                        setDraftStatus(
                          'Question ${editingIndex + 1} updated in this paper draft.',
                        );
                      }
                    });
                    if (!context.mounted) {
                      return;
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          editingIndex == null
                              ? 'Question ${(pendingInsertIndex ?? draftQuestions.length).clamp(1, draftQuestions.length)} added to this paper draft.'
                              : 'Question ${editingIndex + 1} updated in this paper draft.',
                        ),
                      ),
                    );
                  } catch (error) {
                    if (!context.mounted) {
                      return;
                    }
                    setState(
                      () => setDraftStatus(
                        error is ApiException
                            ? error.message
                            : 'Could not update this question draft.',
                        isError: true,
                      ),
                    );
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          error is ApiException
                              ? error.message
                              : 'Could not update this question draft.',
                        ),
                      ),
                    );
                  }
                }

                Future<QuestionAttachment?> uploadAttachmentBytes(
                  Uint8List bytes, {
                  required String filename,
                }) async {
                  final apiClient = controller.apiClient;
                  if (apiClient == null) {
                    throw const ApiException(
                      'Image upload is unavailable right now.',
                    );
                  }
                  final mimeType = _detectImageMimeType(bytes);
                  final extension = _extensionForImageMime(mimeType);
                  final normalizedFilename =
                      filename.contains('.')
                          ? filename
                          : '$filename.$extension';
                  final mimeParts = mimeType.split('/');
                  final response = await apiClient.postMultipart(
                    '/v1/admin/question-images',
                    authenticated: true,
                    files: [
                      http.MultipartFile.fromBytes(
                        'file',
                        bytes,
                        filename: normalizedFilename,
                        contentType: MediaType(
                          mimeParts.first,
                          mimeParts.length > 1 ? mimeParts.last : 'png',
                        ),
                      ),
                    ],
                  );
                  final uploaded = QuestionAttachment(
                    url: (response['url'] as String? ?? '').trim(),
                    mimeType: response['mimeType'] as String?,
                    label:
                        (response['label'] as String?)?.trim().isEmpty ?? true
                            ? null
                            : (response['label'] as String).trim(),
                  );
                  if (uploaded.url.isEmpty) {
                    throw const ApiException(
                      'Image upload succeeded, but no file URL was returned.',
                    );
                  }
                  return uploaded;
                }

                Future<void> uploadPaperSourceFile(
                  Uint8List bytes, {
                  required String filename,
                }) async {
                  final apiClient = controller.apiClient;
                  if (apiClient == null) {
                    throw const ApiException(
                      'Source file upload is unavailable right now.',
                    );
                  }
                  final response = await apiClient.postMultipart(
                    '/v1/admin/paper-sources',
                    authenticated: true,
                    files: [
                      http.MultipartFile.fromBytes(
                        'file',
                        bytes,
                        filename: filename,
                      ),
                    ],
                  );
                  final uploadedUrl = (response['url'] as String? ?? '').trim();
                  if (uploadedUrl.isEmpty) {
                    throw const ApiException(
                      'Source file upload finished, but no file URL was returned.',
                    );
                  }
                  importedSourceFileUrl = uploadedUrl;
                  importedSourceFileName =
                      (response['label'] as String?)?.trim().isNotEmpty == true
                          ? (response['label'] as String).trim()
                          : filename;
                }

                void addAttachmentToTarget(
                  String target,
                  QuestionAttachment attachment,
                ) {
                  if (target == 'question') {
                    draftAttachments = [...draftAttachments, attachment];
                    return;
                  }
                  final optionIndex = switch (target) {
                    'a' => 0,
                    'b' => 1,
                    'c' => 2,
                    'd' => 3,
                    _ => -1,
                  };
                  if (optionIndex >= 0) {
                    draftOptionAttachments[optionIndex] = [
                      ...draftOptionAttachments[optionIndex],
                      attachment,
                    ];
                  }
                }

                Future<void> attachImageToTarget(
                  String target, {
                  bool fromClipboard = false,
                }) async {
                  Uint8List? bytes;
                  String filename =
                      fromClipboard ? '$target-clipboard' : '$target-image.png';
                  if (fromClipboard) {
                    bytes = await readClipboardImageBytes();
                    if (bytes == null || bytes.isEmpty) {
                      if (!context.mounted) return;
                      setState(
                        () => setDraftStatus(
                          'Clipboard does not contain an image right now.',
                          isError: true,
                        ),
                      );
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Clipboard does not contain an image right now.',
                          ),
                        ),
                      );
                      return;
                    }
                    final clipboardMime = _detectImageMimeType(bytes);
                    filename =
                        '$filename.${_extensionForImageMime(clipboardMime)}';

                    setState(() {
                      insertInlineImageToken(
                        controllerForTarget(target),
                        buildInlineClipboardImageDataUri(bytes!),
                      );
                      setDraftStatus(
                        target == 'question'
                            ? 'Pasted image inserted into the question text.'
                            : 'Pasted image inserted into Option ${target.toUpperCase()}.',
                      );
                    });
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          target == 'question'
                              ? 'Pasted image inserted into the question text.'
                              : 'Pasted image inserted into Option ${target.toUpperCase()}.',
                        ),
                      ),
                    );
                    return;
                  } else {
                    final result = await FilePicker.platform.pickFiles(
                      type: FileType.image,
                      withData: true,
                    );
                    if (result == null || result.files.isEmpty) {
                      return;
                    }
                    final file = result.files.single;
                    bytes = file.bytes;
                    filename = file.name.isNotEmpty ? file.name : filename;
                    if (bytes == null || bytes.isEmpty) {
                      if (!context.mounted) return;
                      setState(
                        () => setDraftStatus(
                          'Selected image could not be read.',
                          isError: true,
                        ),
                      );
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Selected image could not be read.'),
                        ),
                      );
                      return;
                    }
                  }
                  setState(() => uploadingImageTarget = target);
                  try {
                    final uploaded = await uploadAttachmentBytes(
                      bytes,
                      filename: filename,
                    );
                    if (uploaded == null) {
                      throw const ApiException(
                        'Image upload did not return a usable attachment.',
                      );
                    }
                    setState(() {
                      addAttachmentToTarget(target, uploaded);
                      setDraftStatus(
                        target == 'question'
                            ? 'Question image attached.'
                            : 'Image attached to Option ${target.toUpperCase()}.',
                      );
                    });
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          target == 'question'
                              ? 'Question image attached.'
                              : 'Image attached to Option ${target.toUpperCase()}.',
                        ),
                      ),
                    );
                  } catch (error) {
                    if (!context.mounted) return;
                    final message =
                        error is ApiException
                            ? error.message
                            : 'Could not upload question image.';
                    setState(() => setDraftStatus(message, isError: true));
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text(message)));
                  } finally {
                    if (context.mounted) {
                      setState(() => uploadingImageTarget = null);
                    }
                  }
                }

                Future<void> attachClipboardBytesToActiveTarget(
                  Uint8List bytes,
                  String filename,
                ) async {
                  final target = switch (activeField) {
                    'a' => 'a',
                    'b' => 'b',
                    'c' => 'c',
                    'd' => 'd',
                    _ => 'question',
                  };
                  try {
                    setState(() {
                      insertInlineImageToken(
                        controllerForTarget(target),
                        buildInlineClipboardImageDataUri(bytes),
                      );
                      setDraftStatus(
                        target == 'question'
                            ? 'Pasted image inserted into the question text.'
                            : 'Pasted image inserted into Option ${target.toUpperCase()}.',
                      );
                    });
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          target == 'question'
                              ? 'Pasted image inserted into the question text.'
                              : 'Pasted image inserted into Option ${target.toUpperCase()}.',
                        ),
                      ),
                    );
                  } catch (error) {
                    if (!context.mounted) return;
                    final message =
                        error is ApiException
                            ? error.message
                            : 'Could not paste the image.';
                    setState(() => setDraftStatus(message, isError: true));
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text(message)));
                  } finally {
                    if (context.mounted) {
                      setState(() => uploadingImageTarget = null);
                    }
                  }
                }

                Future<List<Question>> enrichImportedQuestions(
                  List<Question> questions,
                ) async {
                  final enriched = <Question>[];
                  for (final question in questions) {
                    final promptSegments = MathContentParser.parse(
                      question.prompt,
                    );
                    final optionSegments = <List<MathContentSegment>>[];
                    for (final option in question.options) {
                      optionSegments.add(MathContentParser.parse(option));
                    }
                    enriched.add(
                      Question(
                        id: question.id,
                        section: question.section,
                        prompt: question.prompt,
                        options: question.options,
                        correctIndex: question.correctIndex,
                        promptSegments: promptSegments,
                        optionSegments: optionSegments,
                        explanation: question.explanation,
                        topic: question.topic,
                        concepts: question.concepts,
                        attachments: question.attachments,
                        optionAttachments: question.optionAttachments,
                        difficulty: question.difficulty,
                        marks: question.marks,
                        negativeMarks: question.negativeMarks,
                      ),
                    );
                  }
                  return enriched;
                }

                Future<void> importPaperFromFile() async {
                  final backend = AppScope.backendOf(context);
                  final result = await FilePicker.platform.pickFiles(
                    type: FileType.custom,
                    allowedExtensions: const [
                      'docx',
                      'txt',
                      'pdf',
                      'png',
                      'jpg',
                      'jpeg',
                      'webp',
                    ],
                    withData: true,
                  );
                  if (result == null || result.files.isEmpty) {
                    return;
                  }

                  final file = result.files.single;
                  final bytes = file.bytes;
                  if (bytes == null || bytes.isEmpty) {
                    if (!context.mounted) {
                      return;
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Selected file could not be read.'),
                      ),
                    );
                    return;
                  }

                  setState(() {
                    importing = true;
                    importProgress = 0.1;
                    setDraftStatus(
                      existingPaper == null
                          ? 'Uploading source file and building the paper draft...'
                          : 'Replacing the current paper draft with the uploaded file...',
                    );
                  });
                  try {
                    await uploadPaperSourceFile(bytes, filename: file.name);
                    if (!context.mounted) {
                      return;
                    }
                    setState(() => importProgress = 0.4);
                    final rawText = PaperImportParser.extractRawText(
                      fileName: file.name,
                      bytes: bytes,
                    );
                    final importBackend = PaperImportBackend(
                      backend: backend,
                      token: controller.apiAccessToken,
                    );
                    final imported = await importBackend.importWithAi(
                      fileName: file.name,
                      rawText: rawText,
                      fileBytes: bytes,
                      importMode: 'auto',
                    );
                    if (context.mounted) {
                      setState(() => importProgress = 0.75);
                    }
                    final renderedQuestions = await enrichImportedQuestions(
                      imported.questions,
                    );
                    title.text = imported.title;
                    if (imported.instructions.isNotEmpty) {
                      instructions.text = imported.instructions.join('\n');
                    }
                    draftQuestions
                      ..clear()
                      ..addAll(renderedQuestions);
                    setState(() {
                      pendingInsertIndex = null;
                      importProgress = 1;
                      setDraftStatus(
                        'Loaded ${renderedQuestions.length} question${renderedQuestions.length == 1 ? '' : 's'} from ${file.name}. Save changes to publish this replacement paper.',
                      );
                    });
                    startNewQuestion();
                    if (draftQuestions.isNotEmpty) {
                      loadDraftQuestion(0);
                    }

                    if (!context.mounted) {
                      return;
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          imported.debugLogId == null
                              ? 'Imported ${renderedQuestions.length} question${renderedQuestions.length == 1 ? '' : 's'} from ${file.name}.'
                              : 'Imported ${renderedQuestions.length} question${renderedQuestions.length == 1 ? '' : 's'} from ${file.name}. Trace: ${imported.debugLogId}',
                        ),
                      ),
                    );
                  } catch (error) {
                    if (!context.mounted) {
                      return;
                    }
                    debugPrint('Paper import failed: $error');
                    final message =
                        error is ApiException
                            ? error.message
                            : error.toString();
                    final debug =
                        error is ApiException
                            ? (error.data?['debug'] as Map?)
                                ?.cast<String, dynamic>()
                            : null;
                    final traceId = debug?['logId']?.toString();
                    await showDialog<void>(
                      context: context,
                      builder:
                          (dialogContext) => AlertDialog(
                            title: const Text('Import failed'),
                            content: SingleChildScrollView(
                              child: SelectableText(
                                traceId == null
                                    ? message
                                    : '$message\n\nTrace: $traceId',
                                style:
                                    Theme.of(
                                      dialogContext,
                                    ).textTheme.bodyMedium,
                              ),
                            ),
                            actions: [
                              TextButton(
                                onPressed:
                                    () => Navigator.of(dialogContext).pop(),
                                child: const Text('Close'),
                              ),
                            ],
                          ),
                    );
                  } finally {
                    if (context.mounted) {
                      setState(() {
                        importing = false;
                        importProgress = 0;
                      });
                    }
                  }
                }

                if (!clipboardPasteListenerRegistered) {
                  clipboardPasteListenerRegistered = true;
                  disposeClipboardPasteListener =
                      registerClipboardImagePasteListener(
                        attachClipboardBytesToActiveTarget,
                      );
                }

                return Scaffold(
                  backgroundColor: const Color(0xFFF4F8FD),
                  body: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 22, 24, 20),
                      child: SingleChildScrollView(
                        controller: dialogScrollController,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        existingPaper == null
                                            ? 'Add paper to ${course.title}'
                                            : 'Edit paper in ${course.title}',
                                        style:
                                            Theme.of(
                                              context,
                                            ).textTheme.headlineMedium,
                                      ),
                                      const SizedBox(height: 10),
                                      Wrap(
                                        spacing: 10,
                                        runSpacing: 10,
                                        children: [
                                          _PaperMetaChip(
                                            label:
                                                '${draftQuestions.length} questions',
                                          ),
                                          _PaperMetaChip(
                                            label:
                                                '${int.tryParse(duration.text.trim()) ?? 30} mins',
                                          ),
                                          _PaperMetaChip(
                                            label:
                                                controller
                                                    .subjectById(
                                                      selectedSubjectId ?? '',
                                                    )
                                                    ?.title ??
                                                'No subject',
                                          ),
                                          _PaperMetaChip(
                                            label:
                                                isFreePreview
                                                    ? 'Free preview'
                                                    : 'Paid paper',
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 16),
                                IconButton(
                                  onPressed: () => Navigator.pop(context),
                                  icon: const Icon(Icons.close_rounded),
                                  tooltip: 'Close',
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            LayoutBuilder(
                              builder: (context, constraints) {
                                Widget composer({
                                  VoidCallback? afterSave,
                                }) => _QuestionComposerCard(
                                  sectionController: section,
                                  questionController: questionText,
                                  optionAController: optionA,
                                  optionBController: optionB,
                                  optionCController: optionC,
                                  optionDController: optionD,
                                  activeField: activeField,
                                  answerIndex: answerIndex,
                                  isEditing: selectedDraftIndex != null,
                                  editingLabel:
                                      selectedDraftIndex == null
                                          ? null
                                          : 'Editing question ${selectedDraftIndex! + 1}',
                                  onActiveFieldChanged:
                                      (value) =>
                                          setState(() => activeField = value),
                                  onSectionChanged: () => setState(() {}),
                                  onQuestionChanged: () => setState(() {}),
                                  onOptionChanged: () => setState(() {}),
                                  onAnswerChanged:
                                      (value) =>
                                          setState(() => answerIndex = value),
                                  snippets: _mathSnippets,
                                  onSnippetTap: insertSnippet,
                                  onOpenMathToolbox: openMathToolbox,
                                  onSaveQuestion: () async {
                                    await upsertDraftQuestion();
                                    afterSave?.call();
                                  },
                                  statusMessage: draftStatusMessage,
                                  statusIsError: draftStatusIsError,
                                  attachments: draftAttachments,
                                  optionAttachments: draftOptionAttachments,
                                  uploadingImageTarget: uploadingImageTarget,
                                  onUploadQuestionImage:
                                      () => attachImageToTarget('question'),
                                  onPasteQuestionImage:
                                      () => attachImageToTarget(
                                        'question',
                                        fromClipboard: true,
                                      ),
                                  onRemoveAttachment:
                                      (index) => setState(
                                        () => draftAttachments.removeAt(index),
                                      ),
                                  onUploadOptionImage:
                                      (value) => attachImageToTarget(value),
                                  onPasteOptionImage:
                                      (value) => attachImageToTarget(
                                        value,
                                        fromClipboard: true,
                                      ),
                                  onRemoveOptionAttachment:
                                      (
                                        optionIndex,
                                        attachmentIndex,
                                      ) => setState(
                                        () =>
                                            draftOptionAttachments[optionIndex]
                                                .removeAt(attachmentIndex),
                                      ),
                                  onResetComposer:
                                      () => setState(
                                        () => startNewQuestion(
                                          insertAtCurrent:
                                              selectedDraftIndex != null,
                                        ),
                                      ),
                                  showInlinePreview: true,
                                  onShowMathReference:
                                      () =>
                                          _showMathAuthoringReference(context),
                                );
                                Future<void> openQuestionComposer({
                                  int? index,
                                  bool insertAtCurrent = false,
                                }) async {
                                  if (index != null) {
                                    setState(() => loadDraftQuestion(index));
                                  } else {
                                    setState(
                                      () => startNewQuestion(
                                        insertAtCurrent: insertAtCurrent,
                                      ),
                                    );
                                  }
                                  await showDialog<void>(
                                    context: context,
                                    useRootNavigator: true,
                                    barrierDismissible: false,
                                    builder:
                                        (dialogContext) => Dialog(
                                          insetPadding:
                                              const EdgeInsets.symmetric(
                                                horizontal: 32,
                                                vertical: 20,
                                              ),
                                          child: ConstrainedBox(
                                            constraints: const BoxConstraints(
                                              maxWidth: 1400,
                                              maxHeight: 960,
                                            ),
                                            child: Padding(
                                              padding: const EdgeInsets.all(24),
                                              child: SingleChildScrollView(
                                                child: Column(
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment.start,
                                                  children: [
                                                    Row(
                                                      children: [
                                                        Expanded(
                                                          child: Text(
                                                            selectedDraftIndex ==
                                                                    null
                                                                ? 'Add question'
                                                                : 'Edit question ${selectedDraftIndex! + 1}',
                                                            style:
                                                                Theme.of(
                                                                      context,
                                                                    )
                                                                    .textTheme
                                                                    .headlineSmall,
                                                          ),
                                                        ),
                                                        if (selectedDraftIndex !=
                                                            null)
                                                          Container(
                                                            margin:
                                                                const EdgeInsets.only(
                                                                  right: 12,
                                                                ),
                                                            padding:
                                                                const EdgeInsets.symmetric(
                                                                  horizontal:
                                                                      12,
                                                                  vertical: 8,
                                                                ),
                                                            decoration: BoxDecoration(
                                                              color:
                                                                  MeritTheme
                                                                      .primarySoft,
                                                              borderRadius:
                                                                  BorderRadius.circular(
                                                                    999,
                                                                  ),
                                                              border: Border.all(
                                                                color:
                                                                    MeritTheme
                                                                        .border,
                                                              ),
                                                            ),
                                                            child: Text(
                                                              section.text
                                                                      .trim()
                                                                      .isEmpty
                                                                  ? 'General'
                                                                  : section.text
                                                                      .trim(),
                                                              style: Theme.of(
                                                                    context,
                                                                  )
                                                                  .textTheme
                                                                  .bodySmall
                                                                  ?.copyWith(
                                                                    fontWeight:
                                                                        FontWeight
                                                                            .w700,
                                                                    color:
                                                                        MeritTheme
                                                                            .secondary,
                                                                  ),
                                                            ),
                                                          ),
                                                        IconButton(
                                                          onPressed:
                                                              () =>
                                                                  Navigator.of(
                                                                    dialogContext,
                                                                  ).pop(),
                                                          icon: const Icon(
                                                            Icons.close_rounded,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 12),
                                                    composer(
                                                      afterSave:
                                                          () =>
                                                              Navigator.of(
                                                                dialogContext,
                                                              ).pop(),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                  );
                                }

                                Widget navigator() => _DraftNavigatorCard(
                                  draftQuestions: draftQuestions,
                                  selectedDraftIndex: selectedDraftIndex,
                                  onSelect: (index) {
                                    setState(() => selectedDraftIndex = index);
                                    openQuestionComposer(index: index);
                                  },
                                  onRemove:
                                      (index) => setState(() {
                                        draftQuestions.removeAt(index);
                                        if (selectedDraftIndex == index) {
                                          startNewQuestion();
                                        } else if (selectedDraftIndex != null &&
                                            selectedDraftIndex! > index) {
                                          selectedDraftIndex =
                                              selectedDraftIndex! - 1;
                                        }
                                      }),
                                  onPrevious:
                                      selectedDraftIndex != null &&
                                              selectedDraftIndex! > 0
                                          ? () => openQuestionComposer(
                                            index: selectedDraftIndex! - 1,
                                          )
                                          : null,
                                  onNext:
                                      selectedDraftIndex != null &&
                                              selectedDraftIndex! <
                                                  draftQuestions.length - 1
                                          ? () => openQuestionComposer(
                                            index: selectedDraftIndex! + 1,
                                          )
                                          : null,
                                  onJumpToIncomplete:
                                      nextIncompleteDraftIndex() == null
                                          ? null
                                          : () => openQuestionComposer(
                                            index: nextIncompleteDraftIndex()!,
                                          ),
                                );
                                final setup = <Widget>[
                                  _PaperSetupToolbar(
                                    title:
                                        title.text.trim().isEmpty
                                            ? 'Untitled paper'
                                            : title.text.trim(),
                                    durationMinutes:
                                        int.tryParse(duration.text.trim()) ??
                                        30,
                                    selectedSubjectTitle:
                                        controller
                                            .subjectById(
                                              selectedSubjectId ?? '',
                                            )
                                            ?.title ??
                                        'No subject',
                                    isFreePreview: isFreePreview,
                                    isActive: isActive,
                                    sourceFileUrl: importedSourceFileUrl,
                                    sourceFileName: importedSourceFileName,
                                    importing: importing,
                                    importProgress: importProgress,
                                    showDetails: showSetupDetails,
                                    onToggleDetails:
                                        () => setState(
                                          () =>
                                              showSetupDetails =
                                                  !showSetupDetails,
                                        ),
                                    onTogglePreview:
                                        (value) => setState(
                                          () => isFreePreview = value,
                                        ),
                                    onImport: importPaperFromFile,
                                  ),
                                  if (showSetupDetails) ...[
                                    const SizedBox(height: 12),
                                    _PaperSetupCard(
                                      titleController: title,
                                      durationController: duration,
                                      instructionsController: instructions,
                                      subjects: controller.subjectsForCourse(
                                        course.id,
                                      ),
                                      selectedSubjectId: selectedSubjectId,
                                      isFreePreview: isFreePreview,
                                      isActive: isActive,
                                      importing: importing,
                                      onSubjectChanged:
                                          (value) => setState(
                                            () => selectedSubjectId = value,
                                          ),
                                      onTogglePreview:
                                          (value) => setState(
                                            () => isFreePreview = value,
                                          ),
                                      onToggleActive:
                                          (value) =>
                                              setState(() => isActive = value),
                                      onImport: importPaperFromFile,
                                    ),
                                  ],
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          'Scroll the paper here. Open the editor only when you click Edit.',
                                          style:
                                              Theme.of(
                                                context,
                                              ).textTheme.bodyMedium,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      OutlinedButton.icon(
                                        onPressed:
                                            () => openQuestionComposer(
                                              insertAtCurrent:
                                                  selectedDraftIndex != null,
                                            ),
                                        icon: const Icon(Icons.add_rounded),
                                        label: const Text('Add question here'),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                ];
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [...setup, navigator()],
                                );
                              },
                            ),
                            const SizedBox(height: 18),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text('Cancel'),
                                ),
                                const SizedBox(width: 12),
                                ElevatedButton(
                                  onPressed:
                                      savingPaper
                                          ? null
                                          : () async {
                                            try {
                                              setState(
                                                () => savingPaper = true,
                                              );
                                              final stagedQuestions =
                                                  List<Question>.of(
                                                    draftQuestions,
                                                  );
                                              final currentDraft =
                                                  await buildDraftQuestion();
                                              if (!context.mounted) {
                                                return;
                                              }
                                              if (currentDraft != null) {
                                                if (selectedDraftIndex ==
                                                    null) {
                                                  final insertIndex =
                                                      (pendingInsertIndex ??
                                                              stagedQuestions
                                                                  .length)
                                                          .clamp(
                                                            0,
                                                            stagedQuestions
                                                                .length,
                                                          );
                                                  stagedQuestions.insert(
                                                    insertIndex,
                                                    currentDraft,
                                                  );
                                                } else {
                                                  stagedQuestions[selectedDraftIndex!] =
                                                      currentDraft;
                                                }
                                              }
                                              if (stagedQuestions.isEmpty) {
                                                ScaffoldMessenger.of(
                                                  context,
                                                ).showSnackBar(
                                                  const SnackBar(
                                                    content: Text(
                                                      'Add at least one question before saving the paper.',
                                                    ),
                                                  ),
                                                );
                                                return;
                                              }
                                              final unresolvedCount =
                                                  stagedQuestions
                                                      .where(
                                                        (question) =>
                                                            question.correctIndex <
                                                                0 ||
                                                            question.correctIndex >
                                                                3,
                                                      )
                                                      .length;
                                              if (resolvedExistingPaper ==
                                                      null &&
                                                  unresolvedCount > 0) {
                                                ScaffoldMessenger.of(
                                                  context,
                                                ).showSnackBar(
                                                  SnackBar(
                                                    content: Text(
                                                      unresolvedCount == 1
                                                          ? 'Assign the correct option for 1 question before saving.'
                                                          : 'Assign the correct option for $unresolvedCount questions before saving.',
                                                    ),
                                                  ),
                                                );
                                                return;
                                              }
                                              final normalizedInstructions =
                                                  instructions.text
                                                      .split('\n')
                                                      .map(
                                                        (line) => line.trim(),
                                                      )
                                                      .where(
                                                        (line) =>
                                                            line.isNotEmpty,
                                                      )
                                                      .toList();
                                              if (resolvedExistingPaper ==
                                                  null) {
                                                await controller.addPaper(
                                                  courseId: course.id,
                                                  subjectId: selectedSubjectId,
                                                  title: title.text.trim(),
                                                  durationMinutes:
                                                      int.tryParse(
                                                        duration.text.trim(),
                                                      ) ??
                                                      30,
                                                  isFreePreview: isFreePreview,
                                                  isActive: isActive,
                                                  instructions:
                                                      normalizedInstructions,
                                                  questions: stagedQuestions,
                                                  sourceFileUrl:
                                                      importedSourceFileUrl,
                                                  sourceFileName:
                                                      importedSourceFileName,
                                                );
                                              } else {
                                                await controller.updatePaper(
                                                  paperId:
                                                      resolvedExistingPaper.id,
                                                  courseId: course.id,
                                                  subjectId: selectedSubjectId,
                                                  title: title.text.trim(),
                                                  durationMinutes:
                                                      int.tryParse(
                                                        duration.text.trim(),
                                                      ) ??
                                                      30,
                                                  isFreePreview: isFreePreview,
                                                  isActive: isActive,
                                                  instructions:
                                                      normalizedInstructions,
                                                  questions: stagedQuestions,
                                                  sourceFileUrl:
                                                      importedSourceFileUrl,
                                                  sourceFileName:
                                                      importedSourceFileName,
                                                );
                                              }
                                              if (!context.mounted) {
                                                return;
                                              }
                                              final notice =
                                                  unresolvedCount > 0
                                                      ? (unresolvedCount == 1
                                                          ? 'Paper saved. 1 question still needs a correct answer before it is production-ready.'
                                                          : 'Paper saved. $unresolvedCount questions still need correct answers before they are production-ready.')
                                                      : (resolvedExistingPaper ==
                                                              null
                                                          ? 'Paper created successfully.'
                                                          : 'Paper changes saved successfully.');
                                              Navigator.pop(context, notice);
                                            } catch (error) {
                                              if (!context.mounted) {
                                                return;
                                              }
                                              final message =
                                                  error is ApiException
                                                      ? error.message
                                                      : 'Could not save paper changes.';
                                              setState(
                                                () => setDraftStatus(
                                                  message,
                                                  isError: true,
                                                ),
                                              );
                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                SnackBar(
                                                  content: Text(message),
                                                ),
                                              );
                                            } finally {
                                              if (context.mounted) {
                                                setState(
                                                  () => savingPaper = false,
                                                );
                                              }
                                            }
                                          },
                                  child: Text(
                                    savingPaper
                                        ? 'Saving...'
                                        : resolvedExistingPaper == null
                                        ? 'Add paper'
                                        : 'Save changes',
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
      ),
    );
    disposeClipboardPasteListener?.call();
    dialogScrollController.dispose();
    if (context.mounted && saveNotice != null && saveNotice.isNotEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(saveNotice)));
    }
  }

  Future<void> _showMathAuthoringReference(BuildContext context) async {
    await showDialog<void>(
      context: context,
      builder:
          (dialogContext) => Dialog(
            insetPadding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 960, maxHeight: 760),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Math authoring reference',
                            style:
                                Theme.of(dialogContext).textTheme.headlineSmall,
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(dialogContext).pop(),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Expanded(
                      child: SingleChildScrollView(
                        child: _MathAuthoringGuide(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
    );
  }

  List<Paper> _visiblePapersForCourse({
    required List<Paper> papers,
    required String? selectedSubjectId,
    required String searchQuery,
  }) {
    final normalizedQuery = searchQuery.trim().toLowerCase();
    final filtered =
        papers.where((paper) {
            final matchesSubject =
                selectedSubjectId == null
                    ? paper.subjectId == null
                    : paper.subjectId == selectedSubjectId;
            if (!matchesSubject) {
              return false;
            }
            if (normalizedQuery.isEmpty) {
              return true;
            }
            return paper.title.toLowerCase().contains(normalizedQuery);
          }).toList()
          ..sort(
            (a, b) => a.title.toLowerCase().compareTo(b.title.toLowerCase()),
          );
    return filtered;
  }

  Subject? _resolveSelectedSubject(Course course, List<Subject> subjects) {
    final selectedId = _selectedSubjectIds[course.id];
    if (selectedId != null) {
      for (final subject in subjects) {
        if (subject.id == selectedId) {
          return subject;
        }
      }
    }
    if (subjects.isNotEmpty) {
      final subject = subjects.first;
      _selectedSubjectIds[course.id] = subject.id;
      return subject;
    }
    _selectedSubjectIds.remove(course.id);
    return null;
  }

  Widget _buildSubjectChip({
    required BuildContext context,
    required Subject subject,
    required bool selected,
    required VoidCallback onTap,
    required VoidCallback onEdit,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? MeritTheme.primarySoft : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? MeritTheme.primary : MeritTheme.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              subject.title,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? MeritTheme.secondary : null,
              ),
            ),
            const SizedBox(width: 6),
            InkWell(
              borderRadius: BorderRadius.circular(999),
              onTap: onEdit,
              child: const Padding(
                padding: EdgeInsets.all(2),
                child: Icon(Icons.edit_outlined, size: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deletePaper(BuildContext context, Paper paper) async {
    final controller = AppScope.of(context);
    final shouldDelete =
        await showDialog<bool>(
          context: context,
          builder:
              (dialogContext) => AlertDialog(
                title: const Text('Delete paper?'),
                content: Text('Delete "${paper.title}" permanently?'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(dialogContext, false),
                    child: const Text('Cancel'),
                  ),
                  FilledButton(
                    onPressed: () => Navigator.pop(dialogContext, true),
                    style: FilledButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.error,
                    ),
                    child: const Text('Delete paper'),
                  ),
                ],
              ),
        ) ??
        false;
    if (!shouldDelete) return;
    await controller.deletePaper(paper.id);
    if (!context.mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('"${paper.title}" deleted.')));
  }

  Widget _buildPaperTile(
    BuildContext context,
    Course course,
    Paper paper,
    bool compact,
  ) {
    if (compact) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  paper.title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              if (paper.isFreePreview)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: MeritTheme.accent.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text('Free'),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _PaperMetaChip(label: '${paper.durationMinutes} mins'),
              _PaperMetaChip(label: '${paper.displayQuestionCount} questions'),
              _PaperMetaChip(label: paper.isActive ? 'Active' : 'Inactive'),
              if (paper.instructions.isNotEmpty)
                _PaperMetaChip(
                  label: '${paper.instructions.length} instructions',
                ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed:
                        () => _openPaperDialog(
                          context,
                          course,
                          existingPaper: paper,
                        ),
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _deletePaper(context, paper),
                    icon: const Icon(Icons.delete_outline),
                    label: const Text('Delete'),
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      paper.title,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  if (paper.isFreePreview)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: MeritTheme.accent.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text('Free'),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _PaperMetaChip(label: '${paper.durationMinutes} mins'),
                  _PaperMetaChip(
                    label: '${paper.displayQuestionCount} questions',
                  ),
                  _PaperMetaChip(label: paper.isActive ? 'Active' : 'Inactive'),
                  if (paper.instructions.isNotEmpty)
                    _PaperMetaChip(
                      label: '${paper.instructions.length} instructions',
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            OutlinedButton.icon(
              onPressed:
                  () => _openPaperDialog(context, course, existingPaper: paper),
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Edit'),
            ),
            OutlinedButton.icon(
              onPressed: () => _deletePaper(context, paper),
              icon: const Icon(Icons.delete_outline),
              label: const Text('Delete'),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final compact = MediaQuery.sizeOf(context).width < 900;
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        compact
            ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Content management',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _openCourseDialog(context),
                    icon: const Icon(Icons.add),
                    label: const Text('New course'),
                  ),
                ),
              ],
            )
            : Row(
              children: [
                Text(
                  'Content management',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const Spacer(),
                ElevatedButton.icon(
                  onPressed: () => _openCourseDialog(context),
                  icon: const Icon(Icons.add),
                  label: const Text('New course'),
                ),
              ],
            ),
        const SizedBox(height: 20),
        ...controller.courses.map((course) {
          final papers = controller.papersForCourse(course.id);
          final subjects = controller.subjectsForCourse(course.id);
          final selectedSubject = _resolveSelectedSubject(course, subjects);
          final selectedSubjectId = selectedSubject?.id;
          final paperSearchController = _paperSearchControllerFor(course.id);
          final visiblePapers = _visiblePapersForCourse(
            papers: papers,
            selectedSubjectId: selectedSubjectId,
            searchQuery: _paperSearchQueries[course.id] ?? '',
          );
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  compact
                      ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            course.title,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 6),
                          Text(course.subtitle),
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed:
                                  () => _openSubjectDialog(context, course),
                              icon: const Icon(Icons.account_tree_outlined),
                              label: const Text('Add subject'),
                            ),
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed:
                                  () => _openPaperDialog(context, course),
                              icon: const Icon(Icons.note_add_outlined),
                              label: const Text('Add paper'),
                            ),
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed:
                                  () => _setCourseVideoUrl(context, course),
                              icon: const Icon(Icons.link_outlined),
                              label: const Text('Set video URL'),
                            ),
                          ),
                        ],
                      )
                      : Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  course.title,
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(height: 6),
                                Text(course.subtitle),
                              ],
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed:
                                () => _openSubjectDialog(context, course),
                            icon: const Icon(Icons.account_tree_outlined),
                            label: const Text('Add subject'),
                          ),
                          const SizedBox(width: 12),
                          OutlinedButton.icon(
                            onPressed: () => _openPaperDialog(context, course),
                            icon: const Icon(Icons.note_add_outlined),
                            label: const Text('Add paper'),
                          ),
                          const SizedBox(width: 12),
                          OutlinedButton.icon(
                            onPressed:
                                () => _setCourseVideoUrl(context, course),
                            icon: const Icon(Icons.link_outlined),
                            label: const Text('Set video URL'),
                          ),
                        ],
                      ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _PaperMetaChip(
                        label:
                            course.purchaseMode == PurchaseMode.subject
                                ? 'Subject unlock'
                                : 'Full course unlock',
                      ),
                      _PaperMetaChip(label: purchaseBadgeLabel(course)),
                      _PaperMetaChip(label: totalPriceLabel(course)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (course.introVideoUrl != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        'Video attached to this course.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  if (subjects.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children:
                            subjects
                                .map(
                                  (subject) => _buildSubjectChip(
                                    context: context,
                                    subject: subject,
                                    selected: subject.id == selectedSubjectId,
                                    onTap:
                                        () => setState(
                                          () =>
                                              _selectedSubjectIds[course.id] =
                                                  subject.id,
                                        ),
                                    onEdit:
                                        () => _openSubjectDialog(
                                          context,
                                          course,
                                          existingSubject: subject,
                                        ),
                                  ),
                                )
                                .toList(),
                      ),
                    ),
                  if (subjects.isNotEmpty) ...[
                    TextField(
                      controller: paperSearchController,
                      decoration: InputDecoration(
                        hintText:
                            'Search paper name inside ${selectedSubject?.title ?? "this subject"}',
                        prefixIcon: const Icon(Icons.search_rounded),
                        suffixIcon:
                            (paperSearchController.text.isEmpty)
                                ? null
                                : IconButton(
                                  icon: const Icon(Icons.close_rounded),
                                  onPressed:
                                      () => paperSearchController.clear(),
                                ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (selectedSubject != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: MeritTheme.background,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: MeritTheme.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (compact)
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  selectedSubject.title,
                                  style:
                                      Theme.of(context).textTheme.titleMedium,
                                ),
                                if (selectedSubject.description.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    selectedSubject.description,
                                    style:
                                        Theme.of(context).textTheme.bodyMedium,
                                  ),
                                ],
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    _PaperMetaChip(
                                      label: '${visiblePapers.length} papers',
                                    ),
                                    OutlinedButton.icon(
                                      onPressed:
                                          () => _openSubjectDialog(
                                            context,
                                            course,
                                            existingSubject: selectedSubject,
                                          ),
                                      icon: const Icon(Icons.edit_outlined),
                                      label: const Text('Edit subject'),
                                    ),
                                  ],
                                ),
                              ],
                            )
                          else
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        selectedSubject.title,
                                        style:
                                            Theme.of(
                                              context,
                                            ).textTheme.titleMedium,
                                      ),
                                      if (selectedSubject
                                          .description
                                          .isNotEmpty) ...[
                                        const SizedBox(height: 6),
                                        Text(
                                          selectedSubject.description,
                                          style:
                                              Theme.of(
                                                context,
                                              ).textTheme.bodyMedium,
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                _PaperMetaChip(
                                  label: '${visiblePapers.length} papers',
                                ),
                                const SizedBox(width: 10),
                                OutlinedButton.icon(
                                  onPressed:
                                      () => _openSubjectDialog(
                                        context,
                                        course,
                                        existingSubject: selectedSubject,
                                      ),
                                  icon: const Icon(Icons.edit_outlined),
                                  label: const Text('Edit subject'),
                                ),
                              ],
                            ),
                          const SizedBox(height: 10),
                          if (visiblePapers.isEmpty)
                            Text(
                              paperSearchController.text.isEmpty
                                  ? 'No papers added in this subject yet.'
                                  : 'No papers match this search.',
                              style: Theme.of(context).textTheme.bodyMedium,
                            )
                          else
                            ...visiblePapers.map(
                              (paper) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _buildPaperTile(
                                  context,
                                  course,
                                  paper,
                                  compact,
                                ),
                              ),
                            ),
                        ],
                      ),
                    )
                  else if (subjects.isEmpty && papers.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: MeritTheme.background,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: MeritTheme.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'General papers',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 10),
                          ..._visiblePapersForCourse(
                            papers: papers,
                            selectedSubjectId: null,
                            searchQuery: _paperSearchQueries[course.id] ?? '',
                          ).map(
                            (paper) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _buildPaperTile(
                                context,
                                course,
                                paper,
                                compact,
                              ),
                            ),
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
    );
  }
}

class _PaperMetaChip extends StatelessWidget {
  const _PaperMetaChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Text(label, style: Theme.of(context).textTheme.bodySmall),
    );
  }
}

class _PaperSetupToolbar extends StatelessWidget {
  const _PaperSetupToolbar({
    required this.title,
    required this.durationMinutes,
    required this.selectedSubjectTitle,
    required this.isFreePreview,
    required this.isActive,
    this.sourceFileUrl,
    this.sourceFileName,
    required this.importing,
    required this.importProgress,
    required this.showDetails,
    required this.onToggleDetails,
    required this.onTogglePreview,
    required this.onImport,
  });

  final String title;
  final int durationMinutes;
  final String selectedSubjectTitle;
  final bool isFreePreview;
  final bool isActive;
  final String? sourceFileUrl;
  final String? sourceFileName;
  final bool importing;
  final double importProgress;
  final bool showDetails;
  final VoidCallback onToggleDetails;
  final ValueChanged<bool> onTogglePreview;
  final Future<void> Function() onImport;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _PaperMetaChip(label: '$durationMinutes mins'),
                    _PaperMetaChip(label: selectedSubjectTitle),
                    _PaperMetaChip(
                      label: isFreePreview ? 'Free preview' : 'Paid paper',
                    ),
                    _PaperMetaChip(
                      label:
                          isActive
                              ? 'Active on portal'
                              : 'Hidden from students',
                    ),
                    const _PaperMetaChip(label: 'Automatic import'),
                  ],
                ),
              ],
            ),
          ),
          if (importing) ...[
            const SizedBox(width: 12),
            SizedBox(
              width: 180,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Replacing paper...', style: theme.textTheme.labelLarge),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value:
                        importProgress > 0 && importProgress <= 1
                            ? importProgress
                            : null,
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(width: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              FilledButton.icon(
                onPressed: importing ? null : onImport,
                icon: Icon(
                  importing
                      ? Icons.hourglass_top_rounded
                      : Icons.upload_file_rounded,
                ),
                label: Text(importing ? 'Importing...' : 'Upload file'),
              ),
              if ((sourceFileUrl ?? '').trim().isNotEmpty)
                OutlinedButton.icon(
                  onPressed:
                      () => launchUrl(
                        Uri.parse(sourceFileUrl!),
                        webOnlyWindowName: '_blank',
                      ),
                  icon: const Icon(Icons.download_rounded),
                  label: Text(
                    sourceFileName?.trim().isNotEmpty == true
                        ? 'Source file'
                        : 'Download source',
                  ),
                ),
              OutlinedButton.icon(
                onPressed: onToggleDetails,
                icon: Icon(
                  showDetails ? Icons.expand_less_rounded : Icons.tune_rounded,
                ),
                label: Text(showDetails ? 'Hide setup' : 'Setup'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PaperSetupCard extends StatelessWidget {
  const _PaperSetupCard({
    required this.titleController,
    required this.durationController,
    required this.instructionsController,
    required this.subjects,
    required this.selectedSubjectId,
    required this.isFreePreview,
    required this.isActive,
    required this.importing,
    required this.onSubjectChanged,
    required this.onTogglePreview,
    required this.onToggleActive,
    required this.onImport,
  });

  final TextEditingController titleController;
  final TextEditingController durationController;
  final TextEditingController instructionsController;
  final List<Subject> subjects;
  final String? selectedSubjectId;
  final bool isFreePreview;
  final bool isActive;
  final bool importing;
  final ValueChanged<String?> onSubjectChanged;
  final ValueChanged<bool> onTogglePreview;
  final ValueChanged<bool> onToggleActive;
  final Future<void> Function() onImport;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 760;
        final theme = Theme.of(context);
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
              compact
                  ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Paper setup', style: theme.textTheme.titleLarge),
                      const SizedBox(height: 4),
                      Text(
                        'Keep metadata hidden while writing questions. Open this only when needed.',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  )
                  : Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Paper setup',
                              style: theme.textTheme.titleLarge,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Keep metadata hidden while writing questions. Open this only when needed.',
                              style: theme.textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
              const SizedBox(height: 14),
              compact
                  ? Column(
                    children: [
                      TextField(
                        controller: titleController,
                        decoration: const InputDecoration(
                          labelText: 'Paper title',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: durationController,
                        decoration: const InputDecoration(
                          labelText: 'Duration (minutes)',
                        ),
                      ),
                    ],
                  )
                  : Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: TextField(
                          controller: titleController,
                          decoration: const InputDecoration(
                            labelText: 'Paper title',
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: durationController,
                          decoration: const InputDecoration(
                            labelText: 'Duration (minutes)',
                          ),
                        ),
                      ),
                    ],
                  ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: Text('Subject', style: theme.textTheme.labelLarge),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('General / no subject'),
                    selected: selectedSubjectId == null,
                    onSelected: (_) => onSubjectChanged(null),
                  ),
                  ...subjects.map(
                    (subject) => ChoiceChip(
                      label: Text(subject.title),
                      selected: subject.id == selectedSubjectId,
                      onSelected: (_) => onSubjectChanged(subject.id),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: instructionsController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Instructions (one per line)',
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 24,
                runSpacing: 10,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Free preview'),
                      const SizedBox(width: 8),
                      Switch.adaptive(
                        value: isFreePreview,
                        onChanged: onTogglePreview,
                      ),
                    ],
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Visible to students'),
                      const SizedBox(width: 8),
                      Switch.adaptive(
                        value: isActive,
                        onChanged: onToggleActive,
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _QuestionComposerCard extends StatelessWidget {
  const _QuestionComposerCard({
    required this.sectionController,
    required this.questionController,
    required this.optionAController,
    required this.optionBController,
    required this.optionCController,
    required this.optionDController,
    required this.activeField,
    required this.answerIndex,
    required this.isEditing,
    required this.editingLabel,
    required this.onActiveFieldChanged,
    required this.onSectionChanged,
    required this.onQuestionChanged,
    required this.onOptionChanged,
    required this.onAnswerChanged,
    required this.snippets,
    required this.onSnippetTap,
    required this.onOpenMathToolbox,
    required this.onSaveQuestion,
    required this.statusMessage,
    required this.statusIsError,
    required this.attachments,
    required this.optionAttachments,
    required this.uploadingImageTarget,
    required this.onUploadQuestionImage,
    required this.onPasteQuestionImage,
    required this.onRemoveAttachment,
    required this.onUploadOptionImage,
    required this.onPasteOptionImage,
    required this.onRemoveOptionAttachment,
    required this.onResetComposer,
    required this.onShowMathReference,
    this.showInlinePreview = true,
  });

  final TextEditingController sectionController;
  final quill.QuillController questionController;
  final quill.QuillController optionAController;
  final quill.QuillController optionBController;
  final quill.QuillController optionCController;
  final quill.QuillController optionDController;
  final String activeField;
  final int answerIndex;
  final bool isEditing;
  final String? editingLabel;
  final ValueChanged<String> onActiveFieldChanged;
  final VoidCallback onSectionChanged;
  final VoidCallback onQuestionChanged;
  final VoidCallback onOptionChanged;
  final ValueChanged<int> onAnswerChanged;
  final List<_MathSnippet> snippets;
  final ValueChanged<String> onSnippetTap;
  final Future<void> Function() onOpenMathToolbox;
  final Future<void> Function() onSaveQuestion;
  final String? statusMessage;
  final bool statusIsError;
  final List<QuestionAttachment> attachments;
  final List<List<QuestionAttachment>> optionAttachments;
  final String? uploadingImageTarget;
  final Future<void> Function() onUploadQuestionImage;
  final Future<void> Function() onPasteQuestionImage;
  final ValueChanged<int> onRemoveAttachment;
  final Future<void> Function(String optionKey) onUploadOptionImage;
  final Future<void> Function(String optionKey) onPasteOptionImage;
  final void Function(int optionIndex, int attachmentIndex)
  onRemoveOptionAttachment;
  final VoidCallback onResetComposer;
  final VoidCallback onShowMathReference;
  final bool showInlinePreview;

  quill.QuillController activeControllerForKey(String key) {
    switch (key) {
      case 'a':
        return optionAController;
      case 'b':
        return optionBController;
      case 'c':
        return optionCController;
      case 'd':
        return optionDController;
      default:
        return questionController;
    }
  }

  @override
  Widget build(BuildContext context) {
    final answerAssigned = answerIndex >= 0 && answerIndex < 4;
    void toggleInlineAttribute(quill.Attribute attribute) {
      final controller = activeControllerForKey(activeField);
      final styles = controller.getSelectionStyle().attributes;
      final alreadyApplied = styles.containsKey(attribute.key);
      controller.formatSelection(
        alreadyApplied
            ? quill.Attribute.fromKeyValue(attribute.key, null)
            : attribute,
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 760;
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
              compact
                  ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isEditing
                            ? editingLabel ?? 'Edit question'
                            : 'Compose question',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isEditing
                            ? 'Editing the selected draft question.'
                            : 'Compose one clean question at a time.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  )
                  : Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isEditing
                                  ? editingLabel ?? 'Edit question'
                                  : 'Compose question',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              isEditing
                                  ? 'Editing the selected draft question.'
                                  : 'Compose one clean question at a time.',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  OutlinedButton.icon(
                    onPressed: onShowMathReference,
                    icon: const Icon(Icons.functions_rounded),
                    label: const Text('Legacy reference'),
                  ),
                  OutlinedButton.icon(
                    onPressed: onResetComposer,
                    icon: const Icon(Icons.add_circle_outline),
                    label: Text(
                      isEditing ? 'Insert new question here' : 'New question',
                    ),
                  ),
                  if (statusMessage != null && statusMessage!.trim().isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color:
                            statusIsError
                                ? const Color(0xFFFFF4EA)
                                : MeritTheme.primarySoft,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color:
                              statusIsError
                                  ? const Color(0xFFFFC79D)
                                  : MeritTheme.border,
                        ),
                      ),
                      child: Text(
                        statusMessage!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color:
                              statusIsError
                                  ? const Color(0xFF9A4A17)
                                  : MeritTheme.secondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: sectionController,
                onChanged: (_) => onSectionChanged(),
                decoration: const InputDecoration(
                  labelText: 'Question section',
                ),
              ),
              const SizedBox(height: 16),
              _FormattingToolbar(
                onBold: () => toggleInlineAttribute(quill.Attribute.bold),
                onItalic: () => toggleInlineAttribute(quill.Attribute.italic),
                onUnderline:
                    () => toggleInlineAttribute(quill.Attribute.underline),
                onSnippetTap: onSnippetTap,
                onOpenMathToolbox: onOpenMathToolbox,
                activeField: activeField,
                snippets: snippets,
              ),
              const SizedBox(height: 12),
              _RichEditorField(
                controller: questionController,
                label: 'Question text',
                placeholder:
                    'Write the question here. Use the math toolbox for matrices, tables, determinants, and rich symbols.',
                onTap: () => onActiveFieldChanged('question'),
                onChanged: onQuestionChanged,
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: MeritTheme.background,
                  borderRadius: BorderRadius.circular(18),
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
                                'Question image / reference diagram',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Attach any diagram, graph, or visual reference that belongs to this question.',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            OutlinedButton.icon(
                              onPressed:
                                  uploadingImageTarget == 'question'
                                      ? null
                                      : onPasteQuestionImage,
                              icon: const Icon(Icons.content_paste_rounded),
                              label: const Text('Paste image'),
                            ),
                            OutlinedButton.icon(
                              onPressed:
                                  uploadingImageTarget == 'question'
                                      ? null
                                      : onUploadQuestionImage,
                              icon: const Icon(Icons.image_outlined),
                              label: Text(
                                uploadingImageTarget == 'question'
                                    ? 'Uploading...'
                                    : 'Upload image',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    if (attachments.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: List.generate(attachments.length, (index) {
                          final attachment = attachments[index];
                          return _QuestionAttachmentCard(
                            attachment: attachment,
                            onRemove: () => onRemoveAttachment(index),
                          );
                        }),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
              compact
                  ? Column(
                    children: [
                      _OptionEditorField(
                        optionKey: 'a',
                        label: 'Option A',
                        controller: optionAController,
                        onTap: () => onActiveFieldChanged('a'),
                        onChanged: onOptionChanged,
                        attachments: optionAttachments[0],
                        uploading: uploadingImageTarget == 'a',
                        onPasteImage: () => onPasteOptionImage('a'),
                        onUploadImage: () => onUploadOptionImage('a'),
                        onRemoveAttachment:
                            (attachmentIndex) =>
                                onRemoveOptionAttachment(0, attachmentIndex),
                      ),
                      const SizedBox(height: 12),
                      _OptionEditorField(
                        optionKey: 'b',
                        label: 'Option B',
                        controller: optionBController,
                        onTap: () => onActiveFieldChanged('b'),
                        onChanged: onOptionChanged,
                        attachments: optionAttachments[1],
                        uploading: uploadingImageTarget == 'b',
                        onPasteImage: () => onPasteOptionImage('b'),
                        onUploadImage: () => onUploadOptionImage('b'),
                        onRemoveAttachment:
                            (attachmentIndex) =>
                                onRemoveOptionAttachment(1, attachmentIndex),
                      ),
                    ],
                  )
                  : Row(
                    children: [
                      Expanded(
                        child: _OptionEditorField(
                          optionKey: 'a',
                          label: 'Option A',
                          controller: optionAController,
                          onTap: () => onActiveFieldChanged('a'),
                          onChanged: onOptionChanged,
                          attachments: optionAttachments[0],
                          uploading: uploadingImageTarget == 'a',
                          onPasteImage: () => onPasteOptionImage('a'),
                          onUploadImage: () => onUploadOptionImage('a'),
                          onRemoveAttachment:
                              (attachmentIndex) =>
                                  onRemoveOptionAttachment(0, attachmentIndex),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _OptionEditorField(
                          optionKey: 'b',
                          label: 'Option B',
                          controller: optionBController,
                          onTap: () => onActiveFieldChanged('b'),
                          onChanged: onOptionChanged,
                          attachments: optionAttachments[1],
                          uploading: uploadingImageTarget == 'b',
                          onPasteImage: () => onPasteOptionImage('b'),
                          onUploadImage: () => onUploadOptionImage('b'),
                          onRemoveAttachment:
                              (attachmentIndex) =>
                                  onRemoveOptionAttachment(1, attachmentIndex),
                        ),
                      ),
                    ],
                  ),
              const SizedBox(height: 12),
              compact
                  ? Column(
                    children: [
                      _OptionEditorField(
                        optionKey: 'c',
                        label: 'Option C',
                        controller: optionCController,
                        onTap: () => onActiveFieldChanged('c'),
                        onChanged: onOptionChanged,
                        attachments: optionAttachments[2],
                        uploading: uploadingImageTarget == 'c',
                        onPasteImage: () => onPasteOptionImage('c'),
                        onUploadImage: () => onUploadOptionImage('c'),
                        onRemoveAttachment:
                            (attachmentIndex) =>
                                onRemoveOptionAttachment(2, attachmentIndex),
                      ),
                      const SizedBox(height: 12),
                      _OptionEditorField(
                        optionKey: 'd',
                        label: 'Option D',
                        controller: optionDController,
                        onTap: () => onActiveFieldChanged('d'),
                        onChanged: onOptionChanged,
                        attachments: optionAttachments[3],
                        uploading: uploadingImageTarget == 'd',
                        onPasteImage: () => onPasteOptionImage('d'),
                        onUploadImage: () => onUploadOptionImage('d'),
                        onRemoveAttachment:
                            (attachmentIndex) =>
                                onRemoveOptionAttachment(3, attachmentIndex),
                      ),
                    ],
                  )
                  : Row(
                    children: [
                      Expanded(
                        child: _OptionEditorField(
                          optionKey: 'c',
                          label: 'Option C',
                          controller: optionCController,
                          onTap: () => onActiveFieldChanged('c'),
                          onChanged: onOptionChanged,
                          attachments: optionAttachments[2],
                          uploading: uploadingImageTarget == 'c',
                          onPasteImage: () => onPasteOptionImage('c'),
                          onUploadImage: () => onUploadOptionImage('c'),
                          onRemoveAttachment:
                              (attachmentIndex) =>
                                  onRemoveOptionAttachment(2, attachmentIndex),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _OptionEditorField(
                          optionKey: 'd',
                          label: 'Option D',
                          controller: optionDController,
                          onTap: () => onActiveFieldChanged('d'),
                          onChanged: onOptionChanged,
                          attachments: optionAttachments[3],
                          uploading: uploadingImageTarget == 'd',
                          onPasteImage: () => onPasteOptionImage('d'),
                          onUploadImage: () => onUploadOptionImage('d'),
                          onRemoveAttachment:
                              (attachmentIndex) =>
                                  onRemoveOptionAttachment(3, attachmentIndex),
                        ),
                      ),
                    ],
                  ),
              const SizedBox(height: 12),
              compact
                  ? Column(
                    children: [
                      DropdownButtonFormField<int>(
                        value: answerIndex,
                        decoration: const InputDecoration(
                          labelText: 'Correct option',
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: -1,
                            child: Text('Answer required'),
                          ),
                          DropdownMenuItem(value: 0, child: Text('A')),
                          DropdownMenuItem(value: 1, child: Text('B')),
                          DropdownMenuItem(value: 2, child: Text('C')),
                          DropdownMenuItem(value: 3, child: Text('D')),
                        ],
                        onChanged: (value) => onAnswerChanged(value ?? -1),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          color:
                              answerAssigned
                                  ? MeritTheme.primarySoft
                                  : const Color(0xFFFFF1E7),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color:
                                answerAssigned
                                    ? MeritTheme.border
                                    : const Color(0xFFFFBE98),
                          ),
                        ),
                        child: Text(
                          answerAssigned
                              ? 'Current answer: ${String.fromCharCode(65 + answerIndex)}'
                              : 'Answer required before publishing',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                    ],
                  )
                  : Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<int>(
                          value: answerIndex,
                          decoration: const InputDecoration(
                            labelText: 'Correct option',
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: -1,
                              child: Text('Answer required'),
                            ),
                            DropdownMenuItem(value: 0, child: Text('A')),
                            DropdownMenuItem(value: 1, child: Text('B')),
                            DropdownMenuItem(value: 2, child: Text('C')),
                            DropdownMenuItem(value: 3, child: Text('D')),
                          ],
                          onChanged: (value) => onAnswerChanged(value ?? -1),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          decoration: BoxDecoration(
                            color:
                                answerAssigned
                                    ? MeritTheme.primarySoft
                                    : const Color(0xFFFFF1E7),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color:
                                  answerAssigned
                                      ? MeritTheme.border
                                      : const Color(0xFFFFBE98),
                            ),
                          ),
                          child: Text(
                            answerAssigned
                                ? 'Current answer: ${String.fromCharCode(65 + answerIndex)}'
                                : 'Answer required before publishing',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ),
                      ),
                    ],
                  ),
              if (showInlinePreview) ...[
                const SizedBox(height: 16),
                Theme(
                  data: Theme.of(
                    context,
                  ).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    childrenPadding: EdgeInsets.zero,
                    initiallyExpanded: false,
                    title: const Text('Student preview'),
                    subtitle: const Text(
                      'Open only when you want to verify layout and maths.',
                    ),
                    children: [
                      const SizedBox(height: 8),
                      _StudentQuestionPreviewCard(
                        section: sectionController.text,
                        prompt: RichContentCodec.encodeDocument(
                          questionController.document,
                        ),
                        attachments: attachments,
                        optionAttachments: optionAttachments,
                        options: [
                          RichContentCodec.encodeDocument(
                            optionAController.document,
                          ),
                          RichContentCodec.encodeDocument(
                            optionBController.document,
                          ),
                          RichContentCodec.encodeDocument(
                            optionCController.document,
                          ),
                          RichContentCodec.encodeDocument(
                            optionDController.document,
                          ),
                        ],
                        correctIndex: answerIndex,
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              compact
                  ? Column(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: onSaveQuestion,
                          icon: Icon(
                            isEditing
                                ? Icons.save_outlined
                                : Icons.playlist_add_rounded,
                          ),
                          label: Text(
                            isEditing ? 'Update question' : 'Add question',
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: onResetComposer,
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Clear form'),
                        ),
                      ),
                    ],
                  )
                  : Row(
                    children: [
                      ElevatedButton.icon(
                        onPressed: onSaveQuestion,
                        icon: Icon(
                          isEditing
                              ? Icons.save_outlined
                              : Icons.playlist_add_rounded,
                        ),
                        label: Text(
                          isEditing ? 'Update question' : 'Add question',
                        ),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton.icon(
                        onPressed: onResetComposer,
                        icon: const Icon(Icons.refresh_rounded),
                        label: const Text('Clear form'),
                      ),
                    ],
                  ),
            ],
          ),
        );
      },
    );
  }
}

String _detectImageMimeType(Uint8List bytes) {
  if (bytes.length >= 4 &&
      bytes[0] == 0x89 &&
      bytes[1] == 0x50 &&
      bytes[2] == 0x4E &&
      bytes[3] == 0x47) {
    return 'image/png';
  }
  if (bytes.length >= 3 &&
      bytes[0] == 0xFF &&
      bytes[1] == 0xD8 &&
      bytes[2] == 0xFF) {
    return 'image/jpeg';
  }
  if (bytes.length >= 2 && bytes[0] == 0x42 && bytes[1] == 0x4D) {
    return 'image/bmp';
  }
  if (bytes.length >= 4 &&
      bytes[0] == 0x47 &&
      bytes[1] == 0x49 &&
      bytes[2] == 0x46 &&
      bytes[3] == 0x38) {
    return 'image/gif';
  }
  if (bytes.length >= 12 &&
      String.fromCharCodes(bytes.sublist(0, 4)) == 'RIFF' &&
      String.fromCharCodes(bytes.sublist(8, 12)) == 'WEBP') {
    return 'image/webp';
  }
  if (bytes.length >= 4 &&
      ((bytes[0] == 0x49 &&
              bytes[1] == 0x49 &&
              bytes[2] == 0x2A &&
              bytes[3] == 0x00) ||
          (bytes[0] == 0x4D &&
              bytes[1] == 0x4D &&
              bytes[2] == 0x00 &&
              bytes[3] == 0x2A))) {
    return 'image/tiff';
  }
  return 'image/png';
}

String _extensionForImageMime(String mimeType) {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/bmp':
      return 'bmp';
    case 'image/tiff':
      return 'tiff';
    default:
      return 'png';
  }
}

class _FormattingToolbar extends StatelessWidget {
  const _FormattingToolbar({
    required this.onBold,
    required this.onItalic,
    required this.onUnderline,
    required this.onSnippetTap,
    required this.onOpenMathToolbox,
    required this.activeField,
    required this.snippets,
  });

  final VoidCallback onBold;
  final VoidCallback onItalic;
  final VoidCallback onUnderline;
  final ValueChanged<String> onSnippetTap;
  final Future<void> Function() onOpenMathToolbox;
  final String activeField;
  final List<_MathSnippet> snippets;

  String _fieldLabel(String key) {
    switch (key) {
      case 'a':
        return 'Option A';
      case 'b':
        return 'Option B';
      case 'c':
        return 'Option C';
      case 'd':
        return 'Option D';
      default:
        return 'Question text';
    }
  }

  @override
  Widget build(BuildContext context) {
    final quickSnippets = snippets.take(8).toList();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: MeritTheme.background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          _FormatChip(
            icon: Icons.format_bold_rounded,
            label: 'Bold',
            onTap: onBold,
          ),
          _FormatChip(
            icon: Icons.format_italic_rounded,
            label: 'Italic',
            onTap: onItalic,
          ),
          _FormatChip(
            icon: Icons.format_underline_rounded,
            label: 'Underline',
            onTap: onUnderline,
          ),
          _FormatChip(
            icon: Icons.calculate_rounded,
            label: 'Math toolbox',
            onTap: () {
              onOpenMathToolbox();
            },
          ),
          const SizedBox(width: 8),
          Text(
            'Quick symbols for ${_fieldLabel(activeField)}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          ...quickSnippets.map(
            (snippet) => ActionChip(
              label: Text(snippet.label),
              onPressed: () => onSnippetTap(snippet.value),
            ),
          ),
        ],
      ),
    );
  }
}

class _FormatChip extends StatelessWidget {
  const _FormatChip({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label),
    );
  }
}

class _RichEditorField extends StatefulWidget {
  const _RichEditorField({
    required this.controller,
    required this.label,
    required this.placeholder,
    required this.onTap,
    required this.onChanged,
    this.minHeight = 180,
  });

  final quill.QuillController controller;
  final String label;
  final String placeholder;
  final VoidCallback onTap;
  final VoidCallback onChanged;
  final double minHeight;

  @override
  State<_RichEditorField> createState() => _RichEditorFieldState();
}

class _RichEditorFieldState extends State<_RichEditorField> {
  late final FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode(debugLabel: '${widget.label}EditorFocus');
    widget.controller.addListener(_handleChange);
  }

  @override
  void didUpdateWidget(covariant _RichEditorField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller.removeListener(_handleChange);
      widget.controller.addListener(_handleChange);
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_handleChange);
    _focusNode.dispose();
    super.dispose();
  }

  void _handleChange() {
    widget.onChanged();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: MeritTheme.secondary,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          constraints: BoxConstraints(minHeight: widget.minHeight),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: MeritTheme.border),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: quill.QuillEditor.basic(
              controller: widget.controller,
              configurations: quill.QuillEditorConfigurations(
                controller: widget.controller,
                placeholder: widget.placeholder,
                padding: EdgeInsets.zero,
                scrollable: false,
                showCursor: true,
                autoFocus: false,
                embedBuilders: meritQuillEmbedBuilders(),
                onTapUp: (_, __) {
                  if (!_focusNode.hasFocus) {
                    _focusNode.requestFocus();
                  }
                  widget.onTap();
                  return false;
                },
                sharedConfigurations: const quill.QuillSharedConfigurations(),
              ),
              focusNode: _focusNode,
            ),
          ),
        ),
      ],
    );
  }
}

class _OptionEditorField extends StatelessWidget {
  const _OptionEditorField({
    required this.optionKey,
    required this.label,
    required this.controller,
    required this.onTap,
    required this.onChanged,
    required this.attachments,
    required this.uploading,
    required this.onPasteImage,
    required this.onUploadImage,
    required this.onRemoveAttachment,
  });

  final String optionKey;
  final String label;
  final quill.QuillController controller;
  final VoidCallback onTap;
  final VoidCallback onChanged;
  final List<QuestionAttachment> attachments;
  final bool uploading;
  final Future<void> Function() onPasteImage;
  final Future<void> Function() onUploadImage;
  final ValueChanged<int> onRemoveAttachment;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: MeritTheme.background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _RichEditorField(
            controller: controller,
            label: label,
            placeholder: 'Write $label here.',
            minHeight: 120,
            onTap: onTap,
            onChanged: onChanged,
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlinedButton.icon(
                onPressed: uploading ? null : onPasteImage,
                icon: const Icon(Icons.content_paste_rounded),
                label: const Text('Paste image'),
              ),
              OutlinedButton.icon(
                onPressed: uploading ? null : onUploadImage,
                icon: const Icon(Icons.image_outlined),
                label: Text(uploading ? 'Uploading...' : 'Upload image'),
              ),
            ],
          ),
          if (attachments.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: List.generate(
                attachments.length,
                (index) => SizedBox(
                  width: 180,
                  child: _QuestionAttachmentCard(
                    attachment: attachments[index],
                    onRemove: () => onRemoveAttachment(index),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _DraftNavigatorCard extends StatefulWidget {
  const _DraftNavigatorCard({
    required this.draftQuestions,
    required this.selectedDraftIndex,
    required this.onSelect,
    required this.onRemove,
    required this.onPrevious,
    required this.onNext,
    this.onJumpToIncomplete,
  });

  final List<Question> draftQuestions;
  final int? selectedDraftIndex;
  final ValueChanged<int> onSelect;
  final ValueChanged<int> onRemove;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;
  final VoidCallback? onJumpToIncomplete;

  @override
  State<_DraftNavigatorCard> createState() => _DraftNavigatorCardState();
}

class _DraftNavigatorCardState extends State<_DraftNavigatorCard> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';
  bool _showNeedsAnswerOnly = false;
  bool _showPaperScroll = true;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final unresolvedCount =
        widget.draftQuestions
            .where(
              (question) =>
                  question.correctIndex < 0 || question.correctIndex > 3,
            )
            .length;
    final selectedIndex = widget.selectedDraftIndex;
    final filteredEntries = <({int index, Question question})>[];
    for (var i = 0; i < widget.draftQuestions.length; i += 1) {
      final question = widget.draftQuestions[i];
      final matchesNeedsAnswer =
          !_showNeedsAnswerOnly ||
          question.correctIndex < 0 ||
          question.correctIndex > 3;
      final normalizedQuery = _query.trim().toLowerCase();
      final matchesQuery =
          normalizedQuery.isEmpty ||
          '${i + 1}'.contains(normalizedQuery) ||
          question.section.toLowerCase().contains(normalizedQuery) ||
          question.prompt.toLowerCase().contains(normalizedQuery);
      if (matchesNeedsAnswer && matchesQuery) {
        filteredEntries.add((index: i, question: question));
      }
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 4),
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
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
                      'Paper draft',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      selectedIndex == null
                          ? 'Jump directly to any question.'
                          : 'Question ${selectedIndex + 1} of ${widget.draftQuestions.length} is open.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  IconButton(
                    onPressed: widget.onPrevious,
                    icon: const Icon(Icons.chevron_left_rounded),
                  ),
                  IconButton(
                    onPressed: widget.onNext,
                    icon: const Icon(Icons.chevron_right_rounded),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              SizedBox(
                width: 620,
                child: TextField(
                  controller: _searchController,
                  onChanged: (value) => setState(() => _query = value),
                  decoration: InputDecoration(
                    hintText: 'Jump by number or search question text',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon:
                        _query.isEmpty
                            ? null
                            : IconButton(
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _query = '');
                              },
                              icon: const Icon(Icons.close_rounded),
                            ),
                  ),
                ),
              ),
              FilterChip(
                selected: _showNeedsAnswerOnly,
                onSelected:
                    (value) => setState(() => _showNeedsAnswerOnly = value),
                label: Text(
                  unresolvedCount == 0
                      ? 'All resolved'
                      : '$unresolvedCount need answers',
                ),
              ),
              SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(
                    value: true,
                    icon: Icon(Icons.view_agenda_outlined),
                    label: Text('Scroll'),
                  ),
                  ButtonSegment(
                    value: false,
                    icon: Icon(Icons.list_alt_rounded),
                    label: Text('Compact'),
                  ),
                ],
                selected: {_showPaperScroll},
                onSelectionChanged:
                    (values) => setState(() => _showPaperScroll = values.first),
              ),
            ],
          ),
          if (unresolvedCount > 0) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF4EA),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFFFC79D)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.warning_amber_rounded,
                    color: Color(0xFFC76A1B),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Use the filter to focus on unresolved answers first.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  if (widget.onJumpToIncomplete != null)
                    TextButton(
                      onPressed: widget.onJumpToIncomplete,
                      child: const Text('Review next'),
                    ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            filteredEntries.length == widget.draftQuestions.length
                ? 'Question navigator'
                : 'Question navigator - ${filteredEntries.length} visible',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 10),
          if (filteredEntries.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: MeritTheme.background,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: MeritTheme.border),
              ),
              child: const Text(
                'No questions match the current search or filter.',
              ),
            )
          else if (_showPaperScroll)
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filteredEntries.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, visibleIndex) {
                final entry = filteredEntries[visibleIndex];
                return _DraftQuestionReviewCard(
                  index: entry.index,
                  question: entry.question,
                  selected: widget.selectedDraftIndex == entry.index,
                  onEdit: () => widget.onSelect(entry.index),
                );
              },
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filteredEntries.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, visibleIndex) {
                final entry = filteredEntries[visibleIndex];
                return _DraftQuestionListRow(
                  index: entry.index,
                  question: entry.question,
                  selected: widget.selectedDraftIndex == entry.index,
                  onTap: () => widget.onSelect(entry.index),
                  onEdit: () => widget.onSelect(entry.index),
                );
              },
            ),
        ],
      ),
    );
  }
}

class AdminStudentsPage extends StatefulWidget {
  const AdminStudentsPage({super.key});

  @override
  State<AdminStudentsPage> createState() => _AdminStudentsPageState();
}

class _AdminStudentsPageState extends State<AdminStudentsPage> {
  final _search = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final all = controller.students;
    final q = _query.toLowerCase().trim();
    final filtered =
        q.isEmpty
            ? all
            : all
                .where(
                  (s) =>
                      s.name.toLowerCase().contains(q) ||
                      s.contact.toLowerCase().contains(q) ||
                      s.city.toLowerCase().contains(q) ||
                      (s.referralCode?.toLowerCase().contains(q) ?? false),
                )
                .toList();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Students',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: MeritTheme.primarySoft,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${all.length}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: MeritTheme.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _search,
            onChanged: (v) => setState(() => _query = v),
            decoration: InputDecoration(
              hintText: 'Search by name, contact, city or referral code...',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon:
                  _query.isNotEmpty
                      ? IconButton(
                        icon: const Icon(Icons.clear_rounded),
                        onPressed: () {
                          _search.clear();
                          setState(() => _query = '');
                        },
                      )
                      : null,
            ),
          ),
          const SizedBox(height: 16),
          if (filtered.isEmpty)
            Expanded(
              child: Center(
                child: Text(
                  q.isEmpty ? 'No students yet.' : 'No results for "$q".',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            )
          else
            Expanded(
              child: ListView.separated(
                itemCount: filtered.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final student = filtered[index];
                  final purchases = controller.purchasesForStudent(student.id);
                  final attempts = controller.attemptsForStudent(student.id);
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  student.name,
                                  style:
                                      Theme.of(context).textTheme.titleMedium,
                                ),
                              ),
                              if (purchases.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.green.shade50,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'Paid',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.green.shade700,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${student.contact}  Ã¢â‚¬Â¢  ${student.city}',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.group_outlined,
                                size: 14,
                                color: MeritTheme.secondaryMuted,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Referral: ${student.referralCode ?? 'None'}',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                              const SizedBox(width: 16),
                              const Icon(
                                Icons.shopping_bag_outlined,
                                size: 14,
                                color: MeritTheme.secondaryMuted,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${purchases.length} purchase${purchases.length == 1 ? '' : 's'}',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                              const SizedBox(width: 16),
                              const Icon(
                                Icons.quiz_outlined,
                                size: 14,
                                color: MeritTheme.secondaryMuted,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${attempts.length} attempt${attempts.length == 1 ? '' : 's'}',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

class AdminAffiliatesPage extends StatefulWidget {
  const AdminAffiliatesPage({super.key});

  @override
  State<AdminAffiliatesPage> createState() => _AdminAffiliatesPageState();
}

class _AdminAffiliatesPageState extends State<AdminAffiliatesPage> {
  final _name = TextEditingController();
  final _code = TextEditingController();
  final _channel = TextEditingController();
  final _search = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _search.addListener(() {
      setState(() => _searchQuery = _search.text.trim().toLowerCase());
    });
  }

  @override
  void dispose() {
    _name.dispose();
    _code.dispose();
    _channel.dispose();
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final theme = Theme.of(context);

    // Build flat rows: one row per student who has a referral code.
    // Also include affiliates with 0 referrals so they appear in the table.
    final affiliateMap = {for (final a in controller.affiliates) a.code: a};
    final referred =
        controller.students
            .where((s) => s.referralCode != null && s.referralCode!.isNotEmpty)
            .toList();

    // Rows: (affiliate, student)
    final rows = <({Affiliate affiliate, StudentProfile student})>[];
    for (final student in referred) {
      final code = student.referralCode!.toUpperCase();
      final affiliate = affiliateMap[code];
      if (affiliate != null) {
        rows.add((affiliate: affiliate, student: student));
      }
    }
    // Sort newest first
    rows.sort((a, b) => b.student.joinedAt.compareTo(a.student.joinedAt));

    // Affiliates with no referrals yet
    final usedCodes =
        referred.map((s) => s.referralCode!.toUpperCase()).toSet();
    final emptyAffiliates = controller.affiliates.where(
      (a) => !usedCodes.contains(a.code),
    );

    // Filter
    final filteredRows =
        _searchQuery.isEmpty
            ? rows
            : rows.where((r) {
              return r.affiliate.code.toLowerCase().contains(_searchQuery) ||
                  r.affiliate.name.toLowerCase().contains(_searchQuery) ||
                  r.student.name.toLowerCase().contains(_searchQuery) ||
                  r.student.city.toLowerCase().contains(_searchQuery) ||
                  r.student.contact.toLowerCase().contains(_searchQuery);
            }).toList();

    final filteredEmpty =
        _searchQuery.isEmpty
            ? emptyAffiliates.toList()
            : emptyAffiliates
                .where(
                  (a) =>
                      a.code.toLowerCase().contains(_searchQuery) ||
                      a.name.toLowerCase().contains(_searchQuery),
                )
                .toList();

    final totalReferred = referred.length;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Affiliates', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 20),

        // Ã¢â€â‚¬Ã¢â€â‚¬ Create affiliate Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Create affiliate code',
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _name,
                  decoration: const InputDecoration(
                    labelText: 'Affiliate name',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _code,
                  decoration: const InputDecoration(labelText: 'Referral code'),
                  textCapitalization: TextCapitalization.characters,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _channel,
                  decoration: const InputDecoration(
                    labelText: 'Channel / source',
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    await controller.addAffiliate(
                      name: _name.text.trim(),
                      code: _code.text.trim(),
                      channel: _channel.text.trim(),
                    );
                    _name.clear();
                    _code.clear();
                    _channel.clear();
                  },
                  child: const Text('Add affiliate'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Partner onboarding link',
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  'Share this admin-owned onboarding link when a new partner should apply without being referred by another partner.',
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                SelectableText(
                  kIsWeb
                      ? '${Uri.base.origin}/join/ADMIN'
                      : 'https://meritlaunchers.com/join/ADMIN',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: MeritTheme.secondary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () async {
                    final link =
                        kIsWeb
                            ? '${Uri.base.origin}/join/ADMIN'
                            : 'https://meritlaunchers.com/join/ADMIN';
                    await Clipboard.setData(ClipboardData(text: link));
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Admin onboarding link copied'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.copy_rounded),
                  label: const Text('Copy onboarding link'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 28),

        // Ã¢â€â‚¬Ã¢â€â‚¬ Summary Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        Row(
          children: [
            Text('Referral map', style: theme.textTheme.titleLarge),
            const SizedBox(width: 12),
            Chip(
              label: Text(
                '$totalReferred student${totalReferred == 1 ? '' : 's'} referred',
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Ã¢â€â‚¬Ã¢â€â‚¬ Search Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        TextField(
          controller: _search,
          decoration: InputDecoration(
            hintText:
                'Search by code, affiliate name, student name or cityÃ¢â‚¬Â¦',
            prefixIcon: const Icon(Icons.search_rounded),
            suffixIcon:
                _searchQuery.isEmpty
                    ? null
                    : IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => _search.clear(),
                    ),
            border: const OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),

        // Ã¢â€â‚¬Ã¢â€â‚¬ Table Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
        if (filteredRows.isEmpty && filteredEmpty.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 40),
            child: Center(child: Text('No results')),
          )
        else
          Card(
            clipBehavior: Clip.antiAlias,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: WidgetStateProperty.all(
                  theme.colorScheme.surfaceContainerHighest,
                ),
                columns: const [
                  DataColumn(label: Text('Code')),
                  DataColumn(label: Text('Affiliate')),
                  DataColumn(label: Text('Channel')),
                  DataColumn(label: Text('Login email')),
                  DataColumn(label: Text('Access')),
                  DataColumn(label: Text('Student')),
                  DataColumn(label: Text('City')),
                  DataColumn(label: Text('Contact')),
                  DataColumn(label: Text('Joined')),
                ],
                rows: [
                  // Rows with referred students
                  ...filteredRows.map(
                    (r) => DataRow(
                      cells: [
                        DataCell(_CodeChip(r.affiliate.code)),
                        DataCell(Text(r.affiliate.name)),
                        DataCell(
                          Text(
                            r.affiliate.channel.isEmpty
                                ? '-'
                                : r.affiliate.channel,
                          ),
                        ),
                        DataCell(
                          Text(
                            r.affiliate.loginEmail?.isNotEmpty == true
                                ? r.affiliate.loginEmail!
                                : '-',
                          ),
                        ),
                        DataCell(
                          _PaperMetaChip(
                            label:
                                r.affiliate.invitationStatus == 'active'
                                    ? 'Active'
                                    : 'Invitation sent',
                          ),
                        ),
                        DataCell(Text(r.student.name)),
                        DataCell(
                          Text(r.student.city.isEmpty ? '-' : r.student.city),
                        ),
                        DataCell(Text(r.student.contact)),
                        DataCell(Text(_formatDate(r.student.joinedAt))),
                      ],
                    ),
                  ),
                  // Affiliates with no referrals yet
                  ...filteredEmpty.map(
                    (a) => DataRow(
                      cells: [
                        DataCell(_CodeChip(a.code)),
                        DataCell(Text(a.name)),
                        DataCell(Text(a.channel.isEmpty ? '-' : a.channel)),
                        DataCell(
                          Text(
                            a.loginEmail?.isNotEmpty == true
                                ? a.loginEmail!
                                : '-',
                          ),
                        ),
                        DataCell(
                          a.loginEmail?.isNotEmpty == true
                              ? _PaperMetaChip(
                                label:
                                    a.invitationStatus == 'active'
                                        ? 'Active'
                                        : 'Invitation sent',
                              )
                              : Text(
                                '-',
                                style: TextStyle(color: theme.disabledColor),
                              ),
                        ),
                        DataCell(
                          Text(
                            '-',
                            style: TextStyle(color: theme.disabledColor),
                          ),
                        ),
                        DataCell(
                          Text(
                            '-',
                            style: TextStyle(color: theme.disabledColor),
                          ),
                        ),
                        DataCell(
                          Text(
                            '-',
                            style: TextStyle(color: theme.disabledColor),
                          ),
                        ),
                        DataCell(
                          Text(
                            '-',
                            style: TextStyle(color: theme.disabledColor),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

class _CodeChip extends StatelessWidget {
  const _CodeChip(this.code);
  final String code;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: MeritTheme.primarySoft,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        code,
        style: TextStyle(
          color: MeritTheme.secondary,
          fontWeight: FontWeight.w700,
          fontSize: 12,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class AdminSupportPage extends StatefulWidget {
  const AdminSupportPage({super.key});

  @override
  State<AdminSupportPage> createState() => _AdminSupportPageState();
}

class _AdminSupportPageState extends State<AdminSupportPage> {
  String? _selectedStudentId;

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final isWide = MediaQuery.sizeOf(context).width >= 760;

    // Build per-student thread map (studentId Ã¢â€ â€™ messages sorted by time).
    final allMessages = controller.supportMessages;
    final Map<String, List<SupportMessage>> threads = {};
    for (final msg in allMessages) {
      final sid = msg.studentId ?? 'unknown';
      (threads[sid] ??= []).add(msg);
    }
    // Sort thread keys by most-recent message.
    final threadKeys =
        threads.keys.toList()..sort((a, b) {
          final aLast = threads[a]!.last.sentAt;
          final bLast = threads[b]!.last.sentAt;
          return bLast.compareTo(aLast);
        });

    // Resolve student display info.
    StudentProfile? studentFor(String sid) {
      try {
        return controller.students.firstWhere((s) => s.id == sid);
      } catch (_) {
        return null;
      }
    }

    final studentListPanel = _AdminStudentListPanel(
      threadKeys: threadKeys,
      threads: threads,
      selectedStudentId: _selectedStudentId,
      studentFor: studentFor,
      onSelect: (sid) => setState(() => _selectedStudentId = sid),
    );

    if (isWide) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(width: 300, child: studentListPanel),
          Container(width: 1, color: MeritTheme.border),
          Expanded(
            child:
                _selectedStudentId == null
                    ? const Center(
                      child: Text('Select a student to view their thread.'),
                    )
                    : _AdminThreadPanel(
                      key: ValueKey(_selectedStudentId),
                      studentId: _selectedStudentId!,
                      messages: threads[_selectedStudentId] ?? [],
                      student: studentFor(_selectedStudentId!),
                    ),
          ),
        ],
      );
    }

    // Compact: show list first, tap opens thread (thread header has its own back button).
    if (_selectedStudentId != null) {
      return _AdminThreadPanel(
        key: ValueKey(_selectedStudentId),
        studentId: _selectedStudentId!,
        messages: threads[_selectedStudentId] ?? [],
        student: studentFor(_selectedStudentId!),
        onBack: () => setState(() => _selectedStudentId = null),
      );
    }
    return studentListPanel;
  }
}

class _AdminStudentListPanel extends StatelessWidget {
  const _AdminStudentListPanel({
    required this.threadKeys,
    required this.threads,
    required this.selectedStudentId,
    required this.studentFor,
    required this.onSelect,
  });

  final List<String> threadKeys;
  final Map<String, List<SupportMessage>> threads;
  final String? selectedStudentId;
  final StudentProfile? Function(String) studentFor;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    if (threadKeys.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.inbox_outlined,
                size: 48,
                color: MeritTheme.secondaryMuted,
              ),
              const SizedBox(height: 12),
              Text(
                'No support messages yet.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: MeritTheme.secondaryMuted,
                ),
              ),
            ],
          ),
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Text(
            'Support inbox',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
        ),
        Expanded(
          child: ListView.separated(
            itemCount: threadKeys.length,
            separatorBuilder: (_, __) => const Divider(height: 1, indent: 20),
            itemBuilder: (context, index) {
              final sid = threadKeys[index];
              final msgs = threads[sid]!;
              final last = msgs.last;
              final student = studentFor(sid);
              final unread =
                  msgs.where((m) => m.sender == SenderRole.student).length;
              final selected = selectedStudentId == sid;
              return InkWell(
                onTap: () => onSelect(sid),
                child: Container(
                  color: selected ? MeritTheme.primarySoft : Colors.transparent,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 14,
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: MeritTheme.primary.withValues(
                          alpha: 0.12,
                        ),
                        child: Text(
                          (student?.name.isNotEmpty == true
                                  ? student!.name[0]
                                  : '?')
                              .toUpperCase(),
                          style: TextStyle(
                            color: MeritTheme.secondary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              student?.name.isNotEmpty == true
                                  ? student!.name
                                  : 'Unknown student',
                              style: Theme.of(context).textTheme.titleSmall,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              student?.contact ?? sid,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: MeritTheme.secondaryMuted),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              last.message,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: Colors.black54),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            DateFormat('dd MMM').format(last.sentAt),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: MeritTheme.secondaryMuted),
                          ),
                          if (unread > 0) ...[
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 7,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: MeritTheme.primary,
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                '$unread',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _AdminThreadPanel extends StatefulWidget {
  const _AdminThreadPanel({
    super.key,
    required this.studentId,
    required this.messages,
    required this.student,
    this.onBack,
  });

  final String studentId;
  final List<SupportMessage> messages;
  final StudentProfile? student;
  final VoidCallback? onBack;

  @override
  State<_AdminThreadPanel> createState() => _AdminThreadPanelState();
}

class _AdminThreadPanelState extends State<_AdminThreadPanel> {
  final _reply = TextEditingController();
  final _scrollController = ScrollController();
  bool _sending = false;

  @override
  void dispose() {
    _reply.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final student = widget.student;
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: MeritTheme.border)),
          ),
          child: Row(
            children: [
              if (widget.onBack != null) ...[
                IconButton(
                  onPressed: widget.onBack,
                  icon: const Icon(Icons.arrow_back_rounded),
                  visualDensity: VisualDensity.compact,
                ),
                const SizedBox(width: 4),
              ],
              CircleAvatar(
                radius: 20,
                backgroundColor: MeritTheme.primary.withValues(alpha: 0.12),
                child: Text(
                  (student?.name.isNotEmpty == true ? student!.name[0] : '?')
                      .toUpperCase(),
                  style: TextStyle(
                    color: MeritTheme.secondary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      student?.name.isNotEmpty == true
                          ? student!.name
                          : 'Unknown student',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    if (student?.contact.isNotEmpty == true)
                      Text(
                        student!.contact,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: MeritTheme.secondaryMuted,
                        ),
                      ),
                  ],
                ),
              ),
              Text(
                '${widget.messages.length} message${widget.messages.length == 1 ? '' : 's'}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: MeritTheme.secondaryMuted,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            itemCount: widget.messages.length,
            itemBuilder: (context, index) {
              final message = widget.messages[index];
              final isAdmin = message.sender == SenderRole.admin;
              return Align(
                alignment:
                    isAdmin ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  constraints: const BoxConstraints(maxWidth: 480),
                  decoration: BoxDecoration(
                    color: isAdmin ? MeritTheme.secondary : Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isAdmin ? 18 : 4),
                      bottomRight: Radius.circular(isAdmin ? 4 : 18),
                    ),
                    border: Border.all(
                      color: isAdmin ? Colors.transparent : MeritTheme.border,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment:
                        isAdmin
                            ? CrossAxisAlignment.end
                            : CrossAxisAlignment.start,
                    children: [
                      Text(
                        isAdmin
                            ? 'You (admin)'
                            : (student?.name.isNotEmpty == true
                                ? student!.name
                                : 'Student'),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color:
                              isAdmin
                                  ? Colors.white60
                                  : MeritTheme.secondaryMuted,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        message.message,
                        style: TextStyle(
                          color: isAdmin ? Colors.white : MeritTheme.secondary,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        DateFormat('dd MMM, hh:mm a').format(message.sentAt),
                        style: TextStyle(
                          fontSize: 11,
                          color: isAdmin ? Colors.white54 : Colors.black38,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        SafeArea(
          top: false,
          child: Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: MeritTheme.border)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: TextField(
                    controller: _reply,
                    minLines: 1,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText:
                          'Reply to ${student?.name.isNotEmpty == true ? student!.name : "student"}Ã¢â‚¬Â¦',
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed:
                        _sending
                            ? null
                            : () async {
                              final text = _reply.text;
                              if (text.trim().isEmpty) return;
                              setState(() => _sending = true);
                              _reply.clear();
                              try {
                                await controller.addSupportMessage(
                                  SenderRole.admin,
                                  text,
                                  studentId: widget.studentId,
                                );
                              } finally {
                                if (mounted) setState(() => _sending = false);
                              }
                            },
                    icon: const Icon(Icons.send_rounded, size: 18),
                    label: const Text('Reply'),
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

class AdminSettingsPage extends StatefulWidget {
  const AdminSettingsPage({super.key});

  @override
  State<AdminSettingsPage> createState() => _AdminSettingsPageState();
}

class _AdminSettingsPageState extends State<AdminSettingsPage> {
  final _label = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _accountName = TextEditingController();
  final _accountEmail = TextEditingController();
  bool _loading = false;
  bool _accountsLoading = false;
  String? _error;
  String? _accountError;
  String? _accountNotice;
  bool _loadCalled = false;
  String _accountRoleType = 'admin';
  List<Map<String, dynamic>> _adminAccounts = const [];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_loadCalled) {
      _loadCalled = true;
      AppScope.of(context).loadAdminAllowlist();
      _loadAdminAccounts();
    }
  }

  @override
  void dispose() {
    _label.dispose();
    _email.dispose();
    _phone.dispose();
    _accountName.dispose();
    _accountEmail.dispose();
    super.dispose();
  }

  Future<void> _loadAdminAccounts() async {
    final client = AppScope.of(context).apiClient;
    if (client == null) return;
    setState(() => _accountsLoading = true);
    try {
      final response = await client.getJson(
        '/v1/admin/admin-users',
        authenticated: true,
      );
      final raw = (response['accounts'] as List<dynamic>? ?? const []);
      setState(() {
        _adminAccounts = raw
            .whereType<Map>()
            .map((row) => Map<String, dynamic>.from(row))
            .toList(growable: false);
      });
    } on ApiException catch (error) {
      setState(() => _accountError = error.message);
    } finally {
      if (mounted) {
        setState(() => _accountsLoading = false);
      }
    }
  }

  Future<void> _add(AppController controller) async {
    final email = _email.text.trim();
    final phone = _phone.text.trim();
    if (email.isEmpty && phone.isEmpty) {
      setState(() => _error = 'Enter at least an email or a phone number.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await controller.addAdminAllowlistEntry(
        label:
            _label.text.trim().isEmpty
                ? (email.isNotEmpty ? email : phone)
                : _label.text.trim(),
        email: email.isEmpty ? null : email,
        phone: phone.isEmpty ? null : phone,
      );
      _label.clear();
      _email.clear();
      _phone.clear();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _createAdminAccount(AppController controller) async {
    final client = controller.apiClient;
    if (client == null) return;
    final name = _accountName.text.trim();
    final email = _accountEmail.text.trim();
    if (name.isEmpty || email.isEmpty) {
      setState(() => _accountError = 'Enter a name and email address.');
      return;
    }
    setState(() {
      _accountsLoading = true;
      _accountError = null;
      _accountNotice = null;
    });
    try {
      await client.postJson(
        '/v1/admin/admin-users',
        authenticated: true,
        body: {'name': name, 'email': email, 'roleType': _accountRoleType},
      );
      _accountName.clear();
      _accountEmail.clear();
      _accountNotice = 'Invitation email sent successfully.';
      await _loadAdminAccounts();
    } on ApiException catch (error) {
      setState(() => _accountError = error.message);
    } finally {
      if (mounted) {
        setState(() => _accountsLoading = false);
      }
    }
  }

  Future<void> _deactivateAdminAccount(
    AppController controller,
    String id,
  ) async {
    final client = controller.apiClient;
    if (client == null) return;
    setState(() {
      _accountsLoading = true;
      _accountError = null;
      _accountNotice = null;
    });
    try {
      await client.deleteJson('/v1/admin/admin-users/$id', authenticated: true);
      _accountNotice = 'Account access has been disabled.';
      await _loadAdminAccounts();
    } on ApiException catch (error) {
      setState(() => _accountError = error.message);
    } finally {
      if (mounted) {
        setState(() => _accountsLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Settings', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Portal access accounts',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 6),
                Text(
                  'Create admin or marketing admin accounts here. We send a secure invitation link so they can set their own password in the right portal.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _accountName,
                  decoration: const InputDecoration(labelText: 'Full name'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _accountEmail,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email address'),
                ),
                const SizedBox(height: 12),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment<String>(value: 'admin', label: Text('Admin')),
                    ButtonSegment<String>(
                      value: 'marketing_admin',
                      label: Text('Marketing admin'),
                    ),
                  ],
                  selected: {_accountRoleType},
                  onSelectionChanged:
                      (value) => setState(() => _accountRoleType = value.first),
                ),
                const SizedBox(height: 16),
                if (_accountError != null) ...[
                  Text(
                    _accountError!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                if (_accountNotice != null) ...[
                  Text(
                    _accountNotice!,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: MeritTheme.success),
                  ),
                  const SizedBox(height: 10),
                ],
                ElevatedButton(
                  onPressed:
                      _accountsLoading
                          ? null
                          : () => _createAdminAccount(controller),
                  child: Text(
                    _accountsLoading ? 'Sending...' : 'Send invitation',
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  'Existing portal accounts',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 10),
                if (_accountsLoading && _adminAccounts.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (_adminAccounts.isEmpty)
                  Text(
                    'No managed admin accounts yet.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  )
                else
                  ..._adminAccounts.map(
                    (account) => Card(
                      margin: const EdgeInsets.only(top: 10),
                      child: ListTile(
                        title: Text(
                          account['name'] as String? ?? 'Unnamed account',
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              "${account['email'] ?? ''}  ?  ${(account['role_type'] == 'marketing_admin') ? 'Marketing admin' : 'Admin'}",
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                _PaperMetaChip(
                                  label:
                                      account['invitation_status'] == 'active'
                                          ? 'Active'
                                          : 'Invitation sent',
                                ),
                                _PaperMetaChip(
                                  label:
                                      account['is_active'] == true
                                          ? 'Enabled'
                                          : 'Disabled',
                                ),
                              ],
                            ),
                          ],
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.block_outlined),
                          tooltip: 'Disable access',
                          onPressed:
                              _accountsLoading
                                  ? null
                                  : () => _deactivateAdminAccount(
                                    controller,
                                    account['id'] as String,
                                  ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Admin access',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 6),
                Text(
                  'Email addresses and phone numbers added here are allowed to sign in as admin.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _label,
                  decoration: const InputDecoration(
                    labelText: 'Label (optional)',
                    helperText:
                        'A name to identify this admin, e.g. "Marketing head".',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email address'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone number',
                    hintText: '+91 9876543210',
                  ),
                ),
                const SizedBox(height: 16),
                if (_error != null) ...[
                  Text(
                    _error!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                ElevatedButton(
                  onPressed: _loading ? null : () => _add(controller),
                  child: Text(_loading ? 'Adding...' : 'Add admin'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'Current allowlist',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        if (controller.allowlistEntries.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'No entries loaded. Add one above.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          )
        else
          ...controller.allowlistEntries.map(
            (entry) => Card(
              child: ListTile(
                leading: Icon(
                  entry.email != null
                      ? Icons.email_outlined
                      : Icons.phone_outlined,
                  color: MeritTheme.secondary,
                ),
                title: Text(entry.label),
                subtitle: Text(
                  [
                    if (entry.email != null) entry.email!,
                    if (entry.phone != null) entry.phone!,
                  ].join('  Ã‚Â·  '),
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.delete_outline),
                  tooltip: 'Remove',
                  onPressed:
                      () => controller.removeAdminAllowlistEntry(entry.id),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.title, required this.value});

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 220,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title),
              const SizedBox(height: 10),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: MeritTheme.secondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuotaCard extends StatelessWidget {
  const _QuotaCard({required this.item});

  final _QuotaItem item;

  @override
  Widget build(BuildContext context) {
    final numberFormat = NumberFormat.compact();
    final hasFreeTier = item.freeTier > 0;
    final left = item.freeTier - item.estimatedUsage;
    final ratio =
        hasFreeTier
            ? (item.estimatedUsage / item.freeTier).clamp(0.0, 1.0)
            : 0.0;
    final safe = !hasFreeTier || left >= 0;

    return SizedBox(
      width: 320,
      child: Container(
        padding: const EdgeInsets.all(18),
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
                    item.title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color:
                        safe
                            ? MeritTheme.success.withValues(alpha: 0.12)
                            : const Color(0xFFFFF3E0),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    hasFreeTier
                        ? (safe ? 'Within free tier' : 'Billable soon')
                        : 'Pay as you go',
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '${numberFormat.format(item.estimatedUsage)} ${item.unit}',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(color: MeritTheme.secondary),
            ),
            const SizedBox(height: 4),
            Text('Estimated monthly usage'),
            const SizedBox(height: 12),
            if (hasFreeTier)
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: ratio,
                  minHeight: 8,
                  backgroundColor: MeritTheme.primarySoft,
                  color: safe ? MeritTheme.primary : Colors.orange.shade700,
                ),
              ),
            if (hasFreeTier) ...[
              const SizedBox(height: 12),
              Text(
                'Free tier: ${numberFormat.format(item.freeTier)} ${item.unit}',
              ),
              const SizedBox(height: 4),
              Text(
                safe
                    ? 'Left before billing: ${numberFormat.format(left)} ${item.unit}'
                    : 'Above free tier by ${numberFormat.format(left.abs())} ${item.unit}',
              ),
            ] else ...[
              const SizedBox(height: 12),
              Text('Billed on actual monthly usage for this service.'),
            ],
            if (item.note != null) ...[
              const SizedBox(height: 10),
              Text(item.note!, style: Theme.of(context).textTheme.bodySmall),
            ],
          ],
        ),
      ),
    );
  }
}

class _PlatformQuotaEstimate {
  const _PlatformQuotaEstimate({
    required this.items,
    required this.projectedBillableMetrics,
  });

  final List<_QuotaItem> items;
  final int projectedBillableMetrics;

  factory _PlatformQuotaEstimate.fromController(AppController controller) {
    final totalQuestions = controller.papers.fold<int>(
      0,
      (sum, paper) => sum + paper.displayQuestionCount,
    );
    final reportArchiveGiB = controller.attempts.length * 0.0000015;
    final receiptArchiveGiB = controller.purchases.length * 0.00015;
    final dataStorageGiB =
        (controller.students.length * 0.00001) +
        (controller.affiliates.length * 0.00001) +
        (controller.courses.length * 0.00004) +
        (controller.papers.length * 0.00012) +
        (totalQuestions * 0.000018) +
        (controller.supportMessages.length * 0.00001) +
        reportArchiveGiB +
        receiptArchiveGiB;
    final vmStorageGiB = dataStorageGiB.clamp(0.05, 50).toDouble();
    final vmTransferGiB =
        (controller.activeUsers * 0.08) +
        (controller.examSessions.length * 0.0012) +
        (controller.attempts.length * 0.0035) +
        (controller.purchases.length * 0.0015);
    final hostedVideoCatalog =
        controller.courses
            .where((course) => (course.introVideoUrl ?? '').trim().isNotEmpty)
            .length
            .toDouble();
    final googleSignIns = controller.activeUsers.toDouble();
    final razorpayTransactions =
        controller.purchases
            .where((purchase) => purchase.amount > 0)
            .length
            .toDouble();
    final razorpayFeeEstimate = controller.purchases
        .where((purchase) => purchase.amount > 0)
        .fold<double>(0, (sum, purchase) => sum + (purchase.amount * 0.0236));
    final geminiImports = controller.papers.length.toDouble();
    final geminiInputTokens = controller.papers.fold<double>(
      0,
      (sum, paper) => sum + (paper.displayQuestionCount * 1700),
    );
    final geminiOutputTokens = controller.papers.fold<double>(
      0,
      (sum, paper) => sum + (paper.displayQuestionCount * 650),
    );

    final items = <_QuotaItem>[
      _QuotaItem(
        title: 'VM storage footprint',
        estimatedUsage: vmStorageGiB,
        freeTier: 50,
        unit: 'GiB',
        note:
            'Includes structured data, receipts, and retained result reports. Your current VM is free up to 50 GiB.',
      ),
      _QuotaItem(
        title: 'Retained result reports',
        estimatedUsage: reportArchiveGiB,
        freeTier: 50,
        unit: 'GiB',
        note:
            'Reports stay permanently available from attempt history. Storage here reflects lightweight attempt metadata and cached math assets, not full PDF blobs.',
      ),
      _QuotaItem(
        title: 'VM transfer',
        estimatedUsage: vmTransferGiB,
        freeTier: 0,
        unit: 'GB',
        note:
            'Relevant if your provider bills for network egress. Video traffic is excluded when students stream from your own file URLs separately.',
      ),
      _QuotaItem(
        title: 'Google sign-ins',
        estimatedUsage: googleSignIns,
        freeTier: 50000,
        unit: 'users',
        note:
            'Current architecture uses Google sign-in directly, with mobile number capture handled inside the app after sign-in.',
      ),
      _QuotaItem(
        title: 'Razorpay success fees',
        estimatedUsage: razorpayFeeEstimate,
        freeTier: 0,
        unit: 'Rs',
        note:
            'Estimated at 2.36% effective fee on successful paid purchases only.',
      ),
      _QuotaItem(
        title: 'Razorpay transactions',
        estimatedUsage: razorpayTransactions,
        freeTier: 0,
        unit: 'payments',
      ),
      _QuotaItem(
        title: 'Gemini paper imports',
        estimatedUsage: geminiImports,
        freeTier: 0,
        unit: 'papers',
        note:
            'Charged only when admin imports or reimports papers through Gemini.',
      ),
      _QuotaItem(
        title: 'Gemini input tokens',
        estimatedUsage: geminiInputTokens,
        freeTier: 0,
        unit: 'tokens',
      ),
      _QuotaItem(
        title: 'Gemini output tokens',
        estimatedUsage: geminiOutputTokens,
        freeTier: 0,
        unit: 'tokens',
      ),
      _QuotaItem(
        title: 'Hosted course video URLs',
        estimatedUsage: hostedVideoCatalog,
        freeTier: 0,
        unit: 'courses',
        note:
            'Counts how many courses currently point to self-hosted video content.',
      ),
    ];

    return _PlatformQuotaEstimate(
      items: items,
      projectedBillableMetrics:
          items
              .where(
                (item) =>
                    item.freeTier > 0 && item.estimatedUsage > item.freeTier,
              )
              .length,
    );
  }
}

class _QuotaItem {
  const _QuotaItem({
    required this.title,
    required this.estimatedUsage,
    required this.freeTier,
    required this.unit,
    this.note,
  });

  final String title;
  final double estimatedUsage;
  final double freeTier;
  final String unit;
  final String? note;
}

class _MathAuthoringGuide extends StatelessWidget {
  const _MathAuthoringGuide();

  @override
  Widget build(BuildContext context) {
    final labelStyle = Theme.of(context).textTheme.labelMedium?.copyWith(
      color: MeritTheme.secondary,
      fontWeight: FontWeight.w600,
    );
    final codeStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
      fontFamily: 'monospace',
      color: MeritTheme.secondary,
      height: 1.4,
    );
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          title: Text(
            'Math authoring reference',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: MeritTheme.secondary),
          ),
          subtitle: const Text(
            'Collapsed by default so editing stays clean. Open it only when you need a syntax example or symbol reference.',
          ),
          children: [
            SelectionArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Recommended workflow', style: labelStyle),
                  ),
                  const SizedBox(height: 6),
                  const SelectableText(
                    '1. Type normal text directly when no math is involved.\n'
                    '2. For formulas, paste LaTeX-style text from ChatGPT/Gemini or use the snippets below.\n'
                    '3. Keep short formulas inline with \$...\$ and large structures on their own line.\n'
                    '4. Use the live preview below the editor before saving.',
                  ),
                  const SizedBox(height: 14),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Everyday patterns', style: labelStyle),
                  ),
                  const SizedBox(height: 6),
                  _TipRow(
                    label: 'Inline math',
                    code: r'The value of $x^2 + y^2$ is',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Fraction',
                    code: r'\frac{numerator}{denominator}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Square root',
                    code: r'\sqrt{x}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Nth root',
                    code: r'\sqrt[n]{x}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(label: 'Power', code: r'x^{2}', codeStyle: codeStyle),
                  _TipRow(
                    label: 'Subscript',
                    code: r'a_{n}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Plus/minus',
                    code: r'x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}',
                    codeStyle: codeStyle,
                  ),
                  const SizedBox(height: 14),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Greek letters and symbols', style: labelStyle),
                  ),
                  const SizedBox(height: 6),
                  _TipRow(
                    label: 'Greek',
                    code:
                        r'\alpha \beta \gamma \theta \lambda \mu \pi \sigma \omega \Delta',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Relations',
                    code: r'\le \ge \ne \approx \equiv \propto \parallel \perp',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Sets',
                    code: r'\in \notin \subseteq \cup \cap \emptyset',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Arrows',
                    code: r'\to \rightarrow \Rightarrow \leftrightarrow',
                    codeStyle: codeStyle,
                  ),
                  const SizedBox(height: 14),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Functions and calculus', style: labelStyle),
                  ),
                  const SizedBox(height: 6),
                  _TipRow(
                    label: 'Trigonometry',
                    code: r'\sin x,\ \cos x,\ \tan^{-1}x',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Logs',
                    code: r'\log x,\ \ln x,\ e^x',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Limit',
                    code: r'\lim_{x \to 0} f(x)',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Derivative',
                    code: r'\frac{d}{dx}(x^2)',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Integral',
                    code: r'\int_a^b f(x)\,dx',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Summation',
                    code: r'\sum_{i=1}^{n} i',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Product',
                    code: r'\prod_{r=1}^{n} r',
                    codeStyle: codeStyle,
                  ),
                  const SizedBox(height: 14),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Matrices, determinants, vectors and cases',
                      style: labelStyle,
                    ),
                  ),
                  const SizedBox(height: 6),
                  _TipRow(
                    label: '2x2 matrix',
                    code: r'\begin{bmatrix} a & b \\ c & d \end{bmatrix}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: '3x3 matrix',
                    code:
                        r'\begin{bmatrix} a & b & c \\ d & e & f \\ g & h & i \end{bmatrix}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Determinant',
                    code: r'\begin{vmatrix} a & b \\ c & d \end{vmatrix}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Column vector',
                    code: r'\begin{bmatrix} x \\ y \\ z \end{bmatrix}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Piecewise',
                    code:
                        r'f(x)=\begin{cases} x^2, & x>0 \\ 0, & x=0 \\ -x, & x<0 \end{cases}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: '2-column table',
                    code:
                        r'\begin{array}{|c|c|}\hline Cell\ 1 & Cell\ 2 \\ \hline Cell\ 3 & Cell\ 4 \\ \hline \end{array}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: '3-column table',
                    code:
                        r'\begin{array}{|c|c|c|}\hline A & B & C \\ \hline 1 & 2 & 3 \\ \hline 4 & 5 & 6 \\ \hline \end{array}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Vector / line',
                    code: r'\vec{AB},\ \overline{AB},\ |AB|',
                    codeStyle: codeStyle,
                  ),
                  const SizedBox(height: 14),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Probability and statistics',
                      style: labelStyle,
                    ),
                  ),
                  const SizedBox(height: 6),
                  _TipRow(
                    label: 'Probability',
                    code: r'P(A \mid B) = \frac{P(A \cap B)}{P(B)}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Mean',
                    code: r'\bar{x} = \frac{\sum x}{n}',
                    codeStyle: codeStyle,
                  ),
                  _TipRow(
                    label: 'Variance',
                    code: r'\sigma^2 = \frac{\sum (x-\mu)^2}{n}',
                    codeStyle: codeStyle,
                  ),
                  const SizedBox(height: 14),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Good editing habits', style: labelStyle),
                  ),
                  const SizedBox(height: 6),
                  const SelectableText(
                    'Use one question per editor entry. Keep shared directions in the Instructions or Section field when they apply to a group. If a symbol still looks off, ask ChatGPT/Gemini for a clean LaTeX version and preview again before saving.',
                  ),
                  const SizedBox(height: 8),
                  const SelectableText(
                    'This preview follows the same math-rendering path used in the student portal, so it is the best check before saving.',
                    style: TextStyle(fontStyle: FontStyle.italic),
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

class _TipRow extends StatelessWidget {
  const _TipRow({required this.label, required this.code, this.codeStyle});
  final String label;
  final String code;
  final TextStyle? codeStyle;

  @override
  Widget build(BuildContext context) {
    final copyableCode = _renderableMathSnippet(code);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: MeritTheme.primarySoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: SelectableText(copyableCode, style: codeStyle)),
                const SizedBox(width: 8),
                Tooltip(
                  message: 'Copy exact snippet',
                  child: IconButton(
                    visualDensity: VisualDensity.compact,
                    icon: const Icon(Icons.copy_rounded, size: 18),
                    onPressed: () async {
                      await Clipboard.setData(
                        ClipboardData(text: copyableCode),
                      );
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Math snippet copied.')),
                        );
                      }
                    },
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

String _renderableMathSnippet(String code) {
  final trimmed = code.trim();
  if (trimmed.isEmpty) {
    return trimmed;
  }
  if (trimmed.contains(r'$') ||
      trimmed.contains(r'\(') ||
      trimmed.contains(r'\[')) {
    return trimmed;
  }
  final hasLatexCommand = RegExp(r'\\[A-Za-z]+').hasMatch(trimmed);
  final hasScript = RegExp(
    r'(?<!\w)[A-Za-z0-9)\]}]+(?:\^\{?[^ }\n]+\}?|_\{?[^ }\n]+\}?)+',
  ).hasMatch(trimmed);
  final hasMathOperator = RegExp(r'[&^_=]|\\').hasMatch(trimmed);
  if (hasLatexCommand || hasScript || hasMathOperator) {
    return r'$' + trimmed + r'$';
  }
  return trimmed;
}

class _DraftQuestionListRow extends StatelessWidget {
  const _DraftQuestionListRow({
    required this.index,
    required this.question,
    required this.selected,
    required this.onTap,
    required this.onEdit,
  });

  final int index;
  final Question question;
  final bool selected;
  final VoidCallback onTap;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final answerAssigned =
        question.correctIndex >= 0 && question.correctIndex < 4;
    final prompt =
        MathContentParser.normalizeSourceText(
          question.prompt,
        ).replaceAll('\n', ' ').trim();
    return Material(
      color: selected ? MeritTheme.primarySoft : MeritTheme.background,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected ? MeritTheme.primary : MeritTheme.border,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: selected ? MeritTheme.primary : Colors.white,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '${index + 1}',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: selected ? Colors.white : MeritTheme.secondary,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      question.section.trim().isEmpty
                          ? 'General'
                          : question.section.trim(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: MeritTheme.secondaryMuted,
                      ),
                    ),
                    const SizedBox(height: 3),
                    MathAwareText(
                      prompt.isEmpty ? 'Untitled question' : prompt,
                      selectable: false,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      padding: EdgeInsets.zero,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight:
                            selected ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color:
                      answerAssigned ? Colors.white : const Color(0xFFFFF4EA),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color:
                        answerAssigned
                            ? MeritTheme.border
                            : const Color(0xFFFFC79D),
                  ),
                ),
                child: Text(
                  answerAssigned ? 'Ready' : 'Answer required',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color:
                        answerAssigned
                            ? MeritTheme.secondary
                            : const Color(0xFFC76A1B),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined, size: 16),
                label: const Text('Edit'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DraftQuestionReviewCard extends StatelessWidget {
  const _DraftQuestionReviewCard({
    required this.index,
    required this.question,
    required this.selected,
    required this.onEdit,
  });

  final int index;
  final Question question;
  final bool selected;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final answerAssigned =
        question.correctIndex >= 0 && question.correctIndex < 4;
    final options =
        question.options.length >= 4
            ? question.options.take(4).toList(growable: false)
            : [
              ...question.options,
              ...List<String>.filled(4 - question.options.length, ''),
            ];
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: selected ? MeritTheme.primarySoft : MeritTheme.background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: selected ? MeritTheme.primary : MeritTheme.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: selected ? MeritTheme.primary : Colors.white,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: MeritTheme.border),
                ),
                child: Text(
                  'Q${index + 1}',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: selected ? Colors.white : MeritTheme.secondary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  question.section.trim().isEmpty
                      ? 'General'
                      : question.section.trim(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: MeritTheme.secondaryMuted,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: MeritTheme.border),
                ),
                child: Text(
                  '+${question.marks} / -${question.negativeMarks}',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: MeritTheme.secondary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color:
                      answerAssigned ? Colors.white : const Color(0xFFFFF4EA),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color:
                        answerAssigned
                            ? MeritTheme.border
                            : const Color(0xFFFFC79D),
                  ),
                ),
                child: Text(
                  answerAssigned
                      ? 'Answer ${String.fromCharCode(65 + question.correctIndex)}'
                      : 'Answer required',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color:
                        answerAssigned
                            ? MeritTheme.secondary
                            : const Color(0xFFC76A1B),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              FilledButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined, size: 16),
                label: const Text('Edit'),
                style: FilledButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: MeritTheme.border),
            ),
            child: RichQuestionContentView(
              rawText: question.prompt,
              allowExpand: false,
              preferProvidedSegments: false,
            ),
          ),
          if (question.attachments.isNotEmpty) ...[
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  question.attachments
                      .where((attachment) => attachment.url.trim().isNotEmpty)
                      .map(
                        (attachment) => SizedBox(
                          width: 160,
                          child: _QuestionAttachmentCard(
                            attachment: attachment,
                          ),
                        ),
                      )
                      .toList(),
            ),
          ],
          const SizedBox(height: 8),
          ...List<Widget>.generate(4, (optionIndex) {
            final option = options[optionIndex];
            return Padding(
              padding: const EdgeInsets.only(bottom: 5),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                decoration: BoxDecoration(
                  color:
                      question.correctIndex == optionIndex
                          ? MeritTheme.primarySoft
                          : Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: MeritTheme.border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color:
                            question.correctIndex == optionIndex
                                ? MeritTheme.primary
                                : MeritTheme.background,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        String.fromCharCode(65 + optionIndex),
                        style: Theme.of(
                          context,
                        ).textTheme.labelMedium?.copyWith(
                          color:
                              question.correctIndex == optionIndex
                                  ? Colors.white
                                  : MeritTheme.secondary,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: RichQuestionContentView(
                        rawText: option,
                        allowExpand: false,
                        preferProvidedSegments: false,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _QuestionAttachmentCard extends StatelessWidget {
  const _QuestionAttachmentCard({required this.attachment, this.onRemove});

  final QuestionAttachment attachment;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 220,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: AspectRatio(
              aspectRatio: 4 / 3,
              child: Image.network(
                attachment.url,
                fit: BoxFit.cover,
                errorBuilder:
                    (_, __, ___) => Container(
                      color: MeritTheme.background,
                      alignment: Alignment.center,
                      child: const Icon(Icons.broken_image_outlined),
                    ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            (attachment.label?.trim().isNotEmpty ?? false)
                ? attachment.label!.trim()
                : 'Reference image',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: SelectableText(
                  attachment.url,
                  maxLines: 1,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
              if (onRemove != null)
                IconButton(
                  tooltip: 'Remove image',
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MathToolboxDialog extends StatefulWidget {
  const _MathToolboxDialog();

  @override
  State<_MathToolboxDialog> createState() => _MathToolboxDialogState();
}

class _MathToolboxResult {
  const _MathToolboxResult._({
    this.grid,
    this.snippet,
    this.latex,
    this.displayMode = false,
  });

  factory _MathToolboxResult.math({
    required String snippet,
    required String latex,
    required bool displayMode,
  }) {
    return _MathToolboxResult._(
      snippet: snippet,
      latex: latex,
      displayMode: displayMode,
    );
  }

  final RichGridData? grid;
  final String? snippet;
  final String? latex;
  final bool displayMode;
}

class _MathToolboxDialogState extends State<_MathToolboxDialog> {
  late final AdminMathComposer _composer;
  late final Future<void> _composerReady;
  String _selectedCategoryId = adminMathPalette.first.id;
  bool _displayMode = false;

  @override
  void initState() {
    super.initState();
    _composer = createAdminMathComposer();
    _composerReady = _composer.initialize();
  }

  @override
  void dispose() {
    _composer.dispose();
    super.dispose();
  }

  AdminMathCategory get _selectedCategory => adminMathPalette.firstWhere(
    (category) => category.id == _selectedCategoryId,
    orElse: () => adminMathPalette.first,
  );

  String _wrapLatex(String latex) {
    final trimmed = latex.trim();
    if (trimmed.isEmpty) {
      return trimmed;
    }
    return _displayMode ? '\n\$\$$trimmed\$\$\n' : '\$$trimmed\$';
  }

  Widget _buildCategoryChip(AdminMathCategory category) {
    final selected = category.id == _selectedCategoryId;
    return Padding(
      padding: const EdgeInsets.only(right: 8, bottom: 8),
      child: ChoiceChip(
        selected: selected,
        avatar: Icon(category.icon, size: 18),
        label: Text(category.label),
        onSelected: (_) => setState(() => _selectedCategoryId = category.id),
      ),
    );
  }

  Widget _buildTemplateCard(BuildContext context, AdminMathTemplate template) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () async {
        await _composer.insertTemplate(template.latex);
        if (mounted) {
          setState(() {});
        }
      },
      child: Ink(
        width: 178,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: MeritTheme.border),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A183B6B),
              blurRadius: 8,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              template.preview,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                fontFamily: 'Cambria Math',
              ),
            ),
            const SizedBox(height: 10),
            Text(
              template.label,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTemplateGroups(BuildContext context) {
    final groups = _selectedCategory.groups;
    return ListView.separated(
      itemCount: groups.length,
      separatorBuilder: (_, _) => const SizedBox(height: 18),
      itemBuilder: (context, index) {
        final group = groups[index];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              group.label,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: group.templates
                  .map((template) => _buildTemplateCard(context, template))
                  .toList(growable: false),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Dialog(
      insetPadding: const EdgeInsets.all(28),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1320, maxHeight: 860),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    _selectedCategory.label == 'Chemistry'
                        ? 'Chemistry Type'
                        : 'Math Type',
                    style: theme.textTheme.headlineSmall,
                  ),
                  const Spacer(),
                  SegmentedButton<bool>(
                    segments: const [
                      ButtonSegment<bool>(
                        value: false,
                        label: Text('Inline'),
                        icon: Icon(Icons.short_text_rounded),
                      ),
                      ButtonSegment<bool>(
                        value: true,
                        label: Text('Display'),
                        icon: Icon(Icons.view_stream_rounded),
                      ),
                    ],
                    selected: {_displayMode},
                    onSelectionChanged: (values) {
                      setState(() => _displayMode = values.first);
                    },
                  ),
                  const SizedBox(width: 12),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Build the full equation here, nest operators as deeply as needed, then insert once into the question at the current cursor position.',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 18),
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 6,
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: MeritTheme.background,
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(color: MeritTheme.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: adminMathPalette
                                    .map(_buildCategoryChip)
                                    .toList(growable: false),
                              ),
                            ),
                            const SizedBox(height: 18),
                            Expanded(child: _buildTemplateGroups(context)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 18),
                    Expanded(
                      flex: 5,
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(color: MeritTheme.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Equation builder',
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Click placeholders inside the builder, then keep composing. You can nest fractions, roots, scripts, matrices, integrals, and chemistry arrows before inserting.',
                              style: theme.textTheme.bodyMedium,
                            ),
                            const SizedBox(height: 16),
                            Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: () async {
                                    await _composer.moveToNextPlaceholder();
                                    if (mounted) {
                                      setState(() {});
                                    }
                                  },
                                  icon: const Icon(Icons.keyboard_tab_rounded),
                                  label: const Text('Next placeholder'),
                                ),
                                OutlinedButton.icon(
                                  onPressed: () async {
                                    await _composer.deleteBackward();
                                    if (mounted) {
                                      setState(() {});
                                    }
                                  },
                                  icon: const Icon(Icons.backspace_outlined),
                                  label: const Text('Backspace'),
                                ),
                                TextButton.icon(
                                  onPressed: () async {
                                    await _composer.clear();
                                    if (mounted) {
                                      setState(() {});
                                    }
                                  },
                                  icon: const Icon(Icons.delete_sweep_rounded),
                                  label: const Text('Clear'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Expanded(
                              child: Container(
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: MeritTheme.background,
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(color: MeritTheme.border),
                                ),
                                child: FutureBuilder<void>(
                                  future: _composerReady,
                                  builder: (context, snapshot) {
                                    if (snapshot.connectionState !=
                                        ConnectionState.done) {
                                      return const Center(
                                        child: CircularProgressIndicator(),
                                      );
                                    }
                                    return Padding(
                                      padding: const EdgeInsets.all(8),
                                      child: _composer.buildEditor(),
                                    );
                                  },
                                ),
                              ),
                            ),
                            if (!_composer.supportsVisualBuilder) ...[
                              const SizedBox(height: 12),
                              Text(
                                'Visual MathLive authoring is available on web builds. This fallback still lets you type LaTeX manually for local desktop testing.',
                                style: theme.textTheme.bodySmall,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                  const Spacer(),
                  FilledButton.icon(
                    onPressed: () async {
                      final navigator = Navigator.of(context);
                      final rawLatex = await _composer.getLatex();
                      // Strip any unfilled MathLive placeholder tokens.
                      final latex = rawLatex
                          .replaceAll(r'\placeholder{}', '')
                          .replaceAll(r'\placeholder{ }', '')
                          .trim();
                      if (!mounted || latex.isEmpty) {
                        return;
                      }
                      navigator.pop(
                        _MathToolboxResult.math(
                          snippet: _wrapLatex(latex),
                          latex: latex,
                          displayMode: _displayMode,
                        ),
                      );
                    },
                    icon: const Icon(Icons.add_rounded),
                    label: Text(
                      _displayMode
                          ? 'Insert display math'
                          : 'Insert inline math',
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

class _StudentQuestionPreviewCard extends StatelessWidget {
  const _StudentQuestionPreviewCard({
    required this.section,
    required this.prompt,
    required this.attachments,
    required this.optionAttachments,
    required this.options,
    required this.correctIndex,
  });

  final String section;
  final String prompt;
  final List<QuestionAttachment> attachments;
  final List<List<QuestionAttachment>> optionAttachments;
  final List<String> options;
  final int correctIndex;

  @override
  Widget build(BuildContext context) {
    final normalizedPrompt =
        RichContentCodec.isEncoded(prompt)
            ? prompt
            : MathContentParser.normalizeSourceText(prompt);
    final normalizedOptions = options
        .map(
          (option) =>
              RichContentCodec.isEncoded(option)
                  ? option
                  : MathContentParser.normalizeSourceText(option),
        )
        .toList(growable: false);
    final answerAssigned = correctIndex >= 0 && correctIndex < 4;
    final safeOptions =
        normalizedOptions.length >= 4
            ? normalizedOptions
            : [
              ...normalizedOptions,
              ...List.filled(4 - normalizedOptions.length, ''),
            ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: MeritTheme.background,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Student preview',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(color: MeritTheme.secondary),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color:
                      answerAssigned
                          ? MeritTheme.primarySoft
                          : const Color(0xFFFFF4EA),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color:
                        answerAssigned
                            ? MeritTheme.border
                            : const Color(0xFFFFC79D),
                  ),
                ),
                child: Text(
                  answerAssigned
                      ? (section.trim().isEmpty ? 'No section' : section.trim())
                      : 'Answer pending',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: RichQuestionContentView(
                rawText: normalizedPrompt,
                allowExpand: true,
                preferProvidedSegments: false,
              ),
            ),
          ),
          if (attachments.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...attachments
                .where((item) => item.url.trim().isNotEmpty)
                .map(
                  (attachment) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: Image.network(
                        attachment.url,
                        fit: BoxFit.contain,
                        errorBuilder:
                            (_, __, ___) => Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: MeritTheme.border),
                              ),
                              child: Text(
                                attachment.label ??
                                    'Question image could not be loaded.',
                              ),
                            ),
                      ),
                    ),
                  ),
                ),
          ],
          const SizedBox(height: 12),
          if (!answerAssigned) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF4EA),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFFFC79D)),
              ),
              child: Text(
                'This imported question is editable. Pick the correct option in the editor before saving the paper.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
            const SizedBox(height: 12),
          ],
          ...List.generate(4, (index) {
            final option = safeOptions[index];
            final selected = answerAssigned && index == correctIndex;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Material(
                color: selected ? MeritTheme.primarySoft : Colors.white,
                borderRadius: BorderRadius.circular(22),
                child: InkWell(
                  borderRadius: BorderRadius.circular(22),
                  onTap: null,
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color:
                            selected ? MeritTheme.primary : MeritTheme.border,
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
                                    ? MeritTheme.primary
                                    : MeritTheme.primarySoft,
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            String.fromCharCode(65 + index),
                            style: Theme.of(
                              context,
                            ).textTheme.titleMedium?.copyWith(
                              color:
                                  selected
                                      ? Colors.white
                                      : MeritTheme.secondary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              RichQuestionContentView(
                                rawText: option,
                                allowExpand: true,
                                preferProvidedSegments: false,
                                compact: true,
                              ),
                              if (index < optionAttachments.length &&
                                  optionAttachments[index].isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: List.generate(
                                    optionAttachments[index].length,
                                    (attachmentIndex) {
                                      final attachment =
                                          optionAttachments[index][attachmentIndex];
                                      return SizedBox(
                                        width: 180,
                                        child: _QuestionAttachmentCard(
                                          attachment: attachment,
                                          onRemove: () {},
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Blog admin Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

class _BlogEntry {
  _BlogEntry({
    required this.id,
    required this.title,
    required this.slug,
    required this.author,
    required this.category,
    required this.tags,
    required this.content,
    required this.featuredImage,
    required this.metaDescription,
    required this.status,
    required this.views,
    required this.publishDate,
  });

  factory _BlogEntry.fromJson(Map<String, dynamic> j) => _BlogEntry(
    id: j['id'] as String,
    title: j['title'] as String,
    slug: j['slug'] as String,
    author: j['author'] as String? ?? '',
    category: j['category'] as String? ?? '',
    tags: (j['tags'] as List?)?.map((e) => e.toString()).toList() ?? [],
    content: j['content'] as String? ?? '',
    featuredImage: j['featured_image'] as String?,
    metaDescription: j['meta_description'] as String?,
    status: j['status'] as String? ?? 'draft',
    views: j['views'] as int? ?? 0,
    publishDate: j['publish_date'] as String?,
  );

  final String id;
  final String title;
  final String slug;
  final String author;
  final String category;
  final List<String> tags;
  final String content;
  final String? featuredImage;
  final String? metaDescription;
  final String status;
  final int views;
  final String? publishDate;
}

String _blogSlugify(String text) => text
    .toLowerCase()
    .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
    .replaceAll(RegExp(r'(^-|-$)'), '');

String _deltaToHtml(List<dynamic> ops) {
  final buffer = StringBuffer();
  final pending = <String>[];
  bool inBullet = false;
  bool inOrdered = false;

  String esc(String s) => s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

  String inline(String text, Map<String, dynamic> a) {
    if (text.isEmpty) return '';
    var s = esc(text);
    if (a['bold'] == true) s = '<strong>$s</strong>';
    if (a['italic'] == true) s = '<em>$s</em>';
    if (a['underline'] == true) s = '<u>$s</u>';
    if (a['strike'] == true) s = '<s>$s</s>';
    final link = a['link'];
    if (link is String) s = '<a href="$link">$s</a>';
    return s;
  }

  void closeList() {
    if (inBullet) {
      buffer.write('</ul>');
      inBullet = false;
    }
    if (inOrdered) {
      buffer.write('</ol>');
      inOrdered = false;
    }
  }

  void emitBlock(String content, Map<String, dynamic> blockAttrs) {
    final list = blockAttrs['list'];
    final header = blockAttrs['header'];
    if (list == 'bullet') {
      if (!inBullet) {
        closeList();
        buffer.write('<ul>');
        inBullet = true;
      }
      buffer.write('<li>$content</li>');
    } else if (list == 'ordered') {
      if (!inOrdered) {
        closeList();
        buffer.write('<ol>');
        inOrdered = true;
      }
      buffer.write('<li>$content</li>');
    } else {
      closeList();
      if (header == 1) {
        buffer.write('<h1>$content</h1>');
      } else if (header == 2) {
        buffer.write('<h2>$content</h2>');
      } else if (header == 3) {
        buffer.write('<h3>$content</h3>');
      } else if (content.isNotEmpty) {
        buffer.write('<p>$content</p>');
      }
    }
  }

  for (final op in ops) {
    if (op is! Map<String, dynamic>) continue;
    final opMap = op;
    final insert = opMap['insert'];
    final attrs =
        (opMap['attributes'] ?? <String, dynamic>{}) as Map<String, dynamic>;

    if (insert is Map) {
      final img = insert['image'];
      if (img is String) pending.add('<img src="$img" style="max-width:100%">');
      continue;
    }
    if (insert is! String) continue;

    final parts = insert.split('\n');
    for (int i = 0; i < parts.length; i++) {
      if (parts[i].isNotEmpty) pending.add(inline(parts[i], attrs));
      if (i < parts.length - 1) {
        final blockAttrs =
            (i == parts.length - 2) ? attrs : <String, dynamic>{};
        emitBlock(pending.join(''), blockAttrs);
        pending.clear();
      }
    }
  }

  if (pending.isNotEmpty) {
    closeList();
    buffer.write('<p>${pending.join('')}</p>');
  }
  closeList();
  return buffer.toString();
}

class AdminBlogPage extends StatefulWidget {
  const AdminBlogPage({super.key});

  @override
  State<AdminBlogPage> createState() => _AdminBlogPageState();
}

class _AdminBlogPageState extends State<AdminBlogPage> {
  List<_BlogEntry> _blogs = [];
  bool _loading = true;
  bool _fetchError = false;
  _BlogEntry? _editing; // null = list, non-null = edit form, sentinel for new
  bool _showForm = false;

  @override
  void initState() {
    super.initState();
    _fetchBlogs();
  }

  Future<void> _fetchBlogs() async {
    setState(() {
      _loading = true;
      _fetchError = false;
    });
    try {
      final api = AppScope.of(context).apiClient!;
      final result = await api.getJson(
        '/v1/cms/admin/blogs',
        authenticated: true,
      );
      final list = result['data'] as List? ?? [];
      if (!mounted) return;
      setState(() {
        _blogs =
            list
                .map((e) => _BlogEntry.fromJson(e as Map<String, dynamic>))
                .toList();
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _fetchError = true;
      });
    }
  }

  Future<void> _deleteBlog(String id) async {
    final api = AppScope.of(context).apiClient!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder:
          (ctx) => AlertDialog(
            title: const Text('Delete blog?'),
            content: const Text('This cannot be undone.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text(
                  'Delete',
                  style: TextStyle(color: Colors.red),
                ),
              ),
            ],
          ),
    );
    if (confirmed != true) return;
    try {
      await api.deleteJson('/v1/cms/admin/blogs/$id', authenticated: true);
      _fetchBlogs();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Delete failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_showForm) {
      return _BlogFormPage(
        initial: _editing,
        api: AppScope.of(context).apiClient!,
        onDone: () {
          setState(() {
            _showForm = false;
            _editing = null;
          });
          _fetchBlogs();
        },
      );
    }

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Blog Posts',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed:
                    () => setState(() {
                      _editing = null;
                      _showForm = true;
                    }),
                icon: const Icon(Icons.add),
                label: const Text('New Post'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_loading)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (_fetchError)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Failed to load blog posts.'),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: _fetchBlogs,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          else if (_blogs.isEmpty)
            const Expanded(child: Center(child: Text('No blog posts yet.')))
          else
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children:
                      _blogs
                          .map(
                            (b) => _BlogListTile(
                              blog: b,
                              onEdit:
                                  () => setState(() {
                                    _editing = b;
                                    _showForm = true;
                                  }),
                              onDelete: () => _deleteBlog(b.id),
                            ),
                          )
                          .toList(),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _BlogListTile extends StatelessWidget {
  const _BlogListTile({
    required this.blog,
    required this.onEdit,
    required this.onDelete,
  });

  final _BlogEntry blog;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final isPublished = blog.status == 'published';
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(
          blog.title,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          '${blog.category}  Ã¢â‚¬Â¢  ${blog.views} views  Ã¢â‚¬Â¢  ${blog.publishDate != null ? (blog.publishDate!.length >= 10 ? blog.publishDate!.substring(0, 10) : blog.publishDate!) : 'No date'}',
        ),
        leading: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: isPublished ? Colors.green.shade50 : Colors.amber.shade50,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            blog.status,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color:
                  isPublished ? Colors.green.shade700 : Colors.amber.shade700,
            ),
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: onEdit,
              tooltip: 'Edit',
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, color: Colors.red),
              onPressed: onDelete,
              tooltip: 'Delete',
            ),
          ],
        ),
      ),
    );
  }
}

class _BlogFormPage extends StatefulWidget {
  const _BlogFormPage({
    required this.initial,
    required this.api,
    required this.onDone,
  });

  final _BlogEntry? initial;
  final ApiClient api;
  final VoidCallback onDone;

  @override
  State<_BlogFormPage> createState() => _BlogFormPageState();
}

class _BlogFormPageState extends State<_BlogFormPage> {
  late final TextEditingController _title;
  late final TextEditingController _slug;
  late final TextEditingController _author;
  late final TextEditingController _category;
  late final TextEditingController _tags;
  late final quill.QuillController _quillController;
  late final TextEditingController _metaDesc;
  String? _featuredImage;
  Uint8List? _previewBytes;
  bool _uploading = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final b = widget.initial;
    _title = TextEditingController(text: b?.title ?? '');
    _slug = TextEditingController(text: b?.slug ?? '');
    _author = TextEditingController(text: b?.author ?? 'Merit Launchers');
    _category = TextEditingController(text: b?.category ?? 'General');
    _tags = TextEditingController(text: b?.tags.join(', ') ?? '');
    _metaDesc = TextEditingController(text: b?.metaDescription ?? '');
    _featuredImage = b?.featuredImage;

    final htmlContent = b?.content ?? '';
    if (htmlContent.isNotEmpty) {
      try {
        final delta = HtmlToDelta().convert(htmlContent);
        _quillController = quill.QuillController(
          document: quill.Document.fromJson(delta.toJson()),
          selection: const TextSelection.collapsed(offset: 0),
        );
      } catch (_) {
        _quillController = quill.QuillController.basic();
      }
    } else {
      _quillController = quill.QuillController.basic();
    }
  }

  @override
  void dispose() {
    for (final c in [_title, _slug, _author, _category, _tags, _metaDesc]) {
      c.dispose();
    }
    _quillController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
    );
    if (result == null ||
        result.files.isEmpty ||
        result.files.single.bytes == null) {
      return;
    }
    setState(() => _uploading = true);
    try {
      final bytes = result.files.single.bytes!;
      final ext = result.files.single.extension ?? 'jpg';
      final b64 = base64Encode(bytes);
      final resp = await widget.api.postJson(
        '/v1/cms/admin/upload',
        authenticated: true,
        body: {'data': b64, 'ext': ext},
      );
      setState(() {
        _featuredImage = resp['url'] as String?;
        _previewBytes = bytes;
        _uploading = false;
      });
    } catch (e) {
      setState(() => _uploading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
      }
    }
  }

  Future<void> _save(String status) async {
    if (_title.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Title is required')));
      return;
    }
    setState(() => _saving = true);
    final body = {
      'title': _title.text.trim(),
      'slug':
          _slug.text.trim().isEmpty
              ? _blogSlugify(_title.text.trim())
              : _slug.text.trim(),
      'content': _deltaToHtml(_quillController.document.toDelta().toJson()),
      'featured_image': _featuredImage,
      'author': _author.text.trim(),
      'category': _category.text.trim(),
      'tags':
          _tags.text
              .split(',')
              .map((t) => t.trim())
              .where((t) => t.isNotEmpty)
              .toList(),
      'meta_description':
          _metaDesc.text.trim().isEmpty ? null : _metaDesc.text.trim(),
      'status': status,
      'publish_date':
          status == 'published' ? DateTime.now().toIso8601String() : null,
    };
    try {
      final id = widget.initial?.id;
      if (id != null) {
        await widget.api.putJson(
          '/v1/cms/admin/blogs/$id',
          authenticated: true,
          body: body,
        );
      } else {
        await widget.api.postJson(
          '/v1/cms/admin/blogs',
          authenticated: true,
          body: body,
        );
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              status == 'published' ? 'Published!' : 'Draft saved!',
            ),
          ),
        );
        widget.onDone();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Save failed: $e')));
      }
    }
    if (mounted) {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: widget.onDone,
              ),
              const SizedBox(width: 8),
              Text(
                widget.initial != null ? 'Edit Post' : 'New Post',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: _saving ? null : () => _save('draft'),
                icon: const Icon(Icons.save_outlined, size: 18),
                label: const Text('Save Draft'),
              ),
              const SizedBox(width: 8),
              FilledButton.icon(
                onPressed: _saving ? null : () => _save('published'),
                icon: const Icon(Icons.send_outlined, size: 18),
                label: const Text('Publish'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Ã¢â€â‚¬Ã¢â€â‚¬ Details card Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Details',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _field(
                                  'Title *',
                                  _title,
                                  onChanged: (v) {
                                    if (widget.initial == null) {
                                      _slug.text = _blogSlugify(v);
                                    }
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(child: _field('Slug', _slug)),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(child: _field('Author', _author)),
                              const SizedBox(width: 12),
                              Expanded(child: _field('Category', _category)),
                            ],
                          ),
                          const SizedBox(height: 10),
                          _field(
                            'Tags (comma separated)',
                            _tags,
                            hint: 'CUET, tips, preparation',
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Ã¢â€â‚¬Ã¢â€â‚¬ Featured image Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Featured Image',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 12),
                          if (_previewBytes != null) ...[
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.memory(
                                _previewBytes!,
                                height: 160,
                                width: double.infinity,
                                fit: BoxFit.cover,
                              ),
                            ),
                            const SizedBox(height: 8),
                          ] else if (_featuredImage != null) ...[
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                _featuredImage!,
                                height: 160,
                                width: double.infinity,
                                fit: BoxFit.cover,
                              ),
                            ),
                            const SizedBox(height: 8),
                          ],
                          OutlinedButton.icon(
                            onPressed: _uploading ? null : _pickImage,
                            icon: const Icon(Icons.upload_outlined),
                            label: Text(
                              _uploading
                                  ? 'UploadingÃ¢â‚¬Â¦'
                                  : _featuredImage != null
                                  ? 'Replace image'
                                  : 'Upload image',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Ã¢â€â‚¬Ã¢â€â‚¬ Content Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Content',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.shade300),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              children: [
                                quill.QuillSimpleToolbar(
                                  controller: _quillController,
                                  configurations:
                                      const quill.QuillSimpleToolbarConfigurations(
                                        showFontFamily: false,
                                        showFontSize: false,
                                        showSubscript: false,
                                        showSuperscript: false,
                                        showInlineCode: false,
                                        showCodeBlock: false,
                                        showSearchButton: false,
                                        showClipboardCut: false,
                                        showClipboardCopy: false,
                                        showClipboardPaste: false,
                                      ),
                                ),
                                const Divider(height: 1),
                                SizedBox(
                                  height: 420,
                                  child: quill.QuillEditor.basic(
                                    controller: _quillController,
                                    configurations:
                                        const quill.QuillEditorConfigurations(
                                          placeholder:
                                              'Write your blog content hereÃ¢â‚¬Â¦',
                                          padding: EdgeInsets.all(12),
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
                  const SizedBox(height: 12),
                  // Ã¢â€â‚¬Ã¢â€â‚¬ SEO Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'SEO',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _metaDesc,
                            maxLines: 3,
                            maxLength: 160,
                            decoration: const InputDecoration(
                              labelText: 'Meta Description',
                              hintText:
                                  'Brief description for search enginesÃ¢â‚¬Â¦',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(
    String label,
    TextEditingController ctrl, {
    String? hint,
    void Function(String)? onChanged,
  }) {
    return TextField(
      controller: ctrl,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
    );
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

class _MathSnippet {
  const _MathSnippet(this.label, this.value, {this.category = 'Basic'});

  final String label;
  final String value;
  final String category;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Grid picker â€“ MS-Word-style table/matrix dimension selector
