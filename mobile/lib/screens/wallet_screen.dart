import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../core/files.dart';
import '../core/format.dart';
import '../core/models.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

/// "bKash •••5678" / "City Bank •••4321".
String payoutText(Json p) {
  String tail(Object? v) => v == null || '$v'.length < 4 ? '' : '•••${'$v'.substring('$v'.length - 4)}';
  if (p['method'] == 'mobile') {
    final provider = '${p['mfsProvider'] ?? 'Mobile'}';
    return '${provider[0].toUpperCase()}${provider.substring(1)} ${tail(p['mobileNumber'])}'.trim();
  }
  return '${p['bankName'] ?? 'Bank'} ${tail(p['bankAccountNumber'])}'.trim();
}

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final _loader = GlobalKey<LoaderState<WalletData>>();

  Future<void> _reload() async => _loader.currentState?.reload();

  Future<void> _withdraw(WalletData w) async {
    final done = await showFormSheet<bool>(context, builder: (_) => _WithdrawForm(wallet: w));
    if (done == true && mounted) {
      showSnack(context, context.l.withdrawRequested);
      _reload();
    }
  }

  Future<void> _cancel(String id) async {
    final l = context.l;
    if (!await confirmDialog(context, title: l.cancelWithdrawal, body: l.cancelWithdrawalConfirm, confirm: l.cancelWithdrawal)) {
      return;
    }
    if (!mounted) return;
    try {
      await context.api.post('/api/wallet/withdrawals/$id/cancel');
      if (mounted) showSnack(context, l.saved);
      _reload();
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    return Scaffold(
      appBar: AppBar(
        title: Text(l.walletTitle),
        actions: [
          IconButton(
            tooltip: l.transactions,
            icon: const Icon(Icons.receipt_long_outlined),
            onPressed: () => context.push('/transactions'),
          ),
          IconButton(
            tooltip: l.downloadStatement,
            icon: const Icon(Icons.picture_as_pdf_outlined),
            onPressed: () => openStatement(context, '/api/reports/wallet', 'krishi-wallet.pdf'),
          ),
        ],
      ),
      body: Loader<WalletData>(
        key: _loader,
        load: () async => WalletData(await context.api.get('/api/mobile/v1/wallet')),
        builder: (context, w, _) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          children: [
            ResponsiveBody(
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Card(
                  color: KColors.greenDeep,
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(l.available, style: const TextStyle(color: Colors.white70)),
                      const SizedBox(height: 4),
                      Text(bdt(w.balance),
                          style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 14),
                      FilledButton.icon(
                        style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: KColors.greenDeep),
                        onPressed: w.payout == null || w.balance < w.minimum ? null : () => _withdraw(w),
                        icon: const Icon(Icons.south_west_rounded),
                        label: Text(l.withdraw),
                      ),
                      const SizedBox(height: 6),
                      Text(l.minimumWithdrawal(bdt(w.minimum)), style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    ]),
                  ),
                ),
                const SizedBox(height: 10),
                StatGrid(children: [
                  StatCard(label: l.earned, value: bdt(w.earned)),
                  StatCard(label: l.withdrawn, value: bdt(w.withdrawn)),
                  StatCard(label: l.pendingWithdrawal, value: bdt(w.pending)),
                ]),
                const SizedBox(height: 12),
                SectionCard(
                  title: l.payoutAccount,
                  trailing: TextButton(
                    onPressed: () async {
                      final saved = await context.push<bool>('/payout', extra: w.payout);
                      if (saved == true) _reload();
                    },
                    child: Text(w.payout == null ? l.addPayout : l.editPayout),
                  ),
                  child: w.payout == null
                      ? Text(l.noPayout, style: const TextStyle(color: KColors.inkSecondary))
                      : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('${payoutText(w.payout!)} · ${w.payout!['accountHolderName'] ?? ''}',
                              style: const TextStyle(fontWeight: FontWeight.w600)),
                          if (w.payout!['updatedAt'] != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(l.payoutUpdated(dateText(context.lang, w.payout!['updatedAt'])),
                                  style: const TextStyle(color: KColors.inkMuted, fontSize: 12)),
                            ),
                        ]),
                ),
                const SizedBox(height: 12),
                SectionCard(
                  title: l.withdrawals,
                  padding: EdgeInsets.zero,
                  child: w.withdrawals.isEmpty
                      ? Padding(padding: const EdgeInsets.all(16), child: Text(l.noWithdrawals))
                      : Column(children: [
                          for (final r in w.withdrawals)
                            ListTile(
                              title: Text(bdt(r['amount'] as num), style: const TextStyle(fontWeight: FontWeight.w700)),
                              subtitle: Text([
                                '${r['reference']} · ${dateText(lang, r['createdAt'])}',
                                l.withdrawTo('${r['destination']}'),
                                if (r['rejectionReason'] != null) '${r['rejectionReason']}',
                              ].join('\n')),
                              trailing: r['status'] == 'pending'
                                  ? TextButton(onPressed: () => _cancel('${r['id']}'), child: Text(l.cancel))
                                  : StatusChip(label(lang, 'withdrawalStatus', r['status'] as String?),
                                      tone: toneFor('${r['status']}')),
                            ),
                        ]),
                ),
                const SizedBox(height: 12),
                SectionCard(
                  title: l.transactions,
                  padding: EdgeInsets.zero,
                  child: w.transactions.isEmpty
                      ? Padding(padding: const EdgeInsets.all(16), child: Text(l.noTransactions))
                      : Column(children: [
                          for (final t in w.transactions)
                            ListTile(
                              title: Text(label(lang, 'walletType', t['type'] as String?),
                                  style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text([
                                if (t['description'] != null) '${t['description']}',
                                dateText(lang, t['createdAt']),
                              ].join('\n')),
                              trailing: Text(
                                '${(t['amount'] as num) > 0 ? '+' : ''}${bdt(t['amount'] as num)}',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: (t['amount'] as num) < 0 ? KColors.danger : KColors.greenDeep,
                                ),
                              ),
                            ),
                        ]),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _WithdrawForm extends StatefulWidget {
  const _WithdrawForm({required this.wallet});
  final WalletData wallet;
  @override
  State<_WithdrawForm> createState() => _WithdrawFormState();
}

class _WithdrawFormState extends State<_WithdrawForm> {
  final _amount = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final w = widget.wallet;
    final amount = double.tryParse(_amount.text) ?? 0;
    return FormSheet(
      title: l.withdrawTitle,
      submitLabel: l.withdraw,
      busy: _busy,
      error: _error,
      enabled: amount >= w.minimum && amount <= w.balance,
      onSubmit: () async {
        setState(() {
          _busy = true;
          _error = null;
        });
        try {
          await context.api.post('/api/wallet/withdrawals', {'amount': amount});
          if (context.mounted) Navigator.of(context).pop(true);
        } catch (e) {
          if (context.mounted) setState(() => _error = errorText(context, e));
        } finally {
          if (mounted) setState(() => _busy = false);
        }
      },
      children: [
        Text('${l.available}: ${bdt(w.balance)}', style: const TextStyle(fontWeight: FontWeight.w700)),
        TextField(
          controller: _amount,
          autofocus: true,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
          decoration: InputDecoration(labelText: l.amountBdt, helperText: l.minimumWithdrawal(bdt(w.minimum))),
          onChanged: (_) => setState(() {}),
        ),
        if (w.payout != null) Text(l.withdrawTo(payoutText(w.payout!)), style: const TextStyle(color: KColors.inkSecondary)),
      ],
    );
  }
}
