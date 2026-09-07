// FoodRescue AI — Suitability Score Screen

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/donations_provider.dart';
import '../../models/app_models.dart';
import '../../core/constants/app_constants.dart';

class SuitabilityScoreScreen extends ConsumerWidget {
  final String id;
  const SuitabilityScoreScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final donAsync = ref.watch(singleDonationProvider(id));
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Suitability Score')),
      body: donAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (donation) {
          if (donation == null || donation.scoreBreakdown == null) {
            return const Center(child: Text('Score not available yet'));
          }
          return _ScoreBody(donation: donation);
        },
      ),
    );
  }
}

class _ScoreBody extends StatelessWidget {
  final Donation donation;
  const _ScoreBody({required this.donation});

  @override
  Widget build(BuildContext context) {
    final score = donation.suitabilityScore;
    final breakdown = donation.scoreBreakdown!;
    final scoreColor = score >= AppConstants.goodSuitabilityScore
        ? AppTheme.statusEligible
        : score >= AppConstants.minimumSuitabilityScore
            ? AppTheme.amber
            : AppTheme.statusBlocked;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Big score circle
          Center(
            child: SizedBox(
              width: 160,
              height: 160,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircularProgressIndicator(
                    value: score / 100,
                    strokeWidth: 12,
                    backgroundColor: AppTheme.divider,
                    valueColor: AlwaysStoppedAnimation<Color>(scoreColor),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        score.toStringAsFixed(0),
                        style: TextStyle(
                          fontSize: 40, fontWeight: FontWeight.w700, color: scoreColor,
                        ),
                      ),
                      const Text('/100', style: TextStyle(color: AppTheme.textHint, fontSize: 13)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(
              score >= AppConstants.goodSuitabilityScore
                  ? 'Highly Suitable'
                  : score >= AppConstants.minimumSuitabilityScore
                      ? 'Needs Attention'
                      : 'Not Suitable',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: scoreColor),
            ),
          ),

          const SizedBox(height: 24),

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
                Icon(Icons.info_outline, color: AppTheme.amber, size: 16),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    AppConstants.aiSafetyNotice,
                    style: TextStyle(fontSize: 11, color: Color(0xFF6D4C00)),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Blockers
          if (breakdown.blockers.isNotEmpty) ...[
            const Text('Blockers', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.statusBlocked)),
            const SizedBox(height: 8),
            ...breakdown.blockers.map((b) => _IssueRow(b, Icons.block, AppTheme.statusBlocked)),
            const SizedBox(height: 16),
          ],

          // Warnings
          if (breakdown.warnings.isNotEmpty) ...[
            const Text('Warnings', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.amber)),
            const SizedBox(height: 8),
            ...breakdown.warnings.map((w) => _IssueRow(w, Icons.warning_amber, AppTheme.amber)),
            const SizedBox(height: 16),
          ],

          // Score breakdown
          const Text('Score Breakdown', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _ScoreBar('Visual Condition', breakdown.visualCondition, 20),
                  _ScoreBar('Time Remaining', breakdown.timeScore, 20),
                  _ScoreBar('Food Type', breakdown.foodTypeScore, 10),
                  _ScoreBar('Storage', breakdown.storageScore, 15),
                  _ScoreBar('Temperature', breakdown.temperatureScore, 10),
                  _ScoreBar('Packaging', breakdown.packagingScore, 10),
                  _ScoreBar('Delivery Time Fit', breakdown.deliveryTimeScore, 10),
                  _ScoreBar('Window Fit', breakdown.windowScore, 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _IssueRow extends StatelessWidget {
  final String message;
  final IconData icon;
  final Color color;
  const _IssueRow(this.message, this.icon, this.color);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(child: Text(message, style: TextStyle(fontSize: 13, color: color))),
        ],
      ),
    );
  }
}

class _ScoreBar extends StatelessWidget {
  final String label;
  final double value;
  final int maxValue;
  const _ScoreBar(this.label, this.value, this.maxValue);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          SizedBox(
            width: 130,
            child: Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
          ),
          Expanded(
            child: LinearProgressIndicator(
              value: maxValue > 0 ? value / maxValue : 0,
              backgroundColor: AppTheme.divider,
              valueColor: AlwaysStoppedAnimation<Color>(
                value / maxValue >= 0.7 ? AppTheme.statusEligible
                : value / maxValue >= 0.4 ? AppTheme.amber
                : AppTheme.statusBlocked,
              ),
              minHeight: 8,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 40,
            child: Text('${value.toStringAsFixed(0)}/$maxValue',
                style: const TextStyle(fontSize: 11, color: AppTheme.textHint)),
          ),
        ],
      ),
    );
  }
}
