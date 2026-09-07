// FoodRescue AI — GoRouter Configuration

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../features/auth/splash_screen.dart';
import '../../features/auth/role_selection_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/donor/donor_dashboard.dart';
import '../../features/donor/create_donation_screen.dart';
import '../../features/donor/donation_detail_screen.dart';
import '../../features/donor/suitability_score_screen.dart';
import '../../features/matching/receiver_matching_screen.dart';
import '../../features/receiver/receiver_dashboard.dart';
import '../../features/receiver/receiver_profile_screen.dart';
import '../../features/volunteer/volunteer_dashboard.dart';
import '../../features/volunteer/pickup_task_screen.dart';
import '../../features/volunteer/route_screen.dart';
import '../../features/volunteer/delivery_confirm_screen.dart';
import '../../features/deliveries/delivery_history_screen.dart';
import '../../features/analytics/analytics_screen.dart';
import '../../features/safety/food_safety_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = authState.user != null;
      final isAuthRoute = state.matchedLocation == '/' ||
          state.matchedLocation == '/role' ||
          state.matchedLocation == '/login';

      if (!isLoggedIn && !isAuthRoute) return '/';
      return null;
    },
    routes: [
      // Auth
      GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/role', builder: (_, __) => const RoleSelectionScreen()),
      GoRoute(
        path: '/login',
        builder: (_, state) => LoginScreen(role: state.extra as String? ?? 'donor'),
      ),

      // Donor
      GoRoute(path: '/donor', builder: (_, __) => const DonorDashboard()),
      GoRoute(path: '/donor/donate', builder: (_, __) => const CreateDonationScreen()),
      GoRoute(
        path: '/donor/donation/:id',
        builder: (_, state) => DonationDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/donor/donation/:id/score',
        builder: (_, state) => SuitabilityScoreScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/donor/donation/:id/match',
        builder: (_, state) => ReceiverMatchingScreen(id: state.pathParameters['id']!),
      ),

      // Receiver
      GoRoute(path: '/receiver', builder: (_, __) => const ReceiverDashboard()),
      GoRoute(path: '/receiver/profile', builder: (_, __) => const ReceiverProfileScreen()),

      // Volunteer
      GoRoute(path: '/volunteer', builder: (_, __) => const VolunteerDashboard()),
      GoRoute(
        path: '/volunteer/task/:id',
        builder: (_, state) => PickupTaskScreen(deliveryId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/volunteer/task/:id/route',
        builder: (_, state) => RouteScreen(deliveryId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/volunteer/task/:id/confirm',
        builder: (_, state) => DeliveryConfirmScreen(deliveryId: state.pathParameters['id']!),
      ),

      // Shared
      GoRoute(path: '/history', builder: (_, __) => const DeliveryHistoryScreen()),
      GoRoute(path: '/analytics', builder: (_, __) => const AnalyticsScreen()),
      GoRoute(path: '/safety', builder: (_, __) => const FoodSafetyScreen()),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(
        child: Text('Route not found: ${state.error}'),
      ),
    ),
  );
});
