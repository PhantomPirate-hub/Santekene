# 📱 **Guide d'Intégration Flutter - Santé Kènè**

## **📋 Table des matières**
1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Configuration du projet Flutter](#configuration-du-projet-flutter)
4. [Authentification](#authentification)
5. [API Endpoints](#api-endpoints)
6. [Modèles de données](#modèles-de-données)
7. [Services](#services)
8. [Exemples d'implémentation](#exemples-dimplémentation)
9. [Upload de fichiers](#upload-de-fichiers)
10. [KenePoints et Badges](#kenepoints-et-badges)
11. [Gestion des erreurs](#gestion-des-erreurs)
12. [Bonnes pratiques](#bonnes-pratiques)

---

## **🎯 Introduction**

Ce guide explique comment intégrer l'application mobile Flutter avec le backend Santé Kènè (Node.js + Express + MySQL + Hedera).

### **Prérequis**

- Flutter SDK 3.0+
- Dart 3.0+
- Android Studio / Xcode
- Accès au backend Santé Kènè (localhost ou déployé)

---

## **🏗️ Architecture**

### **Stack technique**

```
Flutter App (Mobile)
    ↓ HTTP/HTTPS
Backend API (Express.js)
    ↓
MySQL Database
    ↓
Hedera Services (HCS, HFS, HTS)
```

### **Communication**

- **Protocole** : HTTP/HTTPS
- **Format** : JSON
- **Authentification** : JWT (Bearer Token)
- **Base URL** : `http://localhost:3001` (dev) ou `https://api.santekene.com` (prod)

---

## **📦 Configuration du projet Flutter**

### **1. Créer le projet**

```bash
flutter create santekene_mobile
cd santekene_mobile
```

### **2. Ajouter les dépendances**

Éditez `pubspec.yaml` :

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # HTTP
  http: ^1.1.0
  dio: ^5.3.3              # Alternative à http (recommandé)
  
  # State Management
  provider: ^6.0.5         # Ou riverpod, bloc, getx
  
  # Local Storage
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0
  
  # JSON
  json_annotation: ^4.8.1
  
  # File Picker
  file_picker: ^6.1.1
  image_picker: ^1.0.4
  
  # UI
  cached_network_image: ^3.3.0
  flutter_svg: ^2.0.9
  intl: ^0.18.1           # Formatage dates
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.6
  json_serializable: ^6.7.1
```

### **3. Installer les dépendances**

```bash
flutter pub get
```

### **4. Configuration de base**

Créez `lib/config/api_config.dart` :

```dart
class ApiConfig {
  // Changez selon votre environnement
  static const String baseUrl = 'http://10.0.2.2:3001'; // Android Emulator
  // static const String baseUrl = 'http://localhost:3001'; // iOS Simulator
  // static const String baseUrl = 'https://api.santekene.com'; // Production
  
  static const String apiVersion = 'api';
  
  // Endpoints
  static const String authEndpoint = '/auth';
  static const String patientEndpoint = '/patient';
  static const String medecinEndpoint = '/medecin';
  static const String consultationEndpoint = '/consultations';
  static const String documentEndpoint = '/documents';
  static const String walletEndpoint = '/wallet';
  static const String communityEndpoint = '/community';
  
  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
```

---

## **🔐 Authentification**

### **1. Modèle User**

Créez `lib/models/user_model.dart` :

```dart
import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class User {
  final int id;
  final String email;
  final String name;
  final String role; // PATIENT, MEDECIN, ADMIN, SUPERADMIN
  final String? phone;
  
  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.phone,
  });
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class LoginResponse {
  final String token;
  final User user;
  
  LoginResponse({required this.token, required this.user});
  
  factory LoginResponse.fromJson(Map<String, dynamic> json) => 
    _$LoginResponseFromJson(json);
  Map<String, dynamic> toJson() => _$LoginResponseToJson(this);
}
```

### **2. Service d'authentification**

Créez `lib/services/auth_service.dart` :

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';

class AuthService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: ApiConfig.connectionTimeout,
    receiveTimeout: ApiConfig.receiveTimeout,
  ));
  
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  // Clés de stockage
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';
  
  // Login
  Future<LoginResponse> login(String email, String password) async {
    try {
      final response = await _dio.post(
        '${ApiConfig.authEndpoint}/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      
      final loginResponse = LoginResponse.fromJson(response.data);
      
      // Sauvegarder le token et les infos user
      await _storage.write(key: _tokenKey, value: loginResponse.token);
      await _storage.write(key: _userKey, value: jsonEncode(loginResponse.user.toJson()));
      
      // Configurer le token pour les futures requêtes
      _dio.options.headers['Authorization'] = 'Bearer ${loginResponse.token}';
      
      return loginResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Register
  Future<LoginResponse> register({
    required String email,
    required String password,
    required String name,
    required String role,
    String? phone,
  }) async {
    try {
      final response = await _dio.post(
        '${ApiConfig.authEndpoint}/register',
        data: {
          'email': email,
          'password': password,
          'name': name,
          'role': role,
          'phone': phone,
        },
      );
      
      final loginResponse = LoginResponse.fromJson(response.data);
      
      await _storage.write(key: _tokenKey, value: loginResponse.token);
      await _storage.write(key: _userKey, value: jsonEncode(loginResponse.user.toJson()));
      
      _dio.options.headers['Authorization'] = 'Bearer ${loginResponse.token}';
      
      return loginResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Récupérer le token stocké
  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }
  
  // Récupérer l'utilisateur stocké
  Future<User?> getUser() async {
    final userJson = await _storage.read(key: _userKey);
    if (userJson != null) {
      return User.fromJson(jsonDecode(userJson));
    }
    return null;
  }
  
  // Vérifier si l'utilisateur est connecté
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
  
  // Logout
  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
    _dio.options.headers.remove('Authorization');
  }
  
  // Initialiser le Dio avec le token au démarrage
  Future<void> initializeAuth() async {
    final token = await getToken();
    if (token != null) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }
  
  // Gestion des erreurs
  String _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      if (data is Map && data.containsKey('error')) {
        return data['error'];
      }
      return 'Erreur serveur: ${error.response!.statusCode}';
    } else {
      return 'Erreur de connexion. Vérifiez votre connexion internet.';
    }
  }
}
```

### **3. Exemple d'utilisation**

```dart
// Login
try {
  final authService = AuthService();
  final response = await authService.login(
    'patient@test.com',
    'password123',
  );
  
  print('Connecté: ${response.user.name}');
  print('Rôle: ${response.user.role}');
} catch (e) {
  print('Erreur: $e');
}
```

---

## **📡 API Endpoints**

### **Endpoints disponibles**

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/api/auth/register` | POST | Inscription | ❌ |
| `/api/auth/login` | POST | Connexion | ❌ |
| `/api/auth/profile` | GET | Profil utilisateur | ✅ |
| `/api/auth/profile` | PATCH | Mise à jour profil | ✅ |
| `/api/patient/dse` | GET | DSE du patient | ✅ |
| `/api/patient/consultations` | GET | Liste consultations | ✅ |
| `/api/patient/documents` | GET | Liste documents | ✅ |
| `/api/medecin/consultations` | POST | Créer consultation | ✅ |
| `/api/medecin/consultations/documents` | POST | Upload document | ✅ |
| `/api/medecin/patients` | GET | Liste patients | ✅ |
| `/api/wallet/info` | GET | Portefeuille + Badge | ✅ |
| `/api/wallet/transactions` | GET | Historique KNP | ✅ |
| `/api/community/posts` | GET | Liste posts | ✅ |
| `/api/community/posts` | POST | Créer post | ✅ |
| `/api/hedera/status` | GET | État services Hedera | ✅ |

---

## **📝 Modèles de données**

### **Consultation**

```dart
@JsonSerializable()
class Consultation {
  final int id;
  final int patientId;
  final int doctorId;
  final String? diagnosis;
  final String? notes;
  final String? allergies;
  final DateTime date;
  
  Consultation({
    required this.id,
    required this.patientId,
    required this.doctorId,
    this.diagnosis,
    this.notes,
    this.allergies,
    required this.date,
  });
  
  factory Consultation.fromJson(Map<String, dynamic> json) => 
    _$ConsultationFromJson(json);
  Map<String, dynamic> toJson() => _$ConsultationToJson(this);
}
```

### **Document**

```dart
@JsonSerializable()
class Document {
  final int id;
  final int patientId;
  final String type;
  final String name;
  final String url;
  final String? hfsFileId; // ID Hedera (si HFS activé)
  final int size;
  final String mimeType;
  final DateTime createdAt;
  
  Document({
    required this.id,
    required this.patientId,
    required this.type,
    required this.name,
    required this.url,
    this.hfsFileId,
    required this.size,
    required this.mimeType,
    required this.createdAt,
  });
  
  factory Document.fromJson(Map<String, dynamic> json) => 
    _$DocumentFromJson(json);
  Map<String, dynamic> toJson() => _$DocumentToJson(this);
}
```

### **Wallet & Badge**

```dart
@JsonSerializable()
class Badge {
  final String level; // BRONZE, ARGENT, OR, PLATINE, VIP
  final String name;
  final int minKNP;
  final int? maxKNP;
  final String color;
  final String icon;
  
  Badge({
    required this.level,
    required this.name,
    required this.minKNP,
    this.maxKNP,
    required this.color,
    required this.icon,
  });
  
  factory Badge.fromJson(Map<String, dynamic> json) => _$BadgeFromJson(json);
}

@JsonSerializable()
class WalletInfo {
  final double balance;
  final double totalEarned;
  final double totalSpent;
  final Badge currentBadge;
  final Badge? nextBadge;
  final double progressPercentage;
  final int kpToNext;
  
  WalletInfo({
    required this.balance,
    required this.totalEarned,
    required this.totalSpent,
    required this.currentBadge,
    this.nextBadge,
    required this.progressPercentage,
    required this.kpToNext,
  });
  
  factory WalletInfo.fromJson(Map<String, dynamic> json) => 
    _$WalletInfoFromJson(json);
}
```

---

## **🛠️ Services**

### **Service API générique**

```dart
import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'auth_service.dart';

class ApiService {
  final Dio _dio;
  final AuthService _authService;
  
  ApiService(this._authService) : _dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: ApiConfig.connectionTimeout,
    receiveTimeout: ApiConfig.receiveTimeout,
  )) {
    // Intercepteur pour ajouter le token automatiquement
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _authService.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Si 401 (token expiré), déconnecter
        if (error.response?.statusCode == 401) {
          await _authService.logout();
        }
        return handler.next(error);
      },
    ));
  }
  
  Future<T> get<T>(String path, T Function(Map<String, dynamic>) fromJson) async {
    try {
      final response = await _dio.get(path);
      return fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  Future<List<T>> getList<T>(String path, T Function(Map<String, dynamic>) fromJson) async {
    try {
      final response = await _dio.get(path);
      final List data = response.data;
      return data.map((item) => fromJson(item)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  Future<T> post<T>(String path, Map<String, dynamic> data, T Function(Map<String, dynamic>) fromJson) async {
    try {
      final response = await _dio.post(path, data: data);
      return fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  String _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      if (data is Map && data.containsKey('error')) {
        return data['error'];
      }
      return 'Erreur serveur: ${error.response!.statusCode}';
    } else {
      return 'Erreur de connexion';
    }
  }
}
```

### **Service Wallet**

```dart
class WalletService {
  final ApiService _apiService;
  
  WalletService(this._apiService);
  
  Future<WalletInfo> getWalletInfo() async {
    return await _apiService.get(
      '${ApiConfig.walletEndpoint}/info',
      (json) => WalletInfo.fromJson(json),
    );
  }
  
  Future<List<WalletTransaction>> getTransactions() async {
    final response = await _apiService._dio.get('${ApiConfig.walletEndpoint}/transactions');
    final List data = response.data['transactions'];
    return data.map((item) => WalletTransaction.fromJson(item)).toList();
  }
}
```

---

## **📱 Exemples d'implémentation**

### **1. Écran de connexion**

```dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  
  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    
    try {
      final response = await _authService.login(
        _emailController.text,
        _passwordController.text,
      );
      
      // Navigation selon le rôle
      if (response.user.role == 'PATIENT') {
        Navigator.pushReplacementNamed(context, '/patient-home');
      } else if (response.user.role == 'MEDECIN') {
        Navigator.pushReplacementNamed(context, '/medecin-home');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Connexion')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _emailController,
              decoration: InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
            ),
            SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(labelText: 'Mot de passe'),
              obscureText: true,
            ),
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _handleLogin,
              child: _isLoading 
                ? CircularProgressIndicator()
                : Text('Se connecter'),
            ),
          ],
        ),
      ),
    );
  }
}
```

### **2. Liste des consultations**

```dart
class ConsultationsScreen extends StatelessWidget {
  final ApiService _apiService = ApiService(AuthService());
  
  Future<List<Consultation>> _fetchConsultations() async {
    return await _apiService.getList(
      '${ApiConfig.patientEndpoint}/consultations',
      (json) => Consultation.fromJson(json),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Mes consultations')),
      body: FutureBuilder<List<Consultation>>(
        future: _fetchConsultations(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }
          
          if (snapshot.hasError) {
            return Center(child: Text('Erreur: ${snapshot.error}'));
          }
          
          final consultations = snapshot.data ?? [];
          
          return ListView.builder(
            itemCount: consultations.length,
            itemBuilder: (context, index) {
              final consultation = consultations[index];
              return ListTile(
                title: Text(consultation.diagnosis ?? 'Consultation'),
                subtitle: Text(
                  DateFormat('dd/MM/yyyy HH:mm').format(consultation.date),
                ),
                trailing: Icon(Icons.chevron_right),
                onTap: () {
                  // Naviguer vers les détails
                },
              );
            },
          );
        },
      ),
    );
  }
}
```

### **3. Affichage du badge**

```dart
class BadgeWidget extends StatelessWidget {
  final Badge badge;
  final double size;
  
  const BadgeWidget({
    required this.badge,
    this.size = 50,
  });
  
  Color _getBadgeColor() {
    switch (badge.level) {
      case 'BRONZE': return Colors.orange;
      case 'ARGENT': return Colors.grey;
      case 'OR': return Colors.amber;
      case 'PLATINE': return Colors.cyan;
      case 'VIP': return Colors.purple;
      default: return Colors.grey;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              colors: [_getBadgeColor(), _getBadgeColor().withOpacity(0.7)],
            ),
          ),
          child: Center(
            child: Text(
              badge.icon,
              style: TextStyle(fontSize: size * 0.5),
            ),
          ),
        ),
        SizedBox(height: 8),
        Text(
          badge.name,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: _getBadgeColor(),
          ),
        ),
      ],
    );
  }
}
```

---

## **📤 Upload de fichiers**

### **Upload de document**

```dart
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

class DocumentService {
  final AuthService _authService;
  
  DocumentService(this._authService);
  
  Future<Document> uploadDocument({
    required int patientId,
    required String type,
    required PlatformFile file,
  }) async {
    final token = await _authService.getToken();
    
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.medecinEndpoint}/consultations/documents'),
    );
    
    // Headers
    request.headers['Authorization'] = 'Bearer $token';
    
    // Fichier
    request.files.add(await http.MultipartFile.fromPath(
      'document',
      file.path!,
      filename: file.name,
    ));
    
    // Champs
    request.fields['patientId'] = patientId.toString();
    request.fields['type'] = type;
    request.fields['title'] = file.name;
    
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 201) {
      return Document.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Upload échoué: ${response.body}');
    }
  }
}

// Utilisation
Future<void> _pickAndUploadDocument() async {
  final result = await FilePicker.platform.pickFiles(
    type: FileType.custom,
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
  );
  
  if (result != null && result.files.isNotEmpty) {
    final file = result.files.first;
    
    try {
      final document = await DocumentService(_authService).uploadDocument(
        patientId: 1,
        type: 'ANALYSE',
        file: file,
      );
      
      print('Document uploadé: ${document.name}');
      if (document.hfsFileId != null) {
        print('Sur Hedera: ${document.hfsFileId}');
      }
    } catch (e) {
      print('Erreur: $e');
    }
  }
}
```

---

## **💰 KenePoints et Badges**

### **Widget Portefeuille**

```dart
class WalletScreen extends StatelessWidget {
  final WalletService _walletService = WalletService(ApiService(AuthService()));
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Mon Portefeuille')),
      body: FutureBuilder<WalletInfo>(
        future: _walletService.getWalletInfo(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Center(child: CircularProgressIndicator());
          }
          
          final wallet = snapshot.data!;
          
          return SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                // Solde
                Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Column(
                      children: [
                        Text(
                          '${wallet.balance.toStringAsFixed(0)} KNP',
                          style: TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 16),
                        BadgeWidget(badge: wallet.currentBadge),
                      ],
                    ),
                  ),
                ),
                
                SizedBox(height: 16),
                
                // Progression
                if (wallet.nextBadge != null) ...[
                  Card(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              BadgeWidget(badge: wallet.currentBadge, size: 40),
                              Expanded(
                                child: LinearProgressIndicator(
                                  value: wallet.progressPercentage / 100,
                                  minHeight: 8,
                                ),
                              ),
                              BadgeWidget(badge: wallet.nextBadge!, size: 40),
                            ],
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Plus que ${wallet.kpToNext} KNP pour ${wallet.nextBadge!.name}',
                            style: TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
```

---

## **⚠️ Gestion des erreurs**

### **Wrapper pour les erreurs**

```dart
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  
  ApiException(this.message, [this.statusCode]);
  
  @override
  String toString() => message;
}

// Dans vos services
try {
  // ...
} on DioException catch (e) {
  if (e.response?.statusCode == 401) {
    throw ApiException('Session expirée. Veuillez vous reconnecter.', 401);
  } else if (e.response?.statusCode == 404) {
    throw ApiException('Ressource non trouvée', 404);
  } else if (e.response?.statusCode == 500) {
    throw ApiException('Erreur serveur. Veuillez réessayer.', 500);
  } else {
    throw ApiException('Erreur de connexion', null);
  }
}
```

---

## **✅ Bonnes pratiques**

### **1. Gestion du token**

```dart
// Vérifier au démarrage de l'app
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final authService = AuthService();
  await authService.initializeAuth();
  
  final isLoggedIn = await authService.isLoggedIn();
  
  runApp(MyApp(isLoggedIn: isLoggedIn));
}
```

### **2. State Management (Provider)**

```dart
class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  User? _user;
  bool _isLoading = false;
  
  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null;
  
  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final response = await _authService.login(email, password);
      _user = response.user;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    notifyListeners();
  }
}

// Utilisation
ChangeNotifierProvider(
  create: (_) => AuthProvider(),
  child: MyApp(),
)
```

### **3. Offline-First**

```dart
// Cache local avec Hive ou Sqflite
import 'package:hive/hive.dart';

class CacheService {
  static const String _consultationsBox = 'consultations';
  
  Future<void> cacheConsultations(List<Consultation> consultations) async {
    final box = await Hive.openBox(_consultationsBox);
    await box.put('data', consultations.map((c) => c.toJson()).toList());
  }
  
  Future<List<Consultation>?> getCachedConsultations() async {
    final box = await Hive.openBox(_consultationsBox);
    final data = box.get('data');
    if (data != null) {
      return (data as List).map((item) => Consultation.fromJson(item)).toList();
    }
    return null;
  }
}
```

---

## **📚 Ressources**

- **Flutter Docs** : https://flutter.dev/docs
- **Dio Package** : https://pub.dev/packages/dio
- **Provider** : https://pub.dev/packages/provider
- **JSON Serialization** : https://flutter.dev/docs/development/data-and-backend/json

---

🎉 **Votre application mobile Flutter est maintenant prête à communiquer avec le backend Santé Kènè !**

