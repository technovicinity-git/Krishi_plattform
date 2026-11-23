import 'dart:io';

import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

import '../ui/widgets.dart';

/// Downloads a PDF statement from the API (signed in) and opens it in the
/// phone's PDF viewer.
Future<void> openStatement(BuildContext context, String path, String fileName) async {
  final messenger = ScaffoldMessenger.of(context);
  messenger.showSnackBar(SnackBar(content: Text(context.l.downloadStatement), duration: const Duration(seconds: 2)));
  try {
    final bytes = await context.api.download(path, query: {'lang': context.lang});
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$fileName');
    await file.writeAsBytes(bytes, flush: true);
    await OpenFilex.open(file.path, type: 'application/pdf');
  } catch (e) {
    if (context.mounted) showSnack(context, errorText(context, e), error: true);
  }
}
