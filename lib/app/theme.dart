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

  static const Color darkBackground = Color(0xFF1F201B);
  static const Color darkBackgroundDeep = Color(0xFF191A16);
  static const Color darkSurface = Color(0xFF292A24);
  static const Color darkSurfaceRaised = Color(0xFF323329);
  static const Color darkBorder = Color(0xFF45473C);
  static const Color darkText = Color(0xFFF3F0E8);
  static const Color darkMuted = Color(0xFFB9B6A8);
  static const Color darkCyan = Color(0xFF66D9EF);
  static const Color darkGreen = Color(0xFFA6E22E);
  static const Color darkAmber = Color(0xFFE6DB74);
  static const Color darkRose = Color(0xFFFF6188);

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

  static ThemeData studentDarkTheme() {
    const scheme = ColorScheme.dark(
      primary: darkCyan,
      onPrimary: Color(0xFF10262B),
      secondary: darkGreen,
      onSecondary: Color(0xFF18230D),
      tertiary: darkAmber,
      error: darkRose,
      surface: darkSurface,
      onSurface: darkText,
      surfaceContainerHighest: darkSurfaceRaised,
      outline: darkBorder,
    );

    final textTheme = GoogleFonts.plusJakartaSansTextTheme(
      ThemeData.dark().textTheme,
    ).copyWith(
      displaySmall: GoogleFonts.plusJakartaSans(
        fontSize: 34,
        fontWeight: FontWeight.w800,
        color: darkText,
        height: 1.04,
      ),
      headlineMedium: GoogleFonts.plusJakartaSans(
        fontSize: 28,
        fontWeight: FontWeight.w800,
        color: darkText,
        height: 1.15,
      ),
      headlineSmall: GoogleFonts.plusJakartaSans(
        fontSize: 23,
        fontWeight: FontWeight.w800,
        color: darkText,
        height: 1.15,
      ),
      titleLarge: GoogleFonts.plusJakartaSans(
        fontSize: 18,
        fontWeight: FontWeight.w800,
        color: darkText,
      ),
      titleMedium: GoogleFonts.plusJakartaSans(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: darkText,
      ),
      bodyLarge: GoogleFonts.plusJakartaSans(
        fontSize: 15,
        fontWeight: FontWeight.w500,
        color: darkText,
        height: 1.55,
      ),
      bodyMedium: GoogleFonts.plusJakartaSans(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: darkMuted,
        height: 1.5,
      ),
      labelLarge: GoogleFonts.plusJakartaSans(
        fontSize: 13,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.28,
        color: darkText,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: darkBackground,
      textTheme: textTheme,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        foregroundColor: darkText,
        centerTitle: false,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: darkSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      cardTheme: CardThemeData(
        color: darkSurface,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black.withValues(alpha: 0.18),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: darkBorder),
        ),
      ),
      dividerColor: darkBorder,
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkSurfaceRaised,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        labelStyle: textTheme.bodyMedium,
        hintStyle: textTheme.bodyMedium,
        helperStyle: textTheme.bodyMedium,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: darkCyan, width: 1.4),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: const StadiumBorder(side: BorderSide(color: darkBorder)),
        backgroundColor: darkSurfaceRaised,
        selectedColor: darkSurfaceRaised,
        side: const BorderSide(color: darkBorder),
        labelStyle: textTheme.labelLarge,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: darkCyan,
          foregroundColor: const Color(0xFF10262B),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          shadowColor: darkCyan.withValues(alpha: 0.2),
          textStyle: textTheme.labelLarge?.copyWith(fontSize: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: darkText,
          side: const BorderSide(color: darkBorder),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: darkCyan),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 74,
        backgroundColor: darkSurface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: darkCyan.withValues(alpha: 0.18),
        labelTextStyle: WidgetStatePropertyAll(textTheme.labelLarge),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          return IconThemeData(
            color: states.contains(WidgetState.selected) ? darkCyan : darkMuted,
          );
        }),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: darkSurfaceRaised,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: darkText),
      ),
    );
  }
}
