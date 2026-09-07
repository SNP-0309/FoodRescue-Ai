// FoodRescue AI — Delivery History Screen

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/deliveries_provider.dart';
import '../../models/app_models.dart';

class DeliveryHistoryScreen extends ConsumerStatefulWidget {
  const DeliveryHistoryScreen({super.key});

  @override
  ConsumerState<DeliveryHistoryScreen> createState() => _DeliveryHistoryScreenState();
}

class _DeliveryHistoryScreenState extends ConsumerState<DeliveryHistoryScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final user = ref.read(authProvider).user;
      ref.read(deliveriesProvider.notifier).fetchTasks(
        volunteerId: user?.id,
        status: 'delivered',
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(deliveriesProvider);
    final delivered = state.deliveries.where((d) => d.status == 'delivered').toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Delivery History')),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : delivered.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.history, size: 64, color: AppTheme.textHint),
                      SizedBox(height: 16),
                      Text('No completed deliveries', style: TextStyle(color: AppTheme.textHint, fontSize: 15)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: delivered.length,
                  itemBuilder: (ctx, i) => _HistoryCard(delivery: delivered[i]),
                ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final Delivery delivery;
  const _HistoryCard({required this.delivery});

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('MMM d, yyyy h:mm a');
    final donation = delivery.donation;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.done_all, color: AppTheme.statusEligible, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    donation?.foodName ?? 'Completed Delivery',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                  ),
                ),
                const Text('Delivered', style: TextStyle(color: AppTheme.statusEligible, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
            if (donation != null) ...[
              const SizedBox(height: 6),
              Text(
                '${donation.quantity} meals · ${donation.weightKg} kg · ${donation.category}',
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              ),
            ],
            if (delivery.deliveredAt != null) ...[
              const SizedBox(height: 4),
              Text(
                'Delivered: ${fmt.format(delivery.deliveredAt!.toLocal())}',
                style: const TextStyle(fontSize: 12, color: AppTheme.textHint),
              ),
            ],
            if (delivery.recipientName != null) ...[
              const SizedBox(height: 4),
              Text(
                'Received by: ${delivery.recipientName}',
                style: const TextStyle(fontSize: 12, color: AppTheme.textHint),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
