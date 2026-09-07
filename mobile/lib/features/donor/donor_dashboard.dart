// FoodRescue AI — Donor Dashboard

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/donations_provider.dart';
import '../../models/app_models.dart';

class DonorDashboard extends ConsumerStatefulWidget {
  const DonorDashboard({super.key});

  @override
  ConsumerState<DonorDashboard> createState() => _DonorDashboardState();
}

class _DonorDashboardState extends ConsumerState<DonorDashboard> {
  @override
  void initState() {
    super.initState();
    Future.microtask(_loadDonations);
  }

  Future<void> _loadDonations() async {
    final user = ref.read(authProvider).user;
    if (user != null) {
      await ref.read(donationsProvider.notifier).fetchDonations(donorId: user.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final donState = ref.watch(donationsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Donor Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.analytics_outlined),
            onPressed: () => context.push('/analytics'),
          ),
          IconButton(
            icon: const Icon(Icons.shield_outlined),
            onPressed: () => context.push('/safety'),
          ),
          PopupMenuButton(
            itemBuilder: (ctx) => [
              PopupMenuItem(
                onTap: () => ref.read(authProvider.notifier).logout().then((_) => context.go('/')),
                child: const Text('Logout'),
              ),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/donor/donate').then((_) => _loadDonations()),
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Donate Food', style: TextStyle(color: Colors.white)),
      ),
      body: RefreshIndicator(
        onRefresh: _loadDonations,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Hello, ${user?.name ?? 'Donor'}! 👋',
                        style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w700, color: AppTheme.textPrimary,
                        )),
                    const SizedBox(height: 4),
                    const Text('Your food donations at a glance',
                        style: TextStyle(color: AppTheme.textSecondary)),
                    const SizedBox(height: 20),
                    _StatsRow(donations: donState.donations),
                    const SizedBox(height: 20),
                    const Text('Your Donations',
                        style: TextStyle(
                          fontSize: 17, fontWeight: FontWeight.w600, color: AppTheme.textPrimary,
                        )),
                  ],
                ),
              ),
            ),
            if (donState.isLoading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (donState.error != null)
              SliverFillRemaining(
                child: Center(
                  child: _ErrorState(
                    message: donState.error!,
                    onRetry: _loadDonations,
                  ),
                ),
              )
            else if (donState.donations.isEmpty)
              const SliverFillRemaining(
                child: Center(child: _EmptyState()),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => _DonationCard(donation: donState.donations[i]),
                  childCount: donState.donations.length,
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final List<Donation> donations;
  const _StatsRow({required this.donations});

  @override
  Widget build(BuildContext context) {
    final eligible = donations.where((d) => d.status == 'eligible').length;
    final delivered = donations.where((d) => d.status == 'delivered').length;
    final blocked = donations.where((d) => d.status == 'blocked').length;
    final totalKg = donations.fold<double>(0, (sum, d) => sum + d.weightKg);

    return Row(
      children: [
        Expanded(child: _StatCard('${totalKg.toStringAsFixed(1)} kg', 'Food Posted', Icons.scale, AppTheme.primary)),
        const SizedBox(width: 8),
        Expanded(child: _StatCard('$eligible', 'Eligible', Icons.check_circle, AppTheme.statusEligible)),
        const SizedBox(width: 8),
        Expanded(child: _StatCard('$delivered', 'Delivered', Icons.done_all, AppTheme.sage)),
        const SizedBox(width: 8),
        Expanded(child: _StatCard('$blocked', 'Blocked', Icons.block, AppTheme.statusBlocked)),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;

  const _StatCard(this.value, this.label, this.icon, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withAlpha(15),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withAlpha(40)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontWeight: FontWeight.w700, color: color, fontSize: 14)),
          Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textHint)),
        ],
      ),
    );
  }
}

class _DonationCard extends StatelessWidget {
  final Donation donation;
  const _DonationCard({required this.donation});

  @override
  Widget build(BuildContext context) {
    final statusColor = AppTheme.statusColor(donation.status);
    final statusLabel = AppTheme.statusLabel(donation.status);
    final statusIcon = AppTheme.statusIcon(donation.status);

    return Card(
      child: InkWell(
        onTap: () => context.push('/donor/donation/${donation.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(donation.foodName,
                        style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary,
                        )),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withAlpha(20),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: statusColor.withAlpha(60)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(statusIcon, color: statusColor, size: 12),
                        const SizedBox(width: 4),
                        Text(statusLabel,
                            style: TextStyle(
                              color: statusColor, fontSize: 11, fontWeight: FontWeight.w600,
                            )),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.category_outlined, size: 14, color: AppTheme.textHint),
                  const SizedBox(width: 4),
                  Text(
                    '${donation.category} • ${donation.quantity} units • ${donation.weightKg} kg',
                    style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.timer_outlined, size: 14, color: AppTheme.textHint),
                  const SizedBox(width: 4),
                  Text(
                    donation.isExpired
                        ? 'Window expired'
                        : '${donation.remainingWindowMinutes ~/ 60}h ${donation.remainingWindowMinutes % 60}m remaining',
                    style: TextStyle(
                      fontSize: 13,
                      color: donation.isExpired
                          ? AppTheme.statusBlocked
                          : donation.remainingWindowMinutes < 60
                              ? AppTheme.amber
                              : AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
              if (donation.suitabilityScore > 0) ...[
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: donation.suitabilityScore / 100,
                  backgroundColor: AppTheme.divider,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    donation.suitabilityScore >= 70
                        ? AppTheme.statusEligible
                        : donation.suitabilityScore >= 40
                            ? AppTheme.amber
                            : AppTheme.statusBlocked,
                  ),
                  borderRadius: BorderRadius.circular(4),
                  minHeight: 6,
                ),
                const SizedBox(height: 4),
                Text(
                  'Suitability: ${donation.suitabilityScore.toStringAsFixed(0)}%',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textHint),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.food_bank_outlined, size: 64, color: AppTheme.textHint.withAlpha(100)),
        const SizedBox(height: 16),
        const Text('No donations yet', style: TextStyle(fontSize: 16, color: AppTheme.textHint)),
        const SizedBox(height: 8),
        const Text('Tap the button below to post your first donation',
            style: TextStyle(color: AppTheme.textHint, fontSize: 13),
            textAlign: TextAlign.center),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.cloud_off, size: 48, color: AppTheme.textHint),
        const SizedBox(height: 12),
        Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textSecondary)),
        const SizedBox(height: 16),
        ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
      ],
    );
  }
}
