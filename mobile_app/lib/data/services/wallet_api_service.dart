
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:mobile_app/data/models/wallet_models.dart';
import 'package:mobile_app/data/services/auth_service.dart';

class WalletApiService {
  final String _baseUrl = 'http://localhost:3001/api/wallet';

  Future<WalletData> getWalletInfo() async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.get(
      Uri.parse('$_baseUrl/info'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return WalletData.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load wallet info');
    }
  }

  Future<List<BadgeInfo>> getBadgeLevels() async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.get(
      Uri.parse('$_baseUrl/badge-levels'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body)['levels'];
      return data.map((json) => BadgeInfo.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load badge levels');
    }
  }
}
