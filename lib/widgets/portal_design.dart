import 'package:flutter/material.dart';

import '../app/theme.dart';

class PortalSurface extends StatelessWidget {
  const PortalSurface({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(22),
    this.borderRadius = const BorderRadius.all(Radius.circular(22)),
    this.color,
    this.gradient,
    this.borderColor,
    this.shadowColor,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadius borderRadius;
  final Color? color;
  final Gradient? gradient;
  final Color? borderColor;
  final Color? shadowColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: gradient == null ? (color ?? Colors.white) : null,
        gradient: gradient,
        borderRadius: borderRadius,
        border: Border.all(color: borderColor ?? MeritTheme.border),
        boxShadow: [
          BoxShadow(
            color: (shadowColor ?? MeritTheme.secondary).withValues(alpha: 0.08),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
  }
}

class PortalSectionCard extends StatelessWidget {
  const PortalSectionCard({
    super.key,
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
    return PortalSurface(
      color: Colors.white,
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFFFFFFF), Color(0xFFF9FBFE)],
      ),
      borderRadius: BorderRadius.circular(22),
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
                    Text(title, style: Theme.of(context).textTheme.headlineSmall),
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

class PortalMetricPill extends StatelessWidget {
  const PortalMetricPill({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    this.dark = false,
    this.accent,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool dark;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final iconAccent = accent ?? (dark ? Colors.white : MeritTheme.primary);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: dark ? Colors.white.withValues(alpha: 0.1) : const Color(0xFFF7FAFD),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: dark ? Colors.white.withValues(alpha: 0.12) : MeritTheme.border,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: dark
                  ? Colors.white.withValues(alpha: 0.14)
                  : iconAccent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: Icon(icon, size: 17, color: iconAccent),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: dark ? Colors.white : MeritTheme.secondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: dark
                        ? Colors.white.withValues(alpha: 0.76)
                        : MeritTheme.secondaryMuted,
                    fontWeight: FontWeight.w600,
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

class PortalActionTile extends StatelessWidget {
  const PortalActionTile({
    super.key,
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
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: MeritTheme.border),
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: MeritTheme.primarySoft,
                  borderRadius: BorderRadius.circular(12),
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
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: MeritTheme.primary,
                  ),
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
