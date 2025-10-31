
class AuthService {
  // Singleton pattern to ensure only one instance of AuthService is created
  static final AuthService _instance = AuthService._internal();

  factory AuthService() {
    return _instance;
  }

  AuthService._internal();

  String? _token;
  Map<String, dynamic>? _user;

  String? get token => _token;
  Map<String, dynamic>? get user => _user;

  void setUser(Map<String, dynamic> user, String token) {
    _user = user;
    _token = token;
  }

  void clearUser() {
    _user = null;
    _token = null;
  }

  bool get isAuthenticated => _token != null;
}
