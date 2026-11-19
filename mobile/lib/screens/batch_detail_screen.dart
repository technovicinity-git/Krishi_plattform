import 'package:flutter/material.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../l10n/app_localizations.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'animal_sheet.dart';
import 'decisions.dart';
import 'forms.dart';

/// One batch: summary, what the viewer can do, sale & settlement, money,
/// animals, fund requests, expenses and the timeline.
class BatchDetailScreen extends StatefulWidget {
  const BatchDetailScreen({super.key, required this.id});
  final String id;

  @override
  State<BatchDetailScreen> createState() => _BatchDetailScreenState();
}

class _BatchDetailScreenState extends State<BatchDetailScreen> {
  final _loader = GlobalKey<LoaderState<InvestmentDetail>>();
  String? _title;

  Future<void> _reload() async => _loader.currentState?.reload();

  /// Opens a form sheet and reloads when it saved something.
  Future<void> _open(Widget form) async {
    final saved = await showFormSheet<bool>(context, builder: (_) => form);
    if (saved == true && mounted) {
      showSnack(context, context.l.saved);
      _reload();
    }
  }

  Future<void> _decided(Future<bool> decision) async {
    if (await decision) _reload();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(_title ?? '')),
        body: Loader<InvestmentDetail>(
          key: _loader,
          load: () async {
            final b = InvestmentDetail(await context.api.get('/api/mobile/v1/investments/${widget.id}'));
            if (mounted) setState(() => _title = b.plan(context.lang));
            return b;
          },
          builder: (context, b, _) => ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
            children: [
              ResponsiveBody(
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  _Header(b: b),
                  ..._gap(_actions(context, b)),
                  if (b.sale != null) ...[const SizedBox(height: 12), _SaleCard(b: b, onDecide: _decided)],
                  const SizedBox(height: 12),
                  _MoneyCard(b: b),
                  const SizedBox(height: 12),
                  _AnimalsCard(b: b, onChanged: _reload, onDecide: _decided),
                  const SizedBox(height: 12),
                  _FundRequestsCard(b: b, onDecide: _decided),
                  const SizedBox(height: 12),
                  _ExpensesCard(b: b, onDecide: _decided),
                  const SizedBox(height: 12),
                  _Timeline(b: b),
                ]),
              ),
            ],
          ),
        ),
      );

  List<Widget> _gap(Widget? w) => w == null ? const [] : [const SizedBox(height: 12), w];

  /// The buttons and notices for what this person can do now.
  Widget? _actions(BuildContext context, InvestmentDetail b) {
    final l = context.l;
    final buttons = <Widget>[];
    final notes = <Widget>[];
    final sale = b.sale;
    final saleOpen = sale != null && sale.status != 'rejected';

    if (b.isFarmer) {
      final canSpend = b.stage == 'awaiting_purchase' || b.stage == 'growing_care';
      if (b.stage == 'awaiting_purchase') {
        buttons.add(FilledButton.icon(
          onPressed: () => _open(PurchaseForm(batch: b)),
          icon: const Icon(Icons.shopping_cart_checkout),
          label: Text(l.actConfirmPurchase),
        ));
      }
      if (sale?.status == 'awaiting_remittance') {
        buttons.add(FilledButton.icon(
          onPressed: () => _open(RemitForm(batch: b)),
          icon: const Icon(Icons.send_rounded),
          label: Text(l.actSendMoney(bdt(sale!.toSend))),
        ));
      }
      if (b.raising && !saleOpen) {
        final allDead = b.animals.isNotEmpty && b.animals.every((a) => a.status == 'dead');
        final pendingFunds = b.fundRequests.any((r) => r.status == 'pending');
        final pendingExpenses = b.expenses.any((e) => e.status == 'pending');
        if (allDead) {
          notes.add(InfoBanner(text: l.allAnimalsDied, tone: Tone.danger));
        } else if (b.anyDeathPending) {
          notes.add(InfoBanner(text: l.waitDeathReview, tone: Tone.warning));
        } else if (pendingFunds) {
          notes.add(InfoBanner(text: l.waitPendingFunds, tone: Tone.info));
        } else if (pendingExpenses) {
          notes.add(InfoBanner(text: l.waitPendingExpenses, tone: Tone.info));
        } else {
          buttons.add(FilledButton.icon(
            onPressed: () => _open(SaleForm(batch: b)),
            icon: const Icon(Icons.sell_outlined),
            label: Text(l.actRecordSale),
          ));
        }
      }
      if (canSpend) {
        buttons.add(OutlinedButton.icon(
          onPressed: () => _open(FundRequestForm(batch: b)),
          icon: const Icon(Icons.request_quote_outlined),
          label: Text(l.actFundRequest),
        ));
        buttons.add(OutlinedButton.icon(
          onPressed: () => _open(ExpenseForm(batch: b)),
          icon: const Icon(Icons.receipt_long_outlined),
          label: Text(l.actLogExpense),
        ));
      }
      if (b.stage != 'settled' && b.stage != 'awaiting_farmer') {
        buttons.add(OutlinedButton.icon(
          onPressed: () => _open(UpdateForm(batch: b)),
          icon: const Icon(Icons.campaign_outlined),
          label: Text(l.actPostUpdate),
        ));
      }
    }

    if (b.isSteward) {
      if (b.stage == 'awaiting_farmer') notes.add(InfoBanner(text: l.assignFarmerOnWeb, tone: Tone.info));
      final allGone = b.animals.isNotEmpty && b.animals.every((a) => a.status == 'dead' || a.status == 'death_reported');
      if (b.canCloseTotalLoss) {
        buttons.add(FilledButton.icon(
          style: FilledButton.styleFrom(backgroundColor: KColors.danger),
          onPressed: () => _open(TotalLossForm(batch: b)),
          icon: const Icon(Icons.report_outlined),
          label: Text(l.actCloseTotalLoss),
        ));
      } else if (allGone && b.raising && !saleOpen) {
        final blocker = b.totalLossBlocker;
        if (blocker == 'death_pending') notes.add(InfoBanner(text: l.blocker_death_pending, tone: Tone.warning));
        if (blocker == 'fund_requests') notes.add(InfoBanner(text: l.blocker_fund_requests, tone: Tone.warning));
      }
    }

    if (buttons.isEmpty && notes.isEmpty) return null;
    return SectionCard(
      title: l.actions,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        for (final n in notes) Padding(padding: const EdgeInsets.only(bottom: 10), child: n),
        for (final btn in buttons) Padding(padding: const EdgeInsets.only(bottom: 8), child: btn),
      ]),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.b});
  final InvestmentDetail b;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(b.reference, style: const TextStyle(fontSize: 12, color: KColors.inkMuted, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(b.plan(lang), style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800)),
                Text(l.startedOn(dateText(lang, b.createdAt)),
                    style: const TextStyle(fontSize: 12, color: KColors.inkMuted)),
              ]),
            ),
            StatusChip(label(lang, 'stage', b.stage), tone: toneFor(b.stage)),
          ]),
          const SizedBox(height: 14),
          _StageBar(stage: b.stage),
          const SizedBox(height: 14),
          KeyValue(l.invested, bdt(b.amount), bold: true),
          KeyValue(l.unitsCount(b.units), l.monthsCount(b.durationMonths)),
          KeyValue(l.estReturn, '${b.roiMin.toStringAsFixed(0)}–${b.roiMax.toStringAsFixed(0)}%'),
          const Divider(height: 22),
          _Person(role: l.steward, name: b.stewardName),
          _Person(role: l.farmer, name: b.farmerName ?? l.notAssigned, phone: b.farmerPhone),
          if (b.isSteward) _Person(role: l.investor, name: b.investorName, phone: b.investorPhone),
        ]),
      ),
    );
  }
}

/// The batch's journey: bought → raised → sold → settled.
class _StageBar extends StatelessWidget {
  const _StageBar({required this.stage});
  final String stage;
  static const _stages = ['awaiting_farmer', 'awaiting_purchase', 'growing_care', 'sale_pending', 'sold', 'settled'];

  @override
  Widget build(BuildContext context) {
    final at = _stages.indexOf(stage);
    return Row(children: [
      for (var i = 0; i < _stages.length; i++)
        Expanded(
          child: Container(
            height: 6,
            margin: EdgeInsets.only(right: i == _stages.length - 1 ? 0 : 4),
            decoration: BoxDecoration(
              color: i <= at ? KColors.brand : KColors.stone,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        ),
    ]);
  }
}

class _Person extends StatelessWidget {
  const _Person({required this.role, this.name, this.phone});
  final String role;
  final String? name;
  final String? phone;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(children: [
          SizedBox(width: 96, child: Text(role, style: const TextStyle(color: KColors.inkSecondary, fontSize: 13.5))),
          Expanded(child: Text(name ?? '—', style: const TextStyle(fontWeight: FontWeight.w600))),
          if (phone != null)
            TextButton.icon(
              onPressed: () => callPhone(phone!),
              icon: const Icon(Icons.call_outlined, size: 18),
              label: Text(context.l.call),
            ),
        ]),
      );
}

class _SaleCard extends StatelessWidget {
  const _SaleCard({required this.b, required this.onDecide});
  final InvestmentDetail b;
  final Future<void> Function(Future<bool>) onDecide;

  (String, Tone)? _notice(BuildContext context, Sale s) {
    final l = context.l;
    if (s.totalLoss) {
      return switch (s.status) {
        'awaiting_remittance' => s.remitRejectionReason != null
            ? (l.remitRejected(s.remitRejectionReason!), Tone.danger)
            : (b.isFarmer ? l.totalLossReturnFarmer(bdt(s.fundsReturned)) : l.awaitingRemittance(bdt(s.toSend)), Tone.warning),
        'remittance_submitted' => (l.totalLossPending, Tone.danger),
        'rejected' => (l.totalLossRejected(s.rejectionReason ?? ''), Tone.danger),
        'settled' => (l.totalLossSettled, Tone.info),
        _ => null,
      };
    }
    return switch (s.status) {
      'pending_review' => (b.isSteward ? l.salePendingReviewSteward : l.salePendingReview, Tone.info),
      'rejected' => (l.saleRejected(s.rejectionReason ?? ''), Tone.danger),
      'awaiting_remittance' => s.remitRejectionReason != null
          ? (l.remitRejected(s.remitRejectionReason!), Tone.danger)
          : (b.isFarmer ? l.awaitingRemittanceFarmer(bdt(s.toSend)) : l.awaitingRemittance(bdt(s.toSend)), Tone.warning),
      'remittance_submitted' => (l.remittanceSubmitted, Tone.info),
      'settled' => (l.settledNotice, Tone.success),
      _ => null,
    };
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final s = b.sale!;
    final notice = _notice(context, s);
    final st = b.settlement;
    return SectionCard(
      title: s.totalLoss ? l.totalLossTitle : l.saleTitle,
      subtitle: s.reference,
      trailing: StatusChip(label(lang, 'saleStatus', s.status), tone: toneFor(s.status)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        if (notice != null) ...[InfoBanner(text: notice.$1, tone: notice.$2), const SizedBox(height: 10)],
        if (s.totalLoss)
          KeyValue(l.closedOn, dateText(lang, s.saleDate))
        else ...[
          KeyValue(l.soldFor, bdt(s.saleAmount), bold: true, valueColor: KColors.greenDeep),
          KeyValue(l.animalsSold, '${s.animalsSold}'),
          KeyValue(l.saleDate, dateText(lang, s.saleDate)),
          if (s.buyerName != null) KeyValue(l.buyer, s.buyerName!),
        ],
        if (s.fundsReturned > 0) KeyValue(l.fundsReturned, bdt(s.fundsReturned)),
        if (s.note != null) ...[
          const SizedBox(height: 6),
          Text(s.note!, style: const TextStyle(color: KColors.inkSecondary)),
        ],
        if (s.photoUrl != null || s.remitProofUrl != null) ...[
          const SizedBox(height: 10),
          Wrap(spacing: 8, children: [
            if (s.photoUrl != null) PhotoThumb(s.photoUrl!),
            if (s.remitProofUrl != null) PhotoThumb(s.remitProofUrl!),
          ]),
        ],
        if (b.isSteward && s.status == 'pending_review') ...[
          const SizedBox(height: 12),
          DecisionButtons(
            approveLabel: l.actConfirmSale,
            onApprove: () => onDecide(Decisions.sale(context, s.id, s.saleAmount, approve: true)),
            onReject: () => onDecide(Decisions.sale(context, s.id, s.saleAmount, approve: false)),
          ),
        ],
        if (st != null) ...[
          const Divider(height: 26),
          Text(l.settlementTitle, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 6),
          Text(
            st.outcome == 'profit'
                ? l.resultProfit(bdt(st.netResult))
                : st.outcome == 'loss'
                    ? l.resultLoss(bdt(st.netResult.abs()))
                    : l.resultEven,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: st.outcome == 'loss' ? KColors.danger : KColors.greenDeep,
            ),
          ),
          const SizedBox(height: 6),
          KeyValue(l.capital, bdt(st.capital)),
          KeyValue(l.spentOnBatch, '− ${bdt(st.fundsReleased)}'),
          KeyValue(l.soldFor, '+ ${bdt(st.saleAmount)}'),
          KeyValue(l.totalReturn, bdt(st.totalReturn), bold: true),
          const SizedBox(height: 6),
          KeyValue(l.investorPayout, bdt(st.investorPayout), bold: true, valueColor: KColors.greenDeep),
          if (st.farmerShare > 0) KeyValue(l.farmerShare, bdt(st.farmerShare)),
          if (st.stewardShare > 0) KeyValue(l.stewardShare, bdt(st.stewardShare)),
          if (st.platformShare > 0) KeyValue(l.platformShare, bdt(st.platformShare)),
          if (st.note != null) ...[
            const SizedBox(height: 6),
            Text(st.note!, style: const TextStyle(color: KColors.inkSecondary, fontSize: 12.5)),
          ],
        ],
      ]),
    );
  }
}

class _MoneyCard extends StatelessWidget {
  const _MoneyCard({required this.b});
  final InvestmentDetail b;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final s = b.stats;
    return SectionCard(
      title: l.overview,
      child: Column(children: [
        KeyValue(l.invested, bdt(b.amount)),
        KeyValue(l.animalPurchase, bdt(s.purchaseCost)),
        KeyValue(l.paidOut, bdt(s.fundsReleased)),
        KeyValue(l.expensesApproved, bdt(s.expensesApproved)),
        if (s.leftover > 0) KeyValue(l.leftoverFunds, bdt(s.leftover), valueColor: KColors.warning),
        KeyValue(l.spentOnBatch, bdt(s.capitalSpent), bold: true),
      ]),
    );
  }
}

class _AnimalsCard extends StatelessWidget {
  const _AnimalsCard({required this.b, required this.onChanged, required this.onDecide});
  final InvestmentDetail b;
  final VoidCallback onChanged;
  final Future<void> Function(Future<bool>) onDecide;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final animals = b.animals;
    int count(String s) => animals.where((a) => a.status == s).length;
    return SectionCard(
      title: l.animalsTitle,
      subtitle: animals.isEmpty ? null : l.animalsSummary(count('active') + count('death_reported'), count('sold'), count('dead')),
      padding: EdgeInsets.zero,
      child: animals.isEmpty
          ? Padding(padding: const EdgeInsets.all(16), child: Text(l.noAnimals))
          : Column(children: [
              for (final a in animals) ...[
                ListTile(
                  onTap: () async {
                    final changed = await showAnimalSheet(context, animal: a, role: b.viewerRole);
                    if (changed == true) onChanged();
                  },
                  leading: CircleAvatar(
                    backgroundColor: KColors.brandTint,
                    child: Text(a.tag, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: KColors.greenDeep)),
                  ),
                  title: Text(
                    a.currentWeightKg != null ? kg(a.currentWeightKg!) : l.noWeight,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text([
                    if (a.earTag != null) l.earTag(a.earTag!),
                    if (a.gain != null) '${a.gain! >= 0 ? '+' : ''}${kg(a.gain!)}',
                    if (a.breed != null) a.breed!,
                  ].join(' · ')),
                  trailing: StatusChip(label(lang, 'animalStatus', a.status), tone: toneFor(a.status)),
                ),
                if (b.isSteward && a.status == 'death_reported')
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: DecisionButtons(
                      approveLabel: l.confirmDeath,
                      onApprove: () => onDecide(Decisions.death(context, a.id, approve: true)),
                      onReject: () => onDecide(Decisions.death(context, a.id, approve: false)),
                    ),
                  ),
                if (a != animals.last) const Divider(indent: 16, endIndent: 16),
              ],
            ]),
    );
  }
}

class _FundRequestsCard extends StatelessWidget {
  const _FundRequestsCard({required this.b, required this.onDecide});
  final InvestmentDetail b;
  final Future<void> Function(Future<bool>) onDecide;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final items = b.fundRequests;
    return SectionCard(
      title: l.fundRequestsTitle,
      padding: EdgeInsets.zero,
      child: items.isEmpty
          ? Padding(padding: const EdgeInsets.all(16), child: Text(l.noFundRequests))
          : Column(children: [
              for (final r in items) ...[
                ListTile(
                  title: Text(label(lang, 'purpose', r.purpose), style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text([
                    '${r.reference} · ${dateText(lang, r.createdAt)}',
                    if (r.rejectionReason != null) l.notAcceptedReason(r.rejectionReason!),
                  ].join('\n')),
                  trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text(bdt(r.amount), style: const TextStyle(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    StatusChip(label(lang, 'status', r.status), tone: toneFor(r.status)),
                  ]),
                ),
                if (b.isSteward && r.status == 'pending')
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: DecisionButtons(
                      onApprove: () => onDecide(Decisions.fundRequest(context, r.id, approve: true)),
                      onReject: () => onDecide(Decisions.fundRequest(context, r.id, approve: false)),
                    ),
                  ),
                if (r != items.last) const Divider(indent: 16, endIndent: 16),
              ],
            ]),
    );
  }
}

class _ExpensesCard extends StatelessWidget {
  const _ExpensesCard({required this.b, required this.onDecide});
  final InvestmentDetail b;
  final Future<void> Function(Future<bool>) onDecide;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final items = b.expenses;
    return SectionCard(
      title: l.expensesTitle,
      padding: EdgeInsets.zero,
      child: items.isEmpty
          ? Padding(padding: const EdgeInsets.all(16), child: Text(l.noExpenses))
          : Column(children: [
              for (final e in items) ...[
                ListTile(
                  leading: e.receiptUrl != null ? PhotoThumb(e.receiptUrl!, size: 44) : null,
                  title: Text(label(lang, 'purpose', e.category), style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text([
                    if (e.description?.isNotEmpty == true) e.description!,
                    dateText(lang, e.createdAt),
                    if (e.rejectionReason != null) l.notAcceptedReason(e.rejectionReason!),
                  ].join('\n')),
                  trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text(bdt(e.amount), style: const TextStyle(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    StatusChip(label(lang, 'status', e.status), tone: toneFor(e.status)),
                  ]),
                ),
                if (b.isSteward && e.status == 'pending')
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: DecisionButtons(
                      onApprove: () => onDecide(Decisions.expense(context, e.id, approve: true)),
                      onReject: () => onDecide(Decisions.expense(context, e.id, approve: false)),
                    ),
                  ),
                if (e != items.last) const Divider(indent: 16, endIndent: 16),
              ],
            ]),
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.b});
  final InvestmentDetail b;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final items = b.updates;
    return SectionCard(
      title: l.timelineTitle,
      child: items.isEmpty
          ? Text(l.noUpdates)
          : Column(children: [
              for (final u in items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Container(
                      margin: const EdgeInsets.only(top: 5, right: 12),
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: u.superseded ? KColors.inkMuted : KColors.brand,
                        shape: BoxShape.circle,
                      ),
                    ),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Expanded(
                            child: Text(
                              u.title,
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                decoration: u.superseded ? TextDecoration.lineThrough : null,
                                color: u.superseded ? KColors.inkMuted : KColors.ink,
                              ),
                            ),
                          ),
                          if (u.amount != null && u.amount! > 0)
                            Text(bdt(u.amount!), style: const TextStyle(fontWeight: FontWeight.w700)),
                        ]),
                        if (u.superseded) StatusChip(l.replaced),
                        if (u.body?.isNotEmpty == true)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(u.body!, style: const TextStyle(color: KColors.inkSecondary, fontSize: 13)),
                          ),
                        const SizedBox(height: 2),
                        Text(
                          [dateText(lang, u.createdAt), if (u.authorRole != null && u.authorRole != 'system') _role(l, u.authorRole!)]
                              .join(' · '),
                          style: const TextStyle(color: KColors.inkMuted, fontSize: 11.5),
                        ),
                        if (u.photoUrl != null) Padding(padding: const EdgeInsets.only(top: 6), child: PhotoThumb(u.photoUrl!)),
                      ]),
                    ),
                  ]),
                ),
            ]),
    );
  }

  String _role(AppLocalizations l, String role) => switch (role) {
        'farmer' => l.role_farmer,
        'steward' => l.role_steward,
        'investor' => l.role_investor,
        'admin' => l.appName,
        _ => role,
      };
}
