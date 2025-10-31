
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:mobile_app/data/services/auth_service.dart';

class NotificationService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  Future<void> initializeNotifications() async {
    // Request permission for notifications
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');

      // Get the FCM token
      String? token = await _firebaseMessaging.getToken();
      print('FCM Token: $token');

      // Send token to backend
      if (token != null && AuthService().isAuthenticated) {
        await _sendTokenToBackend(token);
      }

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('Got a message whilst in the foreground!');
        print('Message data: ${message.data}');

        if (message.notification != null) {
          print('Message also contained a notification: ${message.notification}');
          // Display local notification (you'd use a package like flutter_local_notifications here)
          _showLocalNotification(message.notification!.title, message.notification!.body);
        }
      });

      // Handle background messages
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Handle interaction when app is terminated or in background
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        print('A new onMessageOpenedApp event was published!');
        // TODO: Navigate to specific screen based on message data
      });

    } else {
      print('User declined or has not accepted permission');
    }
  }

  Future<void> _sendTokenToBackend(String token) async {
    final authToken = AuthService().token;
    if (authToken == null) return;

    try {
      final response = await http.post(
        Uri.parse('http://localhost:3001/api/users/me/device-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({'deviceToken': token}),
      );

      if (response.statusCode == 200) {
        print('Device token sent to backend successfully');
      } else {
        print('Failed to send device token to backend: ${response.body}');
      }
    } catch (e) {
      print('Error sending device token to backend: $e');
    }
  }

  void _showLocalNotification(String? title, String? body) {
    // This is a placeholder. In a real app, you'd use flutter_local_notifications
    // to display a notification when the app is in the foreground.
    print('Local Notification: $title - $body');
    // Example: show a SnackBar
    // ScaffoldMessenger.of(navigatorKey.currentContext!).showSnackBar(
    //   SnackBar(content: Text('$title: $body')),
    // );
  }
}

// This must be a top-level function
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // If you're going to use other Firebase services in the background, such as Firestore,
  // you'll need to call `initializeApp` before using any other Firebase services.
  // await Firebase.initializeApp();
  print("Handling a background message: ${message.messageId}");
  if (message.notification != null) {
    print('Message also contained a notification: ${message.notification}');
  }
}
