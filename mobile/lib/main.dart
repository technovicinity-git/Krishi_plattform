import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/push.dart';
import 'core/session.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting();
  await Push.init();
  final session = Session();
  runApp(ChangeNotifierProvider.value(value: session, child: const KrishiApp()));
  await session.init();
}
