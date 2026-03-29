import 'package:flutter/material.dart';
import 'core/theme.dart';
import 'pages/login_page.dart';
import 'pages/register_page.dart';
import 'pages/admin_dashboard.dart';
import 'pages/student_dashboard.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Uni Resource Platform',
      theme: AppTheme.lightTheme,
      initialRoute: '/register',
      routes: {
        '/login': (context) => const LoginPage(),
        '/register': (context) => const RegisterPage(),
        '/admin-register': (context) => const RegisterPage(isAdmin: true),
        '/admin': (context) => const AdminDashboard(),
        '/student': (context) => const StudentDashboard(),
      },
    );
  }
}
