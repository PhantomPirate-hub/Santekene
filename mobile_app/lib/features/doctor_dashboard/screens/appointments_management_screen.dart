
import 'package:flutter/material.dart';
import 'package:mobile_app/data/models/doctor_models.dart';
import 'package:mobile_app/data/services/doctor_api_service.dart';
import 'package:intl/intl.dart';

class AppointmentsManagementScreen extends StatefulWidget {
  const AppointmentsManagementScreen({super.key});

  @override
  State<AppointmentsManagementScreen> createState() => _AppointmentsManagementScreenState();
}

class _AppointmentsManagementScreenState extends State<AppointmentsManagementScreen> {
  late Future<List<Appointment>> _pendingAppointmentsFuture;
  final DoctorApiService _apiService = DoctorApiService();

  @override
  void initState() {
    super.initState();
    _pendingAppointmentsFuture = _apiService.getPendingAppointments();
  }

  Future<void> _refreshAppointments() async {
    setState(() {
      _pendingAppointmentsFuture = _apiService.getPendingAppointments();
    });
  }

  Future<void> _acceptAppointment(int appointmentId) async {
    try {
      await _apiService.acceptAppointment(appointmentId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Rendez-vous accepté avec succès')),
      );
      _refreshAppointments();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Échec de l\'acceptation du rendez-vous: $e')),
      );
    }
  }

  Future<void> _rejectAppointment(int appointmentId) async {
    String? rejectionReason;
    await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Motif de refus'),
        content: TextField(
          onChanged: (value) {
            rejectionReason = value;
          },
          decoration: const InputDecoration(hintText: 'Ex: Indisponible à cette date'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, rejectionReason),
            child: const Text('Refuser', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    ).then((value) => rejectionReason = value);

    try {
      await _apiService.rejectAppointment(appointmentId, rejectionReason);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Rendez-vous refusé avec succès')),
      );
      _refreshAppointments();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Échec du refus du rendez-vous: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestion des Rendez-vous'),
      ),
      body: FutureBuilder<List<Appointment>>(
        future: _pendingAppointmentsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('Aucun rendez-vous en attente.'));
          }

          final appointments = snapshot.data!;

          return ListView.builder(
            padding: const EdgeInsets.all(16.0),
            itemCount: appointments.length,
            itemBuilder: (context, index) {
              final appointment = appointments[index];
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
                        'Rendez-vous avec ${appointment.patient.user.name}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Type: ${appointment.type}',
                        style: const TextStyle(color: Colors.grey),
                      ),
                      if (appointment.reason != null)
                        Text('Raison: ${appointment.reason!}'),
                      if (appointment.notes != null)
                        Text('Notes: ${appointment.notes!}'),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          ElevatedButton(
                            onPressed: () => _acceptAppointment(appointment.id),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                            child: const Text('Accepter', style: TextStyle(color: Colors.white)),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () => _rejectAppointment(appointment.id),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                            child: const Text('Refuser', style: TextStyle(color: Colors.white)),
                          ),
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
