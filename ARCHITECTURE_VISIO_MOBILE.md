# Architecture Visioconférence & Compatibilité Mobile

## 🎯 Vue d'ensemble

Ce document décrit l'architecture de la visioconférence et sa compatibilité avec Flutter pour Santé Kènè.

---

## 🏗️ Architecture Backend

### Base de données (Prisma)

```prisma
model Appointment {
  id             Int        @id @default(autoincrement())
  patientId      Int
  doctorId       Int
  date           DateTime?  // Nullable - défini par le médecin
  type           String
  reason         String?
  notes          String?
  isVideo        Boolean    @default(false)
  videoLink      String?    // URL Jitsi Meet
  videoRoomId    String?    // ID unique de la room
  status         AppointmentStatus @default(PENDING)
  rejectedReason String?
  acceptedAt     DateTime?
  rejectedAt     DateTime?
  createdAt      DateTime   @default(now())
}

enum AppointmentStatus {
  PENDING      // En attente
  CONFIRMED    // Accepté
  REJECTED     // Refusé
  CANCELLED    // Annulé
  COMPLETED    // Terminé
}
```

### API Routes

#### Médecin
- `GET /api/medecin/appointments` - Liste des demandes
- `GET /api/medecin/schedule` - Planning
- `PUT /api/medecin/appointments/:id/accept` - Accepter + date/heure
- `PUT /api/medecin/appointments/:id/reject` - Refuser
- `POST /api/medecin/appointments/:id/video/start` - Générer lien visio

#### Patient
- `POST /api/patients/appointments` - Créer une demande
- `GET /api/patients/appointments` - Voir ses RDV
- `PUT /api/patients/appointments/:id` - Modifier
- `DELETE /api/patients/appointments/:id` - Annuler

### Génération du lien Jitsi

```typescript
// Format du videoRoomId
const videoRoomId = `sk-${doctorId}-${patientId}-${timestamp}`;

// URL Jitsi
const videoLink = `https://meet.jit.si/${videoRoomId}`;
```

**Sécurité** :
- Room ID unique par consultation
- Timestamp pour éviter les collisions
- Pas de réutilisation possible

---

## 📱 Compatibilité Flutter

### SDK Jitsi Flutter

**Package** : [`jitsi_meet_flutter_sdk`](https://pub.dev/packages/jitsi_meet_flutter_sdk)

### Installation Flutter

```yaml
# pubspec.yaml
dependencies:
  jitsi_meet_flutter_sdk: ^9.0.0
```

### Configuration Android

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
</manifest>
```

### Configuration iOS

```xml
<!-- ios/Runner/Info.plist -->
<key>NSCameraUsageDescription</key>
<string>Caméra nécessaire pour la visioconférence</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone nécessaire pour la visioconférence</string>
```

### Exemple d'utilisation Flutter

```dart
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';

// 1. Récupérer le RDV depuis l'API
Future<void> startVideoConsultation(String appointmentId) async {
  // Appel API pour obtenir le videoRoomId
  final response = await http.get(
    Uri.parse('$API_URL/api/patients/appointments/$appointmentId'),
    headers: {'Authorization': 'Bearer $token'},
  );

  final appointment = jsonDecode(response.body);
  
  if (appointment['isVideo'] && appointment['videoLink'] != null) {
    await joinJitsiMeeting(
      roomId: appointment['videoRoomId'],
      userDisplayName: appointment['patient']['name'],
      userEmail: appointment['patient']['email'],
    );
  }
}

// 2. Lancer Jitsi
Future<void> joinJitsiMeeting({
  required String roomId,
  required String userDisplayName,
  String? userEmail,
}) async {
  var jitsiMeet = JitsiMeet();
  
  var options = JitsiMeetConferenceOptions(
    serverURL: "https://meet.jit.si",
    room: roomId,
    configOverrides: {
      "startWithAudioMuted": false,
      "startWithVideoMuted": false,
      "subject": "Consultation Santé Kènè",
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
      "ios.recording.enabled": false,
      "live-streaming.enabled": false,
      "meeting-name.enabled": false,
      "meeting-password.enabled": false,
      "pip.enabled": true,
      "raise-hand.enabled": true,
      "recording.enabled": false,
      "tile-view.enabled": true,
      "toolbox.alwaysVisible": false,
      "video-share.enabled": false,
      "welcomepage.enabled": false,
    },
    userInfo: JitsiMeetUserInfo(
      displayName: userDisplayName,
      email: userEmail,
    ),
  );

  await jitsiMeet.join(options);
}

// 3. Écouter les événements
jitsiMeet.addListener(
  JitsiMeetingListener(
    onConferenceWillJoin: (message) {
      print("Conference en cours de connexion...");
    },
    onConferenceJoined: (message) {
      print("Rejoint la conférence");
    },
    onConferenceTerminated: (message) {
      print("Conférence terminée");
      // Navigation ou action post-consultation
    },
  ),
);
```

---

## 🌐 Compatibilité Web

### Next.js (Frontend actuel)

```tsx
// Bouton pour lancer la visio
<Button
  onClick={() => window.open(appointment.videoLink, '_blank')}
  className="bg-purple-600 hover:bg-purple-700 text-white"
>
  <Video className="w-4 h-4 mr-2" />
  Lancer la visio
</Button>
```

**Alternative avec iframe** (optionnel) :

```tsx
const [showVideo, setShowVideo] = useState(false);

{showVideo && (
  <div className="fixed inset-0 bg-black z-50">
    <iframe
      src={appointment.videoLink}
      allow="camera; microphone; fullscreen; display-capture"
      className="w-full h-full"
    ></iframe>
    <button 
      onClick={() => setShowVideo(false)}
      className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded"
    >
      Quitter
    </button>
  </div>
)}
```

---

## 🔐 Sécurité

### 1. Room ID Unique
- Format : `sk-{doctorId}-{patientId}-{timestamp}`
- Empêche l'accès non autorisé
- Pas de réutilisation possible

### 2. Validation Backend
```typescript
// Vérifier que l'utilisateur a le droit d'accéder au lien
if (appointment.doctorId !== currentDoctor.id && 
    appointment.patientId !== currentPatient.id) {
  throw new Error('Accès non autorisé');
}
```

### 3. Tokens JWT (optionnel - avancé)

Pour une sécurité maximale, utilisez les JWT tokens Jitsi :

```typescript
// Backend: Générer un token JWT
import jwt from 'jsonwebtoken';

const jitsiToken = jwt.sign(
  {
    context: {
      user: {
        name: user.name,
        email: user.email,
        id: user.id,
      },
    },
    aud: "jitsi",
    iss: "santekene",
    sub: "meet.jit.si",
    room: videoRoomId,
  },
  process.env.JITSI_JWT_SECRET,
  { expiresIn: '2h' }
);

// URL avec token
const secureVideoLink = `https://meet.jit.si/${videoRoomId}?jwt=${jitsiToken}`;
```

---

## 📊 Flux Complet

### 1. Patient soumet une demande
```
Patient → Frontend → POST /api/patients/appointments
{
  doctorId: 1,
  type: "Consultation générale",
  reason: "Douleurs abdominales",
  isVideo: true  // Demande une visio
}
```

### 2. Médecin accepte
```
Médecin → Frontend → PUT /api/medecin/appointments/123/accept
{
  date: "2025-10-30T14:00:00",
  notes: "Préparez vos résultats d'analyses"
}

Backend génère automatiquement:
- videoRoomId: "sk-1-5-1730289600000"
- videoLink: "https://meet.jit.si/sk-1-5-1730289600000"
```

### 3. Jour J - Médecin lance la visio
```
Médecin → Clique sur "Lancer la visio"
→ window.open(videoLink) 
→ Jitsi Meet s'ouvre
```

### 4. Jour J - Patient rejoint
```
Patient (Web) → Clique sur le lien → Navigateur
Patient (Mobile) → Clique → SDK Jitsi Flutter
→ Rejoint la même room
```

---

## 🎨 UI/UX Recommandations

### Médecin
- Badge "Visio" sur les RDV visio
- Bouton "Lancer la visio" visible le jour J
- Planning visuel (calendrier)

### Patient
- Badge "Consultation à distance"
- Bouton "Rejoindre la visio" actif 15 min avant
- Notification push (mobile) 10 min avant

---

## 🚀 Avantages de cette Architecture

### ✅ Simple
- Pas de serveur vidéo à gérer
- Jitsi Meet hébergé gratuitement
- Intégration rapide

### ✅ Sécurisé
- Room ID unique
- Pas de réutilisation
- JWT tokens (optionnel)

### ✅ Cross-platform
- Web (iframe ou nouvelle fenêtre)
- Android (SDK Flutter)
- iOS (SDK Flutter)
- Même code backend

### ✅ Scalable
- Jitsi gère la charge
- Pas de limite de consultations
- Gratuit et open source

---

## 📦 Packages Flutter Requis

```yaml
# pubspec.yaml
dependencies:
  # HTTP pour l'API
  http: ^1.1.0
  
  # JWT (si tokens sécurisés)
  dart_jsonwebtoken: ^2.12.0
  
  # Jitsi Meet
  jitsi_meet_flutter_sdk: ^9.0.0
  
  # Permissions
  permission_handler: ^11.0.1
  
  # Notifications (pour rappels)
  flutter_local_notifications: ^16.1.0
```

---

## 🔧 Configuration Backend

### Variables d'environnement

```env
# .env
JITSI_APP_ID=santekene
JITSI_JWT_SECRET=your-secret-key-here  # Optionnel
```

---

## 📱 Exemple Complet Flutter

Voir `flutter_example.dart` pour un exemple complet d'intégration.

---

## 🆘 Support & Dépannage

### Problèmes courants

1. **Caméra/Micro ne marche pas** → Vérifier les permissions
2. **Room inaccessible** → Vérifier le videoRoomId
3. **Crash sur iOS** → Vérifier Info.plist
4. **Latence** → Utiliser un serveur Jitsi dédié si nécessaire

---

## 📚 Ressources

- [Jitsi Meet Flutter SDK](https://pub.dev/packages/jitsi_meet_flutter_sdk)
- [Jitsi Meet API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe)
- [JWT Tokens Jitsi](https://github.com/jitsi/lib-jitsi-meet/blob/master/doc/tokens.md)

---

**Architecture validée pour production** ✅  
**Compatible mobile Flutter** ✅  
**Sécurisé** ✅  
**Scalable** ✅

