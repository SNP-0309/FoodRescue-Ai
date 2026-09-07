// FoodRescue AI — App Theme
// Green primary, warm white background, sage and amber accents

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  AppTheme._();

  // ── Color Palette ──────────────────────────────────────────────────────────
  static const Color primary = Color(0xFF2D7A4F);      // Forest green
  static const Color primaryLight = Color(0xFF4CAF7A); // Light green
  static const Color primaryDark = Color(0xFF1B5E38);  // Dark green

  static const Color background = Color(0xFFFAF8F3);   // Warm white
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF5F0E8); // Warm beige

  static const Color sage = Color(0xFF8FAF8F);         // Sage accent
  static const Color sageLight = Color(0xFFB8D4B8);    // Light sage
  static const Color amber = Color(0xFFE8A020);        // Amber accent
  static const Color amberLight = Color(0xFFF5C842);

  static const Color textPrimary = Color(0xFF1A2820);
  static const Color textSecondary = Color(0xFF4A6358);
  static const Color textHint = Color(0xFF8BA899);

  // Status colors
  static const Color statusEligible = Color(0xFF2D7A4F);   // Green
  static const Color statusReview = Color(0xFFE8A020);     // Amber
  static const Color statusBlocked = Color(0xFFD32F2F);    // Red
  static const Color statusOnHold = Color(0xFF6D4C41);     // Brown
  static const Color statusInTransit = Color(0xFF1565C0);  // Blue

  // Card colors
  static const Color cardBorder = Color(0xFFE0D8CC);
  static const Color divider = Color(0xFFE8E0D4);

  // ── Text Theme ─────────────────────────────────────────────────────────────
  static TextTheme get _textTheme => GoogleFonts.outfitTextTheme(
        const TextTheme(
          displayLarge: TextStyle(
            fontSize: 32, fontWeight: FontWeight.w700, color: textPrimary,
          ),
          displayMedium: TextStyle(
            fontSize: 26, fontWeight: FontWeight.w600, color: textPrimary,
          ),
          headlineLarge: TextStyle(
            fontSize: 22, fontWeight: FontWeight.w700, color: textPrimary,
          ),
          headlineMedium: TextStyle(
            fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary,
          ),
          headlineSmall: TextStyle(
            fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary,
          ),
          titleLarge: TextStyle(
            fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary,
          ),
          titleMedium: TextStyle(
            fontSize: 14, fontWeight: FontWeight.w500, color: textPrimary,
          ),
          bodyLarge: TextStyle(
            fontSize: 16, fontWeight: FontWeight.w400, color: textPrimary,
          ),
          bodyMedium: TextStyle(
            fontSize: 14, fontWeight: FontWeight.w400, color: textSecondary,
          ),
          bodySmall: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w400, color: textHint,
          ),
          labelLarge: TextStyle(
            fontSize: 14, fontWeight: FontWeight.w600, color: textPrimary,
            letterSpacing: 0.5,
          ),
        ),
      );

  // ── Light Theme ────────────────────────────────────────────────────────────
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme(
          brightness: Brightness.light,
          primary: primary,
          onPrimary: Colors.white,
          primaryContainer: sageLight,
          onPrimaryContainer: primaryDark,
          secondary: amber,
          onSecondary: Colors.white,
          secondaryContainer: amberLight,
          onSecondaryContainer: Color(0xFF4A3000),
          tertiary: sage,
          onTertiary: Colors.white,
          surface: surface,
          onSurface: textPrimary,
          surfaceContainerHighest: surfaceVariant,
          onSurfaceVariant: textSecondary,
          error: Color(0xFFD32F2F),
          onError: Colors.white,
          outline: cardBorder,
          outlineVariant: divider,
        ),
        scaffoldBackgroundColor: background,
        textTheme: _textTheme,
        appBarTheme: AppBarTheme(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: GoogleFonts.outfit(
            fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white,
          ),
        ),
        cardTheme: CardThemeData(
          color: surface,
          elevation: 2,
          shadowColor: Colors.black.withAlpha(20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: cardBorder, width: 1),
          ),
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: primary,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            elevation: 2,
            textStyle: GoogleFonts.outfit(
              fontSize: 16, fontWeight: FontWeight.w600,
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: primary,
            minimumSize: const Size(double.infinity, 52),
            side: const BorderSide(color: primary, width: 2),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            textStyle: GoogleFonts.outfit(
              fontSize: 16, fontWeight: FontWeight.w600,
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: surfaceVariant,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: cardBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: cardBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: primary, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFD32F2F)),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          hintStyle: const TextStyle(color: textHint),
          labelStyle: const TextStyle(color: textSecondary),
        ),
        chipTheme: ChipThemeData(
          backgroundColor: surfaceVariant,
          selectedColor: sageLight,
          labelStyle: const TextStyle(color: textSecondary, fontSize: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: surface,
          selectedItemColor: primary,
          unselectedItemColor: textHint,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
          elevation: 8,
        ),
        dividerTheme: const DividerThemeData(color: divider, thickness: 1),
        snackBarTheme: SnackBarThemeData(
          backgroundColor: textPrimary,
          contentTextStyle: const TextStyle(color: Colors.white),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          behavior: SnackBarBehavior.floating,
        ),
      );

  // ── Status Helpers ─────────────────────────────────────────────────────────
  static Color statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'eligible': return statusEligible;
      case 'matched': return primaryLight;
      case 'needs_review': return statusReview;
      case 'blocked': return statusBlocked;
      case 'on_hold': return statusOnHold;
      case 'in_transit': case 'picked_up': return statusInTransit;
      case 'delivered': return statusEligible;
      case 'posted': return sage;
      default: return textHint;
    }
  }

  static String statusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'posted': return 'Posted';
      case 'screening': return 'Screening';
      case 'eligible': return 'Eligible';
      case 'matched': return 'Matched';
      case 'needs_review': return 'Needs Review';
      case 'blocked': return 'Blocked';
      case 'picked_up': return 'Picked Up';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'on_hold': return 'On Hold';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }

  static IconData statusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'posted': return Icons.add_circle_outline;
      case 'screening': return Icons.search;
      case 'eligible': return Icons.check_circle;
      case 'matched': return Icons.people;
      case 'needs_review': return Icons.warning_amber;
      case 'blocked': return Icons.block;
      case 'picked_up': return Icons.shopping_bag;
      case 'in_transit': return Icons.local_shipping;
      case 'delivered': return Icons.done_all;
      case 'on_hold': return Icons.pause_circle;
      case 'rejected': return Icons.cancel;
      default: return Icons.help_outline;
    }
  }
}
