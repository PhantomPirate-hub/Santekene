
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:mobile_app/data/models/patient_dse.dart';
import 'package:mobile_app/data/services/auth_service.dart';

class PatientApiService {
  final String _baseUrl = 'http://localhost:3001/api';

  Future<PatientDSE> getDseSummary() async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.get(
      Uri.parse('$_baseUrl/patients/me/dse'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return PatientDSE.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load DSE summary');
    }
  }
}
