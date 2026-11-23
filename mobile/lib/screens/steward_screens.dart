import 'package:flutter/material.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../core/validate.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

// Steward: farmers (add, resend activation code), assigning a farmer to a
// batch, and their plans on Krishi.

class FarmersScreen extends StatefulWidget {
  const FarmersScreen({super.key});
  @override
  State<FarmersScreen> createState() => _FarmersScreenState();
}

class _FarmersScreenState extends State<FarmersScreen> {
  final _loader = GlobalKey<LoaderState<List<Json>>>();

  Future<void> _add() async {
    final code = await showFormSheet<String?>(context, builder: (_) => const _AddFarmerForm());
    if (!mounted || code == null) return;
    // code is '' when the server didn't return one (live site: sent by SMS).
    showSnack(context, code.isEmpty ? context.l.farmerAdded : '${context.l.farmerAdded} ${context.l.activationCode(code)}');
    _loader.currentState?.reload();
  }

  Future<void> _resend(String id) async {
    try {
      final data = await context.api.post('/api/steward/farmers/$id/resend-activation');
      if (!mounted) return;
      final code = data['devOtp'] as String?;
      showSnack(context, code == null ? context.l.codeSent : '${context.l.codeSent} ${context.l.activationCode(code)}');
    } catch (e) {
      if (mounted) showSnack(context, errorText(context, e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.farmersTitle)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        icon: const Icon(Icons.person_add_alt_1),
        label: Text(l.addFarmer),
      ),
      body: Loader<List<Json>>(
        key: _loader,
        load: () async {
          final data = await context.api.get('/api/mobile/v1/steward/farmers');
          return (data['farmers'] as List).map((e) => Json.from(e as Map)).toList();
        },
        builder: (context, farmers, _) => farmers.isEmpty
            ? ListView(children: [EmptyView(icon: Icons.groups_outlined, title: l.noFarmers, body: l.noFarmersHint)])
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                children: [
                  ResponsiveBody(
                    child: Column(children: [
                      for (final f in farmers)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Card(
                            child: ListTile(
                              leading: const CircleAvatar(backgroundColor: KColors.brandTint, child: Icon(Icons.person, color: KColors.greenDeep)),
                              title: Text('${f['fullName'] ?? '—'}', style: const TextStyle(fontWeight: FontWeight.w700)),
                              subtitle: Text([
                                '${f['phone'] ?? ''}',
                                f['status'] == 'active'
                                    ? l.activeBatchesCount((f['activeBatches'] as num?)?.toInt() ?? 0)
                                    : l.pendingActivation,
                              ].join('\n')),
                              isThreeLine: true,
                              trailing: f['status'] == 'active'
                                  ? IconButton(
                                      icon: const Icon(Icons.call_outlined),
                                      onPressed: f['phone'] == null ? null : () => callPhone('${f['phone']}'),
                                    )
                                  : TextButton(onPressed: () => _resend('${f['id']}'), child: Text(l.resendCode)),
                            ),
                          ),
                        ),
                    ]),
                  ),
                ],
              ),
      ),
    );
  }
}

class _AddFarmerForm extends StatefulWidget {
  const _AddFarmerForm();
  @override
  State<_AddFarmerForm> createState() => _AddFarmerFormState();
}

class _AddFarmerFormState extends State<_AddFarmerForm> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _nid = TextEditingController();
  final _address = TextEditingController();
  bool _busy = false;
  String? _error;

  bool get _valid =>
      _name.text.trim().length >= 2 &&
      isValidBdPhone(_phone.text) &&
      RegExp(r'^\d{10,17}$').hasMatch(_nid.text.trim()) &&
      _address.text.trim().length >= 5;

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final data = await context.api.post('/api/steward/farmers', {
        'fullName': _name.text.trim(),
        'phone': _phone.text.trim(),
        'nidNumber': _nid.text.trim(),
        'presentAddress': _address.text.trim(),
      });
      if (mounted) Navigator.of(context).pop((data['devOtp'] as String?) ?? '');
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
      title: l.addFarmer,
      submitLabel: l.addFarmer,
      busy: _busy,
      error: _error,
      enabled: _valid,
      onSubmit: _send,
      children: [
        TextField(controller: _name, textCapitalization: TextCapitalization.words, onChanged: (_) => setState(() {}),
            decoration: InputDecoration(labelText: l.fullName)),
        TextField(controller: _phone, keyboardType: TextInputType.phone, onChanged: (_) => setState(() {}),
            decoration: InputDecoration(labelText: l.phoneLabel, hintText: l.phoneHint)),
        TextField(controller: _nid, keyboardType: TextInputType.number, onChanged: (_) => setState(() {}),
            decoration: InputDecoration(labelText: l.nidNumber, helperText: l.nidHint)),
        TextField(controller: _address, minLines: 2, maxLines: 3, onChanged: (_) => setState(() {}),
            decoration: InputDecoration(labelText: l.farmerAddress)),
      ],
    );
  }
}

/// Bottom sheet: pick one of the steward's activated farmers for a batch.
class AssignFarmerSheet extends StatefulWidget {
  const AssignFarmerSheet({super.key, required this.investmentId});
  final String investmentId;
  @override
  State<AssignFarmerSheet> createState() => _AssignFarmerSheetState();
}

class _AssignFarmerSheetState extends State<AssignFarmerSheet> {
  List<Json>? _farmers;
  String? _picked;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.api.get('/api/mobile/v1/steward/farmers');
      if (!mounted) return;
      setState(() => _farmers = (data['farmers'] as List).map((e) => Json.from(e as Map)).where((f) => f['status'] == 'active').toList());
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    }
  }

  Future<void> _assign() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.api.post('/api/steward/investments/${widget.investmentId}/assign', {'farmer_id': _picked});
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
    final farmers = _farmers;
    return FormSheet(
      title: l.assignFarmer,
      submitLabel: l.assignFarmer,
      busy: _busy,
      error: _error,
      enabled: _picked != null,
      onSubmit: _assign,
      children: [
        if (farmers == null)
          const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
        else if (farmers.isEmpty)
          InfoBanner(text: l.noActiveFarmers, tone: Tone.warning)
        else
          RadioGroup<String>(
            groupValue: _picked,
            onChanged: (v) => setState(() => _picked = v),
            child: Column(children: [
              for (final f in farmers)
                Card(
                  child: RadioListTile<String>(
                    value: '${f['id']}',
                    title: Text('${f['fullName'] ?? '—'}', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('${f['phone'] ?? ''} · ${l.activeBatchesCount((f['activeBatches'] as num?)?.toInt() ?? 0)}'),
                  ),
                ),
            ]),
          ),
      ],
    );
  }
}

class StewardPlansScreen extends StatelessWidget {
  const StewardPlansScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    String status(String s) => switch (s) {
          'approved' => l.offeringStatus_approved,
          'pending_approval' => l.offeringStatus_pending_approval,
          'paused' => l.offeringStatus_paused,
          'closed' => l.offeringStatus_closed,
          'rejected' => l.offeringStatus_rejected,
          _ => s,
        };
    return Scaffold(
      appBar: AppBar(title: Text(l.myPlansTitle)),
      body: Loader<List<Json>>(
        load: () async {
          final data = await context.api.get('/api/mobile/v1/steward/plans');
          return (data['plans'] as List).map((e) => Json.from(e as Map)).toList();
        },
        builder: (context, plans, _) => plans.isEmpty
            ? ListView(children: [EmptyView(icon: Icons.assignment_outlined, title: l.noStewardPlans, body: l.noStewardPlansHint)])
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                children: [
                  ResponsiveBody(
                    child: Column(children: [
                      for (final p in plans)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                                Row(children: [
                                  Expanded(
                                    child: Text(planName(lang, p['planEn'] as String?, p['planBn'] as String?),
                                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                                  ),
                                  StatusChip(status('${p['status']}'), tone: toneFor(p['status'] == 'approved' ? 'active' : '${p['status']}')),
                                ]),
                                const SizedBox(height: 8),
                                KeyValue(l.unitPrice, bdt(p['unitPrice'] as num)),
                                KeyValue(l.estReturn, '${(p['roiMin'] as num).toStringAsFixed(0)}–${(p['roiMax'] as num).toStringAsFixed(0)}%'),
                                KeyValue(l.unitsLabel, l.fundedOf((p['unitsFunded'] as num).toInt(), (p['unitsOffered'] as num).toInt())),
                                const SizedBox(height: 6),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: (p['unitsOffered'] as num) == 0 ? 0 : (p['unitsFunded'] as num) / (p['unitsOffered'] as num),
                                    minHeight: 6,
                                    backgroundColor: KColors.stone,
                                    color: KColors.brand,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '${l.openInterestsCount((p['openInterests'] as num).toInt())} · ${l.activeBatchesCount((p['activeBatches'] as num).toInt())}',
                                  style: const TextStyle(fontSize: 12.5, color: KColors.inkSecondary),
                                ),
                                if (p['status'] == 'rejected' && p['rejectionReason'] != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 8),
                                    child: InfoBanner(text: '${p['rejectionReason']}', tone: Tone.danger),
                                  ),
                              ]),
                            ),
                          ),
                        ),
                    ]),
                  ),
                ],
              ),
      ),
    );
  }
}
