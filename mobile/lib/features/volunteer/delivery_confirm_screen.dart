// FoodRescue AI — Delivery Confirmation Screen

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/deliveries_provider.dart';

class DeliveryConfirmScreen extends ConsumerStatefulWidget {
  final String deliveryId;
  const DeliveryConfirmScreen({super.key, required this.deliveryId});

  @override
  ConsumerState<DeliveryConfirmScreen> createState() => _DeliveryConfirmScreenState();
}

class _DeliveryConfirmScreenState extends ConsumerState<DeliveryConfirmScreen> {
  final _formKey = GlobalKey<FormState>();
  final _recipientCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _tempCtrl = TextEditingController();
  bool _confirming = false;

  Future<void> _confirm() async {
    if (!_formKey.currentState!.validate()) return;
    final user = ref.read(authProvider).user;
    if (user == null) return;
    setState(() => _confirming = true);

    final ok = await ref.read(deliveriesProvider.notifier).confirmDelivery(
      widget.deliveryId,
      user.id,
      temperature: double.tryParse(_tempCtrl.text),
      recipientName: _recipientCtrl.text.trim(),
      notes: _notesCtrl.text.trim(),
    );
    setState(() => _confirming = false);

    if (!mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Delivery confirmed! Impact recorded.')),
      );
      context.go('/volunteer');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ref.read(deliveriesProvider).error ?? 'Confirmation failed'),
          backgroundColor: AppTheme.statusBlocked,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Confirm Delivery')),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withAlpha(15),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.primary.withAlpha(50)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.done_all, color: AppTheme.primary, size: 28),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Record delivery arrival at receiver',
                        style: TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),
              const Text('Recipient Information',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),

              TextFormField(
                controller: _recipientCtrl,
                decoration: const InputDecoration(
                  labelText: 'Recipient Name *',
                  hintText: 'Name of person who accepted the delivery',
                ),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),

              const SizedBox(height: 20),
              const Text('Condition at Delivery',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),

              TextFormField(
                controller: _tempCtrl,
                decoration: const InputDecoration(
                  labelText: 'Food Temperature at Delivery (°C)',
                  hintText: 'Optional but recommended',
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _notesCtrl,
                decoration: const InputDecoration(
                  labelText: 'Delivery Notes',
                  hintText: 'Any observations about the delivery',
                ),
                maxLines: 3,
              ),

              const SizedBox(height: 20),

              // Safety notice
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF8E1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.amber.withAlpha(80)),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: AppTheme.amber, size: 16),
                        SizedBox(width: 8),
                        Text('Before confirming:',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF6D4C00))),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      '• Verify the receiver accepts the food\n'
                      '• Check that packaging is intact\n'
                      '• Report any concerns immediately\n'
                      '• AI screening does not certify food safety',
                      style: TextStyle(fontSize: 12, color: Color(0xFF6D4C00)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              ElevatedButton.icon(
                onPressed: _confirming ? null : _confirm,
                icon: _confirming
                    ? const SizedBox(
                        width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.check_rounded),
                label: Text(_confirming ? 'Confirming...' : 'Confirm Delivery'),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
