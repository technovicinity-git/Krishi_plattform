import 'dart:io';

import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

import '../ui/widgets.dart';

/// Downloads a PDF statement from the API (signed in) and opens it in the
/// phone's PDF viewer.
Future<void> openStatement(BuildContext context, String path, String fileName) =>
    _downloadAndOpen(context, path, fileName, 'application/pdf');

/// Downloads the transactions CSV (same filters as the screen) and opens it
/// in a spreadsheet app.
Future<void> openTransactionsCsv(BuildContext context, {String? kind}) {
  final day = DateTime.now().toIso8601String().substring(0, 10);
  return _downloadAndOpen(
    context,
    '/api/transactions/export',
    'krishi-transactions-$day.csv',
    'text/csv',
    query: {'type': ?kind},
    noAppMessage: context.l.csvNoApp,
  );
}

Future<void> _downloadAndOpen(
  BuildContext context,
  String path,
  String fileName,
  String type, {
  Map<String, dynamic> query = const {},
  String? noAppMessage,
}) async {
  final messenger = ScaffoldMessenger.of(context);
  messenger.showSnackBar(SnackBar(content: Text(context.l.downloadStatement), duration: const Duration(seconds: 2)));
  try {
    final bytes = await context.api.download(path, query: {'lang': context.lang, ...query});
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$fileName');
    await file.writeAsBytes(bytes, flush: true);
    final result = await OpenFilex.open(file.path, type: type);
    if (result.type == ResultType.noAppToOpen && noAppMessage != null && context.mounted) {
      showSnack(context, noAppMessage, error: true);
    }
  } catch (e) {
    if (context.mounted) showSnack(context, errorText(context, e), error: true);
  }
}
