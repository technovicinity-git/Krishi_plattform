import 'package:flutter_test/flutter_test.dart';
import 'package:krishi/core/format.dart';

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
}
