class DoctorStats {
  final int patientCount;
  final int consultationCount;

  DoctorStats({required this.patientCount, required this.consultationCount});

  factory DoctorStats.fromJson(Map<String, dynamic> json) {
    return DoctorStats(
      patientCount: json['patientCount'] as int,
      consultationCount: json['consultationCount'] as int,
    );
  }
}

class PatientSummary {
  final int id;
  final UserInfo user;
  final String? avatar;

  PatientSummary({required this.id, required this.user, this.avatar});

  factory PatientSummary.fromJson(Map<String, dynamic> json) {
    return PatientSummary(
      id: json['id'] as int,
      user: UserInfo.fromJson(json['user'] as Map<String, dynamic>),
      avatar: json['user']['avatar'] as String?,
    );
  }
}

class Appointment {
  final int id;
  final DateTime? date;
  final String type;
  final String? reason;
  final String? notes;
  final bool isVideo;
  final PatientSummary patient;

  Appointment({
    required this.id,
    this.date,
    required this.type,
    this.reason,
    this.notes,
    required this.isVideo,
    required this.patient,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as int,
      date: json['date'] != null ? DateTime.parse(json['date'] as String) : null,
      type: json['type'] as String,
      reason: json['reason'] as String?,
      notes: json['notes'] as String?,
      isVideo: json['isVideo'] as bool,
      patient: PatientSummary.fromJson(json['patient'] as Map<String, dynamic>),
    );
  }
}

class UserInfo {
  final int id;
  final String name;
  final String email;
  final String? phone;

  UserInfo({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
    );
  }
}