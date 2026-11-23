import 'dart:async';
import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import 'api.dart';

/// Push notifications (Firebase Cloud Messaging). The server sends one for
/// every in-app notification; this registers the phone for the signed-in
/// user and reports taps and messages that arrive while the app is open.
///
/// Every call is safe when Firebase is unavailable (no config, desktop,
/// tests): push then does nothing and the in-app list still works.
///
/// Uses the FCM registration token (getToken / onTokenRefresh): it is what the
/// server's HTTP v1 `message.token` targets. firebase_messaging 17 marks these
/// deprecated in favour of installation IDs (register / onRegistered), which
/// need a different send API; switch both sides together when that is stable.
// ignore_for_file: deprecated_member_use
class Push {
  Push._();

  static bool _ready = false;
  static StreamSubscription<String>? _refresh;

  /// A notification was tapped (from the background or a closed app).
  /// Carries the message data: kind, href, investmentId.
  static final opened = StreamController<Map<String, dynamic>>.broadcast();

  /// A notification arrived while the app was open (title, body, data).
  static final foreground = StreamController<RemoteMessage>.broadcast();

  static Future<void> init() async {
    if (kIsWeb || !(Platform.isAndroid || Platform.isIOS)) return;
    try {
      await Firebase.initializeApp();
      _ready = true;
      FirebaseMessaging.onMessageOpenedApp.listen((m) => opened.add(m.data));
      FirebaseMessaging.onMessage.listen(foreground.add);
      // While the app is open it shows its own message (on both platforms),
      // so iOS should not also show a system banner.
      await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(alert: false, badge: true, sound: false);
    } catch (e) {
      debugPrint('[push] Firebase unavailable: $e');
    }
  }

  /// The notification that opened the app from closed, if any. Read once.
  static Future<Map<String, dynamic>?> launchData() async {
    if (!_ready) return null;
    try {
      return (await FirebaseMessaging.instance.getInitialMessage())?.data;
    } catch (_) {
      return null;
    }
  }

  /// Asks for permission (first time only) and registers this phone for the
  /// signed-in user, in the app's language. Re-registers when Firebase
  /// rotates the token.
  static Future<void> register(Api api, String locale) async {
    if (!_ready) return;
    try {
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission();
      if (settings.authorizationStatus == AuthorizationStatus.denied) return;
      final token = await messaging.getToken();
      if (token == null) return;
      await _send(api, token, locale);
      await _refresh?.cancel();
      _refresh = messaging.onTokenRefresh.listen((t) => _send(api, t, locale));
    } catch (e) {
      debugPrint('[push] register failed: $e');
    }
  }

  static Future<void> _send(Api api, String token, String locale) => api.post('/api/mobile/v1/push-token', {
        'token': token,
        'platform': Platform.isIOS ? 'ios' : 'android',
        'locale': locale,
      });

  /// Stops pushes to this phone (sign-out).
  static Future<void> unregister(Api api) async {
    if (!_ready) return;
    try {
      await _refresh?.cancel();
      _refresh = null;
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await api.delete('/api/mobile/v1/push-token', {'token': token});
    } catch (e) {
      debugPrint('[push] unregister failed: $e');
    }
  }
}
