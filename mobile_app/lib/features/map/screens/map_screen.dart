
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:mobile_app/data/models/health_facility.dart';
import 'package:mobile_app/data/services/health_facility_api_service.dart';
import 'package:mobile_app/data/services/geolocation_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  final GeolocationService _geolocationService = GeolocationService();
  final HealthFacilityApiService _apiService = HealthFacilityApiService();

  Position? _currentPosition;
  List<HealthFacility> _healthFacilities = [];
  bool _isLoading = true;
  String? _errorMessage;
  int _searchRadius = 100; // Default radius in km
  TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  Future<void> _initializeMap() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final position = await _geolocationService.getCurrentLocation();
      setState(() {
        _currentPosition = position;
      });
      await _fetchHealthFacilities(position.latitude, position.longitude, _searchRadius);
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchHealthFacilities(double lat, double lon, int radius, {String? search}) async {
    setState(() {
      _isLoading = true;
    });
    try {
      final facilities = await _apiService.getHealthFacilities(lat, lon, radius, search: search);
      setState(() {
        _healthFacilities = facilities;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _onSearch() {
    if (_currentPosition != null) {
      _fetchHealthFacilities(_currentPosition!.latitude, _currentPosition!.longitude, _searchRadius, search: _searchController.text);
    } else {
      setState(() {
        _errorMessage = 'Please enable location services to search.';
      });
    }
  }

  void _openDirections(double lat, double lon) async {
    final url = 'https://www.google.com/maps/dir/?api=1&destination=$lat,$lon&travelmode=driving';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open Google Maps.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Centres de Santé'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(child: Text('Error: $_errorMessage'))
              : Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _searchController,
                              decoration: const InputDecoration(
                                hintText: 'Rechercher un centre...',
                                border: OutlineInputBorder(),
                                contentPadding: EdgeInsets.symmetric(horizontal: 10),
                              ),
                              onSubmitted: (_) => _onSearch(),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.search),
                            onPressed: _onSearch,
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: ['25', '50', '100', '200'].map((radius) {
                          return ChoiceChip(
                            label: Text('$radius km'),
                            selected: _searchRadius == int.parse(radius),
                            onSelected: (selected) {
                              if (selected) {
                                setState(() {
                                  _searchRadius = int.parse(radius);
                                  _onSearch(); // Re-fetch with new radius
                                });
                              }
                            },
                          );
                        }).toList(),
                      ),
                    ),
                    Expanded(
                      child: FlutterMap(
                        mapController: _mapController,
                        options: MapOptions(
                          initialCenter: _currentPosition != null
                              ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
                              : LatLng(12.6392, -8.0029), // Default to Bamako
                          initialZoom: 13.0,
                        ),
                        children: [
                          TileLayer(urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
                          if (_currentPosition != null)
                            MarkerLayer(
                              markers: [
                                Marker(
                                  width: 80.0,
                                  height: 80.0,
                                  point: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
                                  child: const Icon(Icons.my_location, color: Colors.blueAccent, size: 30.0),
                                ),
                              ],
                            ),
                          CircleLayer(
                            circles: [
                              if (_currentPosition != null)
                                CircleMarker(
                                  point: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
                                  radius: _searchRadius * 1000, // Convert km to meters
                                  color: Colors.blue.withOpacity(0.1),
                                  borderColor: Colors.blue,
                                  borderStrokeWidth: 2,
                                ),
                            ],
                          ),
                          MarkerLayer(
                            markers: _healthFacilities.map((facility) {
                              if (facility.latitude != null && facility.longitude != null) {
                                return Marker(
                                  width: 80.0,
                                  height: 80.0,
                                  point: LatLng(facility.latitude!, facility.longitude!),
                                  child: GestureDetector(
                                    onTap: () {
                                      showDialog(
                                        context: context,
                                        builder: (BuildContext context) {
                                          return AlertDialog(
                                            title: Text(facility.name),
                                            content: Column(
                                              mainAxisSize: MainAxisSize.min,
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(facility.address),
                                                if (facility.phone != null) Text('Tel: ${facility.phone}'),
                                                if (facility.distance != null) Text('${facility.distance!.toStringAsFixed(1)} km'),
                                              ],
                                            ),
                                            actions: [
                                              TextButton(
                                                onPressed: () => _openDirections(facility.latitude!, facility.longitude!),
                                                child: const Text('Itinéraire'),
                                              ),
                                              TextButton(
                                                onPressed: () => Navigator.of(context).pop(),
                                                child: const Text('Fermer'),
                                              ),
                                            ],
                                          );
                                        },
                                      );
                                    },
                                    child: const Icon(Icons.local_hospital, color: Colors.red, size: 30.0),
                                  ),
                                );
                              }
                              return Marker(
                                point: LatLng(0,0),
                                child: Container(),
                              ); // Fallback for facilities without coords
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}
