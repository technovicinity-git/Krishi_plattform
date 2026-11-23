import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/files.dart';
import '../core/format.dart';
import '../core/models.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

/// Every money movement for the signed-in person: payments, refunds, funds
/// released, sale money sent, payouts, shares, adjustments and withdrawals.
/// Same data as the website's Transactions page.
class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final _loader = GlobalKey<LoaderState<Json>>();
  String? _kind;

  Tone _tone(String status) => switch (status) {
        'completed' => Tone.success,
        'pending' => Tone.warning,
        'processing' => Tone.info,
        'rejected' => Tone.danger,
        _ => Tone.neutral,
      };

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    return Scaffold(
      appBar: AppBar(
        title: Text(l.transactions),
        actions: [
          IconButton(
            tooltip: l.downloadCsv,
            icon: const Icon(Icons.download_outlined),
            onPressed: () => openTransactionsCsv(context, kind: _kind),
          ),
        ],
      ),
      body: Loader<Json>(
        key: _loader,
        load: () => context.api.get('/api/mobile/v1/transactions', query: {'type': ?_kind}),
        builder: (context, data, _) {
          final kinds = (data['kinds'] as List).map((e) => Json.from(e as Map)).toList();
          final entries = (data['entries'] as List).map((e) => Json.from(e as Map)).toList();
          final summary = Json.from(data['summary'] as Map);
          final byKind = Json.from(summary['byKind'] as Map);
          final profit = data['profit'] is Map ? Json.from(data['profit'] as Map) : null;
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            children: [
              ResponsiveBody(
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  StatGrid(children: [
                    for (final (i, k) in kinds.where((k) => k['kind'] != 'adjustment').take(4).indexed)
                      StatCard(
                        label: '${k['summaryLabel']}',
                        value: bdt((byKind[k['kind']] as num?) ?? 0),
                        highlight: i == 0,
                      ),
                    if (profit != null)
                      StatCard(
                        label: '${profit['label']}',
                        value: bdt((profit['amount'] as num?) ?? 0),
                        hint: profit['hint'] as String?,
                        highlight: true,
                      ),
                  ]),
                  const SizedBox(height: 12),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(l.filterAll),
                          selected: _kind == null,
                          onSelected: (_) {
                            setState(() => _kind = null);
                            _loader.currentState?.reload();
                          },
                        ),
                      ),
                      for (final k in kinds)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text('${k['label']}'),
                            selected: _kind == k['kind'],
                            onSelected: (_) {
                              setState(() => _kind = k['kind'] as String);
                              _loader.currentState?.reload();
                            },
                          ),
                        ),
                    ]),
                  ),
                  const SizedBox(height: 10),
                  if (entries.isEmpty)
                    EmptyView(icon: Icons.receipt_long_outlined, title: l.noTransactions)
                  else
                    Card(
                      child: Column(children: [
                        for (final e in entries) ...[
                          ListTile(
                            onTap: e['investmentId'] == null ? null : () => context.push('/batches/${e['investmentId']}'),
                            leading: CircleAvatar(
                              backgroundColor: e['direction'] == 'in' ? KColors.brandTint : KColors.dangerTint,
                              child: Icon(
                                e['direction'] == 'in' ? Icons.south_west_rounded : Icons.north_east_rounded,
                                color: e['direction'] == 'in' ? KColors.greenDeep : KColors.danger,
                                size: 20,
                              ),
                            ),
                            title: Text('${e['label']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text([
                              [e['reference'], e['investmentRef']].whereType<String>().join(' · '),
                              if (e['detail'] != null) '${e['detail']}',
                              dateText(lang, e['at']),
                            ].where((s) => s.isNotEmpty).join('\n')),
                            isThreeLine: true,
                            trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                              Text(
                                '${e['direction'] == 'in' ? '+' : '−'}${bdt(e['amount'] as num)}',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: e['status'] != 'completed'
                                      ? KColors.inkMuted
                                      : e['direction'] == 'in'
                                          ? KColors.greenDeep
                                          : KColors.danger,
                                ),
                              ),
                              const SizedBox(height: 4),
                              StatusChip('${e['statusLabel']}', tone: _tone('${e['status']}')),
                            ]),
                          ),
                          if (e != entries.last) const Divider(indent: 16, endIndent: 16),
                        ],
                      ]),
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
