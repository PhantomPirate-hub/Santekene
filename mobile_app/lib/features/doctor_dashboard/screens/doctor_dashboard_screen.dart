import 'package:flutter/material.dart';
import 'package:mobile_app/data/models/doctor_models.dart';
import 'package:mobile_app/data/services/auth_service.dart';
import 'package:mobile_app/data/services/doctor_api_service.dart';
import 'package:mobile_app/features/wallet/screens/wallet_screen.dart';
import 'package:mobile_app/features/community/screens/community_list_screen.dart';
import 'package:mobile_app/features/doctor_dashboard/screens/consultation_history_screen.dart';
import 'package:mobile_app/features/doctor_dashboard/screens/appointments_management_screen.dart';

class DoctorDashboardScreen extends StatefulWidget {
  const DoctorDashboardScreen({super.key});

  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> {
  late Future<Map<String, dynamic>> _dashboardDataFuture;
  final DoctorApiService _apiService = DoctorApiService();

  @override
  void initState() {
    super.initState();
    _dashboardDataFuture = _fetchDashboardData();
  }

  Future<Map<String, dynamic>> _fetchDashboardData() async {
    try {
      final results = await Future.wait([
        _apiService.getStats(),
        _apiService.getPatients(),
        _apiService.getUpcomingAppointments(),
      ]);
      return {
        'stats': results[0] as DoctorStats,
        'patients': results[1] as List<PatientSummary>,
        'appointments': results[2] as List<Appointment>,
      };
    } catch (e) {
      throw Exception('Failed to load dashboard data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService().user;
    final doctorName = user?['name'] ?? 'Doctor';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tableau de Bord Médecin'),
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _dashboardDataFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          if (!snapshot.hasData) {
            return const Center(child: Text('No data found.'));
          }

          final DoctorStats stats = snapshot.data!['stats'];
          final List<PatientSummary> patients = snapshot.data!['patients'];
          final List<Appointment> appointments = snapshot.data!['appointments'];

          return ListView(
            padding: const EdgeInsets.all(16.0),
            children: [
              Text(
                'Bienvenue Dr. $doctorName',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              _buildStatsGrid(stats),
              const SizedBox(height: 24),
              _buildShortcuts(), // Add shortcuts here
              const SizedBox(height: 24),
              _buildSectionTitle(context, 'Patients Récents'),
              _buildRecentPatientsList(patients),
              const SizedBox(height: 24),
              _buildSectionTitle(context, 'Rendez-vous à venir'),
              _buildUpcomingAppointmentsList(appointments),
            ],
          );
        },
      ),
    );
  }

  Widget _buildShortcuts() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Raccourcis',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          children: [
            _buildShortcutItem('Mes KènèPoints', Icons.currency_bitcoin, () {
              Navigator.of(context).push(MaterialPageRoute(builder: (context) => const WalletScreen()));
            }),
            _buildShortcutItem('Communauté', Icons.people, () {
              Navigator.of(context).push(MaterialPageRoute(builder: (context) => const CommunityListScreen()));
            }),
            _buildShortcutItem('Historique Consultations', Icons.history, () {
              Navigator.of(context).push(MaterialPageRoute(builder: (context) => const ConsultationHistoryScreen()));
            }),
            _buildShortcutItem('Gérer RDV', Icons.event_note, () {
              Navigator.of(context).push(MaterialPageRoute(builder: (context) => const AppointmentsManagementScreen()));
            }),
            // Add other doctor-specific shortcuts here later
          ],
        ),
      ],
    );
  }

  Widget _buildShortcutItem(String title, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(15),
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: Theme.of(context).primaryColor),
            const SizedBox(height: 12),
            Text(title, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid(DoctorStats stats) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      children: [
        _buildStatCard('Patients', stats.patientCount.toString(), Icons.people, Colors.blue),
        _buildStatCard('Consultations', stats.consultationCount.toString(), Icons.medical_services, Colors.green),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 30, color: color),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
            Text(title, style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
    );
  }

  Widget _buildRecentPatientsList(List<PatientSummary> patients) {
    if (patients.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20.0),
        child: Center(child: Text('Aucun patient récent.')),
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: patients.length,
      itemBuilder: (context, index) {
        final patient = patients[index];
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 8.0),
          child: ListTile(
            leading: CircleAvatar(
              child: Text(patient.user.name[0]),
            ),
            title: Text(patient.user.name, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(patient.user.email),
            onTap: () { /* TODO: Navigate to patient details */ },
          ),
        );
      },
    );
  }

  Widget _buildUpcomingAppointmentsList(List<Appointment> appointments) {
    if (appointments.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20.0),
        child: Center(child: Text('Aucun rendez-vous à venir.')),
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: appointments.length,
      itemBuilder: (context, index) {
        final appointment = appointments[index];
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 8.0),
          child: ListTile(
            leading: const Icon(Icons.calendar_today, color: Colors.teal),
            title: Text(appointment.patient.user.name, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('${appointment.date?.toLocal().toString().substring(0, 16)} - ${appointment.type}'),
            onTap: () { /* TODO: Navigate to appointment details */ },
          ),
        );
      },
    );
  }
}