/// Build-time settings. By default the app talks to the deployed Krishi site.
/// Override with --dart-define for local development, e.g.
///
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000      (Android emulator → this PC)
///   flutter run --dart-define=API_BASE_URL=http://192.168.0.10:3000  (phone → this PC on Wi-Fi)
class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://krishi-plattform.vercel.app',
  );

  /// The website, for things the app sends people to (payment, KYC upload).
  static const webBaseUrl = String.fromEnvironment(
    'WEB_BASE_URL',
    defaultValue: apiBaseUrl,
  );
}
