import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../core/session.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

// Investor: interests, the steps from an approved interest to a batch
// (identity → payout account → payment → Krishi's check), and the KYC form.

class InterestsScreen extends StatelessWidget {
  const InterestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    return Scaffold(
      appBar: AppBar(title: Text(l.myInterests)),
      body: Loader<List<InterestItem>>(
        load: () async {
          final data = await context.api.get('/api/mobile/v1/interests');
          return (data['interests'] as List).map((e) => InterestItem(Json.from(e as Map))).toList();
        },
        builder: (context, items, _) {
          if (items.isEmpty) {
            return ListView(children: [
              EmptyView(icon: Icons.inbox_outlined, title: l.noInterests, body: l.noInterestsHint),
              Center(child: FilledButton(onPressed: () => context.go('/plans'), child: Text(l.browsePlans))),
            ]);
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            children: [
              ResponsiveBody(
                child: Column(children: [
                  for (final i in items)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                            Row(children: [
                              Expanded(
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(i.reference, style: const TextStyle(fontSize: 12, color: KColors.inkMuted, fontWeight: FontWeight.w600)),
                                  Text(i.plan(lang), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                                ]),
                              ),
                              StatusChip(label(lang, 'status', i.status), tone: toneFor(i.status == 'submitted' ? 'pending' : i.status)),
                            ]),
                            const SizedBox(height: 8),
                            KeyValue(l.unitsCount(i.units), bdt(i.amount), bold: true),
                            if (i.stewardName != null) KeyValue(l.steward, i.stewardName!),
                            KeyValue(l.date, dateText(lang, i.createdAt)),
                            if (i.rejectionReason != null && i.status == 'not_approved') ...[
                              const SizedBox(height: 6),
                              InfoBanner(text: l.interestNotApproved(i.rejectionReason!), tone: Tone.danger),
                            ],
                            if (i.readyToPay) ...[
                              const SizedBox(height: 10),
                              FilledButton(onPressed: () => context.push('/onboarding/${i.reference}'), child: Text(l.continuePayment)),
                            ],
                            if (i.investmentId != null) ...[
                              const SizedBox(height: 10),
                              OutlinedButton(onPressed: () => context.push('/batches/${i.investmentId}'), child: Text(l.openBatch)),
                            ],
                          ]),
                        ),
                      ),
                    ),
                ]),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Approved interest → identity → payout account → payment → Krishi's check → batch.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.reference});
  final String reference;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> with WidgetsBindingObserver {
  final _loader = GlobalKey<LoaderState<Onboarding>>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Coming back from the payment page (or KYC on another screen): refresh.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _reload();
  }

  Future<void> _reload() async {
    await _loader.currentState?.reload();
    if (mounted) context.read<Session>().refreshMe().catchError((_) {});
  }

  Future<void> _payOnline(Onboarding o) async {
    try {
      final data = await context.api.post('/api/payments/sslcommerz/init', {'interest_id': o.interestId, 'locale': context.lang});
      final url = data['url'] as String?;
      if (url == null) throw Exception();
      await launchUrl(Uri.parse(url), mode: LaunchMode.inAppBrowserView);
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e), error: true);
    }
  }

  Future<void> _reportTransfer(Onboarding o) async {
    final sent = await showFormSheet<bool>(context, builder: (_) => _TransferForm(onboarding: o));
    if (sent == true && mounted) _reload();
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    return Scaffold(
      appBar: AppBar(title: Text(l.onboardingTitle)),
      body: Loader<Onboarding>(
        key: _loader,
        load: () async => Onboarding(await context.api.get('/api/mobile/v1/onboarding/${widget.reference}')),
        builder: (context, o, _) {
          const steps = ['kyc', 'payout', 'payment', 'review'];
          final at = o.step == 'done' ? steps.length : steps.indexOf(o.step);
          final deposit = o.deposit;
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            children: [
              ResponsiveBody(
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(o.reference, style: const TextStyle(fontSize: 12, color: KColors.inkMuted, fontWeight: FontWeight.w600)),
                        Text(o.plan(lang), style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 8),
                        KeyValue(l.unitsCount(o.units), bdt(o.amount), bold: true, valueColor: KColors.greenDeep),
                      ]),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (o.step != 'closed')
                    StepProgress(current: at, labels: [l.stepKyc, l.stepPayout, l.stepPayment, l.stepReview]),
                  const SizedBox(height: 14),
                  ...switch (o.step) {
                    'kyc' => [
                        if (o.kycStatus == 'pending' || o.kycStatus == 'under_review')
                          InfoBanner(text: l.kycPendingNote, tone: Tone.info)
                        else ...[
                          InfoBanner(
                            text: o.kycRejectionReason != null && o.kycStatus != 'not_started'
                                ? l.kycRejectedNote(o.kycRejectionReason!)
                                : l.kycNeeded,
                            tone: Tone.warning,
                          ),
                          const SizedBox(height: 12),
                          FilledButton(
                            onPressed: () async {
                              final done = await context.push<bool>('/kyc');
                              if (done == true) _reload();
                            },
                            child: Text(l.verifyNow),
                          ),
                        ],
                      ],
                    'payout' => [
                        InfoBanner(text: l.payoutNeeded, tone: Tone.warning),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: () async {
                            final saved = await context.push<bool>('/payout');
                            if (saved == true) _reload();
                          },
                          child: Text(l.addPayout),
                        ),
                      ],
                    'payment' => [
                        if (deposit != null && deposit['status'] == 'rejected') ...[
                          InfoBanner(text: l.depositNotAccepted('${deposit['rejectionReason'] ?? ''}'), tone: Tone.danger),
                          const SizedBox(height: 12),
                        ],
                        if (o.unitsLeft < o.units) ...[
                          InfoBanner(text: l.notEnoughUnits(o.unitsLeft), tone: Tone.danger),
                          const SizedBox(height: 12),
                        ],
                        Card(
                          color: KColors.greenDeep,
                          child: Padding(
                            padding: const EdgeInsets.all(18),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(l.amountToPay, style: const TextStyle(color: Colors.white70)),
                              Text(bdt(o.amount), style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800)),
                            ]),
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (o.onlineEnabled) ...[
                          FilledButton.icon(
                            onPressed: o.unitsLeft >= o.units ? () => _payOnline(o) : null,
                            icon: const Icon(Icons.credit_card),
                            label: Text(l.payOnline),
                          ),
                          const SizedBox(height: 6),
                          Text(l.payOnlineHint, style: const TextStyle(fontSize: 12.5, color: KColors.inkSecondary)),
                          const SizedBox(height: 14),
                        ],
                        Text(l.orTransfer, style: const TextStyle(color: KColors.inkSecondary)),
                        const SizedBox(height: 8),
                        for (final a in o.platformAccounts)
                          Card(
                            child: ListTile(
                              leading: Icon(a['method'] == 'bank' ? Icons.account_balance : Icons.phone_android, color: KColors.greenDeep),
                              title: Text('${a['provider'] ?? ''} · ${a['accountNumber'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w700)),
                              subtitle: Text([a['accountName'], a['branchName']].whereType<String>().join(' · ')),
                              trailing: IconButton(
                                icon: const Icon(Icons.copy, size: 20),
                                onPressed: () {
                                  Clipboard.setData(ClipboardData(text: '${a['accountNumber'] ?? ''}'));
                                  showSnack(context, l.saved);
                                },
                              ),
                            ),
                          ),
                        const SizedBox(height: 8),
                        OutlinedButton.icon(
                          onPressed: o.unitsLeft >= o.units ? () => _reportTransfer(o) : null,
                          icon: const Icon(Icons.receipt_long_outlined),
                          label: Text(l.reportTransfer),
                        ),
                      ],
                    'review' => [InfoBanner(text: l.depositReview('${deposit?['reference'] ?? ''}'), tone: Tone.info)],
                    'done' => [
                        InfoBanner(text: l.onboardingDone, tone: Tone.success),
                        if (o.investmentId != null) ...[
                          const SizedBox(height: 12),
                          FilledButton(onPressed: () => context.go('/batches/${o.investmentId}'), child: Text(l.openBatch)),
                        ],
                      ],
                    _ => [InfoBanner(text: l.interestClosed, tone: Tone.neutral)],
                  },
                  const SizedBox(height: 16),
                  TextButton.icon(onPressed: _reload, icon: const Icon(Icons.refresh), label: Text(l.refresh)),
                ]),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _TransferForm extends StatefulWidget {
  const _TransferForm({required this.onboarding});
  final Onboarding onboarding;
  @override
  State<_TransferForm> createState() => _TransferFormState();
}

class _TransferFormState extends State<_TransferForm> {
  String _method = 'mfs';
  final _txn = TextEditingController();
  final _sender = TextEditingController();
  final _note = TextEditingController();
  DateTime _date = DateTime.now();
  XFile? _proof;
  bool _busy = false;
  String? _error;

  String get _dateValue =>
      '${_date.year}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}';

  bool get _valid => _method == 'bank' ? _txn.text.trim().isNotEmpty : _sender.text.trim().isNotEmpty;

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.api.postForm('/api/deposits', {
        'interest_id': widget.onboarding.interestId,
        'method': _method,
        'txn_id': _txn.text.trim(),
        'sender_number': _sender.text.trim(),
        'deposit_date': _dateValue,
        'note': _note.text.trim(),
      }, files: {'proof': _proof});
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return FormSheet(
      title: l.transferTitle,
      submitLabel: l.send,
      busy: _busy,
      error: _error,
      enabled: _valid,
      onSubmit: _send,
      children: [
        KeyValue(l.amountToPay, bdt(widget.onboarding.amount), bold: true),
        SegmentedButton<String>(
          showSelectedIcon: false,
          segments: [
            ButtonSegment(value: 'mfs', label: Text(l.methodMfs)),
            ButtonSegment(value: 'bank', label: Text(l.methodBank)),
          ],
          selected: {_method},
          onSelectionChanged: (v) => setState(() => _method = v.first),
        ),
        if (_method == 'mfs')
          TextField(controller: _sender, keyboardType: TextInputType.phone, onChanged: (_) => setState(() {}),
              decoration: InputDecoration(labelText: l.senderNumber)),
        TextField(controller: _txn, onChanged: (_) => setState(() {}),
            decoration: InputDecoration(labelText: _method == 'bank' ? l.txnId : l.optional(l.txnId))),
        InkWell(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _date,
              firstDate: DateTime.now().subtract(const Duration(days: 60)),
              lastDate: DateTime.now(),
            );
            if (picked != null) setState(() => _date = picked);
          },
          child: InputDecorator(
            decoration: InputDecoration(labelText: l.dateSent, suffixIcon: const Icon(Icons.calendar_today_outlined, size: 20)),
            child: Text(dateText(context.lang, _date)),
          ),
        ),
        TextField(controller: _note, minLines: 2, maxLines: 4, decoration: InputDecoration(labelText: l.optional(l.note))),
        PhotoField(label: l.transferProof, file: _proof, onChanged: (f) => setState(() => _proof = f)),
      ],
    );
  }
}

/// National ID verification: number, addresses, both sides of the NID and an
/// optional photo. Same API as the website (POST /api/kyc/submit).
class KycScreen extends StatefulWidget {
  const KycScreen({super.key});
  @override
  State<KycScreen> createState() => _KycScreenState();
}

class _KycScreenState extends State<KycScreen> {
  final _nid = TextEditingController();
  final _present = TextEditingController();
  final _permanent = TextEditingController();
  bool _same = false;
  XFile? _front;
  XFile? _back;
  XFile? _photo;
  bool _busy = false;
  String? _error;

  bool get _valid =>
      RegExp(r'^\d{10,17}$').hasMatch(_nid.text.trim()) &&
      _present.text.trim().length >= 5 &&
      (_same || _permanent.text.trim().length >= 5) &&
      _front != null &&
      _back != null;

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final session = context.read<Session>();
    try {
      await context.api.postForm('/api/kyc/submit', {
        'docType': 'nid',
        'nidNumber': _nid.text.trim(),
        'presentAddress': _present.text.trim(),
        'permanentAddress': (_same ? _present.text : _permanent.text).trim(),
      }, files: {'nidFront': _front, 'nidBack': _back, 'profilePhoto': _photo});
      await session.refreshMe().catchError((_) {});
      if (!mounted) return;
      showSnack(context, context.l.kycSubmitted);
      context.pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.kycTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ResponsiveBody(
            maxWidth: 560,
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text(l.kycIntro, style: const TextStyle(color: KColors.inkSecondary)),
              const SizedBox(height: 16),
              TextField(
                controller: _nid,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                maxLength: 17,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(labelText: l.nidNumber, helperText: l.nidHint, counterText: ''),
              ),
              const SizedBox(height: 14),
              TextField(controller: _present, minLines: 2, maxLines: 3, onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(labelText: l.presentAddress)),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: _same,
                onChanged: (v) => setState(() => _same = v ?? false),
                title: Text(l.sameAsPresent),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              if (!_same) ...[
                TextField(controller: _permanent, minLines: 2, maxLines: 3, onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(labelText: l.permanentAddress)),
                const SizedBox(height: 14),
              ],
              PhotoField(label: l.nidFront, file: _front, required: true, onChanged: (f) => setState(() => _front = f)),
              const SizedBox(height: 14),
              PhotoField(label: l.nidBack, file: _back, required: true, onChanged: (f) => setState(() => _back = f)),
              const SizedBox(height: 14),
              PhotoField(label: l.yourPhoto, file: _photo, onChanged: (f) => setState(() => _photo = f)),
              const SizedBox(height: 16),
              if (_error != null) ...[
                Text(_error!, style: const TextStyle(color: KColors.danger, fontWeight: FontWeight.w600)),
                const SizedBox(height: 10),
              ],
              FilledButton(
                onPressed: _busy || !_valid ? null : _submit,
                child: _busy
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : Text(l.submit),
              ),
            ]),
          ),
        ],
      ),
    );
  }
}

/// Steps joined by a line that fills up to the current step (0-based;
/// `labels.length` means all done). Finished steps show a tick.
class StepProgress extends StatelessWidget {
  const StepProgress({super.key, required this.current, required this.labels});
  final int current;
  final List<String> labels;

  static const _circle = 28.0;

  @override
  Widget build(BuildContext context) {
    final count = labels.length;
    final filled = (current.clamp(0, count - 1)) / (count - 1);
    return LayoutBuilder(builder: (context, c) {
      // The line runs between the centres of the first and last column.
      final inset = c.maxWidth / count / 2;
      final track = c.maxWidth - inset * 2;
      return Stack(children: [
        Positioned(
          left: inset,
          top: _circle / 2 - 1.5,
          child: Container(width: track, height: 3, decoration: BoxDecoration(color: KColors.stone, borderRadius: BorderRadius.circular(2))),
        ),
        Positioned(
          left: inset,
          top: _circle / 2 - 1.5,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            width: track * filled,
            height: 3,
            decoration: BoxDecoration(color: KColors.greenDeep, borderRadius: BorderRadius.circular(2)),
          ),
        ),
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          for (var i = 0; i < count; i++)
            Expanded(
              child: Column(children: [
                Container(
                  width: _circle,
                  height: _circle,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i < current ? KColors.greenDeep : (i == current ? KColors.brand : KColors.stone),
                    // A ring in the page colour so the line passes behind the circle.
                    border: Border.all(color: KColors.cream, width: 3),
                  ),
                  child: i < current
                      ? const Icon(Icons.check, size: 14, color: Colors.white)
                      : Text('${i + 1}',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: i == current ? Colors.white : KColors.inkSecondary)),
                ),
                const SizedBox(height: 4),
                Text(
                  labels[i],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: i == current ? FontWeight.w700 : FontWeight.w500,
                    color: i < current ? KColors.greenDeep : (i == current ? KColors.brand : KColors.inkMuted),
                  ),
                ),
              ]),
            ),
        ]),
      ]);
    });
  }
}
