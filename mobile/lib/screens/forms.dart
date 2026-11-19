import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

// Every form posts to the same API the website uses, so the server applies
// the same rules. Each returns true when something was saved.

const kPurposes = ['animal_purchase', 'feed', 'medical', 'transport', 'other'];
const kRecordKinds = ['weight', 'health', 'vaccination', 'treatment', 'note', 'death'];
const kDeathCauses = ['disease', 'accident', 'calving', 'unknown', 'other'];

String _today() {
  final d = DateTime.now();
  return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

final _money = [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))];

InputDecoration _dec(String label, {String? hint, String? helper}) =>
    InputDecoration(labelText: label, hintText: hint, helperText: helper, helperMaxLines: 2);

/// Runs [call], shows the error in the form or closes the sheet on success.
mixin _Submit<T extends StatefulWidget> on State<T> {
  bool busy = false;
  String? error;

  Future<void> submit(Future<void> Function() call) async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await call();
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => error = errorText(context, e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}

class _DateField extends StatelessWidget {
  const _DateField({required this.label, required this.value, required this.onChanged});
  final String label;
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: () async {
          final now = DateTime.now();
          final picked = await showDatePicker(
            context: context,
            initialDate: DateTime.tryParse(value) ?? now,
            firstDate: DateTime(now.year - 2),
            lastDate: now,
          );
          if (picked != null) {
            onChanged('${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}');
          }
        },
        child: InputDecorator(
          decoration: _dec(label).copyWith(suffixIcon: const Icon(Icons.calendar_today_outlined, size: 20)),
          child: Text(dateText(context.lang, value)),
        ),
      );
}

// ─── Farmer: confirm purchase ────────────────────────────────────────────────

class PurchaseForm extends StatefulWidget {
  const PurchaseForm({super.key, required this.batch});
  final InvestmentDetail batch;
  @override
  State<PurchaseForm> createState() => _PurchaseFormState();
}

class _PurchaseFormState extends State<PurchaseForm> with _Submit {
  late final _animals = TextEditingController(text: '${widget.batch.units}');
  final _cost = TextEditingController();
  final _breed = TextEditingController();
  final _weight = TextEditingController();
  final _note = TextEditingController();
  XFile? _photo;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return FormSheet(
      title: l.purchaseTitle,
      submitLabel: l.actConfirmPurchase,
      busy: busy,
      error: error,
      enabled: (int.tryParse(_animals.text) ?? 0) > 0 && (double.tryParse(_cost.text) ?? 0) > 0,
      onSubmit: () => submit(() => context.api.postForm('/api/farmer/investments/${widget.batch.id}/purchase', {
            'animals': _animals.text,
            'total_cost': _cost.text,
            'breed': _breed.text.trim(),
            'avg_weight': _weight.text,
            'note': _note.text.trim(),
          }, files: {'photo': _photo})),
      children: [
        TextField(controller: _animals, keyboardType: TextInputType.number, inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: _dec(l.animalsBought), onChanged: (_) => setState(() {})),
        TextField(controller: _cost, keyboardType: const TextInputType.numberWithOptions(decimal: true), inputFormatters: _money,
            decoration: _dec(l.totalCost), onChanged: (_) => setState(() {})),
        TextField(controller: _breed, decoration: _dec(l.optional(l.breed))),
        TextField(controller: _weight, keyboardType: const TextInputType.numberWithOptions(decimal: true), inputFormatters: _money,
            decoration: _dec(l.optional(l.avgWeight))),
        TextField(controller: _note, minLines: 2, maxLines: 4, decoration: _dec(l.optional(l.note))),
        PhotoField(label: l.photo, file: _photo, onChanged: (f) => setState(() => _photo = f)),
      ],
    );
  }
}

// ─── Farmer: fund request ────────────────────────────────────────────────────

class FundRequestForm extends StatefulWidget {
  const FundRequestForm({super.key, required this.batch});
  final InvestmentDetail batch;
  @override
  State<FundRequestForm> createState() => _FundRequestFormState();
}

class _FundRequestFormState extends State<FundRequestForm> with _Submit {
  String _purpose = 'feed';
  final _amount = TextEditingController();
  final _note = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    return FormSheet(
      title: l.fundRequestTitle,
      submitLabel: l.send,
      busy: busy,
      error: error,
      enabled: (double.tryParse(_amount.text) ?? 0) > 0,
      onSubmit: () => submit(() => context.api.post('/api/farmer/fund-requests', {
            'investment_id': widget.batch.id,
            'purpose': _purpose,
            'amount': _amount.text,
            if (_note.text.trim().isNotEmpty) 'note': _note.text.trim(),
          })),
      children: [
        ChoiceField(
          label: l.purpose,
          value: _purpose,
          options: {for (final p in kPurposes) p: label(lang, 'purpose', p)},
          onChanged: (v) => setState(() => _purpose = v ?? _purpose),
        ),
        TextField(controller: _amount, keyboardType: const TextInputType.numberWithOptions(decimal: true), inputFormatters: _money,
            decoration: _dec(l.amountBdt, helper: l.budgetLeftHint), onChanged: (_) => setState(() {})),
        TextField(controller: _note, minLines: 2, maxLines: 4, decoration: _dec(l.optional(l.note))),
      ],
    );
  }
}

// ─── Farmer: expense ─────────────────────────────────────────────────────────

class ExpenseForm extends StatefulWidget {
  const ExpenseForm({super.key, required this.batch});
  final InvestmentDetail batch;
  @override
  State<ExpenseForm> createState() => _ExpenseFormState();
}

class _ExpenseFormState extends State<ExpenseForm> with _Submit {
  String _category = 'feed';
  final _amount = TextEditingController();
  final _description = TextEditingController();
  XFile? _receipt;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    return FormSheet(
      title: l.expenseTitle,
      submitLabel: l.save,
      busy: busy,
      error: error,
      enabled: (double.tryParse(_amount.text) ?? 0) > 0,
      onSubmit: () => submit(() => context.api.postForm('/api/farmer/expenses', {
            'investment_id': widget.batch.id,
            'category': _category,
            'amount': _amount.text,
            'description': _description.text.trim(),
          }, files: {'receipt': _receipt})),
      children: [
        ChoiceField(
          label: l.category,
          value: _category,
          options: {for (final p in kPurposes) p: label(lang, 'purpose', p)},
          onChanged: (v) => setState(() => _category = v ?? _category),
        ),
        TextField(controller: _amount, keyboardType: const TextInputType.numberWithOptions(decimal: true), inputFormatters: _money,
            decoration: _dec(l.amountBdt), onChanged: (_) => setState(() {})),
        TextField(controller: _description, minLines: 2, maxLines: 4, decoration: _dec(l.optional(l.description))),
        PhotoField(label: l.receiptPhoto, file: _receipt, onChanged: (f) => setState(() => _receipt = f)),
      ],
    );
  }
}

// ─── Farmer: record sale ─────────────────────────────────────────────────────

class SaleForm extends StatefulWidget {
  const SaleForm({super.key, required this.batch});
  final InvestmentDetail batch;
  @override
  State<SaleForm> createState() => _SaleFormState();
}

class _SaleFormState extends State<SaleForm> with _Submit {
  late final List<Animal> _animals = widget.batch.animals.where((a) => a.status != 'sold').toList();
  late final Set<String> _picked = {for (final a in _animals) if (a.active) a.id};
  late final _count = TextEditingController(text: '${widget.batch.units}');
  final _amount = TextEditingController();
  final _buyer = TextEditingController();
  final _phone = TextEditingController();
  final _note = TextEditingController();
  String _date = _today();
  XFile? _photo;

  bool get _tracked => _animals.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final valid = (double.tryParse(_amount.text) ?? 0) > 0 &&
        (_tracked ? _picked.isNotEmpty : (int.tryParse(_count.text) ?? 0) > 0);
    return FormSheet(
      title: l.saleFormTitle,
      submitLabel: l.actRecordSale,
      busy: busy,
      error: error,
      enabled: valid,
      onSubmit: () => submit(() => context.api.postForm('/api/farmer/investments/${widget.batch.id}/sale', {
            if (_tracked) 'animal_ids': _picked.toList() else 'animals_sold': _count.text,
            'sale_amount': _amount.text,
            'sale_date': _date,
            'buyer_name': _buyer.text.trim(),
            'buyer_phone': _phone.text.trim(),
            'note': _note.text.trim(),
          }, files: {'photo': _photo})),
      children: [
        if (_tracked)
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(l.whichAnimals(_picked.length), style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              for (final a in _animals)
                FilterChip(
                  label: Text(a.active ? a.tag : '${a.tag} · ${label(lang, 'animalStatus', a.status)}'),
                  selected: _picked.contains(a.id),
                  onSelected: a.active
                      ? (v) => setState(() => v ? _picked.add(a.id) : _picked.remove(a.id))
                      : null,
                ),
            ]),
            if (_animals.any((a) => !a.active)) ...[
              const SizedBox(height: 6),
              Text(l.deadNotSellable, style: const TextStyle(fontSize: 12, color: KColors.inkSecondary)),
            ],
          ])
        else
          TextField(controller: _count, keyboardType: TextInputType.number, inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: _dec(l.animalsSold), onChanged: (_) => setState(() {})),
        TextField(controller: _amount, keyboardType: const TextInputType.numberWithOptions(decimal: true), inputFormatters: _money,
            decoration: _dec(l.salePrice), onChanged: (_) => setState(() {})),
        _DateField(label: l.saleDate, value: _date, onChanged: (v) => setState(() => _date = v)),
        TextField(controller: _buyer, decoration: _dec(l.optional(l.buyerName))),
        TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: _dec(l.optional(l.buyerPhone))),
        TextField(controller: _note, minLines: 2, maxLines: 4, decoration: _dec(l.optional(l.note), hint: l.saleNoteHint)),
        PhotoField(label: l.photo, file: _photo, onChanged: (f) => setState(() => _photo = f)),
      ],
    );
  }
}

// ─── Farmer: send money to Krishi ────────────────────────────────────────────

class RemitForm extends StatefulWidget {
  const RemitForm({super.key, required this.batch});
  final InvestmentDetail batch;
  @override
  State<RemitForm> createState() => _RemitFormState();
}

class _RemitFormState extends State<RemitForm> with _Submit {
  String _method = 'mfs';
  final _txn = TextEditingController();
  final _sender = TextEditingController();
  final _note = TextEditingController();
  XFile? _proof;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final sale = widget.batch.sale!;
    final cash = _method == 'cash';
    // Krishi's receiving accounts for the chosen method ('mfs' or 'bank').
    final accounts = cash ? const <Json>[] : widget.batch.platformAccounts.where((a) => a['method'] == _method).toList();
    return FormSheet(
      title: l.remitTitle,
      submitLabel: l.send,
      busy: busy,
      error: error,
      enabled: cash || (_txn.text.trim().isNotEmpty && _proof != null),
      onSubmit: () => submit(() => context.api.postForm('/api/farmer/investments/${widget.batch.id}/remit', {
            'method': _method,
            'txn_id': _txn.text.trim(),
            'sender': _sender.text.trim(),
            'note': _note.text.trim(),
          }, files: {'proof': _proof})),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: KColors.brandTint, borderRadius: BorderRadius.circular(12)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(l.remitAmount, style: const TextStyle(color: KColors.inkSecondary)),
            Text(bdt(sale.toSend), style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: KColors.greenDeep)),
            if (sale.fundsReturned > 0)
              Text('${l.fundsReturned}: ${bdt(sale.fundsReturned)}', style: const TextStyle(fontSize: 12.5)),
          ]),
        ),
        SegmentedButton<String>(
          showSelectedIcon: false,
          segments: [
            ButtonSegment(value: 'mfs', label: Text(l.methodMfs)),
            ButtonSegment(value: 'bank', label: Text(l.methodBank)),
            ButtonSegment(value: 'cash', label: Text(l.methodCash)),
          ],
          selected: {_method},
          onSelectionChanged: (v) => setState(() => _method = v.first),
        ),
        if (accounts.isNotEmpty)
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(l.sendTo, style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            for (final a in accounts)
              Card(
                child: ListTile(
                  title: Text('${a['provider'] ?? ''} · ${a['accountNumber'] ?? ''}'),
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
          ]),
        if (!cash) ...[
          TextField(controller: _txn, decoration: _dec(l.txnId), onChanged: (_) => setState(() {})),
          TextField(controller: _sender, decoration: _dec(l.optional(l.sender))),
        ],
        TextField(controller: _note, minLines: 2, maxLines: 4, decoration: _dec(l.optional(l.note))),
        PhotoField(label: l.proof, file: _proof, required: !cash, onChanged: (f) => setState(() => _proof = f)),
      ],
    );
  }
}

// ─── Farmer: post an update ──────────────────────────────────────────────────

class UpdateForm extends StatefulWidget {
  const UpdateForm({super.key, required this.batch});
  final InvestmentDetail batch;
  @override
  State<UpdateForm> createState() => _UpdateFormState();
}

class _UpdateFormState extends State<UpdateForm> with _Submit {
  String _type = 'health_check';
  final _title = TextEditingController();
  final _body = TextEditingController();
  XFile? _photo;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return FormSheet(
      title: l.updateTitle,
      submitLabel: l.send,
      busy: busy,
      error: error,
      enabled: _title.text.trim().length >= 2,
      onSubmit: () => submit(() => context.api.postForm('/api/farmer/updates', {
            'investment_id': widget.batch.id,
            'update_type': _type,
            'title': _title.text.trim(),
            'body': _body.text.trim(),
          }, files: {'photo': _photo})),
      children: [
        ChoiceField(
          label: l.updateType,
          value: _type,
          options: {'health_check': l.updateHealth, 'photo_update': l.updatePhoto, 'note': l.updateNote},
          onChanged: (v) => setState(() => _type = v ?? _type),
        ),
        TextField(controller: _title, decoration: _dec(l.titleLabel), onChanged: (_) => setState(() {})),
        TextField(controller: _body, minLines: 3, maxLines: 6, decoration: _dec(l.optional(l.details))),
        PhotoField(label: l.photo, file: _photo, onChanged: (f) => setState(() => _photo = f)),
      ],
    );
  }
}

// ─── Farmer or steward: animal record / death ────────────────────────────────

class AnimalRecordForm extends StatefulWidget {
  const AnimalRecordForm({super.key, required this.animal, required this.role, this.initialKind = 'weight'});
  final Animal animal;
  final String role;
  final String initialKind;
  @override
  State<AnimalRecordForm> createState() => _AnimalRecordFormState();
}

class _AnimalRecordFormState extends State<AnimalRecordForm> with _Submit {
  late String _kind = widget.initialKind;
  final _weight = TextEditingController();
  final _note = TextEditingController();
  String _date = _today();
  String? _cause;
  XFile? _photo;
  XFile? _document;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final isWeight = _kind == 'weight';
    final isDeath = _kind == 'death';
    final isReport = isDeath && widget.role == 'farmer';
    final valid = (isWeight ? (double.tryParse(_weight.text) ?? 0) > 0 : _note.text.trim().isNotEmpty) &&
        (!isDeath || _cause != null) &&
        (!isReport || _photo != null);
    return FormSheet(
      title: l.recordTitle(widget.animal.tag),
      submitLabel: isReport ? l.reportDeath : isDeath ? l.recordDeath : l.saveRecord,
      danger: isDeath,
      busy: busy,
      error: error,
      enabled: valid,
      onSubmit: () => submit(() => context.api.postForm('/api/animals/${widget.animal.id}/records', {
            'kind': _kind,
            if (isWeight) 'weight_kg': _weight.text,
            'note': _note.text.trim(),
            'recorded_on': _date,
            if (isDeath) 'cause': _cause,
          }, files: {'photo': _photo, if (isDeath) 'document': _document})),
      children: [
        ChoiceField(
          label: l.recordType,
          value: _kind,
          options: {for (final k in kRecordKinds) k: label(lang, 'recordKind', k)},
          onChanged: (v) => setState(() => _kind = v ?? _kind),
        ),
        _DateField(label: l.date, value: _date, onChanged: (v) => setState(() => _date = v)),
        if (isReport)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: KColors.border)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(l.deathGuideTitle, style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              for (final (i, line) in [l.deathGuide1, l.deathGuide2, l.deathGuide3, l.deathGuide4, l.deathGuide5].indexed)
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text('${i + 1}. $line', style: const TextStyle(fontSize: 13, color: KColors.inkSecondary)),
                ),
            ]),
          ),
        if (isWeight)
          TextField(controller: _weight, keyboardType: const TextInputType.numberWithOptions(decimal: true), inputFormatters: _money,
              decoration: _dec(l.weightKg), onChanged: (_) => setState(() {})),
        if (isDeath)
          ChoiceField(
            label: l.deathCause,
            value: _cause,
            options: {for (final c in kDeathCauses) c: label(lang, 'deathCause', c)},
            onChanged: (v) => setState(() => _cause = v),
          ),
        TextField(
          controller: _note,
          minLines: 2,
          maxLines: 4,
          decoration: _dec(isWeight ? l.optional(l.note) : l.note, hint: l.recordNoteHint),
          onChanged: (_) => setState(() {}),
        ),
        PhotoField(label: isReport ? l.deathPhoto : l.photo, file: _photo, required: isReport,
            onChanged: (f) => setState(() => _photo = f)),
        if (isDeath) PhotoField(label: l.vetDocument, file: _document, onChanged: (f) => setState(() => _document = f)),
        if (isDeath) InfoBanner(text: isReport ? l.reportWarning : l.stewardDeathWarning, tone: Tone.danger),
      ],
    );
  }
}

// ─── Steward: close as total loss ────────────────────────────────────────────

class TotalLossForm extends StatefulWidget {
  const TotalLossForm({super.key, required this.batch});
  final InvestmentDetail batch;
  @override
  State<TotalLossForm> createState() => _TotalLossFormState();
}

class _TotalLossFormState extends State<TotalLossForm> with _Submit {
  final _note = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final b = widget.batch;
    final back = (b.amount - b.stats.capitalSpent).clamp(0, double.infinity);
    return FormSheet(
      title: l.totalLossFormTitle,
      submitLabel: l.actCloseTotalLoss,
      danger: true,
      busy: busy,
      error: error,
      enabled: _note.text.trim().length >= 5,
      onSubmit: () => submit(() => context.api.post('/api/steward/investments/${b.id}/total-loss', {'note': _note.text.trim()})),
      children: [
        Text(l.totalLossIntro, style: const TextStyle(color: KColors.inkSecondary)),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(children: [
              KeyValue(l.invested, bdt(b.amount)),
              KeyValue(l.spentOnBatch, bdt(b.stats.capitalSpent)),
              KeyValue(l.investorPayout, bdt(back), bold: true),
            ]),
          ),
        ),
        TextField(controller: _note, minLines: 3, maxLines: 5, decoration: _dec(l.whatHappened, hint: l.reasonHint),
            onChanged: (_) => setState(() {})),
      ],
    );
  }
}
