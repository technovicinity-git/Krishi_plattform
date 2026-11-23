/// The app screen a notification opens, from its link on the website.
/// [replace] means a tab (go) rather than a screen on top (push).
/// Null when it has no screen in the app.
({String path, bool replace})? notificationRoute(String? href, String? investmentId) {
  final link = href ?? '';
  if (investmentId != null && investmentId.isNotEmpty) return (path: '/batches/$investmentId', replace: false);
  final onboarding = RegExp(r'/onboarding/([A-Z0-9-]+)').firstMatch(link);
  if (onboarding != null) return (path: '/onboarding/${onboarding.group(1)}', replace: false);
  if (link.contains('/portal/interests') || link.contains('/interest/')) return (path: '/interests', replace: false);
  if (link.contains('/portal/kyc')) return (path: '/kyc', replace: false);
  if (link.contains('/steward/interests')) return (path: '/approvals', replace: true);
  if (link.contains('/steward/plans')) return (path: '/steward-plans', replace: false);
  if (link.contains('wallet')) return (path: '/wallet', replace: true);
  return null;
}
