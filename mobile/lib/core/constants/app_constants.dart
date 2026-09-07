// FoodRescue AI — App Constants

class AppConstants {
  AppConstants._();

  // API
  static const String baseUrl = 'http://10.0.2.2:3000/api'; // Android emulator
  // static const String baseUrl = 'http://localhost:3000/api'; // iOS simulator

  // Map tiles (OpenStreetMap)
  static const String osmTileUrl =
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  static const String osmAttribution =
      '© OpenStreetMap contributors';

  // Travel time disclaimer
  static const String travelTimeDisclaimer =
      'Estimated travel times are based on straight-line distance only. '
      'They are NOT based on live traffic data or actual road routes.';

  // Food safety notice
  static const String aiSafetyNotice =
      'AI does not certify food as safe to eat. '
      'This is a preliminary visual screening signal only.';

  // Demo notice
  static const String demoNotice =
      'Using demo data — not for real food redistribution decisions.';

  // Score thresholds
  static const int minimumSuitabilityScore = 40;
  static const int goodSuitabilityScore = 70;

  // Map defaults (Bengaluru)
  static const double defaultLat = 12.9716;
  static const double defaultLng = 77.5946;
  static const double defaultZoom = 13.0;

  // Storage key
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';

  // Pagination
  static const int pageSize = 20;
}
