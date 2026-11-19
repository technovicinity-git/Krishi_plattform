/// Build-time settings. Pass them with --dart-define, e.g.
///
///   flutter run --dart-define=API_BASE_URL=http://192.168.0.10:3000
///   flutter build apk --dart-define=API_BASE_URL=https://krishi.example.com
///
/// The default reaches a dev server on this computer from the Android
/// emulator (10.0.2.2 is the host machine).
class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// The website, for things the app sends people to (payment, KYC upload).
  static const webBaseUrl = String.fromEnvironment(
    'WEB_BASE_URL',
    defaultValue: apiBaseUrl,
  );
}
