// FoodRescue AI — Receiver Dashboard

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../core/networking/api_client.dart';
import '../../models/app_models.dart';

class ReceiverDashboard extends ConsumerStatefulWidget {
  const ReceiverDashboard({super.key});

  @override
  ConsumerState<ReceiverDashboard> createState() => _ReceiverDashboardState();
}

class _ReceiverDashboardState extends ConsumerState<ReceiverDashboard> {
  List<Donation> _nearbyDonations = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadDonations();
  }

  Future<void> _loadDonations() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.instance.dio.get('/donations',
          queryParameters: {'status': 'eligible'});
      final data = res.data['data'] as List;
      setState(() {
        _nearbyDonations = data
            .map((e) => Donation.fromJson(e as Map<String, dynamic>))
            .toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Receiver Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => context.push('/receiver/profile'),
          ),
          IconButton(
            icon: const Icon(Icons.analytics_outlined),
            onPressed: () => context.push('/analytics'),
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
      body: RefreshIndicator(
        onRefresh: _loadDonations,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Hello, ${user?.name ?? 'Receiver'}! 👋',
                        style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w700, color: AppTheme.textPrimary,
                        )),
                    const SizedBox(height: 4),
                    const Text('Eligible food donations near you',
                        style: TextStyle(color: AppTheme.textSecondary)),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
            if (_loading)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
            else if (_nearbyDonations.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.search_off, size: 64, color: AppTheme.textHint),
                      SizedBox(height: 16),
                      Text('No eligible donations at the moment',
                          style: TextStyle(color: AppTheme.textHint, fontSize: 15)),
                    ],
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => _DonationListItem(donation: _nearbyDonations[i]),
                  childCount: _nearbyDonations.length,
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
    );
  }
}

class _DonationListItem extends StatelessWidget {
  final Donation donation;
  const _DonationListItem({required this.donation});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(donation.foodName,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text('${donation.quantity} units • ${donation.weightKg} kg • ${donation.category}',
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 13, color: AppTheme.textHint),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(donation.pickupAddress,
                      style: const TextStyle(fontSize: 12, color: AppTheme.textHint)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.timer_outlined, size: 13, color: AppTheme.textHint),
                const SizedBox(width: 4),
                Text(
                  '${donation.remainingWindowMinutes ~/ 60}h ${donation.remainingWindowMinutes % 60}m remaining',
                  style: TextStyle(
                    fontSize: 12,
                    color: donation.remainingWindowMinutes < 60 ? AppTheme.amber : AppTheme.textSecondary,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withAlpha(20),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Score: ${donation.suitabilityScore.toStringAsFixed(0)}',
                    style: const TextStyle(color: AppTheme.primary, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
