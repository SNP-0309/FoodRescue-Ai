// FoodRescue AI — Analytics Screen

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/deliveries_provider.dart';
import '../../models/app_models.dart';
import 'package:intl/intl.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(analyticsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Impact Analytics')),
      body: analyticsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (data) {
          if (data == null) {
            return const Center(child: Text('Analytics unavailable'));
          }
          return _AnalyticsBody(data: data);
        },
      ),
    );
  }
}

class _AnalyticsBody extends StatelessWidget {
  final AnalyticsSummary data;
  const _AnalyticsBody({required this.data});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Notice
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.sageLight.withAlpha(30),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.sageLight),
            ),
            child: const Row(
              children: [
                Icon(Icons.verified_outlined, size: 14, color: AppTheme.textHint),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Only confirmed deliveries are counted in impact metrics.',
                    style: TextStyle(fontSize: 11, color: AppTheme.textHint),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),
          const Text('Impact Summary', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),

          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.4,
            children: [
              _StatTile(
                '${data.totalWeightRescuedKg.toStringAsFixed(1)} kg',
                'Food Rescued',
                Icons.scale,
                AppTheme.primary,
              ),
              _StatTile(
                '${data.totalMealsRedistributed}',
                'Meals Delivered',
                Icons.restaurant,
                AppTheme.amber,
              ),
              _StatTile(
                '${data.successfulDeliveries}',
                'Deliveries',
                Icons.done_all,
                AppTheme.statusEligible,
              ),
              _StatTile(
                '${data.estimatedWastePreventedKg.toStringAsFixed(1)} kg',
                'Waste Prevented',
                Icons.eco,
                AppTheme.sage,
              ),
              _StatTile(
                '${data.activeDonors}',
                'Active Donors',
                Icons.people_alt,
                AppTheme.primaryLight,
              ),
              _StatTile(
                '${data.activeReceivers}',
                'Active Receivers',
                Icons.groups,
                AppTheme.sageLight,
              ),
              _StatTile(
                '${data.averageDeliveryMinutes} min',
                'Avg Delivery Time',
                Icons.timer,
                AppTheme.statusInTransit,
              ),
              _StatTile(
                '${data.highRiskFoodRejected}',
                'High-Risk Blocked',
                Icons.block,
                AppTheme.statusBlocked,
              ),
            ],
          ),

          const SizedBox(height: 24),

          // 7-day chart
          const Text('7-Day Delivery Chart', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                height: 200,
                child: _SevenDayChart(entries: data.sevenDayChart),
              ),
            ),
          ),

          // Category breakdown
          if (data.mealsByCategory.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Text('Meals by Category', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: data.mealsByCategory.entries
                      .where((e) => e.value > 0)
                      .map((e) => _CategoryBar(label: e.key, value: e.value,
                          total: data.totalMealsRedistributed))
                      .toList(),
                ),
              ),
            ),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;

  const _StatTile(this.value, this.label, this.icon, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withAlpha(15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withAlpha(40)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 24),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: color)),
              Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textHint)),
            ],
          ),
        ],
      ),
    );
  }
}

class _SevenDayChart extends StatelessWidget {
  final List<DayChartEntry> entries;
  const _SevenDayChart({required this.entries});

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return const Center(child: Text('No data', style: TextStyle(color: AppTheme.textHint)));
    }

    final max = entries.fold<int>(0, (m, e) => e.mealsDelivered > m ? e.mealsDelivered : m);

    return BarChart(
      BarChartData(
        maxY: (max + 5).toDouble(),
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (val, _) {
                final idx = val.toInt();
                if (idx < 0 || idx >= entries.length) return const SizedBox();
                final date = entries[idx].date;
                final parts = date.split('-');
                return Text('${parts[2]}/${parts[1]}',
                    style: const TextStyle(fontSize: 10, color: AppTheme.textHint));
              },
            ),
          ),
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        barGroups: entries.asMap().entries.map((e) {
          return BarChartGroupData(
            x: e.key,
            barRods: [
              BarChartRodData(
                toY: e.value.mealsDelivered.toDouble(),
                color: AppTheme.primary,
                width: 20,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _CategoryBar extends StatelessWidget {
  final String label;
  final int value;
  final int total;
  const _CategoryBar({required this.label, required this.value, required this.total});

  @override
  Widget build(BuildContext context) {
    final ratio = total > 0 ? value / total : 0.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
          ),
          Expanded(
            child: LinearProgressIndicator(
              value: ratio,
              backgroundColor: AppTheme.divider,
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
              borderRadius: BorderRadius.circular(4),
              minHeight: 8,
            ),
          ),
          const SizedBox(width: 8),
          Text('$value', style: const TextStyle(fontSize: 12, color: AppTheme.textHint)),
        ],
      ),
    );
  }
}
