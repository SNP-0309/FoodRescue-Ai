// FoodRescue AI — Route Screen with flutter_map + OpenStreetMap

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/deliveries_provider.dart';
import '../../core/constants/app_constants.dart';

class RouteScreen extends ConsumerWidget {
  final String deliveryId;
  const RouteScreen({super.key, required this.deliveryId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(deliveriesProvider);
    final delivery = state.deliveries.where((d) => d.id == deliveryId).firstOrNull;
    final donation = delivery?.donation;

    final pickupLat = double.tryParse(donation?.pickupLat ?? '') ?? AppConstants.defaultLat;
    final pickupLng = double.tryParse(donation?.pickupLng ?? '') ?? AppConstants.defaultLng;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Route Map')),
      body: Column(
        children: [
          // DISCLAIMER BANNER - always shown above map
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: const Color(0xFFFFF8E1),
            child: const Row(
              children: [
                Icon(Icons.info_outline, size: 16, color: AppTheme.amber),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Travel times shown are straight-line estimates only. '
                    'Not based on live traffic or actual road routes.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF6D4C00)),
                  ),
                ),
              ],
            ),
          ),

          // Map
          Expanded(
            child: FlutterMap(
              options: MapOptions(
                initialCenter: LatLng(pickupLat, pickupLng),
                initialZoom: AppConstants.defaultZoom,
              ),
              children: [
                TileLayer(
                  urlTemplate: AppConstants.osmTileUrl,
                  userAgentPackageName: 'com.foodrescue.foodrescueai',
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: LatLng(pickupLat, pickupLng),
                      width: 40,
                      height: 40,
                      child: const _MapPin(
                        icon: Icons.restaurant_rounded,
                        color: AppTheme.primary,
                        label: 'Pickup',
                      ),
                    ),
                  ],
                ),
                RichAttributionWidget(
                  attributions: [
                    TextSourceAttribution(AppConstants.osmAttribution),
                  ],
                ),
              ],
            ),
          ),

          // Info panel
          if (donation != null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, -2))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(donation.foodName,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textHint),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          donation.pickupAddress,
                          style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.timer_outlined, size: 14, color: AppTheme.textHint),
                      const SizedBox(width: 4),
                      Text(
                        donation.isExpired
                            ? 'Window expired!'
                            : '${donation.remainingWindowMinutes ~/ 60}h ${donation.remainingWindowMinutes % 60}m remaining',
                        style: TextStyle(
                          fontSize: 13,
                          color: donation.isExpired ? AppTheme.statusBlocked
                              : donation.remainingWindowMinutes < 60 ? AppTheme.amber
                              : AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _MapPin extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  const _MapPin({required this.icon, required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: color.withAlpha(80), blurRadius: 8)],
          ),
          child: Icon(icon, color: Colors.white, size: 18),
        ),
        Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
