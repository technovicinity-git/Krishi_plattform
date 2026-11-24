import 'dart:async';

import 'package:flutter/material.dart';

import '../core/format.dart';
import '../ui/widgets.dart';

/// Steward decisions, shared by the batch screen and the Approvals tab.
/// Each asks for confirmation (approve) or a reason (reject), calls the same
/// API as the website, and returns true when something changed.
class Decisions {
  static Future<bool> fundRequest(BuildContext context, String id, {required bool approve}) =>
      _decide(context, '/api/steward/fund-requests/$id', approve: approve);

  static Future<bool> expense(BuildContext context, String id, {required bool approve}) =>
      _decide(context, '/api/steward/expenses/$id', approve: approve);

  static Future<bool> sale(BuildContext context, String id, num amount, {required bool approve}) async {
    final l = context.l;
    if (approve &&
        !await confirmDialog(context,
            title: l.confirmSaleTitle, body: l.confirmSaleBody(bdt(amount)), confirm: l.actConfirmSale)) {
      return false;
    }
    if (!context.mounted) return false;
    return _decide(context, '/api/steward/sales/$id', approve: approve);
  }

  static Future<bool> death(BuildContext context, String animalId, {required bool approve}) async {
    final l = context.l;
    if (approve &&
        !await confirmDialog(context,
            title: l.confirmDeathTitle, body: l.confirmDeathBody, confirm: l.confirmDeath, danger: true)) {
      return false;
    }
    if (!context.mounted) return false;
    return _decide(context, '/api/steward/animals/$animalId/death', approve: approve);
  }

  static Future<bool> _decide(BuildContext context, String path, {required bool approve}) async {
    String? reason;
    if (!approve) {
      reason = await reasonDialog(context);
      if (reason == null) return false;
    }
    if (!context.mounted) return false;
    try {
      await context.api.patch(path, {'action': approve ? 'approve' : 'reject', 'reason': ?reason});
      if (context.mounted) showSnack(context, context.l.saved);
      return true;
    } catch (e) {
      if (context.mounted) showSnack(context, errorText(context, e), error: true);
      return false;
    }
  }
}

/// Approve / reject buttons for one pending item. While an action runs, the
/// pressed button shows a spinner and both are locked, so nothing is sent twice.
class DecisionButtons extends StatefulWidget {
  const DecisionButtons({super.key, required this.onApprove, required this.onReject, this.approveLabel});
  final FutureOr<void> Function() onApprove;
  final FutureOr<void> Function() onReject;
  final String? approveLabel;

  @override
  State<DecisionButtons> createState() => _DecisionButtonsState();
}

class _DecisionButtonsState extends State<DecisionButtons> {
  /// "approve" or "reject" while that action runs.
  String? _busy;

  Future<void> _run(String which, FutureOr<void> Function() action) async {
    if (_busy != null) return;
    setState(() => _busy = which);
    try {
      await action();
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  Widget _label(String text, bool busy, Color color) => busy
      ? Row(mainAxisSize: MainAxisSize.min, children: [
          SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: color)),
          const SizedBox(width: 8),
          Flexible(child: Text(text, overflow: TextOverflow.ellipsis)),
        ])
      : Text(text);

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final scheme = Theme.of(context).colorScheme;
    final locked = _busy != null;
    return Row(children: [
      Expanded(
        child: FilledButton(
          style: FilledButton.styleFrom(minimumSize: const Size(0, 42)),
          onPressed: locked ? null : () => _run('approve', widget.onApprove),
          child: _label(widget.approveLabel ?? l.approve, _busy == 'approve', scheme.onPrimary),
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: OutlinedButton(
          style: OutlinedButton.styleFrom(minimumSize: const Size(0, 42)),
          onPressed: locked ? null : () => _run('reject', widget.onReject),
          child: _label(l.notAccepted, _busy == 'reject', scheme.primary),
        ),
      ),
    ]);
  }
}
