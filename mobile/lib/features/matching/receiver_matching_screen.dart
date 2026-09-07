// FoodRescue AI — Receiver Matching Screen

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/donations_provider.dart';
import '../../models/app_models.dart';
import '../../core/constants/app_constants.dart';

class ReceiverMatchingScreen extends ConsumerStatefulWidget {
  final String id;
  const ReceiverMatchingScreen({super.key, required this.id});

  @override
  ConsumerState<ReceiverMatchingScreen> createState() => _ReceiverMatchingScreenState();
}

class _ReceiverMatchingScreenState extends ConsumerState<ReceiverMatchingScreen> {
  bool _loading = false;
  Map<String, dynamic>? _matchData;
  String? _error;

  @override
  void initState() {
    super.initState();
    _runMatch();
  }

  Future<void> _runMatch() async {
    setState(() { _loading = true; _error = null; });
    final result = await ref.read(donationsProvider.notifier).matchDonation(widget.id);
    setState(() {
      _loading = false;
      if (result != null) _matchData = result;
      else _error = ref.read(donationsProvider).error;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Receiver Matching'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _runMatch),
        ],
      ),
      body: _loading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Running matching engine...', style: TextStyle(color: AppTheme.textSecondary)),
                ],
              ),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: AppTheme.statusBlocked),
                      const SizedBox(height: 12),
                      Text(_error!, textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _runMatch, child: const Text('Retry')),
                    ],
                  ),
                )
              : _matchData != null
                  ? _MatchResults(data: _matchData!)
                  : const SizedBox(),
    );
  }
}

class _MatchResults extends StatelessWidget {
  final Map<String, dynamic> data;
  const _MatchResults({required this.data});

  @override
  Widget build(BuildContext context) {
    final match = data['match'] as Map<String, dynamic>;
    final allocation = data['allocation'] as Map<String, dynamic>;
    final disclaimer = data['travelTimeDisclaimer'] as String? ?? '';
    final remainingMins = data['remainingWindowMinutes'] as int? ?? 0;

    final eligible = (match['eligible'] as List? ?? [])
        .map((e) => MatchCandidate.fromJson(e as Map<String, dynamic>))
        .toList();
    final ineligible = (match['ineligible'] as List? ?? [])
        .map((e) => MatchCandidate.fromJson(e as Map<String, dynamic>))
        .toList();
    final allocationItems = (allocation['items'] as List? ?? []) as List;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Window remaining
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: remainingMins < 60
                  ? AppTheme.statusBlocked.withAlpha(15)
                  : AppTheme.primary.withAlpha(15),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: remainingMins < 60 ? AppTheme.statusBlocked.withAlpha(50) : AppTheme.primary.withAlpha(50),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.timer,
                  color: remainingMins < 60 ? AppTheme.statusBlocked : AppTheme.primary,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Redistribution window: ${remainingMins ~/ 60}h ${remainingMins % 60}m remaining',
                    style: TextStyle(
                      color: remainingMins < 60 ? AppTheme.statusBlocked : AppTheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Disclaimer
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.sageLight.withAlpha(30),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.sageLight),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, size: 14, color: AppTheme.textHint),
                const SizedBox(width: 8),
                Expanded(child: Text(disclaimer, style: const TextStyle(fontSize: 11, color: AppTheme.textHint))),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Allocation summary
          if (allocationItems.isNotEmpty) ...[
            const Text('Allocation Plan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text('Total:', style: TextStyle(fontWeight: FontWeight.w500)),
                        const Spacer(),
                        Text(
                          '${allocation['totalAllocated']} / ${allocation['totalQuantity']} allocated',
                          style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.primary),
                        ),
                      ],
                    ),
                    const Divider(height: 16),
                    ...allocationItems.map<Widget>((item) {
                      final itm = item as Map<String, dynamic>;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            const Icon(Icons.arrow_forward, size: 14, color: AppTheme.primary),
                            const SizedBox(width: 8),
                            Expanded(child: Text(itm['receiverName'] as String,
                                style: const TextStyle(fontSize: 13))),
                            Text('${itm['quantityAllocated']} meals (${itm['weightAllocated']} kg)',
                                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],

          // Eligible receivers
          Text('Eligible Receivers (${eligible.length})',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          if (eligible.isEmpty)
            const Text('No eligible receivers found', style: TextStyle(color: AppTheme.textHint))
          else
            ...eligible.map((r) => _ReceiverCard(candidate: r, eligible: true)),

          const SizedBox(height: 20),

          // Ineligible
          Text('Ineligible Receivers (${ineligible.length})',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textHint)),
          const SizedBox(height: 8),
          ...ineligible.map((r) => _ReceiverCard(candidate: r, eligible: false)),

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _ReceiverCard extends StatelessWidget {
  final MatchCandidate candidate;
  final bool eligible;
  const _ReceiverCard({required this.candidate, required this.eligible});

  @override
  Widget build(BuildContext context) {
    final urgencyColor = {
      'critical': AppTheme.statusBlocked,
      'high': AppTheme.amber,
      'medium': AppTheme.primary,
      'low': AppTheme.textHint,
    }[candidate.urgency] ?? AppTheme.textHint;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(candidate.receiverName,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                ),
                if (eligible)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withAlpha(20),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text('Score: ${candidate.matchScore}',
                        style: const TextStyle(color: AppTheme.primary, fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 13, color: AppTheme.textHint),
                const SizedBox(width: 4),
                Text('${candidate.distanceKm} km away',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                const SizedBox(width: 12),
                const Icon(Icons.timer_outlined, size: 13, color: AppTheme.textHint),
                const SizedBox(width: 4),
                Text('~${candidate.estimatedTravelMinutes} min (estimate)',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: urgencyColor.withAlpha(20),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${candidate.urgency.toUpperCase()} urgency',
                    style: TextStyle(color: urgencyColor, fontSize: 10, fontWeight: FontWeight.w600),
                  ),
                ),
                const SizedBox(width: 8),
                Text('Needs ${candidate.quantityNeeded} meals',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              ],
            ),
            if (!eligible && candidate.reasons.isNotEmpty) ...[
              const SizedBox(height: 8),
              ...candidate.reasons.map((r) => Row(
                    children: [
                      const Icon(Icons.cancel_outlined, size: 12, color: AppTheme.statusBlocked),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(r, style: const TextStyle(fontSize: 11, color: AppTheme.statusBlocked)),
                      ),
                    ],
                  )),
            ],
            if (eligible && candidate.quantityToAllocate > 0) ...[
              const SizedBox(height: 8),
              Text(
                'Allocating ${candidate.quantityToAllocate} meals to this receiver',
                style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w500),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
