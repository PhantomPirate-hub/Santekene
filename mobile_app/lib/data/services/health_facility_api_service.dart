
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:mobile_app/data/models/health_facility.dart';

class HealthFacilityApiService {
  final String _baseUrl = 'http://localhost:3001/api';

  Future<List<HealthFacility>> getHealthFacilities(double lat, double lon, int radius, {String? search}) async {
    final Map<String, String> queryParams = {
      'lat': lat.toString(),
      'lon': lon.toString(),
      'radius': radius.toString(),
      'limit': '50', // Same limit as web version
    };

    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }

    final uri = Uri.parse('$_baseUrl/healthcenters').replace(queryParameters: queryParams);

    try {
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => HealthFacility.fromJson(json)).toList();
      } else {
        print('API Error: ${response.statusCode} ${response.body}');
        throw Exception('Failed to load health facilities.');
      }
    } catch (e) {
      print('Network Error: $e');
      throw Exception('Could not connect to health facilities service.');
    }
  }
}
