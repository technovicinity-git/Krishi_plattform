import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/models.dart';
import '../ui/widgets.dart';

/// Where Krishi sends this person's withdrawals: a mobile wallet or a bank account.
/// Saves through the same API as the website (POST /api/onboarding/withdrawal).
class PayoutScreen extends StatefulWidget {
  const PayoutScreen({super.key});

  @override
  State<PayoutScreen> createState() => _PayoutScreenState();
}

class _PayoutScreenState extends State<PayoutScreen> {
  String _method = 'mobile';
  String _provider = 'bkash';
  final _mobile = TextEditingController();
  final _holder = TextEditingController();
  final _bank = TextEditingController();
  final _account = TextEditingController();
  final _branch = TextEditingController();
  final _routing = TextEditingController();
  bool _busy = false;
  String? _error;
  bool _filled = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_filled) return;
    _filled = true;
    final current = GoRouterState.of(context).extra;
    if (current is Json) {
      _method = current['method'] == 'bank' ? 'bank' : 'mobile';
      _provider = '${current['mfsProvider'] ?? 'bkash'}';
      _mobile.text = '${current['mobileNumber'] ?? ''}';
      _holder.text = '${current['accountHolderName'] ?? ''}';
      _bank.text = '${current['bankName'] ?? ''}';
      _account.text = '${current['bankAccountNumber'] ?? ''}';
      _branch.text = '${current['bankBranch'] ?? ''}';
      _routing.text = '${current['bankRoutingNumber'] ?? ''}';
    }
  }

  bool get _valid {
    if (_holder.text.trim().length < 2) return false;
    if (_method == 'mobile') return _mobile.text.trim().length >= 11;
    return _bank.text.trim().length >= 2 &&
        _account.text.trim().length >= 6 &&
        _branch.text.trim().length >= 2 &&
        _routing.text.trim().length >= 6;
  }

  Future<void> _save() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.api.post('/api/onboarding/withdrawal', {
        'method': _method,
        'accountHolderName': _holder.text.trim(),
        if (_method == 'mobile') ...{'mfsProvider': _provider, 'mobileNumber': _mobile.text.trim()},
        if (_method == 'bank') ...{
          'bankName': _bank.text.trim(),
          'bankAccountNumber': _account.text.trim(),
          'bankBranch': _branch.text.trim(),
          'bankRoutingNumber': _routing.text.trim(),
        },
      });
      if (mounted) {
        showSnack(context, context.l.saved);
        context.pop(true);
      }
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    Widget field(TextEditingController c, String label, {TextInputType? type}) => Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: TextField(
            controller: c,
            keyboardType: type,
            decoration: InputDecoration(labelText: label),
            onChanged: (_) => setState(() {}),
          ),
        );
    return Scaffold(
      appBar: AppBar(title: Text(l.payoutAccount)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ResponsiveBody(
            maxWidth: 560,
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              SegmentedButton<String>(
                showSelectedIcon: false,
                segments: [
                  ButtonSegment(value: 'mobile', label: Text(l.payoutMobile), icon: const Icon(Icons.phone_android)),
                  ButtonSegment(value: 'bank', label: Text(l.payoutBank), icon: const Icon(Icons.account_balance)),
                ],
                selected: {_method},
                onSelectionChanged: (v) => setState(() => _method = v.first),
              ),
              const SizedBox(height: 18),
              if (_method == 'mobile') ...[
                Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: ChoiceField(
                    label: l.provider,
                    value: _provider,
                    options: const {'bkash': 'bKash', 'nagad': 'Nagad', 'rocket': 'Rocket'},
                    onChanged: (v) => setState(() => _provider = v ?? _provider),
                  ),
                ),
                field(_mobile, l.mobileNumber, type: TextInputType.phone),
              ] else ...[
                field(_bank, l.bankName),
                field(_account, l.accountNumber, type: TextInputType.number),
                field(_branch, l.branch),
                field(_routing, l.routingNumber, type: TextInputType.number),
              ],
              field(_holder, l.accountHolder, type: TextInputType.name),
              if (_error != null) ...[
                Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error, fontWeight: FontWeight.w600)),
                const SizedBox(height: 10),
              ],
              FilledButton(
                onPressed: _busy || !_valid ? null : _save,
                child: _busy
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : Text(l.save),
              ),
            ]),
          ),
        ],
      ),
    );
  }
}
