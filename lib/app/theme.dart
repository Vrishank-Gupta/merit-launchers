import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MeritTheme {
  static const Color primary = Color(0xFF12B8F0);
  static const Color primarySoft = Color(0xFFE9F8FF);
  static const Color secondary = Color(0xFF213A63);
  static const Color secondaryMuted = Color(0xFF60718D);
  static const Color accent = Color(0xFFF4A339);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFF4FAFF);
  static const Color border = Color(0xFFD8E8F5);
  static const Color success = Color(0xFF1A9E74);

  static ThemeData lightTheme() {
    final scheme = ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      secondary: secondary,
      surface: surface,
      brightness: Brightness.light,
    );

    final textTheme = GoogleFonts.plusJakartaSansTextTheme().copyWith(
      displaySmall: GoogleFonts.plusJakartaSans(
        fontSize: 34,
        fontWeight: FontWeight.w800,
        color: secondary,
        height: 1.04,
      ),
      headlineMedium: GoogleFonts.plusJakartaSans(
        fontSize: 28,
        fontWeight: FontWeight.w800,
        color: secondary,
        height: 1.15,
      ),
      headlineSmall: GoogleFonts.plusJakartaSans(
        fontSize: 23,
        fontWeight: FontWeight.w800,
        color: secondary,
        height: 1.15,
      ),
      titleLarge: GoogleFonts.plusJakartaSans(
        fontSize: 18,
        fontWeight: FontWeight.w800,
        color: secondary,
      ),
      titleMedium: GoogleFonts.plusJakartaSans(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: secondary,
      ),
      bodyLarge: GoogleFonts.plusJakartaSans(
        fontSize: 15,
        fontWeight: FontWeight.w500,
        color: const Color(0xFF243446),
        height: 1.55,
      ),
      bodyMedium: GoogleFonts.plusJakartaSans(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: secondaryMuted,
        height: 1.5,
      ),
      labelLarge: GoogleFonts.plusJakartaSans(
        fontSize: 13,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.28,
        color: secondary,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      textTheme: textTheme,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        foregroundColor: secondary,
        centerTitle: false,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      cardTheme: CardThemeData(
        color: surface,
        surfaceTintColor: Colors.transparent,
        shadowColor: primary.withValues(alpha: 0.08),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: border),
        ),
      ),
      dividerColor: border,
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        labelStyle: textTheme.bodyMedium,
        hintStyle: textTheme.bodyMedium,
        helperStyle: textTheme.bodyMedium,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: primary, width: 1.4),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: const StadiumBorder(side: BorderSide(color: border)),
        backgroundColor: primarySoft,
        selectedColor: primarySoft,
        side: const BorderSide(color: border),
        labelStyle: textTheme.labelLarge,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: secondary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          shadowColor: primary.withValues(alpha: 0.25),
          textStyle: textTheme.labelLarge?.copyWith(fontSize: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: secondary,
          side: const BorderSide(color: border),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 74,
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: primarySoft,
        labelTextStyle: WidgetStatePropertyAll(textTheme.labelLarge),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: secondary,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: Colors.white),
      ),
    );
  }
}
