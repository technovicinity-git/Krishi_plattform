import 'package:intl/intl.dart';

import '../l10n/labels.g.dart';

/// ৳1,21,600 — Bangladeshi grouping, same as the website's formatBDT.
String bdt(num value) {
  final negative = value < 0;
  final s = value.abs().round().toString();
  String grouped;
  if (s.length <= 3) {
    grouped = s;
  } else {
    final last3 = s.substring(s.length - 3);
    var rest = s.substring(0, s.length - 3);
    final parts = <String>[];
    while (rest.length > 2) {
      parts.insert(0, rest.substring(rest.length - 2));
      rest = rest.substring(0, rest.length - 2);
    }
    if (rest.isNotEmpty) parts.insert(0, rest);
    grouped = '${parts.join(',')},$last3';
  }
  return '${negative ? '−' : ''}৳$grouped';
}

/// "19 Nov 2026" in the app language.
String dateText(String locale, Object? value) {
  final d = value is DateTime ? value : DateTime.tryParse('${value ?? ''}');
  if (d == null) return '—';
  return DateFormat('d MMM y', locale == 'bn' ? 'bn' : 'en_GB').format(d.toLocal());
}

/// "5 min ago" style, falling back to the date after a week.
String timeAgo(String locale, DateTime d) {
  final diff = DateTime.now().difference(d);
  final bn = locale == 'bn';
  if (diff.inMinutes < 1) return bn ? 'এইমাত্র' : 'just now';
  if (diff.inHours < 1) return bn ? '${diff.inMinutes} মিনিট আগে' : '${diff.inMinutes} min ago';
  if (diff.inDays < 1) return bn ? '${diff.inHours} ঘণ্টা আগে' : '${diff.inHours} h ago';
  if (diff.inDays < 7) return bn ? '${diff.inDays} দিন আগে' : '${diff.inDays} d ago';
  return dateText(locale, d);
}

String kg(num value) => '${value % 1 == 0 ? value.toInt() : value} kg';

/// A website label (stage, status, purpose, …) in the app language.
/// [group] is one of the groups in tool/sync_labels.mjs.
String label(String locale, String group, String? key) {
  if (key == null || key.isEmpty) return '—';
  return kLabels[locale]?['$group.$key'] ?? kLabels['en']?['$group.$key'] ?? key.replaceAll('_', ' ');
}
