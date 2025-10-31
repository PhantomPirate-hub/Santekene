
class AITriageResult {
  final String severity;
  final String diagnosis;
  final List<String> recommendations;
  final List<String> specialties;
  final int urgencyLevel;
  final String urgencyLabel;
  final String urgencyColor;
  final String summary;

  AITriageResult({
    required this.severity,
    required this.diagnosis,
    required this.recommendations,
    required this.specialties,
    required this.urgencyLevel,
    required this.urgencyLabel,
    required this.urgencyColor,
    required this.summary,
  });

  factory AITriageResult.fromJson(Map<String, dynamic> json) {
    return AITriageResult(
      severity: json['severity'] ?? 'moderate',
      diagnosis: json['diagnosis'] ?? 'Evaluation needed',
      recommendations: List<String>.from(json['recommendations'] ?? []),
      specialties: List<String>.from(json['specialties'] ?? []),
      urgencyLevel: json['urgency_level'] ?? 2,
      urgencyLabel: json['urgency_label'] ?? '🟡 Modéré',
      urgencyColor: json['urgency_color'] ?? 'yellow',
      summary: json['summary'] ?? 'Evaluation needed',
    );
  }
}
