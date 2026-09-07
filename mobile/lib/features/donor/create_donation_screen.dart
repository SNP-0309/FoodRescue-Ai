// FoodRescue AI — Create Donation Screen

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/donations_provider.dart';
import 'dart:io';
import 'dart:convert';

class CreateDonationScreen extends ConsumerStatefulWidget {
  const CreateDonationScreen({super.key});

  @override
  ConsumerState<CreateDonationScreen> createState() => _CreateDonationScreenState();
}

class _CreateDonationScreenState extends ConsumerState<CreateDonationScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _submitting = false;

  // Food details
  final _foodNameCtrl = TextEditingController();
  String _category = 'cooked_meal';
  final _quantityCtrl = TextEditingController();
  final _weightCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _allergensCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  // Time
  DateTime _preparedAt = DateTime.now();
  int _usableDuration = 240; // minutes
  DateTime _expiryTime = DateTime.now().add(const Duration(hours: 4));

  // Condition
  String _storageCondition = 'hot_hold';
  final _tempCtrl = TextEditingController();
  String _packagingCondition = 'intact';

  // Location
  final _addressCtrl = TextEditingController();
  final _latCtrl = TextEditingController(text: '12.9716');
  final _lngCtrl = TextEditingController(text: '77.5946');

  // Photo
  File? _photoFile;
  String? _photoBase64;

  @override
  void dispose() {
    for (final ctrl in [
      _foodNameCtrl, _quantityCtrl, _weightCtrl, _descCtrl,
      _allergensCtrl, _notesCtrl, _tempCtrl, _addressCtrl, _latCtrl, _lngCtrl,
    ]) { ctrl.dispose(); }
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 60);
    if (picked != null) {
      final bytes = await picked.readAsBytes();
      setState(() {
        _photoFile = File(picked.path);
        _photoBase64 = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      });
    }
  }

  Future<void> _selectDateTime(
    BuildContext context,
    DateTime initial,
    ValueChanged<DateTime> onPicked,
  ) async {
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(hours: 24)),
      lastDate: DateTime.now().add(const Duration(days: 7)),
    );
    if (date == null || !context.mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return;
    onPicked(DateTime(date.year, date.month, date.day, time.hour, time.minute));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);

    final user = ref.read(authProvider).user!;
    final allergens = _allergensCtrl.text.isNotEmpty
        ? _allergensCtrl.text.split(',').map((e) => e.trim()).toList()
        : <String>[];

    final data = {
      'donorId': user.id,
      'foodName': _foodNameCtrl.text.trim(),
      'category': _category,
      'quantity': int.tryParse(_quantityCtrl.text) ?? 1,
      'weightKg': double.tryParse(_weightCtrl.text) ?? 1.0,
      'description': _descCtrl.text.trim(),
      'allergens': allergens,
      'handlingNotes': _notesCtrl.text.trim(),
      'preparedAt': _preparedAt.toIso8601String(),
      'packagingTime': _preparedAt.toIso8601String(),
      'usableDuration': _usableDuration,
      'expiryTime': _expiryTime.toIso8601String(),
      'storageCondition': _storageCondition,
      if (_tempCtrl.text.isNotEmpty) 'temperature': double.tryParse(_tempCtrl.text),
      if (_tempCtrl.text.isNotEmpty) 'temperatureTime': DateTime.now().toIso8601String(),
      'packagingCondition': _packagingCondition,
      'pickupLat': double.tryParse(_latCtrl.text) ?? 12.9716,
      'pickupLng': double.tryParse(_lngCtrl.text) ?? 77.5946,
      'pickupAddress': _addressCtrl.text.trim(),
      if (_photoBase64 != null) 'photoUrl': _photoBase64,
    };

    final donation = await ref.read(donationsProvider.notifier).createDonation(data);
    setState(() => _submitting = false);

    if (!mounted) return;
    if (donation != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Donation created! Running AI screening...')),
      );
      // Auto-trigger screening
      await ref.read(donationsProvider.notifier).screenDonation(donation.id);
      context.go('/donor/donation/${donation.id}');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ref.read(donationsProvider).error ?? 'Failed to create donation'),
          backgroundColor: AppTheme.statusBlocked,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Post Food Donation')),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _sectionTitle('Food Details'),
              const SizedBox(height: 12),
              _buildTextField(_foodNameCtrl, 'Food Name', required: true, maxLen: 200),
              const SizedBox(height: 12),
              _buildDropdown('Category', _category, _categoryOptions, (v) => setState(() => _category = v!)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildTextField(_quantityCtrl, 'Qty (servings)', required: true, keyboardType: TextInputType.number)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildTextField(_weightCtrl, 'Weight (kg)', required: true, keyboardType: TextInputType.number)),
                ],
              ),
              const SizedBox(height: 12),
              _buildTextField(_descCtrl, 'Description (optional)', maxLines: 2),
              const SizedBox(height: 12),
              _buildTextField(_allergensCtrl, 'Allergens (comma-separated)', hint: 'e.g. gluten, dairy'),

              const SizedBox(height: 20),
              _sectionTitle('Time & Condition'),
              const SizedBox(height: 12),
              _buildDateTile('Prepared At', _preparedAt, (d) => setState(() => _preparedAt = d)),
              const SizedBox(height: 8),
              _buildDateTile('Expiry / Use-by', _expiryTime, (d) => setState(() => _expiryTime = d)),
              const SizedBox(height: 8),
              _buildDurationSlider(),
              const SizedBox(height: 12),
              _buildDropdown('Storage Condition', _storageCondition, _storageOptions, (v) => setState(() => _storageCondition = v!)),
              const SizedBox(height: 12),
              _buildDropdown('Packaging Condition', _packagingCondition, _packagingOptions, (v) => setState(() => _packagingCondition = v!)),
              const SizedBox(height: 12),
              _buildTextField(_tempCtrl, 'Current Temperature (°C)', hint: 'Optional', keyboardType: TextInputType.number),

              const SizedBox(height: 20),
              _sectionTitle('Pickup Location'),
              const SizedBox(height: 12),
              _buildTextField(_addressCtrl, 'Pickup Address', required: true, maxLines: 2),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildTextField(_latCtrl, 'Latitude', keyboardType: TextInputType.number)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildTextField(_lngCtrl, 'Longitude', keyboardType: TextInputType.number)),
                ],
              ),

              const SizedBox(height: 20),
              _sectionTitle('Food Photo (optional)'),
              const SizedBox(height: 12),
              _buildPhotoSection(),

              const SizedBox(height: 12),
              _buildTextField(_notesCtrl, 'Handling Notes', maxLines: 2),

              const SizedBox(height: 24),
              _buildSafetyNotice(),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(
                        width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.upload_rounded),
                label: Text(_submitting ? 'Posting...' : 'Post Donation'),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(String text) => Text(text,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary));

  Widget _buildTextField(
    TextEditingController ctrl,
    String label, {
    bool required = false,
    int maxLines = 1,
    String? hint,
    TextInputType? keyboardType,
    int? maxLen,
  }) {
    return TextFormField(
      controller: ctrl,
      maxLines: maxLines,
      maxLength: maxLen,
      keyboardType: keyboardType,
      decoration: InputDecoration(labelText: label, hintText: hint, counterText: ''),
      validator: required
          ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
          : null,
    );
  }

  Widget _buildDropdown(
    String label,
    String value,
    Map<String, String> options,
    ValueChanged<String?> onChanged,
  ) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(labelText: label),
      items: options.entries
          .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
          .toList(),
      onChanged: onChanged,
    );
  }

  Widget _buildDateTile(String label, DateTime value, ValueChanged<DateTime> onChanged) {
    final fmt = DateFormat('MMM d, yyyy – h:mm a');
    return InkWell(
      onTap: () => _selectDateTime(context, value, onChanged),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppTheme.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.cardBorder),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today_outlined, size: 18, color: AppTheme.textHint),
            const SizedBox(width: 10),
            Expanded(child: Text(label, style: const TextStyle(color: AppTheme.textSecondary))),
            Text(fmt.format(value),
                style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  Widget _buildDurationSlider() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Usable Duration: ${_usableDuration ~/ 60}h ${_usableDuration % 60}m',
          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
        ),
        Slider(
          value: _usableDuration.toDouble(),
          min: 30,
          max: 720,
          divisions: 23,
          activeColor: AppTheme.primary,
          onChanged: (v) => setState(() => _usableDuration = v.toInt()),
        ),
      ],
    );
  }

  Widget _buildPhotoSection() {
    return GestureDetector(
      onTap: _pickImage,
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: AppTheme.surfaceVariant,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.cardBorder, width: 1.5),
        ),
        child: _photoFile != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.file(_photoFile!, fit: BoxFit.cover, width: double.infinity),
              )
            : const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.camera_alt_outlined, size: 32, color: AppTheme.textHint),
                  SizedBox(height: 8),
                  Text('Tap to add a photo', style: TextStyle(color: AppTheme.textHint)),
                ],
              ),
      ),
    );
  }

  Widget _buildSafetyNotice() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3E0),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.amber.withAlpha(80)),
      ),
      child: const Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: AppTheme.amber, size: 18),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'AI does not certify food as safe to eat. '
              'Screening is a preliminary visual signal only.',
              style: TextStyle(fontSize: 12, color: Color(0xFF6D4C00)),
            ),
          ),
        ],
      ),
    );
  }

  static const _categoryOptions = {
    'cooked_meal': 'Cooked Meal',
    'raw_produce': 'Raw Produce',
    'packaged': 'Packaged Food',
    'bakery': 'Bakery',
    'dairy': 'Dairy',
    'beverages': 'Beverages',
    'other': 'Other',
  };

  static const _storageOptions = {
    'room_temp': 'Room Temperature',
    'refrigerated': 'Refrigerated',
    'frozen': 'Frozen',
    'hot_hold': 'Hot Hold (60°C+)',
  };

  static const _packagingOptions = {
    'intact': 'Intact',
    'minor_damage': 'Minor Damage',
    'damaged': 'Damaged',
  };
}
