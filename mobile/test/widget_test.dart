import 'package:flutter_test/flutter_test.dart';
import 'package:krishi/core/format.dart';
import 'package:krishi/core/validate.dart';

void main() {
  test('bdt groups like the website', () {
    expect(bdt(0), '৳0');
    expect(bdt(999), '৳999');
    expect(bdt(1000), '৳1,000');
    expect(bdt(121600), '৳1,21,600');
    expect(bdt(10044700), '৳1,00,44,700');
    expect(bdt(-4000), '−৳4,000');
  });

  test('labels come from the website in both languages', () {
    expect(label('en', 'stage', 'growing_care'), 'Growing & Care');
    expect(label('bn', 'purpose', 'feed'), isNot('feed'));
    expect(label('en', 'stage', 'unknown_stage'), 'unknown stage');
  });

  test('phone numbers follow the website rule', () {
    expect(isValidBdPhone('01712345678'), isTrue);
    expect(isValidBdPhone('+8801712345678'), isTrue);
    expect(isValidBdPhone('8801712345678'), isTrue);
    expect(isValidBdPhone('017 1234 5678'), isTrue);
    expect(isValidBdPhone('01212345678'), isFalse); // 012 isn't a mobile prefix
    expect(isValidBdPhone('0171234567'), isFalse); // too short
  });

  test('passwords need 8+ characters with a letter and a number', () {
    expect(isStrongPassword('Passw0rd'), isTrue);
    expect(isStrongPassword('password'), isFalse);
    expect(isStrongPassword('12345678'), isFalse);
    expect(isStrongPassword('Pass1'), isFalse);
  });

  test('codes are six digits', () {
    expect(isSixDigitCode('123456'), isTrue);
    expect(isSixDigitCode(' 123456 '), isTrue);
    expect(isSixDigitCode('12345a'), isFalse);
  });
}
