// FoodRescue AI — Auth Provider

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/app_models.dart';
import '../core/networking/api_client.dart';
import '../core/constants/app_constants.dart';
import 'dart:convert';

class AuthState {
  final AppUser? user;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.isLoading = false, this.error});

  AuthState copyWith({AppUser? user, bool? isLoading, String? error}) =>
      AuthState(
        user: user ?? this.user,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  final _storage = const FlutterSecureStorage();

  Future<void> demoLogin(String role, {String? userId}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient.instance.dio.post(
        '/auth/demo-login',
        data: {'role': role, if (userId != null) 'userId': userId},
      );
      final data = response.data['data'] as Map<String, dynamic>;
      final user = AppUser.fromJson(data['user'] as Map<String, dynamic>);
      final token = data['token'] as String;

      await _storage.write(key: AppConstants.tokenKey, value: token);
      await _storage.write(key: AppConstants.userKey, value: jsonEncode(user.toJson()));

      state = state.copyWith(user: user, isLoading: false);
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> restoreSession() async {
    final userData = await _storage.read(key: AppConstants.userKey);
    if (userData != null) {
      try {
        final user = AppUser.fromJson(jsonDecode(userData) as Map<String, dynamic>);
        state = state.copyWith(user: user);
      } catch (_) {
        await logout();
      }
    }
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    state = const AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(),
);
