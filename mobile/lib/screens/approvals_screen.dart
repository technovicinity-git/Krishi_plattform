import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'decisions.dart';

/// Steward: every fund request, expense, sale and death report waiting for a
/// decision, across all batches.
class ApprovalsScreen extends StatefulWidget {
  const ApprovalsScreen({super.key});

  @override
  State<ApprovalsScreen> createState() => _ApprovalsScreenState();
}

class _ApprovalsScreenState extends State<ApprovalsScreen> {
  final _loader = GlobalKey<LoaderState<Json>>();

  Future<void> _decided(Future<bool> decision) async {
    if (await decision) _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Scaffold(
      appBar: AppBar(title: Text(l.approvalsTitle)),
      body: Loader<Json>(
        key: _loader,
        load: () async {
          final api = context.api;
          final results = await Future.wait([api.get('/api/mobile/v1/steward/pending'), api.get('/api/steward/interests')]);
          return {...results[0], 'interests': results[1]['items'] ?? const []};
        },
        builder: (context, data, _) {
          List<Json> list(String key) => (data[key] as List).map((e) => Json.from(e as Map)).toList();
          final deaths = list('deathReports');
          final sales = list('sales');
          final funds = list('fundRequests');
          final expenses = list('expenses');
          final interests = list('interests');
          if (deaths.isEmpty && sales.isEmpty && funds.isEmpty && expenses.isEmpty && interests.isEmpty) {
            return ListView(children: [
              EmptyView(icon: Icons.task_alt, title: l.nothingToApprove, body: l.nothingToApproveHint),
            ]);
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            children: [
              ResponsiveBody(
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  if (interests.isNotEmpty) _Group(title: l.interestsToReview, count: interests.length, children: [
                    for (final i in interests) _interest(context, i),
                  ]),
                  if (deaths.isNotEmpty) _Group(title: l.deathReportsTitle, count: deaths.length, children: [
                    for (final d in deaths) _death(context, d),
                  ]),
                  if (sales.isNotEmpty) _Group(title: l.salesTitle, count: sales.length, children: [
                    for (final s in sales) _sale(context, s),
                  ]),
                  if (funds.isNotEmpty) _Group(title: l.fundRequestsTitle, count: funds.length, children: [
                    for (final f in funds) _fund(context, f),
                  ]),
                  if (expenses.isNotEmpty) _Group(title: l.expensesTitle, count: expenses.length, children: [
                    for (final e in expenses) _expense(context, e),
                  ]),
                ]),
              ),
            ],
          );
        },
      ),
    );
  }

  /// An investor's (or guest's) interest in one of the steward's plans.
  Widget _interest(BuildContext context, Json i) {
    final l = context.l;
    final lang = context.lang;
    final investor = (i['investor'] as Map?)?.cast<String, dynamic>();
    final offering = (i['offering'] as Map?)?.cast<String, dynamic>();
    final plan = (offering?['investment_plans'] as Map?)?.cast<String, dynamic>();
    final name = '${investor?['full_name'] ?? i['guest_name'] ?? l.guest}';
    final phone = investor?['phone'] ?? i['guest_phone'];
    final units = (i['requested_units'] as num?)?.toInt() ?? 0;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text('${planName(lang, plan?['name_en'] as String?, plan?['name_bn'] as String?)} · ${i['reference']}',
              style: const TextStyle(fontSize: 12, color: KColors.brand, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Row(children: [
            Expanded(child: Text(name, style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700))),
            Text(l.unitsCount(units), style: const TextStyle(fontWeight: FontWeight.w800)),
          ]),
          Text(
            [if (investor == null) l.guest, if (phone != null) '$phone', dateText(lang, i['created_at'])].join(' · '),
            style: const TextStyle(color: KColors.inkSecondary, fontSize: 13),
          ),
          if (phone != null)
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(onPressed: () => callPhone('$phone'), icon: const Icon(Icons.call_outlined, size: 18), label: Text(l.call)),
            ),
          const SizedBox(height: 6),
          DecisionButtons(
            onApprove: () async {
              if (!await confirmDialog(context,
                  title: l.approveInterestTitle, body: l.approveInterestBody(name, units), confirm: l.approve)) {
                return;
              }
              if (context.mounted) _decided(_decideInterest(context, '${i['id']}', approve: true));
            },
            onReject: () => _decided(_decideInterest(context, '${i['id']}', approve: false)),
          ),
        ]),
      ),
    );
  }

  Future<bool> _decideInterest(BuildContext context, String id, {required bool approve}) async {
    String? reason;
    if (!approve) {
      reason = await reasonDialog(context);
      if (reason == null) return false;
    }
    if (!context.mounted) return false;
    try {
      await context.api.patch('/api/steward/interests/$id', {
        'action': approve ? 'approve' : 'reject',
        'rejection_reason': ?reason,
      });
      if (context.mounted) showSnack(context, context.l.saved);
      return true;
    } catch (e) {
      if (context.mounted) showSnack(context, errorText(context, e), error: true);
      return false;
    }
  }

  Widget _death(BuildContext context, Json d) {
    final l = context.l;
    final lang = context.lang;
    return _Item(
      batch: d,
      title: '${d['tag']}${d['earTag'] != null ? ' · ${l.earTag('${d['earTag']}')}' : ''}',
      amount: null,
      lines: [
        '${l.causeLabel}: ${label(lang, 'deathCause', d['cause'] as String?)}',
        if (d['recordedOn'] != null) l.reportedOn(dateText(lang, d['recordedOn'])),
        if (d['note'] != null) '${d['note']}',
      ],
      photos: [d['photoUrl'], d['documentUrl']].whereType<String>().toList(),
      buttons: DecisionButtons(
        approveLabel: l.confirmDeath,
        onApprove: () => _decided(Decisions.death(context, '${d['animalId']}', approve: true)),
        onReject: () => _decided(Decisions.death(context, '${d['animalId']}', approve: false)),
      ),
    );
  }

  Widget _sale(BuildContext context, Json s) {
    final l = context.l;
    final lang = context.lang;
    final amount = s['saleAmount'] as num;
    return _Item(
      batch: s,
      title: '${s['reference']} · ${l.animalsSold}: ${s['animalsSold']}',
      amount: amount,
      lines: [
        '${l.saleDate}: ${dateText(lang, s['saleDate'])}',
        if (s['buyerName'] != null) '${l.buyer}: ${s['buyerName']}${s['buyerPhone'] != null ? ' (${s['buyerPhone']})' : ''}',
        if (s['note'] != null) '${s['note']}',
      ],
      photos: [s['photoUrl']].whereType<String>().toList(),
      buttons: DecisionButtons(
        approveLabel: l.actConfirmSale,
        onApprove: () => _decided(Decisions.sale(context, '${s['id']}', amount, approve: true)),
        onReject: () => _decided(Decisions.sale(context, '${s['id']}', amount, approve: false)),
      ),
    );
  }

  Widget _fund(BuildContext context, Json f) {
    final lang = context.lang;
    return _Item(
      batch: f,
      title: label(lang, 'purpose', f['purpose'] as String?),
      amount: f['amount'] as num,
      lines: ['${f['reference']} · ${dateText(lang, f['createdAt'])}'],
      buttons: DecisionButtons(
        onApprove: () => _decided(Decisions.fundRequest(context, '${f['id']}', approve: true)),
        onReject: () => _decided(Decisions.fundRequest(context, '${f['id']}', approve: false)),
      ),
    );
  }

  Widget _expense(BuildContext context, Json e) {
    final lang = context.lang;
    return _Item(
      batch: e,
      title: label(lang, 'purpose', e['category'] as String?),
      amount: e['amount'] as num,
      lines: [
        if ((e['description'] as String?)?.isNotEmpty == true) '${e['description']}',
        dateText(lang, e['createdAt']),
      ],
      photos: [e['receiptUrl']].whereType<String>().toList(),
      buttons: DecisionButtons(
        onApprove: () => _decided(Decisions.expense(context, '${e['id']}', approve: true)),
        onReject: () => _decided(Decisions.expense(context, '${e['id']}', approve: false)),
      ),
    );
  }
}

class _Group extends StatelessWidget {
  const _Group({required this.title, required this.count, required this.children});
  final String title;
  final int count;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(2, 14, 0, 8),
          child: Text('$title ($count)',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: KColors.greenDeep)),
        ),
        for (final c in children) Padding(padding: const EdgeInsets.only(bottom: 10), child: c),
      ]);
}

class _Item extends StatelessWidget {
  const _Item({
    required this.batch,
    required this.title,
    required this.amount,
    required this.lines,
    required this.buttons,
    this.photos = const [],
  });
  final Json batch;
  final String title;
  final num? amount;
  final List<String> lines;
  final List<String> photos;
  final Widget buttons;

  @override
  Widget build(BuildContext context) {
    final lang = context.lang;
    final plan = planName(lang, batch['planEn'] as String?, batch['planBn'] as String?, '${batch['batchReference']}');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          InkWell(
            onTap: () => context.push('/batches/${batch['investmentId']}'),
            child: Text(
              '$plan · ${batch['batchReference']}${batch['farmerName'] != null ? ' · ${batch['farmerName']}' : ''}',
              style: const TextStyle(fontSize: 12, color: KColors.brand, fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(height: 6),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: Text(title, style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700))),
            if (amount != null) Text(bdt(amount!), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          ]),
          for (final line in lines)
            Padding(
              padding: const EdgeInsets.only(top: 3),
              child: Text(line, style: const TextStyle(color: KColors.inkSecondary, fontSize: 13)),
            ),
          if (photos.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(spacing: 8, children: [for (final p in photos) PhotoThumb(p, size: 72)]),
          ],
          const SizedBox(height: 12),
          buttons,
        ]),
      ),
    );
  }
}
