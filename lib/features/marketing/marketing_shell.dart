import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../app/app.dart';
import '../../app/models.dart';
import '../../app/theme.dart';

class MarketingShell extends StatefulWidget {
  const MarketingShell({super.key});

  @override
  State<MarketingShell> createState() => _MarketingShellState();
}

class _MarketingShellState extends State<MarketingShell> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 960;
    final employees = controller.affiliates.where((affiliate) {
      final q = _query.trim().toLowerCase();
      if (q.isEmpty) {
        return true;
      }
      return affiliate.name.toLowerCase().contains(q) ||
          affiliate.code.toLowerCase().contains(q) ||
          affiliate.channel.toLowerCase().contains(q);
    }).toList()
      ..sort((a, b) => controller.affiliateRevenue(b.code).compareTo(controller.affiliateRevenue(a.code)));

    final totalSignups = controller.affiliates.fold<int>(
      0,
      (sum, affiliate) => sum + controller.affiliateReferrals(affiliate.code),
    );
    final totalPaid = controller.affiliates.fold<int>(
      0,
      (sum, affiliate) => sum + controller.affiliatePaidStudents(affiliate.code),
    );
    final totalRevenue = controller.affiliates.fold<double>(
      0,
      (sum, affiliate) => sum + controller.affiliateRevenue(affiliate.code),
    );

    final topEmployee = controller.affiliates.isEmpty
        ? null
        : (controller.affiliates.toList()
              ..sort((a, b) => controller.affiliateRevenue(b.code).compareTo(controller.affiliateRevenue(a.code))))
            .first;

    final body = ListView(
      padding: EdgeInsets.fromLTRB(compact ? 16 : 24, 20, compact ? 16 : 24, 24),
      children: [
        _MarketingHero(
          totalEmployees: controller.affiliates.length,
          totalSignups: totalSignups,
          totalPaid: totalPaid,
          totalRevenue: totalRevenue,
          compact: compact,
          onAddEmployee: () => _openEmployeeDialog(context),
        ),
        const SizedBox(height: 20),
        if (topEmployee != null)
          _TopPerformerBanner(
            affiliate: topEmployee,
            signups: controller.affiliateReferrals(topEmployee.code),
            paid: controller.affiliatePaidStudents(topEmployee.code),
            revenue: controller.affiliateRevenue(topEmployee.code),
          ),
        if (topEmployee != null) const SizedBox(height: 20),
        compact
            ? Column(
                children: [
                  _EmployeeSearchCard(
                    controller: _searchController,
                    onChanged: (value) => setState(() => _query = value),
                    totalVisible: employees.length,
                  ),
                  const SizedBox(height: 16),
                  _PerformanceGuideCard(compact: compact),
                ],
              )
            : Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 5,
                    child: _EmployeeSearchCard(
                      controller: _searchController,
                      onChanged: (value) => setState(() => _query = value),
                      totalVisible: employees.length,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 4,
                    child: _PerformanceGuideCard(compact: compact),
                  ),
                ],
              ),
        const SizedBox(height: 20),
        if (employees.isEmpty)
          _EmptyMarketingState(onAddEmployee: () => _openEmployeeDialog(context))
        else
          ...employees.map(
            (affiliate) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _EmployeePerformanceCard(
                affiliate: affiliate,
                students: controller.studentsForReferralCode(affiliate.code),
                paidCount: controller.affiliatePaidStudents(affiliate.code),
                revenue: controller.affiliateRevenue(affiliate.code),
                purchases: controller.purchasesForReferralCode(affiliate.code),
              ),
            ),
          ),
      ],
    );

    if (compact) {
      return Scaffold(
        backgroundColor: const Color(0xFFF5F8FC),
        appBar: AppBar(
          title: const Text('Marketing performance'),
        ),
        drawer: Drawer(
          child: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF183153), Color(0xFF245E8B)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Marketing console',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: Colors.white),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Track employee referral performance and onboard new codes.',
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: Colors.white.withValues(alpha: 0.8)),
                      ),
                    ],
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.person_add_alt_1_rounded),
                  title: const Text('Add employee'),
                  onTap: () {
                    Navigator.of(context).pop();
                    _openEmployeeDialog(context);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.logout_rounded),
                  title: const Text('Sign out'),
                  onTap: controller.logout,
                ),
              ],
            ),
          ),
        ),
        body: SafeArea(child: body),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8FC),
      body: SafeArea(
        child: Row(
          children: [
            Container(
              width: 280,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(right: BorderSide(color: MeritTheme.border)),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(22, 24, 22, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: MeritTheme.primarySoft,
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: Image.asset('assets/branding/logo.png', width: 44, height: 44),
                    ),
                    const SizedBox(height: 18),
                    Text('Marketing console', style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text(
                      'A dedicated dashboard for your marketing head to manage employee referral codes and track performance.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 28),
                    _NavChip(
                      icon: Icons.analytics_outlined,
                      label: 'Performance overview',
                    ),
                    const SizedBox(height: 10),
                    _NavChip(
                      icon: Icons.groups_outlined,
                      label: '${controller.affiliates.length} active employees',
                    ),
                    const SizedBox(height: 10),
                    _NavChip(
                      icon: Icons.verified_outlined,
                      label: '$totalPaid paid referrals',
                    ),
                    const Spacer(),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _openEmployeeDialog(context),
                        icon: const Icon(Icons.person_add_alt_1_rounded),
                        label: const Text('Add employee'),
                      ),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: controller.logout,
                        icon: const Icon(Icons.logout_rounded),
                        label: const Text('Sign out'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(child: body),
          ],
        ),
      ),
    );
  }

  Future<void> _openEmployeeDialog(BuildContext context) async {
    final controller = AppScope.of(context);
    final nameController = TextEditingController();
    final channelController = TextEditingController(text: 'Marketing partner');
    final codeController = TextEditingController();
    var submitting = false;
    String? errorText;

    String generateCode(String name) {
      final cleaned = name
          .trim()
          .toUpperCase()
          .replaceAll(RegExp(r'[^A-Z0-9]+'), ' ')
          .split(' ')
          .where((part) => part.isNotEmpty)
          .take(2)
          .join('-');
      final base = cleaned.isEmpty ? 'EMP' : cleaned;
      var suffix = 1;
      var candidate = '$base-${100 + suffix}';
      final existing = controller.affiliates.map((affiliate) => affiliate.code).toSet();
      while (existing.contains(candidate)) {
        suffix += 1;
        candidate = '$base-${100 + suffix}';
      }
      return candidate;
    }

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => AlertDialog(
          title: const Text('Add marketing employee'),
          content: SizedBox(
            width: 460,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Employee name'),
                  onChanged: (value) {
                    if (codeController.text.trim().isEmpty) {
                      codeController.text = generateCode(value);
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: codeController,
                  decoration: InputDecoration(
                    labelText: 'Referral code',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.auto_fix_high_outlined),
                      onPressed: () {
                        codeController.text = generateCode(nameController.text);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: channelController,
                  decoration: const InputDecoration(labelText: 'Team / company / channel'),
                ),
                if (errorText != null) ...[
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      errorText!,
                      style: Theme.of(dialogContext).textTheme.bodyMedium?.copyWith(
                            color: Colors.red.shade700,
                          ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: submitting ? null : () => Navigator.of(dialogContext).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: submitting
                  ? null
                  : () async {
                      if (nameController.text.trim().isEmpty || codeController.text.trim().isEmpty) {
                        setDialogState(() {
                          errorText = 'Employee name and referral code are required.';
                        });
                        return;
                      }
                      setDialogState(() {
                        submitting = true;
                        errorText = null;
                      });
                      try {
                        await controller.addAffiliate(
                          name: nameController.text.trim(),
                          code: codeController.text.trim(),
                          channel: channelController.text.trim().isEmpty
                              ? 'Marketing partner'
                              : channelController.text.trim(),
                        );
                        if (dialogContext.mounted) {
                          Navigator.of(dialogContext).pop();
                        }
                      } catch (error) {
                        setDialogState(() {
                          errorText = error.toString().replaceFirst('Exception: ', '');
                          submitting = false;
                        });
                      }
                    },
              child: Text(submitting ? 'Creating...' : 'Create employee'),
            ),
          ],
        ),
      ),
    );
  }
}

class _MarketingHero extends StatelessWidget {
  const _MarketingHero({
    required this.totalEmployees,
    required this.totalSignups,
    required this.totalPaid,
    required this.totalRevenue,
    required this.compact,
    required this.onAddEmployee,
  });

  final int totalEmployees;
  final int totalSignups;
  final int totalPaid;
  final double totalRevenue;
  final bool compact;
  final VoidCallback onAddEmployee;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(compact ? 20 : 28),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF15304F), Color(0xFF266995)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            runSpacing: 14,
            spacing: 14,
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 620),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'Marketing performance command center',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Track every employee referral code from signup to paid revenue.',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Colors.white),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Give every employee a unique code, watch signups and paid conversions, and inspect the exact students tied to each code from one dedicated dashboard.',
                      style: Theme.of(context)
                          .textTheme
                          .bodyLarge
                          ?.copyWith(color: Colors.white.withValues(alpha: 0.84)),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: onAddEmployee,
                icon: const Icon(Icons.person_add_alt_1_rounded),
                label: const Text('Add employee'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: MeritTheme.secondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Wrap(
            spacing: 14,
            runSpacing: 14,
            children: [
              _HeroMetric(label: 'Employees', value: '$totalEmployees'),
              _HeroMetric(label: 'Signed up', value: '$totalSignups'),
              _HeroMetric(label: 'Paid students', value: '$totalPaid'),
              _HeroMetric(label: 'Revenue', value: 'Rs ${totalRevenue.toStringAsFixed(0)}'),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroMetric extends StatelessWidget {
  const _HeroMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 180,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _TopPerformerBanner extends StatelessWidget {
  const _TopPerformerBanner({
    required this.affiliate,
    required this.signups,
    required this.paid,
    required this.revenue,
  });

  final Affiliate affiliate;
  final int signups;
  final int paid;
  final double revenue;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: MeritTheme.primarySoft,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(Icons.workspace_premium_rounded, color: MeritTheme.secondary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Top performer right now', style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 4),
                Text(
                  '${affiliate.name} (${affiliate.code})',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  '$signups signups • $paid paid students • Rs ${revenue.toStringAsFixed(0)} revenue',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmployeeSearchCard extends StatelessWidget {
  const _EmployeeSearchCard({
    required this.controller,
    required this.onChanged,
    required this.totalVisible,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final int totalVisible;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Employee directory', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            'Search by employee name, referral code, or team. $totalVisible visible right now.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 14),
          TextField(
            controller: controller,
            onChanged: onChanged,
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search_rounded),
              labelText: 'Search employees',
            ),
          ),
        ],
      ),
    );
  }
}

class _PerformanceGuideCard extends StatelessWidget {
  const _PerformanceGuideCard({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: MeritTheme.primarySoft,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('How to read this dashboard', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Every employee is tracked by referral code. Signups come from profile onboarding, paid students are distinct referred users with at least one purchase, and revenue is the sum of their paid orders.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: const [
              _GuideChip(label: 'Unique referral code'),
              _GuideChip(label: 'Signup count'),
              _GuideChip(label: 'Paid conversion'),
              _GuideChip(label: 'Revenue contribution'),
            ],
          ),
        ],
      ),
    );
  }
}

class _GuideChip extends StatelessWidget {
  const _GuideChip({required this.label});

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

class _EmployeePerformanceCard extends StatelessWidget {
  const _EmployeePerformanceCard({
    required this.affiliate,
    required this.students,
    required this.paidCount,
    required this.revenue,
    required this.purchases,
  });

  final Affiliate affiliate;
  final List<StudentProfile> students;
  final int paidCount;
  final double revenue;
  final List<Purchase> purchases;

  @override
  Widget build(BuildContext context) {
    final signups = students.length;
    final conversion = signups == 0 ? 0 : (paidCount / signups) * 100;
    final avgRevenue = paidCount == 0 ? 0 : revenue / paidCount;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: MeritTheme.border),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        childrenPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        collapsedShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Wrap(
          spacing: 10,
          runSpacing: 10,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(affiliate.name, style: Theme.of(context).textTheme.titleLarge),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: MeritTheme.primarySoft,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(affiliate.code, style: Theme.of(context).textTheme.labelLarge),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            '${affiliate.channel} • $signups signups • $paidCount paid • Rs ${revenue.toStringAsFixed(0)} revenue',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _MetricTile(label: 'Signups', value: '$signups'),
              _MetricTile(label: 'Paid', value: '$paidCount'),
              _MetricTile(label: 'Conversion', value: '${conversion.toStringAsFixed(1)}%'),
              _MetricTile(label: 'Avg paid value', value: 'Rs ${avgRevenue.toStringAsFixed(0)}'),
            ],
          ),
          const SizedBox(height: 18),
          Text('Students tied to this code', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 10),
          if (students.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: MeritTheme.background,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: MeritTheme.border),
              ),
              child: const Text('No students have signed up with this referral code yet.'),
            )
          else
            ...students.map(
              (student) {
                final studentPurchases = purchases.where((purchase) => purchase.studentId == student.id).toList();
                final studentRevenue =
                    studentPurchases.fold<double>(0, (sum, purchase) => sum + purchase.amount);
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: MeritTheme.background,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: MeritTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          Text(student.name, style: Theme.of(context).textTheme.titleMedium),
                          if (studentPurchases.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: MeritTheme.success.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                'Paid',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelLarge
                                    ?.copyWith(color: MeritTheme.success),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${student.contact} • ${student.city.isEmpty ? 'City not set' : student.city}',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Joined ${DateFormat('dd MMM yyyy').format(student.joinedAt)} • ${studentPurchases.length} purchase${studentPurchases.length == 1 ? '' : 's'} • Rs ${studentRevenue.toStringAsFixed(0)} revenue',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MeritTheme.primarySoft,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 8),
          Text(value, style: Theme.of(context).textTheme.titleLarge),
        ],
      ),
    );
  }
}

class _NavChip extends StatelessWidget {
  const _NavChip({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: MeritTheme.background,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: MeritTheme.secondary),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: Theme.of(context).textTheme.bodyMedium)),
        ],
      ),
    );
  }
}

class _EmptyMarketingState extends StatelessWidget {
  const _EmptyMarketingState({required this.onAddEmployee});

  final VoidCallback onAddEmployee;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('No employees added yet', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            'Add your first marketing employee to generate a referral code and start tracking signups, paid students, and revenue contribution.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: onAddEmployee,
            icon: const Icon(Icons.person_add_alt_1_rounded),
            label: const Text('Add first employee'),
          ),
        ],
      ),
    );
  }
}
