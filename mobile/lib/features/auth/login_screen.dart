// FoodRescue AI — Login / Demo Login Screen

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  final String role;
  const LoginScreen({super.key, required this.role});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _loading = false;

  final _roleInfo = {
    'donor': (
      icon: Icons.restaurant_rounded,
      label: 'Donor',
      color: AppTheme.primary,
      bgColor: const Color(0xFFE8F5ED),
    ),
    'receiver': (
      icon: Icons.people_alt_rounded,
      label: 'Receiver',
      color: AppTheme.amber,
      bgColor: const Color(0xFFFFF8E1),
    ),
    'volunteer': (
      icon: Icons.delivery_dining_rounded,
      label: 'Volunteer',
      color: AppTheme.statusInTransit,
      bgColor: const Color(0xFFE3F2FD),
    ),
  };

  Future<void> _demoLogin() async {
    setState(() => _loading = true);
    await ref.read(authProvider.notifier).demoLogin(widget.role);
    if (!mounted) return;
    setState(() => _loading = false);

    final error = ref.read(authProvider).error;
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: AppTheme.statusBlocked),
      );
    } else {
      context.go('/${widget.role}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final info = _roleInfo[widget.role];
    if (info == null) return const SizedBox();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Sign In'),
        backgroundColor: AppTheme.background,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 24),
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: info.bgColor,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Icon(info.icon, color: info.color, size: 44),
                ),
              ),
              const SizedBox(height: 24),
              Center(
                child: Text(
                  'Sign in as ${info.label}',
                  style: const TextStyle(
                    fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              const Center(
                child: Text(
                  'Use a demo account to explore the prototype',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondary),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.sageLight.withAlpha(50),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.sageLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.science_outlined, color: AppTheme.primary, size: 18),
                        const SizedBox(width: 8),
                        const Text(
                          'Demo Account',
                          style: TextStyle(
                            fontWeight: FontWeight.w600, color: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Logs in with pre-seeded sample data.\nAll data is for demonstration purposes only.',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loading ? null : _demoLogin,
                icon: _loading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Icon(Icons.login_rounded),
                label: Text(_loading ? 'Signing in...' : 'Demo Login as ${info.label}'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: info.color,
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => context.go('/role'),
                child: const Text('Choose Different Role'),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
