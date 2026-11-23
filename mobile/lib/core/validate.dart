// Same rules as the website (web/src/lib/auth/phone.ts and the password
// schemas), so the app can say what's wrong before asking the server.

/// 01XXXXXXXXX, 8801XXXXXXXXX or +8801XXXXXXXXX.
bool isValidBdPhone(String raw) {
  var digits = raw.replaceAll(RegExp(r'\D'), '');
  if (digits.startsWith('0')) digits = digits.substring(1);
  if (digits.startsWith('880')) digits = digits.substring(3);
  return RegExp(r'^1[3-9]\d{8}$').hasMatch(digits);
}

/// At least 8 characters with a letter and a number.
bool isStrongPassword(String value) =>
    value.length >= 8 && RegExp(r'[A-Za-z]').hasMatch(value) && RegExp(r'\d').hasMatch(value);

bool isSixDigitCode(String value) => RegExp(r'^\d{6}$').hasMatch(value.trim());
