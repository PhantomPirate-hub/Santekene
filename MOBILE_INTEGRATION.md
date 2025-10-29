# 📱 Intégration Mobile - Guide Complet

Ce guide vous explique comment intégrer Santekene dans une application mobile (Flutter, React Native, etc.) en utilisant l'API REST et les URLs de visioconférence.

---

## 📋 Table des Matières

- [Vue d'Ensemble](#-vue-densemble)
- [URLs de l'API](#-urls-de-lapi)
- [Authentification](#-authentification)
- [Endpoints Principaux](#-endpoints-principaux)
- [Visioconférence (Jitsi Meet)](#-visioconférence-jitsi-meet)
- [Intégration Flutter](#-intégration-flutter)
- [Intégration React Native](#-intégration-react-native)
- [Gestion des Erreurs](#-gestion-des-erreurs)
- [Exemples de Code](#-exemples-de-code)

---

## 🎯 Vue d'Ensemble

Santekene propose une API REST complète pour l'intégration mobile :

- **Authentification JWT** pour la sécurité
- **Endpoints RESTful** pour toutes les fonctionnalités
- **Visioconférence** via Jitsi Meet
- **Upload de fichiers** (documents médicaux)
- **Notifications** en temps réel (optionnel avec WebSocket)

### Architecture Mobile

```
Application Mobile (Flutter/React Native)
         │
         │ HTTP/HTTPS
         ▼
Backend API REST (Port 3001)
         │
         ├──► MySQL (Données)
         ├──► Redis (Cache)
         ├──► Hedera (Blockchain)
         └──► Jitsi Meet (Visio)
```

---

## 🔗 URLs de l'API

### URL de Base

**Développement** : `http://localhost:3001`  
**Production** : `https://api.santekene.com` (à configurer)

### URLs Complètes

| Service | URL Développement | URL Production |
|---------|-------------------|----------------|
| **API REST** | http://localhost:3001 | https://api.santekene.com |
| **Backend AI** | http://localhost:8000 | https://ai.santekene.com |
| **Frontend Web** | http://localhost:3000 | https://santekene.com |

---

## 🔐 Authentification

### Inscription

**Endpoint** : `POST /api/auth/register`

**Body** :
```json
{
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "password": "MotDePasse123!",
  "role": "PATIENT",
  "contact": "+223 70 00 00 00"
}
```

**Réponse** :
```json
{
  "message": "Inscription réussie",
  "user": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "PATIENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Connexion

**Endpoint** : `POST /api/auth/login`

**Body** :
```json
{
  "email": "jean.dupont@example.com",
  "password": "MotDePasse123!"
}
```

**Réponse** :
```json
{
  "message": "Connexion réussie",
  "user": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "PATIENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Utilisation du Token

Ajoutez le token JWT dans le header de toutes les requêtes authentifiées :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📡 Endpoints Principaux

### Patient

#### Récupérer le DSE
```http
GET /api/patients/dse
Authorization: Bearer {token}
```

**Réponse** :
```json
{
  "id": 1,
  "name": "Jean Dupont",
  "bloodGroup": "A+",
  "height": 175,
  "weight": 70,
  "consultations": [...],
  "prescriptions": [...],
  "documents": [...]
}
```

#### Créer un Rendez-vous
```http
POST /api/patients/appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "doctorId": 5,
  "type": "CONSULTATION",
  "reason": "Douleurs abdominales",
  "isVideo": true,
  "preferredDate": "2025-11-15T14:00:00Z"
}
```

#### Récupérer le Portefeuille KenePoints
```http
GET /api/wallet/balance
Authorization: Bearer {token}
```

**Réponse** :
```json
{
  "balance": 250.00,
  "totalEarned": 500.00,
  "totalSpent": 250.00,
  "lastUpdate": "2025-10-28T10:30:00Z"
}
```

#### Upload Document
```http
POST /api/documents/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

patientId: 1
type: ORDONNANCE
file: [binary data]
description: "Ordonnance Dr. Martin"
```

### Médecin

#### Liste des Rendez-vous
```http
GET /api/medecin/appointments
Authorization: Bearer {token}
```

#### Accepter un Rendez-vous
```http
PUT /api/medecin/appointments/{id}/accept
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2025-11-15T14:00:00Z",
  "notes": "RDV confirmé"
}
```

#### Démarrer une Visioconférence
```http
POST /api/medecin/appointments/{id}/video/start
Authorization: Bearer {token}
```

**Réponse** :
```json
{
  "videoRoomId": "sk-5-1-1698765432",
  "videoLink": "https://meet.jit.si/sk-5-1-1698765432",
  "expiresAt": "2025-11-15T15:00:00Z"
}
```

#### Créer une Consultation
```http
POST /api/consultations
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": 1,
  "diagnosis": "Gastrite aiguë",
  "treatment": "Oméprazole 20mg, 2x/jour",
  "allergies": "Aucune",
  "notes": "Contrôle dans 2 semaines"
}
```

### Général

#### Liste des Médecins
```http
GET /api/doctors?speciality=Cardiologie&location=Bamako
```

#### Carte des Centres de Santé
```http
GET /api/healthcenters/nearby?lat=12.6392&lon=-8.0029&radius=25
```

---

## 📹 Visioconférence (Jitsi Meet)

### Architecture Visio

```
1. Médecin accepte RDV vidéo
         │
         ▼
2. Backend génère Room ID unique
   Format: sk-{doctorId}-{patientId}-{timestamp}
         │
         ▼
3. URL Jitsi créée
   https://meet.jit.si/{roomId}
         │
         ├──► Médecin reçoit le lien
         └──► Patient reçoit le lien
```

### Format du Room ID

```
sk-5-1-1698765432
│  │ │ └────────── Timestamp Unix
│  │ └──────────── Patient ID
│  └────────────── Doctor ID
└───────────────── Préfixe "sk" (Santekene Kènè)
```

### Propriétés de Sécurité

- **Room ID unique** : Impossible de deviner
- **Usage unique** : Pas de réutilisation
- **Expiration** : Lien expire après la consultation
- **Pas de stockage** : Pas d'enregistrement automatique

---

## 🐦 Intégration Flutter

### Installation

```yaml
# pubspec.yaml
dependencies:
  http: ^1.1.0
  jitsi_meet_flutter_sdk: ^9.0.0
  shared_preferences: ^2.2.0  # Pour le token
```

### Configuration Android

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
  
  <application android:usesCleartextTraffic="true">
    <!-- ... -->
  </application>
</manifest>
```

### Configuration iOS

```xml
<!-- ios/Runner/Info.plist -->
<dict>
  <key>NSCameraUsageDescription</key>
  <string>Caméra nécessaire pour la visioconférence</string>
  <key>NSMicrophoneUsageDescription</key>
  <string>Microphone nécessaire pour la visioconférence</string>
</dict>
```

### Code Flutter - Service API

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class SantekeneApiService {
  static const String baseUrl = 'http://10.0.2.2:3001'; // Android emulator
  // Pour device réel: 'http://192.168.x.x:3001'
  
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }
  
  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }
  
  // Connexion
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _saveToken(data['token']);
      return data;
    } else {
      throw Exception('Échec de connexion');
    }
  }
  
  // Récupérer le DSE
  Future<Map<String, dynamic>> getDse() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/api/patients/dse'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Échec de récupération du DSE');
    }
  }
  
  // Créer un rendez-vous
  Future<Map<String, dynamic>> createAppointment({
    required int doctorId,
    required String type,
    required String reason,
    required bool isVideo,
    String? preferredDate,
  }) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$baseUrl/api/patients/appointments'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'doctorId': doctorId,
        'type': type,
        'reason': reason,
        'isVideo': isVideo,
        'preferredDate': preferredDate,
      }),
    );
    
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Échec de création du rendez-vous');
    }
  }
  
  // Récupérer le portefeuille KenePoints
  Future<Map<String, dynamic>> getWallet() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/api/wallet/balance'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Échec de récupération du portefeuille');
    }
  }
}
```

### Code Flutter - Visioconférence

```dart
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';

class VideoConsultationService {
  final _jitsiMeetPlugin = JitsiMeet();
  
  Future<void> joinVideoConsultation({
    required String roomId,
    required String displayName,
    required String email,
    bool isAudioMuted = false,
    bool isVideoMuted = false,
  }) async {
    var options = JitsiMeetConferenceOptions(
      room: roomId,
      serverURL: 'https://meet.jit.si',
      userInfo: JitsiMeetUserInfo(
        displayName: displayName,
        email: email,
      ),
      configOverrides: {
        "startWithAudioMuted": isAudioMuted,
        "startWithVideoMuted": isVideoMuted,
        "subject": "Consultation Santekene",
      },
      featureFlags: {
        "unsaferoomwarning.enabled": false,
        "prejoinpage.enabled": false,
      },
    );
    
    await _jitsiMeetPlugin.join(options);
  }
  
  void dispose() {
    _jitsiMeetPlugin.hangUp();
  }
}
```

### Code Flutter - Widget Complet

```dart
import 'package:flutter/material.dart';

class VideoConsultationScreen extends StatefulWidget {
  final String videoRoomId;
  final String videoLink;
  final String patientName;
  
  const VideoConsultationScreen({
    Key? key,
    required this.videoRoomId,
    required this.videoLink,
    required this.patientName,
  }) : super(key: key);
  
  @override
  State<VideoConsultationScreen> createState() => _VideoConsultationScreenState();
}

class _VideoConsultationScreenState extends State<VideoConsultationScreen> {
  final VideoConsultationService _videoService = VideoConsultationService();
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Consultation Vidéo'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.video_call, size: 100, color: Colors.blue),
            SizedBox(height: 20),
            Text(
              'Consultation avec ${widget.patientName}',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text('Room ID: ${widget.videoRoomId}'),
            SizedBox(height: 40),
            ElevatedButton.icon(
              onPressed: _joinCall,
              icon: Icon(Icons.videocam),
              label: Text('Rejoindre la Consultation'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(horizontal: 30, vertical: 15),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Future<void> _joinCall() async {
    try {
      await _videoService.joinVideoConsultation(
        roomId: widget.videoRoomId,
        displayName: 'Dr. Martin',  // Récupérer du profil
        email: 'dr.martin@santekene.com',  // Récupérer du profil
        isAudioMuted: false,
        isVideoMuted: false,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }
  
  @override
  void dispose() {
    _videoService.dispose();
    super.dispose();
  }
}
```

---

## ⚛️ Intégration React Native

### Installation

```bash
npm install axios @react-native-async-storage/async-storage
npm install react-native-jitsi-meet
```

### Configuration iOS

```bash
cd ios
pod install
cd ..
```

### Code React Native - Service API

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3001';

class SantekeneApiService {
  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  }
  
  private async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem('auth_token', token);
  }
  
  async login(email: string, password: string) {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password,
    });
    
    await this.saveToken(response.data.token);
    return response.data;
  }
  
  async getDse() {
    const token = await this.getToken();
    const response = await axios.get(`${API_BASE_URL}/api/patients/dse`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.data;
  }
  
  async createAppointment(data: {
    doctorId: number;
    type: string;
    reason: string;
    isVideo: boolean;
    preferredDate?: string;
  }) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_BASE_URL}/api/patients/appointments`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  }
}

export default new SantekeneApiService();
```

### Code React Native - Visioconférence

```typescript
import JitsiMeet, { JitsiMeetView } from 'react-native-jitsi-meet';

const VideoConsultation = ({ roomId, displayName }: Props) => {
  const startCall = () => {
    const url = `https://meet.jit.si/${roomId}`;
    const userInfo = {
      displayName: displayName,
      email: 'user@santekene.com',
      avatar: 'https://...',
    };
    
    JitsiMeet.call(url, userInfo);
  };
  
  return (
    <View style={styles.container}>
      <Button title="Rejoindre la Consultation" onPress={startCall} />
    </View>
  );
};
```

---

## ❌ Gestion des Erreurs

### Codes de Statut HTTP

| Code | Signification | Action |
|------|---------------|--------|
| 200 | OK | Succès |
| 201 | Created | Ressource créée |
| 400 | Bad Request | Vérifier les données envoyées |
| 401 | Unauthorized | Token invalide ou expiré → Reconnexion |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource inexistante |
| 500 | Server Error | Erreur serveur → Réessayer |

### Exemple de Gestion d'Erreur (Flutter)

```dart
Future<void> fetchData() async {
  try {
    final data = await apiService.getDse();
    // Traiter les données
  } on http.ClientException catch (e) {
    // Problème réseau
    showError('Pas de connexion Internet');
  } catch (e) {
    if (e.toString().contains('401')) {
      // Token expiré
      await logout();
      navigateToLogin();
    } else {
      showError('Une erreur est survenue');
    }
  }
}
```

---

## 📚 Exemples de Code Complets

### Voir le fichier `flutter_example_video_consultation.dart`

Ce fichier contient un exemple complet d'intégration Flutter avec :
- Authentification
- Gestion du DSE
- Création de rendez-vous
- Visioconférence Jitsi

---

## 🔗 URLs Complètes de l'API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur

### Patient
- `GET /api/patients/dse` - Récupérer le DSE
- `POST /api/patients/appointments` - Créer RDV
- `GET /api/patients/appointments` - Liste RDV
- `GET /api/patients/prescriptions` - Ordonnances
- `POST /api/documents/upload` - Upload document

### Médecin
- `GET /api/medecin/appointments` - Demandes RDV
- `PUT /api/medecin/appointments/:id/accept` - Accepter
- `PUT /api/medecin/appointments/:id/reject` - Refuser
- `POST /api/medecin/appointments/:id/video/start` - Démarrer visio
- `GET /api/medecin/stats` - Statistiques
- `GET /api/medecin/schedule` - Planning

### KenePoints
- `GET /api/wallet/balance` - Solde portefeuille
- `GET /api/wallet/transactions` - Historique
- `GET /api/wallet/rules` - Règles de récompense

### Général
- `GET /api/doctors` - Liste médecins
- `GET /api/healthcenters/nearby` - Centres de santé proches

---

## 📞 Support

Pour toute question sur l'intégration mobile :

- **Email** : support@santekene.com
- **Documentation API** : Consultez `README.md`
- **Hedera Integration** : Consultez `HEDERA_INTEGRATION.md`

---

**Version** : 1.0.0  
**Date** : Octobre 2025  
**Auteurs** : Équipe Santekene

🚀 **Bon développement mobile !**

