// FoodRescue AI — Role Selection Screen

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withAlpha(20),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.eco_rounded, color: AppTheme.primary, size: 32),
              ),
              const SizedBox(height: 24),
              const Text(
                'Welcome to\nFoodRescue AI',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Choose your role to get started',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 15),
              ),
              const SizedBox(height: 40),
              Expanded(
                child: Column(
                  children: [
                    _RoleCard(
                      icon: Icons.restaurant_rounded,
                      title: 'Donor',
                      subtitle: 'Post surplus food for redistribution',
                      color: AppTheme.primary,
                      bgColor: const Color(0xFFE8F5ED),
                      onTap: () => context.go('/login', extra: 'donor'),
                    ),
                    const SizedBox(height: 16),
                    _RoleCard(
                      icon: Icons.people_alt_rounded,
                      title: 'Receiver',
                      subtitle: 'Receive food for your community',
                      color: AppTheme.amber,
                      bgColor: const Color(0xFFFFF8E1),
                      onTap: () => context.go('/login', extra: 'receiver'),
                    ),
                    const SizedBox(height: 16),
                    _RoleCard(
                      icon: Icons.delivery_dining_rounded,
                      title: 'Volunteer',
                      subtitle: 'Help transport food between donors and receivers',
                      color: AppTheme.statusInTransit,
                      bgColor: const Color(0xFFE3F2FD),
                      onTap: () => context.go('/login', extra: 'volunteer'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: AppTheme.textHint, size: 16),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'This is a prototype with demo data',
                        style: TextStyle(color: AppTheme.textHint, fontSize: 12),
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

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final Color bgColor;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.bgColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppTheme.cardBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(10),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary,
                      )),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: color),
          ],
        ),
      ),
    );
  }
}
