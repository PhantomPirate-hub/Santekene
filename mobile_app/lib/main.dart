import 'package:flutter/material.dart';
import 'package:mobile_app/features/splash/splash_screen.dart';
import 'package:firebase_core/firebase_core.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Santé Kènè',
      theme: ThemeData(
        primarySwatch: Colors.teal,
        scaffoldBackgroundColor: const Color(0xFFF5F5F5),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF00838F),
          foregroundColor: Colors.white,
        ),
        fontFamily: 'Inter', // Assuming a modern font choice
      ),
      debugShowCheckedModeBanner: false,
      home: const SplashScreen(),
    );
  }
}