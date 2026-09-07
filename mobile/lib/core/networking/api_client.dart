// FoodRescue AI — API Client (Dio)

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

class ApiClient {
  ApiClient._();
  static ApiClient? _instance;
  static ApiClient get instance => _instance ??= ApiClient._();

  final _storage = const FlutterSecureStorage();
  late final Dio _dio = _buildDio();

  Dio get dio => _dio;

  Dio _buildDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    dio.interceptors.add(_AuthInterceptor(_storage));
    dio.interceptors.add(_ErrorInterceptor());

    if (const bool.fromEnvironment('dart.vm.product') == false) {
      dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (o) => print('[API] $o'),
      ));
    }

    return dio;
  }
}

class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  _AuthInterceptor(this._storage);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: AppConstants.tokenKey);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}

class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final message = _extractMessage(err);
    handler.next(DioException(
      requestOptions: err.requestOptions,
      error: message,
      response: err.response,
      type: err.type,
    ));
  }

  String _extractMessage(DioException err) {
    if (err.response?.data is Map) {
      return (err.response!.data as Map)['error'] as String? ??
          'Request failed';
    }
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timeout — check your network';
      case DioExceptionType.connectionError:
        return 'Cannot connect to server — is it running?';
      default:
        return err.message ?? 'Unknown error';
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  const ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}
