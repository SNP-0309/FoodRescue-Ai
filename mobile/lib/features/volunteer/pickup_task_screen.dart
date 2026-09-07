// FoodRescue AI — Pickup Task Detail Screen

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/deliveries_provider.dart';
import '../../models/app_models.dart';
import 'package:intl/intl.dart';

class PickupTaskScreen extends ConsumerStatefulWidget {
  final String deliveryId;
  const PickupTaskScreen({super.key, required this.deliveryId});

  @override
  ConsumerState<PickupTaskScreen> createState() => _PickupTaskScreenState();
}

class _PickupTaskScreenState extends ConsumerState<PickupTaskScreen> {
  Delivery? _delivery;
  bool _loading = true;
  bool _acting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final state = ref.read(deliveriesProvider);
    final found = state.deliveries.where((d) => d.id == widget.deliveryId).firstOrNull;
    setState(() { _delivery = found; _loading = false; });
  }

  Future<void> _acceptTask() async {
    final user = ref.read(authProvider).user;
    if (user == null || _delivery == null) return;
    setState(() => _acting = true);
    final ok = await ref.read(deliveriesProvider.notifier).acceptDelivery(
      widget.deliveryId, user.id, 12.9716, 77.5946,
    );
    setState(() => _acting = false);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Task accepted!')),
      );
      _load();
    }
  }

  Future<void> _confirmPickup() async {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    bool packagingOk = true;
    String? notes;
    double? temp;

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Pickup'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Please verify the food before pickup:'),
            const SizedBox(height: 12),
            SwitchListTile(
              title: const Text('Packaging is OK'),
              value: packagingOk,
              onChanged: (v) { packagingOk = v; },
              activeColor: AppTheme.primary,
            ),
            const Text(
              'AI does not certify food as safe. Use your own judgment.',
              style: TextStyle(fontSize: 11, color: AppTheme.textHint),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Confirm')),
        ],
      ),
    );

    if (confirmed != true) return;
    setState(() => _acting = true);

    final ok = await ref.read(deliveriesProvider.notifier).confirmPickup(
      widget.deliveryId, user.id,
      packagingOk: packagingOk,
    );
    setState(() => _acting = false);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pickup confirmed!')),
      );
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_delivery == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Task Detail')),
        body: const Center(child: Text('Task not found')),
      );
    }

    final delivery = _delivery!;
    final donation = delivery.donation;
    final user = ref.watch(authProvider).user;
    final isMyTask = delivery.volunteerId == user?.id;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Pickup Task'),
        actions: [
          if (donation != null)
            IconButton(
              icon: const Icon(Icons.map_outlined),
              onPressed: () => context.push('/volunteer/task/${widget.deliveryId}/route'),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.statusColor(delivery.status).withAlpha(20),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.statusColor(delivery.status).withAlpha(60)),
              ),
              child: Row(
                children: [
                  Icon(AppTheme.statusIcon(delivery.status),
                      color: AppTheme.statusColor(delivery.status), size: 28),
                  const SizedBox(width: 12),
                  Text(AppTheme.statusLabel(delivery.status),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.statusColor(delivery.status),
                      )),
                ],
              ),
            ),

            const SizedBox(height: 16),

            if (donation != null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(donation.foodName,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      _Row('Category', donation.category),
                      _Row('Quantity', '${donation.quantity} servings · ${donation.weightKg} kg'),
                      _Row('Storage', donation.storageCondition),
                      _Row('Packaging', donation.packagingCondition),
                      if (donation.temperature != null)
                        _Row('Temperature', '${donation.temperature}°C'),
                      _Row('Pickup Address', donation.pickupAddress),
                      if (donation.allergens.isNotEmpty)
                        _Row('Allergens', donation.allergens.join(', ')),
                      if (donation.handlingNotes?.isNotEmpty == true)
                        _Row('Handling Notes', donation.handlingNotes!),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Time window
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Time Window', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(
                            Icons.timer_outlined,
                            color: donation.isExpired ? AppTheme.statusBlocked
                                : donation.remainingWindowMinutes < 60 ? AppTheme.amber
                                : AppTheme.primary,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            donation.isExpired
                                ? 'Window expired!'
                                : '${donation.remainingWindowMinutes ~/ 60}h ${donation.remainingWindowMinutes % 60}m remaining',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: donation.isExpired ? AppTheme.statusBlocked
                                  : donation.remainingWindowMinutes < 60 ? AppTheme.amber
                                  : AppTheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Safety notice
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8E1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.amber.withAlpha(80)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: AppTheme.amber, size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'AI does not certify food as safe to eat. Inspect the food before pickup.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF6D4C00)),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Actions
            if (!isMyTask && delivery.status == 'pending')
              ElevatedButton.icon(
                onPressed: _acting ? null : _acceptTask,
                icon: const Icon(Icons.check_circle_outline),
                label: const Text('Accept Task'),
              ),

            if (isMyTask && delivery.status == 'accepted')
              ElevatedButton.icon(
                onPressed: _acting ? null : _confirmPickup,
                icon: const Icon(Icons.shopping_bag_outlined),
                label: const Text('Confirm Pickup'),
              ),

            if (isMyTask && delivery.status == 'picked_up') ...[
              ElevatedButton.icon(
                onPressed: _acting
                    ? null
                    : () async {
                        setState(() => _acting = true);
                        final user = ref.read(authProvider).user;
                        if (user != null) {
                          await ref.read(deliveriesProvider.notifier)
                              .startTransit(widget.deliveryId, user.id);
                          _load();
                        }
                        setState(() => _acting = false);
                      },
                icon: const Icon(Icons.local_shipping_outlined),
                label: const Text('Start Transit'),
              ),
            ],

            if (isMyTask && delivery.status == 'in_transit') ...[
              ElevatedButton.icon(
                onPressed: () => context.push('/volunteer/task/${widget.deliveryId}/confirm'),
                icon: const Icon(Icons.done_all),
                label: const Text('Confirm Delivery'),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => context.push('/volunteer/task/${widget.deliveryId}/route'),
                icon: const Icon(Icons.map_outlined),
                label: const Text('View Route'),
                style: OutlinedButton.styleFrom(foregroundColor: AppTheme.statusInTransit),
              ),
            ],

            if (isMyTask && !['delivered', 'cancelled', 'on_hold'].contains(delivery.status)) ...[
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: () => _showIncidentDialog(context),
                icon: const Icon(Icons.report_outlined, color: AppTheme.statusBlocked),
                label: const Text('Report Incident', style: TextStyle(color: AppTheme.statusBlocked)),
              ),
            ],

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Future<void> _showIncidentDialog(BuildContext context) async {
    String type = 'other';
    final notesCtrl = TextEditingController();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          left: 16, right: 16, top: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Report Incident', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: type,
              decoration: const InputDecoration(labelText: 'Incident Type'),
              items: const [
                DropdownMenuItem(value: 'spoilage', child: Text('Spoilage')),
                DropdownMenuItem(value: 'accident', child: Text('Accident')),
                DropdownMenuItem(value: 'temperature_breach', child: Text('Temperature Breach')),
                DropdownMenuItem(value: 'packaging_damage', child: Text('Packaging Damage')),
                DropdownMenuItem(value: 'other', child: Text('Other')),
              ],
              onChanged: (v) => type = v!,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesCtrl,
              decoration: const InputDecoration(labelText: 'Description'),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                final user = ref.read(authProvider).user;
                if (user != null) {
                  await ref.read(deliveriesProvider.notifier).reportIncident(
                    widget.deliveryId, user.id,
                    incidentType: type,
                    notes: notesCtrl.text,
                  );
                }
                if (ctx.mounted) Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.statusBlocked),
              child: const Text('Submit & Hold'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
    _load();
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  const _Row(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textHint)),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary))),
        ],
      ),
    );
  }
}
