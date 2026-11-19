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
    final token = data['token'] as String?;
    if (token == null) throw ApiException('Sign-in failed');
    _token = token;
    sessionExpired = false;
    await _storage.write(key: _tokenKey, value: token);
    await refreshMe();
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
