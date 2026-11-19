import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

class BatchesScreen extends StatelessWidget {
  const BatchesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final me = context.session.me!;
    return Scaffold(
      appBar: AppBar(title: Text(l.batchesTitle)),
      body: Loader<List<InvestmentSummary>>(
        load: () async {
          final data = await context.api.get('/api/mobile/v1/investments');
          return (data['investments'] as List).map((e) => InvestmentSummary(Json.from(e as Map))).toList();
        },
        builder: (context, items, _) {
          if (items.isEmpty) {
            return ListView(children: [
              EmptyView(
                icon: Icons.inventory_2_outlined,
                title: l.noBatches,
                body: me.isInvestor
                    ? l.noBatchesInvestor
                    : me.isFarmer
                        ? l.noBatchesFarmer
                        : l.noBatchesSteward,
              ),
            ]);
          }
          final active = items.where((i) => !i.settled).toList();
          final settled = items.where((i) => i.settled).toList();
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            children: [
              ResponsiveBody(
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  if (active.isNotEmpty) ...[
                    _Heading('${l.activeBatches} (${active.length})'),
                    for (final i in active) BatchCard(item: i),
                  ],
                  if (settled.isNotEmpty) ...[
                    _Heading('${l.settledBatches} (${settled.length})'),
                    for (final i in settled) BatchCard(item: i),
                  ],
                ]),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Heading extends StatelessWidget {
  const _Heading(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(2, 12, 0, 8),
        child: Text(text.toUpperCase(),
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: KColors.inkMuted, letterSpacing: 0.4)),
      );
}

class BatchCard extends StatelessWidget {
  const BatchCard({super.key, required this.item});
  final InvestmentSummary item;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final me = context.session.me!;
    final people = <(String, String)>[
      if (!me.isSteward) (l.steward, item.stewardName ?? '—'),
      if (!me.isFarmer) (l.farmer, item.farmerName ?? l.notAssigned),
      if (me.isSteward) (l.investor, item.investorName ?? '—'),
    ];
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/batches/${item.id}'),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(item.reference,
                        style: const TextStyle(fontSize: 11.5, color: KColors.inkMuted, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(item.plan(lang), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  ]),
                ),
                StatusChip(label(lang, 'stage', item.stage), tone: toneFor(item.stage)),
              ]),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(color: KColors.cream, borderRadius: BorderRadius.circular(10)),
                child: Row(children: [
                  _Fact(l.invested, bdt(item.amount)),
                  for (final p in people) _Fact(p.$1, p.$2),
                ]),
              ),
              const SizedBox(height: 10),
              Row(children: [
                Text(l.startedOn(dateText(lang, item.createdAt)),
                    style: const TextStyle(fontSize: 12, color: KColors.inkMuted)),
                const Spacer(),
                Text(l.unitsCount(item.units), style: const TextStyle(fontSize: 12, color: KColors.inkSecondary)),
                const Icon(Icons.chevron_right, color: KColors.brand),
              ]),
            ]),
          ),
        ),
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 11.5, color: KColors.inkMuted)),
          const SizedBox(height: 2),
          Text(value, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ]),
      );
}
