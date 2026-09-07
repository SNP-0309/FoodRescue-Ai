// FoodRescue AI — Receiver Profile Edit Screen

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../core/networking/api_client.dart';

class ReceiverProfileScreen extends ConsumerStatefulWidget {
  const ReceiverProfileScreen({super.key});

  @override
  ConsumerState<ReceiverProfileScreen> createState() => _ReceiverProfileScreenState();
}

class _ReceiverProfileScreenState extends ConsumerState<ReceiverProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _saving = false;

  final _orgNameCtrl = TextEditingController();
  String _orgType = 'ngo';
  final _contactCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _demandCtrl = TextEditingController();
  final _capacityCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _latCtrl = TextEditingController();
  final _lngCtrl = TextEditingController();
  String _urgency = 'medium';
  bool _canArrangePickup = false;
  List<String> _acceptedCategories = ['cooked_meal'];
  List<String> _availableStorage = ['room_temp'];

  String? _receiverId;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final user = ref.read(authProvider).user;
    if (user == null) return;
    try {
      final res = await ApiClient.instance.dio.get('/receivers',
          queryParameters: {'userId': user.id});
      final receivers = res.data['data'] as List;
      if (receivers.isNotEmpty) {
        final r = receivers.first as Map<String, dynamic>;
        setState(() {
          _receiverId = r['id'] as String;
          _orgNameCtrl.text = r['orgName'] as String? ?? '';
          _orgType = r['orgType'] as String? ?? 'ngo';
          _contactCtrl.text = r['contactName'] as String? ?? '';
          _phoneCtrl.text = r['contactPhone'] as String? ?? '';
          _demandCtrl.text = '${r['currentDemand'] ?? 0}';
          _capacityCtrl.text = '${r['maxCapacity'] ?? 0}';
          _addressCtrl.text = r['address'] as String? ?? '';
          _latCtrl.text = '${r['lat'] ?? 12.9716}';
          _lngCtrl.text = '${r['lng'] ?? 77.5946}';
          _urgency = r['urgency'] as String? ?? 'medium';
          _canArrangePickup = r['canArrangePickup'] as bool? ?? false;
          _acceptedCategories = List<String>.from(r['acceptedCategories'] as List? ?? ['cooked_meal']);
          _availableStorage = List<String>.from(r['availableStorage'] as List? ?? ['room_temp']);
        });
      }
    } catch (_) {}
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate() || _receiverId == null) return;
    setState(() => _saving = true);
    try {
      await ApiClient.instance.dio.patch('/receivers/$_receiverId', data: {
        'orgName': _orgNameCtrl.text.trim(),
        'orgType': _orgType,
        'contactName': _contactCtrl.text.trim(),
        'contactPhone': _phoneCtrl.text.trim(),
        'currentDemand': int.tryParse(_demandCtrl.text) ?? 0,
        'maxCapacity': int.tryParse(_capacityCtrl.text) ?? 0,
        'acceptedCategories': _acceptedCategories,
        'availableStorage': _availableStorage,
        'lat': double.tryParse(_latCtrl.text) ?? 12.9716,
        'lng': double.tryParse(_lngCtrl.text) ?? 77.5946,
        'address': _addressCtrl.text.trim(),
        'urgency': _urgency,
        'canArrangePickup': _canArrangePickup,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated!')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.statusBlocked),
        );
      }
    } finally {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Edit Profile')),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Organisation', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              TextFormField(
                controller: _orgNameCtrl,
                decoration: const InputDecoration(labelText: 'Organisation Name'),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _orgType,
                decoration: const InputDecoration(labelText: 'Organisation Type'),
                items: const [
                  DropdownMenuItem(value: 'ngo', child: Text('NGO')),
                  DropdownMenuItem(value: 'shelter', child: Text('Shelter')),
                  DropdownMenuItem(value: 'community_kitchen', child: Text('Community Kitchen')),
                  DropdownMenuItem(value: 'food_bank', child: Text('Food Bank')),
                ],
                onChanged: (v) => setState(() => _orgType = v!),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _contactCtrl,
                decoration: const InputDecoration(labelText: 'Contact Name'),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneCtrl,
                decoration: const InputDecoration(labelText: 'Contact Phone'),
                keyboardType: TextInputType.phone,
              ),

              const SizedBox(height: 20),
              const Text('Capacity & Demand', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _demandCtrl,
                      decoration: const InputDecoration(labelText: 'Current Demand (meals)'),
                      keyboardType: TextInputType.number,
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _capacityCtrl,
                      decoration: const InputDecoration(labelText: 'Max Capacity'),
                      keyboardType: TextInputType.number,
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),
              const Text('Accepted Categories', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: ['cooked_meal', 'raw_produce', 'packaged', 'bakery', 'dairy', 'beverages', 'other']
                    .map((cat) => FilterChip(
                          label: Text(cat),
                          selected: _acceptedCategories.contains(cat),
                          onSelected: (sel) => setState(() {
                            if (sel) _acceptedCategories.add(cat);
                            else _acceptedCategories.remove(cat);
                          }),
                        ))
                    .toList(),
              ),

              const SizedBox(height: 20),
              const Text('Available Storage', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: ['room_temp', 'refrigerated', 'frozen', 'hot_hold']
                    .map((s) => FilterChip(
                          label: Text(s),
                          selected: _availableStorage.contains(s),
                          onSelected: (sel) => setState(() {
                            if (sel) _availableStorage.add(s);
                            else _availableStorage.remove(s);
                          }),
                        ))
                    .toList(),
              ),

              const SizedBox(height: 20),
              const Text('Location', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              TextFormField(
                controller: _addressCtrl,
                decoration: const InputDecoration(labelText: 'Address'),
                maxLines: 2,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: TextFormField(
                    controller: _latCtrl,
                    decoration: const InputDecoration(labelText: 'Latitude'),
                    keyboardType: TextInputType.number,
                  )),
                  const SizedBox(width: 12),
                  Expanded(child: TextFormField(
                    controller: _lngCtrl,
                    decoration: const InputDecoration(labelText: 'Longitude'),
                    keyboardType: TextInputType.number,
                  )),
                ],
              ),

              const SizedBox(height: 20),
              const Text('Preferences', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _urgency,
                decoration: const InputDecoration(labelText: 'Urgency Level'),
                items: const [
                  DropdownMenuItem(value: 'low', child: Text('Low')),
                  DropdownMenuItem(value: 'medium', child: Text('Medium')),
                  DropdownMenuItem(value: 'high', child: Text('High')),
                  DropdownMenuItem(value: 'critical', child: Text('Critical')),
                ],
                onChanged: (v) => setState(() => _urgency = v!),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                value: _canArrangePickup,
                onChanged: (v) => setState(() => _canArrangePickup = v),
                title: const Text('Can arrange own pickup'),
                activeColor: AppTheme.primary,
              ),

              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 18, width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Save Profile'),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
