// FoodRescue AI — Deliveries Provider

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/app_models.dart';
import '../core/networking/api_client.dart';

class DeliveriesState {
  final List<Delivery> deliveries;
  final bool isLoading;
  final String? error;

  const DeliveriesState({
    this.deliveries = const [],
    this.isLoading = false,
    this.error,
  });

  DeliveriesState copyWith({
    List<Delivery>? deliveries,
    bool? isLoading,
    String? error,
  }) => DeliveriesState(
        deliveries: deliveries ?? this.deliveries,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

class DeliveriesNotifier extends StateNotifier<DeliveriesState> {
  DeliveriesNotifier() : super(const DeliveriesState());

  Future<void> fetchTasks({String? volunteerId, String? status}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final params = <String, String>{};
      if (volunteerId != null) params['volunteerId'] = volunteerId;
      if (status != null) params['status'] = status;

      final response = await ApiClient.instance.dio.get(
        '/volunteers/tasks',
        queryParameters: params,
      );
      final data = response.data['data'] as List;
      state = state.copyWith(
        deliveries: data.map((e) => Delivery.fromJson(e as Map<String, dynamic>)).toList(),
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> acceptDelivery(
    String deliveryId,
    String volunteerId,
    double lat,
    double lng,
  ) async {
    try {
      await ApiClient.instance.dio.post(
        '/deliveries/$deliveryId/accept',
        data: {'volunteerId': volunteerId, 'currentLat': lat, 'currentLng': lng},
      );
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> confirmPickup(
    String deliveryId,
    String volunteerId, {
    double? temperature,
    required bool packagingOk,
    String? notes,
  }) async {
    try {
      await ApiClient.instance.dio.post(
        '/deliveries/$deliveryId/pickup',
        data: {
          'volunteerId': volunteerId,
          if (temperature != null) 'pickupTemperature': temperature,
          'pickupPackagingOk': packagingOk,
          if (notes != null) 'pickupNotes': notes,
        },
      );
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> startTransit(String deliveryId, String volunteerId) async {
    try {
      await ApiClient.instance.dio.post(
        '/deliveries/$deliveryId/transit',
        data: {'volunteerId': volunteerId},
      );
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> confirmDelivery(
    String deliveryId,
    String volunteerId, {
    double? temperature,
    required String recipientName,
    String? notes,
  }) async {
    try {
      await ApiClient.instance.dio.post(
        '/deliveries/$deliveryId/confirm',
        data: {
          'volunteerId': volunteerId,
          if (temperature != null) 'deliveryTemperature': temperature,
          'receiverAccepted': true,
          'recipientName': recipientName,
          if (notes != null) 'deliveryNotes': notes,
        },
      );
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> reportIncident(
    String deliveryId,
    String volunteerId, {
    required String incidentType,
    required String notes,
    bool putOnHold = true,
  }) async {
    try {
      await ApiClient.instance.dio.post(
        '/deliveries/$deliveryId/incident',
        data: {
          'volunteerId': volunteerId,
          'incidentType': incidentType,
          'incidentNotes': notes,
          'putOnHold': putOnHold,
        },
      );
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }
}

final deliveriesProvider = StateNotifierProvider<DeliveriesNotifier, DeliveriesState>(
  (ref) => DeliveriesNotifier(),
);

final analyticsProvider = FutureProvider<AnalyticsSummary?>((ref) async {
  try {
    final response = await ApiClient.instance.dio.get('/analytics');
    return AnalyticsSummary.fromJson(response.data['data'] as Map<String, dynamic>);
  } catch (_) {
    return null;
  }
});
