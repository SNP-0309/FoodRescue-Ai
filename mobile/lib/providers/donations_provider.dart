// FoodRescue AI — Donations Provider

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/app_models.dart';
import '../core/networking/api_client.dart';

class DonationsState {
  final List<Donation> donations;
  final bool isLoading;
  final String? error;

  const DonationsState({
    this.donations = const [],
    this.isLoading = false,
    this.error,
  });

  DonationsState copyWith({
    List<Donation>? donations,
    bool? isLoading,
    String? error,
  }) => DonationsState(
        donations: donations ?? this.donations,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

class DonationsNotifier extends StateNotifier<DonationsState> {
  DonationsNotifier() : super(const DonationsState());

  Future<void> fetchDonations({String? donorId, String? status}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final params = <String, String>{};
      if (donorId != null) params['donorId'] = donorId;
      if (status != null) params['status'] = status;

      final response = await ApiClient.instance.dio.get(
        '/donations',
        queryParameters: params,
      );
      final data = response.data['data'] as List;
      state = state.copyWith(
        donations: data.map((e) => Donation.fromJson(e as Map<String, dynamic>)).toList(),
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<Donation?> createDonation(Map<String, dynamic> data) async {
    try {
      final response = await ApiClient.instance.dio.post('/donations', data: data);
      final donation = Donation.fromJson(
        response.data['data'] as Map<String, dynamic>,
      );
      state = state.copyWith(donations: [donation, ...state.donations]);
      return donation;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  Future<Donation?> getDonation(String id) async {
    try {
      final response = await ApiClient.instance.dio.get('/donations/$id');
      return Donation.fromJson(response.data['data'] as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> screenDonation(String id) async {
    try {
      final response = await ApiClient.instance.dio.post('/donations/$id/screen');
      return response.data['data'] as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> matchDonation(String id) async {
    try {
      final response = await ApiClient.instance.dio.post('/donations/$id/match');
      return response.data['data'] as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }
}

final donationsProvider = StateNotifierProvider<DonationsNotifier, DonationsState>(
  (ref) => DonationsNotifier(),
);

final singleDonationProvider = FutureProvider.family<Donation?, String>((ref, id) async {
  final response = await ApiClient.instance.dio.get('/donations/$id');
  return Donation.fromJson(response.data['data'] as Map<String, dynamic>);
});
