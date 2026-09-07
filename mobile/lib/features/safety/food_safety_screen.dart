// FoodRescue AI — Food Safety Information Screen

import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class FoodSafetyScreen extends StatelessWidget {
  const FoodSafetyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Food Safety Information')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Big disclaimer
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.amber.withAlpha(30), AppTheme.amber.withAlpha(10)],
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.amber.withAlpha(80), width: 2),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, color: AppTheme.amber, size: 28),
                      SizedBox(width: 12),
                      Text(
                        'IMPORTANT NOTICE',
                        style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w800,
                          color: AppTheme.amber, letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 12),
                  Text(
                    'AI does not certify food as safe to eat.',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF6D4C00)),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'The AI visual screening feature provides a PRELIMINARY VISUAL SCREENING '
                    'SIGNAL ONLY. It cannot detect pathogens, bacteria, allergens, or contamination. '
                    'A "CLEAR" result does NOT mean the food is safe to consume.',
                    style: TextStyle(fontSize: 13, color: Color(0xFF6D4C00)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            _Section(
              icon: Icons.science_outlined,
              title: 'What AI Screening Does',
              color: AppTheme.primary,
              content: [
                '✓ Provides preliminary visual assessment of food appearance',
                '✓ Identifies visible signs of spoilage, mould, or damage',
                '✓ Returns one of: CLEAR, CONCERN, UNCERTAIN, or UNAVAILABLE',
                '✓ Contributes to the food suitability logistics score',
              ],
            ),

            const SizedBox(height: 16),

            _Section(
              icon: Icons.block_outlined,
              title: 'What AI Screening Cannot Do',
              color: AppTheme.statusBlocked,
              content: [
                '✗ Cannot detect pathogenic bacteria (Salmonella, E. coli, etc.)',
                '✗ Cannot identify allergens or chemical contamination',
                '✗ Cannot assess internal food temperature',
                '✗ Cannot replace trained food safety professionals',
                '✗ Cannot guarantee food is safe for consumption',
              ],
            ),

            const SizedBox(height: 16),

            _Section(
              icon: Icons.how_to_reg_outlined,
              title: 'Screening Result Meanings',
              color: AppTheme.statusInTransit,
              content: [
                'CLEAR — No visible concerns detected (not a safety pass)',
                'CONCERN — Visible spoilage, mould, or damage detected',
                'UNCERTAIN — AI cannot make a confident assessment',
                'UNAVAILABLE — AI screening failed or key not configured',
              ],
            ),

            const SizedBox(height: 16),

            _Section(
              icon: Icons.people_alt_outlined,
              title: 'Responsibility of Receiving Organisations',
              color: AppTheme.sage,
              content: [
                '• Inspect all received food using trained food safety protocols',
                '• Follow local food handling regulations',
                '• Do not distribute food that appears unsafe',
                '• Maintain proper cold chain during storage and serving',
                '• Report any concerns through the incident reporting feature',
              ],
            ),

            const SizedBox(height: 16),

            _Section(
              icon: Icons.local_shipping_outlined,
              title: 'Volunteer Responsibilities',
              color: AppTheme.amber,
              content: [
                '• Inspect food at pickup — do not accept visually unsafe food',
                '• Maintain appropriate storage during transport',
                '• Report incidents immediately using the incident feature',
                '• Follow the redistribution window — do not deliver expired food',
                '• Use your own judgment alongside AI screening',
              ],
            ),

            const SizedBox(height: 24),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surfaceVariant,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'For Emergencies',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'If you suspect food contamination or illness, contact local health authorities immediately. '
                    'Do not redistribute potentially harmful food.',
                    style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final List<String> content;

  const _Section({
    required this.icon,
    required this.title,
    required this.color,
    required this.content,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withAlpha(20),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Text(title,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              ],
            ),
            const Divider(height: 16),
            ...content.map((line) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(line,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                )),
          ],
        ),
      ),
    );
  }
}
