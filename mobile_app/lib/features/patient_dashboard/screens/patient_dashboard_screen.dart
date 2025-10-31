import 'package:flutter/material.dart';
import 'package:mobile_app/data/models/patient_dse.dart';
import 'package:mobile_app/data/services/auth_service.dart';
import 'package:mobile_app/data/services/patient_api_service.dart';
import 'package:mobile_app/features/ai_clinic/screens/ai_clinic_screen.dart';
import 'package:mobile_app/features/map/screens/map_screen.dart';
import 'package:mobile_app/features/wallet/screens/wallet_screen.dart';
import 'package:mobile_app/features/community/screens/community_list_screen.dart';

class PatientDashboardScreen extends StatefulWidget {
  const PatientDashboardScreen({super.key});

  @override
  State<PatientDashboardScreen> createState() => _PatientDashboardScreenState();
}

class _PatientDashboardScreenState extends State<PatientDashboardScreen> {
  late Future<PatientDSE> _dseFuture;
  final PatientApiService _apiService = PatientApiService();

  @override
  void initState() {
    super.initState();
    _dseFuture = _apiService.getDseSummary();
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService().user;
    final patientName = user?['name'] ?? 'Patient';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon Tableau de Bord'),
      ),
      body: FutureBuilder<PatientDSE>(
        future: _dseFuture,
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

          final dseData = snapshot.data!;

          return ListView(
            padding: const EdgeInsets.all(16.0),
            children: [
              Text(
                'Bonjour $patientName, prenez soin de votre santé avec Santé Kènè 🌿',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              _buildHealthProfileCard(dseData),
              const SizedBox(height: 24),
              _buildShortcuts(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildHealthProfileCard(PatientDSE dseData) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Résumé de votre Dossier Santé',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('Consultations', dseData.stats.totalConsultations.toString(), Icons.medical_services),
                _buildStatItem('Documents', dseData.stats.totalDocuments.toString(), Icons.file_copy),
              ],
            ),
            const SizedBox(height: 16),
            _buildKenePointsCard(dseData.stats.totalKenePoints),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Theme.of(context).primaryColor, size: 30),
        const SizedBox(height: 8),
        Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }

  Widget _buildKenePointsCard(int points) {
    return Card(
      color: Colors.teal.shade50,
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            const Icon(Icons.star, color: Colors.amber, size: 40),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Vos KènèPoints', style: Theme.of(context).textTheme.titleMedium),
                Text(points.toString(), style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Colors.teal, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
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
            _buildShortcutItem('Prendre RDV', Icons.calendar_today, () {}),
            _buildShortcutItem('Mes Symptômes', Icons.mic, () {
              Navigator.of(context).push(MaterialPageRoute(builder: (context) => const AiClinicScreen()));
            }),
            _buildShortcutItem('Ordonnances', Icons.description, () {}),
            _buildShortcutItem('Mes KènèPoints', Icons.currency_bitcoin, () {
              Navigator.of(context).push(MaterialPageRoute(builder: (context) => const WalletScreen()));
            }),
            _buildShortcutItem('Trouver un centre de santé', Icons.map, () {
              Navigator.of(context).push(MaterialPageRoute(builder: (context) => const MapScreen()));
            }),
            _buildShortcutItem('Communauté', Icons.people, () {
              Navigator.of(context).push(MaterialPageRoute(builder: (context) => const CommunityListScreen()));
            }),
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
}