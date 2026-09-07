// FoodRescue AI — Donation Detail Screen

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/donations_provider.dart';
import '../../models/app_models.dart';

class DonationDetailScreen extends ConsumerStatefulWidget {
  final String id;
  const DonationDetailScreen({super.key, required this.id});

  @override
  ConsumerState<DonationDetailScreen> createState() => _DonationDetailScreenState();
}

class _DonationDetailScreenState extends ConsumerState<DonationDetailScreen> {
  bool _screening = false;

  Future<void> _runScreening() async {
    setState(() => _screening = true);
    await ref.read(donationsProvider.notifier).screenDonation(widget.id);
    setState(() => _screening = false);
    // Refresh donation
    ref.invalidate(singleDonationProvider(widget.id));
  }

  @override
  Widget build(BuildContext context) {
    final donAsync = ref.watch(singleDonationProvider(widget.id));

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Donation Details'),
        actions: [
          if (donAsync.value != null)
            IconButton(
              icon: const Icon(Icons.people_alt_outlined),
              tooltip: 'Find Receivers',
              onPressed: () => context.push('/donor/donation/${widget.id}/match'),
            ),
        ],
      ),
      body: donAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (donation) {
          if (donation == null) {
            return const Center(child: Text('Donation not found'));
          }
          return _DonationBody(
            donation: donation,
            onScreening: _runScreening,
            screening: _screening,
          );
        },
      ),
    );
  }
}

class _DonationBody extends StatelessWidget {
  final Donation donation;
  final VoidCallback onScreening;
  final bool screening;

  const _DonationBody({
    required this.donation,
    required this.onScreening,
    required this.screening,
  });

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('MMM d, yyyy h:mm a');
    final statusColor = AppTheme.statusColor(donation.status);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusColor.withAlpha(20),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: statusColor.withAlpha(60)),
            ),
            child: Row(
              children: [
                Icon(AppTheme.statusIcon(donation.status), color: statusColor, size: 28),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppTheme.statusLabel(donation.status),
                      style: TextStyle(
                        color: statusColor, fontSize: 16, fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (!donation.isExpired)
                      Text(
                        '${donation.remainingWindowMinutes ~/ 60}h ${donation.remainingWindowMinutes % 60}m remaining',
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                      )
                    else
                      const Text(
                        'Redistribution window expired',
                        style: TextStyle(color: AppTheme.statusBlocked, fontSize: 13),
                      ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Food info card
          _InfoCard(
            title: donation.foodName,
            children: [
              _InfoRow('Category', donation.category),
              _InfoRow('Quantity', '${donation.quantity} servings'),
              _InfoRow('Weight', '${donation.weightKg} kg'),
              if (donation.description?.isNotEmpty == true)
                _InfoRow('Description', donation.description!),
              if (donation.allergens.isNotEmpty)
                _InfoRow('Allergens', donation.allergens.join(', ')),
              if (donation.handlingNotes?.isNotEmpty == true)
                _InfoRow('Handling Notes', donation.handlingNotes!),
            ],
          ),

          const SizedBox(height: 12),

          // Time card
          _InfoCard(
            title: 'Time',
            children: [
              _InfoRow('Prepared At', fmt.format(donation.preparedAt)),
              _InfoRow('Expiry', fmt.format(donation.expiryTime)),
              _InfoRow('Usable Duration', '${donation.usableDuration ~/ 60}h ${donation.usableDuration % 60}m'),
            ],
          ),

          const SizedBox(height: 12),

          // Condition card
          _InfoCard(
            title: 'Condition',
            children: [
              _InfoRow('Storage', donation.storageCondition),
              _InfoRow('Packaging', donation.packagingCondition),
              if (donation.temperature != null)
                _InfoRow('Temperature', '${donation.temperature}°C'),
            ],
          ),

          const SizedBox(height: 12),

          // Location card
          _InfoCard(
            title: 'Pickup Location',
            children: [
              _InfoRow('Address', donation.pickupAddress),
              _InfoRow('Coordinates', '${donation.pickupLat}, ${donation.pickupLng}'),
            ],
          ),

          const SizedBox(height: 12),

          // AI Screening card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text('AI Visual Screening',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      const Spacer(),
                      _ScreeningBadge(result: donation.screeningResult),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // IMPORTANT: Safety notice must always be displayed
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF8E1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.warning_amber, color: AppTheme.amber, size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'AI does not certify food as safe to eat.',
                            style: TextStyle(fontSize: 11, color: Color(0xFF6D4C00)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (donation.screeningNotes != null) ...[
                    const SizedBox(height: 8),
                    Text(donation.screeningNotes!,
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                  ],
                  const SizedBox(height: 12),
                  if (donation.status == 'posted' || donation.status == 'screening')
                    ElevatedButton.icon(
                      onPressed: screening ? null : onScreening,
                      icon: screening
                          ? const SizedBox(
                              width: 18, height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.science_outlined),
                      label: Text(screening ? 'Screening...' : 'Run AI Screening'),
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Score + actions
          if (donation.suitabilityScore > 0)
            InkWell(
              onTap: () => context.push('/donor/donation/${donation.id}/score'),
              borderRadius: BorderRadius.circular(16),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Suitability Score',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
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
                              minHeight: 8,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${donation.suitabilityScore.toStringAsFixed(0)} / 100',
                              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: AppTheme.textHint),
                    ],
                  ),
                ),
              ),
            ),

          const SizedBox(height: 12),

          if (donation.status == 'eligible')
            ElevatedButton.icon(
              onPressed: () => context.push('/donor/donation/${donation.id}/match'),
              icon: const Icon(Icons.people_search),
              label: const Text('Find Receivers & Match'),
            ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _InfoCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            const Divider(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label,
                style: const TextStyle(color: AppTheme.textHint, fontSize: 13)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}

class _ScreeningBadge extends StatelessWidget {
  final String result;
  const _ScreeningBadge({required this.result});

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData icon;
    switch (result) {
      case 'CLEAR':
        color = AppTheme.statusEligible;
        icon = Icons.check_circle;
        break;
      case 'CONCERN':
        color = AppTheme.statusBlocked;
        icon = Icons.cancel;
        break;
      case 'UNCERTAIN':
        color = AppTheme.amber;
        icon = Icons.help_outline;
        break;
      default:
        color = AppTheme.textHint;
        icon = Icons.cloud_off;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(60)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 4),
          Text(result, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
