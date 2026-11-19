import 'package:flutter/material.dart';

/// Krishi brand colours, matching the website (web/src/app/globals.css).
class KColors {
  static const brand = Color(0xFF3A7D44);
  static const brandDark = Color(0xFF2E6537);
  static const brandTint = Color(0xFFEDF5EE);
  static const greenDeep = Color(0xFF2E5B3D);
  static const cream = Color(0xFFFAF8F5);
  static const stone = Color(0xFFEDE9E3);
  static const border = Color(0xFFE0DBD4);
  static const ink = Color(0xFF1A1A1A);
  static const inkSecondary = Color(0xFF6B6560);
  static const inkMuted = Color(0xFFA09890);
  static const danger = Color(0xFFA13D2B);
  static const dangerTint = Color(0xFFFAF0ED);
  static const warning = Color(0xFF9A6B12);
  static const warningTint = Color(0xFFFBF5E6);
  static const info = Color(0xFF2F5D7C);
  static const infoTint = Color(0xFFEAF1F6);
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: KColors.brand,
    primary: KColors.brand,
    onPrimary: Colors.white,
    secondary: KColors.greenDeep,
    error: KColors.danger,
    surface: Colors.white,
  );
  final base = ThemeData(useMaterial3: true, colorScheme: scheme);
  return base.copyWith(
    scaffoldBackgroundColor: KColors.cream,
    textTheme: base.textTheme.apply(bodyColor: KColors.ink, displayColor: KColors.ink),
    appBarTheme: const AppBarTheme(
      backgroundColor: KColors.cream,
      foregroundColor: KColors.ink,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
      titleTextStyle: TextStyle(fontSize: 19, fontWeight: FontWeight.w700, color: KColors.ink),
    ),
    cardTheme: const CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
        side: BorderSide(color: KColors.border),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: KColors.brandTint,
      height: 66,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => TextStyle(
          fontSize: 12,
          fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
          color: states.contains(WidgetState.selected) ? KColors.greenDeep : KColors.inkSecondary,
        ),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(
          color: states.contains(WidgetState.selected) ? KColors.greenDeep : KColors.inkSecondary,
        ),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: KColors.brand,
        foregroundColor: Colors.white,
        minimumSize: const Size(64, 50),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: KColors.greenDeep,
        minimumSize: const Size(64, 46),
        side: const BorderSide(color: KColors.border),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: KColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: KColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: KColors.brand, width: 1.6),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: Colors.white,
      selectedColor: KColors.brandTint,
      side: const BorderSide(color: KColors.border),
    ),
    dividerTheme: const DividerThemeData(color: KColors.border, space: 1, thickness: 1),
    snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
  );
}
