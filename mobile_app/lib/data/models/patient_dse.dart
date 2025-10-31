
class PatientDSE {
  final Map<String, dynamic> patient;
  final DSEStats stats;

  PatientDSE({required this.patient, required this.stats});

  factory PatientDSE.fromJson(Map<String, dynamic> json) {
    return PatientDSE(
      patient: json['patient'] as Map<String, dynamic>,
      stats: DSEStats.fromJson(json['stats'] as Map<String, dynamic>),
    );
  }
}

class DSEStats {
  final int totalConsultations;
  final int totalDocuments;
  final int totalAppointments;
  final int totalKenePoints;
  final int upcomingAppointments;

  DSEStats({
    required this.totalConsultations,
    required this.totalDocuments,
    required this.totalAppointments,
    required this.totalKenePoints,
    required this.upcomingAppointments,
  });

  factory DSEStats.fromJson(Map<String, dynamic> json) {
    return DSEStats(
      totalConsultations: json['totalConsultations'] as int,
      totalDocuments: json['totalDocuments'] as int,
      totalAppointments: json['totalAppointments'] as int,
      totalKenePoints: json['totalKenePoints'] as int,
      upcomingAppointments: json['upcomingAppointments'] as int,
    );
  }
}
