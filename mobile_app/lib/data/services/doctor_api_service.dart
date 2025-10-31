
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:mobile_app/data/models/doctor_models.dart';
import 'package:mobile_app/data/services/auth_service.dart';
import 'package:mobile_app/data/models/consultation_models.dart';

class DoctorApiService {
  final String _baseUrl = 'http://localhost:3001/api/medecin/me';

  Future<DoctorStats> getStats() async {
    final token = AuthService().token;
    final response = await http.get(
      Uri.parse('$_baseUrl/stats'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return DoctorStats.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load stats');
    }
  }

  Future<List<PatientSummary>> getPatients() async {
    final token = AuthService().token;
    final response = await http.get(
      Uri.parse('$_baseUrl/patients'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => PatientSummary.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load patients');
    }
  }

  Future<List<Appointment>> getUpcomingAppointments() async {
    final token = AuthService().token;
    final response = await http.get(
      Uri.parse('$_baseUrl/appointments/upcoming'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Appointment.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load appointments');
    }
  }

  Future<List<Consultation>> getMyConsultations() async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.get(
      Uri.parse('http://localhost:3001/api/medecin/me/consultations'), // Full path as it's not under _baseUrl
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Consultation.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load consultations');
    }
  }

  Future<List<Appointment>> getPendingAppointments() async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.get(
      Uri.parse('http://localhost:3001/api/medecin/me/appointments?status=PENDING'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Appointment.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load pending appointments');
    }
  }

  Future<void> acceptAppointment(int appointmentId) async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.post(
      Uri.parse('http://localhost:3001/api/doctors/$appointmentId/accept-appointment'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to accept appointment');
    }
  }

  Future<void> rejectAppointment(int appointmentId, String? rejectionReason) async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.post(
      Uri.parse('http://localhost:3001/api/doctors/$appointmentId/reject-appointment'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'rejectionReason': rejectionReason}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to reject appointment');
    }
  }
}
