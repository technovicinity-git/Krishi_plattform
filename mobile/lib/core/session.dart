import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api.dart';
import 'models.dart';

/// Who is signed in, their token and the app language. The token lives in
/// the platform's secure storage (Keychain / Keystore).
class Session extends ChangeNotifier implements ApiAuth {
  Session() {
    api = Api(this);
  }

  static const _tokenKey = 'krishi_token';
  static const _localeKey = 'krishi_locale';
  final _storage = const FlutterSecureStorage();

  late final Api api;

  String? _token;
  Me? me;
  String _locale = 'bn';
  bool ready = false;

  /// Set when the server rejected the token (expired or signed out elsewhere).
  bool sessionExpired = false;

  @override
  String? get token => _token;

  @override
  String get locale => _locale;

  bool get signedIn => _token != null && me != null;

  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _locale = prefs.getString(_localeKey) ?? 'bn';
      _token = await _storage.read(key: _tokenKey);
      if (_token != null) await refreshMe();
    } catch (_) {
      // Offline or storage unavailable: show the sign-in screen.
      _token = null;
      me = null;
    }
    ready = true;
    notifyListeners();
  }

  Future<void> refreshMe() async {
    final data = await api.get('/api/mobile/v1/me');
    me = Me.fromJson(data);
    notifyListeners();
  }

  /// Signs in with phone and password. Throws [ApiException] on failure.
  Future<void> signIn(String phone, String password) async {
    final data = await api.post('/api/auth/login', {
      'phone': phone.trim(),
      'password': password,
      'client': 'mobile',
    });
    await _useToken(data);
  }

  /// Stores a token from any sign-in route (login, sign-up, activation) and loads the user.
  Future<void> _useToken(Map<String, dynamic> data) async {
    final token = data['token'] as String?;
    if (token == null) throw ApiException('Sign-in failed');
    _token = token;
    sessionExpired = false;
    await _storage.write(key: _tokenKey, value: token);
    await refreshMe();
  }

  /// Investor sign-up. Signs in straight away; the phone is verified next.
  /// Returns the code when the server shows it (development / staging only).
  Future<String?> registerInvestor({required String name, required String phone, String? email, required String password}) async {
    final data = await api.post('/api/auth/register', {
      'fullName': name.trim(),
      'phone': phone.trim(),
      if (email != null && email.trim().isNotEmpty) 'email': email.trim(),
      'password': password,
    });
    await _useToken(data);
    return data['devOtp'] as String?;
  }

  Future<void> verifyPhone(String code) async {
    await api.post('/api/auth/verify-otp', {'otp': code.trim()});
    await refreshMe();
  }

  /// A farmer sets their password with the code their steward gave them.
  Future<void> activateFarmer({required String phone, required String code, required String password}) async {
    final data = await api.post('/api/auth/farmer-activate', {
      'phone': phone.trim(),
      'otp': code.trim(),
      'password': password,
    });
    await _useToken(data);
  }

  /// Steward sign-up (step 1). Details and Krishi's approval come next.
  Future<void> registerSteward({required String name, required String phone, String? email, required String password}) async {
    final data = await api.post('/api/auth/steward-register', {
      'fullName': name.trim(),
      'phone': phone.trim(),
      if (email != null && email.trim().isNotEmpty) 'email': email.trim(),
      'password': password,
    });
    await _useToken(data);
  }

  Future<void> signOut() async {
    _token = null;
    me = null;
    await _storage.delete(key: _tokenKey);
    notifyListeners();
  }

  Future<void> setLocale(String value) async {
    if (value == _locale) return;
    _locale = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localeKey, value);
  }

  void setUnread(int count) {
    if (me == null || me!.unreadNotifications == count) return;
    me = me!.copyWith(unreadNotifications: count);
    notifyListeners();
  }

  @override
  void onUnauthorized() {
    if (_token == null) return;
    sessionExpired = true;
    signOut();
  }
}
