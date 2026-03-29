import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors
  static const Color brand50 = Color(0xFFF0F9FF);
  static const Color brand100 = Color(0xFFE0F2FE);
  static const Color brand300 = Color(0xFF7DD3FC);
  static const Color brand500 = Color(0xFF0EA5E9); // Primary
  static const Color brand600 = Color(0xFF0284C7);
  static const Color brand700 = Color(0xFF0369A1);
  static const Color brand900 = Color(0xFF0C4A6E);

  // Accent Colors
  static const Color accent500 = Color(0xFF10B981); // Natural Stream
  static const Color accent600 = Color(0xFF059669);

  // Social Colors
  static const Color social500 = Color(0xFFF43F5E); // Social Stream
  static const Color social600 = Color(0xFFE11D48);

  // CSS Variables
  static const Color bgMain = Color(0xFFF8FAFC);
  static const Color textMain = Color(0xFF0F172A);
  static const Color textMuted = Color(0xFF64748B);
  static const Color borderColor = Color(0xFFE2E8F0);

  static ThemeData get lightTheme {
    return ThemeData(
      primaryColor: brand500,
      scaffoldBackgroundColor: bgMain,
      colorScheme: const ColorScheme.light(
        primary: brand500,
        secondary: accent500,
        surface: Colors.white,
        error: social500,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textMain,
        onError: Colors.white,
      ),
      textTheme: GoogleFonts.interTextTheme().copyWith(
        bodyLarge: GoogleFonts.inter(color: textMain),
        bodyMedium: GoogleFonts.inter(color: textMain),
        headlineLarge: GoogleFonts.inter(color: textMain, fontWeight: FontWeight.bold),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bgMain,
        elevation: 0,
        iconTheme: IconThemeData(color: textMain),
        titleTextStyle: TextStyle(
          color: textMain,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: brand500),
        ),
        labelStyle: const TextStyle(color: textMuted),
      ),
    );
  }
}
