
import 'package:flutter/material.dart';
import 'package:mobile_app/data/models/ai_triage_result.dart';
import 'package:mobile_app/data/services/ai_api_service.dart';

class AiClinicScreen extends StatefulWidget {
  const AiClinicScreen({super.key});

  @override
  State<AiClinicScreen> createState() => _AiClinicScreenState();
}

class _AiClinicScreenState extends State<AiClinicScreen> {
  final _symptomsController = TextEditingController();
  final AiApiService _apiService = AiApiService();

  bool _isLoading = false;
  AITriageResult? _result;
  String? _errorMessage;

  Future<void> _getAnalysis() async {
    if (_symptomsController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter your symptoms.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _result = null;
    });

    try {
      final result = await _apiService.getTriage(_symptomsController.text);
      setState(() {
        _result = result;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('IA Clinique'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          _buildInputCard(),
          const SizedBox(height: 24),
          if (_isLoading)
            const Center(child: CircularProgressIndicator()),
          if (_errorMessage != null)
            _buildErrorWidget(),
          if (_result != null)
            _buildResultWidget(),
        ],
      ),
    );
  }

  Widget _buildInputCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Décrivez vos symptômes',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _symptomsController,
              maxLines: 5,
              decoration: const InputDecoration(
                hintText: 'Ex: J\'ai de la fièvre, des maux de tête et une toux sèche depuis hier...', // Corrected escaping for apostrophe
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _getAnalysis,
              icon: const Icon(Icons.auto_awesome),
              label: const Text('Lancer l\'analyse IA'), // Corrected escaping for apostrophe
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Text(
          'Erreur: $_errorMessage',
          style: TextStyle(color: Colors.red.shade900, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildResultWidget() {
    // A more sophisticated result widget can be built in features/ai_clinic/widgets/
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Résultats de l\'analyse', // Corrected escaping for apostrophe
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const Divider(height: 24),
            _buildResultRow('Diagnostic probable:', _result!.diagnosis),
            const SizedBox(height: 12),
            _buildResultRow('Niveau d\'urgence:', _result!.urgencyLabel), // Corrected escaping for apostrophe
            const SizedBox(height: 12),
            _buildResultRow('Spécialités suggérées:', _result!.specialties.join(', ')),
            const SizedBox(height: 24),
            const Text(
              'Recommandations:',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            for (var item in _result!.recommendations)
              ListTile(
                leading: const Icon(Icons.check_circle_outline, color: Colors.green),
                title: Text(item),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultRow(String title, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$title ', style: const TextStyle(fontWeight: FontWeight.bold)),
        Expanded(child: Text(value)),
      ],
    );
  }
}
