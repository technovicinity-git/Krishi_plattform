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

/// Approve / reject buttons for one pending item.
class DecisionButtons extends StatelessWidget {
  const DecisionButtons({super.key, required this.onApprove, required this.onReject, this.approveLabel});
  final VoidCallback onApprove;
  final VoidCallback onReject;
  final String? approveLabel;

  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(
          child: FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size(0, 42)),
            onPressed: onApprove,
            child: Text(approveLabel ?? context.l.approve),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: OutlinedButton(
            style: OutlinedButton.styleFrom(minimumSize: const Size(0, 42)),
            onPressed: onReject,
            child: Text(context.l.notAccepted),
          ),
        ),
      ]);
}
