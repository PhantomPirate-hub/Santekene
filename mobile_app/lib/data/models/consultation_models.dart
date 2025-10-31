
class Consultation {
  final int id;
  final int patientId;
  final int doctorId;
  final String? diagnosis;
  final String? notes;
  final String? allergies;
  final DateTime date;
  final PatientInfo patient;
  final DoctorInfo doctor;
  final PrescriptionInfo? prescription;

  Consultation({
    required this.id,
    required this.patientId,
    required this.doctorId,
    this.diagnosis,
    this.notes,
    this.allergies,
    required this.date,
    required this.patient,
    required this.doctor,
    this.prescription,
  });

  factory Consultation.fromJson(Map<String, dynamic> json) {
    return Consultation(
      id: json['id'] as int,
      patientId: json['patientId'] as int,
      doctorId: json['doctorId'] as int,
      diagnosis: json['diagnosis'] as String?,
      notes: json['notes'] as String?,
      allergies: json['allergies'] as String?,
      date: DateTime.parse(json['date'] as String),
      patient: PatientInfo.fromJson(json['patient'] as Map<String, dynamic>),
      doctor: DoctorInfo.fromJson(json['doctor'] as Map<String, dynamic>),
      prescription: json['prescription'] != null
          ? PrescriptionInfo.fromJson(json['prescription'] as Map<String, dynamic>)
          : null,
    );
  }
}

class PatientInfo {
  final int id;
  final UserInfo user;

  PatientInfo({
    required this.id,
    required this.user,
  });

  factory PatientInfo.fromJson(Map<String, dynamic> json) {
    return PatientInfo(
      id: json['id'] as int,
      user: UserInfo.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class DoctorInfo {
  final int id;
  final UserInfo user;
  final String speciality;

  DoctorInfo({
    required this.id,
    required this.user,
    required this.speciality,
  });

  factory DoctorInfo.fromJson(Map<String, dynamic> json) {
    return DoctorInfo(
      id: json['id'] as int,
      user: UserInfo.fromJson(json['user'] as Map<String, dynamic>),
      speciality: json['speciality'] as String,
    );
  }
}

class UserInfo {
  final int id;
  final String name;
  final String email;

  UserInfo({
    required this.id,
    required this.name,
    required this.email,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
    );
  }
}

class PrescriptionInfo {
  final int id;
  final List<MedicationInfo> medications;

  PrescriptionInfo({
    required this.id,
    required this.medications,
  });

  factory PrescriptionInfo.fromJson(Map<String, dynamic> json) {
    return PrescriptionInfo(
      id: json['id'] as int,
      medications: (json['medications'] as List)
          .map((e) => MedicationInfo.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class MedicationInfo {
  final int id;
  final String name;
  final String dosage;
  final String duration;

  MedicationInfo({
    required this.id,
    required this.name,
    required this.dosage,
    required this.duration,
  });

  factory MedicationInfo.fromJson(Map<String, dynamic> json) {
    return MedicationInfo(
      id: json['id'] as int,
      name: json['name'] as String,
      dosage: json['dosage'] as String,
      duration: json['duration'] as String,
    );
  }
}
