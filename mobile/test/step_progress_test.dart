import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:krishi/screens/interests_screens.dart';

void main() {
  Future<void> pump(WidgetTester tester, int current, double width) => tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView(children: [
              SizedBox(width: width, child: StepProgress(current: current, labels: const ['Identity', 'Payout', 'Payment', 'Check'])),
            ]),
          ),
        ),
      );

  testWidgets('shows ticks for finished steps and the number of the current one', (tester) async {
    await pump(tester, 2, 400);
    expect(find.byIcon(Icons.check), findsNWidgets(2));
    expect(find.text('3'), findsOneWidget);
    expect(find.text('4'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('all steps done', (tester) async {
    await pump(tester, 4, 400);
    expect(find.byIcon(Icons.check), findsNWidgets(4));
    expect(tester.takeException(), isNull);
  });

  testWidgets('lays out on a narrow phone', (tester) async {
    tester.view.physicalSize = const Size(320 * 3, 640 * 3);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    await pump(tester, 0, 300);
    expect(find.byIcon(Icons.check), findsNothing);
    expect(tester.takeException(), isNull);
  });
}
