// FoodRescue AI — Main Entry Point

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: FoodRescueApp()));
}

class FoodRescueApp extends ConsumerStatefulWidget {
  const FoodRescueApp({super.key});

  @override
  ConsumerState<FoodRescueApp> createState() => _FoodRescueAppState();
}

class _FoodRescueAppState extends ConsumerState<FoodRescueApp> {
  @override
  void initState() {
    super.initState();
    // Restore persisted session on startup
    Future.microtask(() => ref.read(authProvider.notifier).restoreSession());
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'FoodRescue AI',
      theme: AppTheme.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
