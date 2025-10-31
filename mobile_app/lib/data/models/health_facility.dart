
class HealthFacility {
  final int id;
  final String name;
  final String address;
  final String city;
  final String country;
  final double? latitude;
  final double? longitude;
  final String? phone;
  final String? email;
  final String? website;
  final double? distance;

  HealthFacility({
    required this.id,
    required this.name,
    required this.address,
    required this.city,
    required this.country,
    this.latitude,
    this.longitude,
    this.phone,
    this.email,
    this.website,
    this.distance,
  });

  factory HealthFacility.fromJson(Map<String, dynamic> json) {
    return HealthFacility(
      id: json['id'] as int,
      name: json['name'] as String,
      address: json['address'] as String,
      city: json['city'] as String,
      country: json['country'] as String,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      website: json['website'] as String?,
      distance: (json['distance'] as num?)?.toDouble(),
    );
  }
}
