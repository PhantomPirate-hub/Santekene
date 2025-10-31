
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:mobile_app/data/models/ai_triage_result.dart';

class AiApiService {
  // NOTE: This URL points to the AI backend, not the main backend-api
  final String _baseUrl = 'http://localhost:8000/api/ai';

  Future<AITriageResult> getTriage(String symptoms) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/triage'),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {'symptoms': symptoms},
      );

      if (response.statusCode == 200) {
        // The response from python backend might be utf8 encoded
        final decodedBody = utf8.decode(response.bodyBytes);
        return AITriageResult.fromJson(jsonDecode(decodedBody));
      } else {
        // Log the error for debugging
        print('AI API Error: ${response.statusCode} ${response.body}');
        throw Exception('Failed to get AI triage analysis.');
      }
    } catch (e) {
      print('Error calling AI API: $e');
      throw Exception('Could not connect to AI service. $e');
    }
  }
}
