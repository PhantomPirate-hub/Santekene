// 📱 EXEMPLE COMPLET FLUTTER - Consultation Vidéo
// Compatible avec le backend Santé Kènè

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';
import 'package:permission_handler/permission_handler.dart';

// =============================================
// CONFIGURATION
// =============================================

const String API_BASE_URL = 'http://localhost:3001/api';

// =============================================
// MODEL: Rendez-vous
// =============================================

class Appointment {
  final int id;
  final String type;
  final String? reason;
  final String? notes;
  final bool isVideo;
  final String? videoLink;
  final String? videoRoomId;
  final String status;
  final DateTime? date;
  final Patient patient;
  final Doctor doctor;

  Appointment({
    required this.id,
    required this.type,
    this.reason,
    this.notes,
    required this.isVideo,
    this.videoLink,
    this.videoRoomId,
    required this.status,
    this.date,
    required this.patient,
    required this.doctor,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'],
      type: json['type'],
      reason: json['reason'],
      notes: json['notes'],
      isVideo: json['isVideo'],
      videoLink: json['videoLink'],
      videoRoomId: json['videoRoomId'],
      status: json['status'],
      date: json['date'] != null ? DateTime.parse(json['date']) : null,
      patient: Patient.fromJson(json['patient']),
      doctor: Doctor.fromJson(json['doctor']),
    );
  }

  bool canJoinVideo() {
    if (!isVideo || videoLink == null || status != 'CONFIRMED') {
      return false;
    }
    
    if (date == null) return false;
    
    // Peut rejoindre 15 minutes avant l'heure prévue
    final now = DateTime.now();
    final canJoinFrom = date!.subtract(Duration(minutes: 15));
    final canJoinUntil = date!.add(Duration(hours: 2));
    
    return now.isAfter(canJoinFrom) && now.isBefore(canJoinUntil);
  }
}

class Patient {
  final int id;
  final String name;
  final String email;
  final String? phone;

  Patient({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      phone: json['phone'],
    );
  }
}

class Doctor {
  final int id;
  final String name;
  final String specialty;

  Doctor({
    required this.id,
    required this.name,
    required this.specialty,
  });

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['id'],
      name: json['name'],
      specialty: json['specialty'],
    );
  }
}

// =============================================
// SERVICE: API Rendez-vous
// =============================================

class AppointmentService {
  final String token;

  AppointmentService(this.token);

  // Récupérer les RDV du patient
  Future<List<Appointment>> getPatientAppointments() async {
    final response = await http.get(
      Uri.parse('$API_BASE_URL/patients/appointments'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body)['appointments'];
      return data.map((json) => Appointment.fromJson(json)).toList();
    } else {
      throw Exception('Erreur de chargement des rendez-vous');
    }
  }

  // Récupérer les RDV du médecin
  Future<List<Appointment>> getDoctorAppointments({String? status}) async {
    String url = '$API_BASE_URL/medecin/appointments';
    if (status != null) {
      url += '?status=$status';
    }

    final response = await http.get(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body)['appointments'];
      return data.map((json) => Appointment.fromJson(json)).toList();
    } else {
      throw Exception('Erreur de chargement des rendez-vous');
    }
  }

  // Générer/Récupérer le lien vidéo
  Future<String> getVideoLink(int appointmentId) async {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/medecin/appointments/$appointmentId/video/start'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['videoLink'];
    } else {
      throw Exception('Erreur lors de la génération du lien vidéo');
    }
  }
}

// =============================================
// SERVICE: Gestion Jitsi Meet
// =============================================

class VideoConsultationService {
  final JitsiMeet _jitsiMeet = JitsiMeet();

  // Demander les permissions
  Future<bool> requestPermissions() async {
    final cameraStatus = await Permission.camera.request();
    final micStatus = await Permission.microphone.request();

    return cameraStatus.isGranted && micStatus.isGranted;
  }

  // Rejoindre une consultation vidéo
  Future<void> joinVideoConsultation({
    required String roomId,
    required String displayName,
    String? email,
    bool isDoctor = false,
  }) async {
    // Vérifier les permissions
    final hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      throw Exception('Permissions caméra/microphone requises');
    }

    final options = JitsiMeetConferenceOptions(
      serverURL: "https://meet.jit.si",
      room: roomId,
      configOverrides: {
        "startWithAudioMuted": false,
        "startWithVideoMuted": false,
        "subject": "Consultation Santé Kènè",
        "hideConferenceSubject": false,
      },
      featureFlags: {
        "unsaferoomwarning.enabled": false,
        "resolution": FeatureFlagEnum.MD_RESOLUTION,
        "audio-only": false,
        "calendar-enabled": false,
        "call-integration.enabled": false,
        "chat.enabled": true,
        "filmstrip.enabled": true,
        "invite.enabled": false,
        "ios.recording.enabled": isDoctor, // Seul le médecin peut enregistrer
        "live-streaming.enabled": false,
        "meeting-name.enabled": true,
        "meeting-password.enabled": false,
        "pip.enabled": true,
        "raise-hand.enabled": true,
        "recording.enabled": isDoctor,
        "tile-view.enabled": true,
        "toolbox.alwaysVisible": false,
        "video-share.enabled": isDoctor, // Seul le médecin peut partager son écran
        "welcomepage.enabled": false,
      },
      userInfo: JitsiMeetUserInfo(
        displayName: displayName,
        email: email,
      ),
    );

    await _jitsiMeet.join(options);
  }

  // Écouter les événements
  void setupListeners({
    VoidCallback? onJoined,
    VoidCallback? onTerminated,
    Function(String)? onError,
  }) {
    _jitsiMeet.addListener(
      JitsiMeetingListener(
        onConferenceWillJoin: (message) {
          print("🔄 Connexion à la consultation en cours...");
        },
        onConferenceJoined: (message) {
          print("✅ Rejoint la consultation");
          onJoined?.call();
        },
        onConferenceTerminated: (message) {
          print("🛑 Consultation terminée");
          onTerminated?.call();
        },
        onError: (error) {
          print("❌ Erreur: $error");
          onError?.call(error.toString());
        },
      ),
    );
  }
}

// =============================================
// WIDGET: Carte de RDV
// =============================================

class AppointmentCard extends StatelessWidget {
  final Appointment appointment;
  final bool isDoctor;
  final VoidCallback onJoinVideo;

  const AppointmentCard({
    Key? key,
    required this.appointment,
    required this.isDoctor,
    required this.onJoinVideo,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // En-tête
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isDoctor ? appointment.patient.name : appointment.doctor.name,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (!isDoctor)
                        Text(
                          appointment.doctor.specialty,
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                    ],
                  ),
                ),
                _buildStatusBadge(),
              ],
            ),

            SizedBox(height: 12),

            // Infos
            _buildInfoRow(Icons.medical_services, appointment.type),
            if (appointment.date != null)
              _buildInfoRow(
                Icons.calendar_today,
                '${_formatDate(appointment.date!)} à ${_formatTime(appointment.date!)}',
              ),
            if (appointment.reason != null)
              _buildInfoRow(Icons.notes, appointment.reason!),
            if (appointment.isVideo)
              _buildInfoRow(
                Icons.video_call,
                'Consultation à distance',
                color: Colors.purple,
              ),

            // Bouton rejoindre (si applicable)
            if (appointment.canJoinVideo()) ...[
              SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onJoinVideo,
                  icon: Icon(Icons.video_call),
                  label: Text('Rejoindre la consultation'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purple,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ] else if (appointment.status == 'CONFIRMED' && appointment.isVideo) ...[
              SizedBox(height: 16),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.blue),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Le bouton sera actif 15 minutes avant le rendez-vous',
                        style: TextStyle(
                          color: Colors.blue[900],
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color color;
    String label;

    switch (appointment.status) {
      case 'PENDING':
        color = Colors.orange;
        label = 'En attente';
        break;
      case 'CONFIRMED':
        color = Colors.green;
        label = 'Confirmé';
        break;
      case 'REJECTED':
        color = Colors.red;
        label = 'Refusé';
        break;
      case 'CANCELLED':
        color = Colors.grey;
        label = 'Annulé';
        break;
      case 'COMPLETED':
        color = Colors.blue;
        label = 'Terminé';
        break;
      default:
        color = Colors.grey;
        label = appointment.status;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text, {Color? color}) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color ?? Colors.grey[600]),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: color ?? Colors.grey[800],
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatTime(DateTime date) {
    return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}

// =============================================
// ÉCRAN: Liste des RDV Patient
// =============================================

class PatientAppointmentsScreen extends StatefulWidget {
  final String token;

  const PatientAppointmentsScreen({Key? key, required this.token})
      : super(key: key);

  @override
  _PatientAppointmentsScreenState createState() =>
      _PatientAppointmentsScreenState();
}

class _PatientAppointmentsScreenState extends State<PatientAppointmentsScreen> {
  late AppointmentService _appointmentService;
  late VideoConsultationService _videoService;
  List<Appointment> _appointments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _appointmentService = AppointmentService(widget.token);
    _videoService = VideoConsultationService();
    _loadAppointments();
    _setupVideoListeners();
  }

  Future<void> _loadAppointments() async {
    try {
      final appointments = await _appointmentService.getPatientAppointments();
      setState(() {
        _appointments = appointments;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      _showError('Erreur de chargement: $e');
    }
  }

  void _setupVideoListeners() {
    _videoService.setupListeners(
      onJoined: () {
        print("✅ Consultation rejointe avec succès");
      },
      onTerminated: () {
        print("🛑 Consultation terminée");
        // Rafraîchir la liste
        _loadAppointments();
      },
      onError: (error) {
        _showError('Erreur vidéo: $error');
      },
    );
  }

  Future<void> _joinVideoConsultation(Appointment appointment) async {
    if (appointment.videoRoomId == null) {
      _showError('Room ID non disponible');
      return;
    }

    try {
      await _videoService.joinVideoConsultation(
        roomId: appointment.videoRoomId!,
        displayName: appointment.patient.name,
        email: appointment.patient.email,
        isDoctor: false,
      );
    } catch (e) {
      _showError('Erreur: $e');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Mes Rendez-vous'),
        backgroundColor: Colors.blue,
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator())
          : _appointments.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.calendar_today,
                          size: 64, color: Colors.grey[400]),
                      SizedBox(height: 16),
                      Text(
                        'Aucun rendez-vous',
                        style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadAppointments,
                  child: ListView.builder(
                    itemCount: _appointments.length,
                    itemBuilder: (context, index) {
                      final appointment = _appointments[index];
                      return AppointmentCard(
                        appointment: appointment,
                        isDoctor: false,
                        onJoinVideo: () => _joinVideoConsultation(appointment),
                      );
                    },
                  ),
                ),
    );
  }
}

// =============================================
// POINT D'ENTRÉE (Exemple)
// =============================================

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Santé Kènè',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: PatientAppointmentsScreen(
        token: 'YOUR_JWT_TOKEN_HERE', // À remplacer par le vrai token
      ),
    );
  }
}

