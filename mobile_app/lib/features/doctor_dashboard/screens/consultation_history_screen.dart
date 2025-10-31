
import 'package:flutter/material.dart';
import 'package:mobile_app/data/models/consultation_models.dart';
import 'package:mobile_app/data/services/doctor_api_service.dart';
import 'package:intl/intl.dart';

class ConsultationHistoryScreen extends StatefulWidget {
  const ConsultationHistoryScreen({super.key});

  @override
  State<ConsultationHistoryScreen> createState() => _ConsultationHistoryScreenState();
}

class _ConsultationHistoryScreenState extends State<ConsultationHistoryScreen> {
  late Future<List<Consultation>> _consultationsFuture;
  final DoctorApiService _apiService = DoctorApiService();

  @override
  void initState() {
    super.initState();
    _consultationsFuture = _apiService.getMyConsultations();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Historique des Consultations'),
      ),
      body: FutureBuilder<List<Consultation>>(
        future: _consultationsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('Aucune consultation trouvée.'));
          }

          final consultations = snapshot.data!;

          return ListView.builder(
            padding: const EdgeInsets.all(16.0),
            itemCount: consultations.length,
            itemBuilder: (context, index) {
              final consultation = consultations[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 16.0),
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Consultation avec Dr. ${consultation.doctor.user.name}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Date: ${DateFormat('dd MMM yyyy HH:mm').format(consultation.date)}',
                        style: const TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      if (consultation.diagnosis != null)
                        Text('Diagnostic: ${consultation.diagnosis}'),
                      if (consultation.notes != null)
                        Text('Notes: ${consultation.notes}'),
                      if (consultation.allergies != null)
                        Text('Allergies: ${consultation.allergies}'),
                      if (consultation.prescription != null)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 8),
                            const Text('Prescription:', style: TextStyle(fontWeight: FontWeight.bold)),
                            ...consultation.prescription!.medications.map((med) => Text('- ${med.name} (${med.dosage})')),
                          ],
                        ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
