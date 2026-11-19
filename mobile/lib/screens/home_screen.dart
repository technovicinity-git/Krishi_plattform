import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../core/session.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final me = session.me!;
    final l = context.l;
    return Scaffold(
      appBar: AppBar(
        title: Text(me.firstName.isEmpty ? l.helloNoName : l.hello(me.firstName)),
        actions: [_Bell(count: me.unreadNotifications), const SizedBox(width: 6)],
      ),
      body: Loader<Dashboard>(
        load: () async {
          final d = Dashboard(await context.api.get('/api/mobile/v1/dashboard'));
          session.setUnread(d.unread);
          return d;
        },
        builder: (context, d, reload) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          children: [
            ResponsiveBody(
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Text(
                  me.isInvestor
                      ? l.homeSubtitleInvestor
                      : me.isFarmer
                          ? l.homeSubtitleFarmer
                          : l.homeSubtitleSteward,
                  style: const TextStyle(color: KColors.inkSecondary),
                ),
                const SizedBox(height: 14),
                ..._todo(context, me, d),
                if (me.isInvestor) _investorStats(context, d),
                if (me.isFarmer) _farmerStats(context, d),
                if (me.isSteward) _stewardStats(context, d),
                const SizedBox(height: 20),
                _ActivityList(items: d.activity),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  /// Things that need the person's action, shown first.
  List<Widget> _todo(BuildContext context, Me me, Dashboard d) {
    final l = context.l;
    final lang = context.lang;
    final cards = <Widget>[];
    if (me.isInvestor && me.kycStatus != 'verified') {
      final waiting = me.kycStatus == 'pending' || me.kycStatus == 'under_review';
      cards.add(InfoBanner(
        tone: waiting ? Tone.info : Tone.warning,
        title: waiting
            ? l.kycWaitingTitle
            : me.kycStatus == 'not_started'
                ? l.kycStartTitle
                : l.kycFixTitle,
        text: waiting
            ? l.kycWaitingBody
            : me.kycStatus == 'not_started'
                ? l.kycStartBody
                : (me.kycRejectionReason ?? l.kycFixBody),
        action: waiting ? null : l.openWebsite,
        onTap: waiting ? null : () => openWebsite(lang == 'en' ? '/en/portal/kyc' : '/portal/kyc'),
      ));
    }
    for (final p in d.toPay) {
      cards.add(InfoBanner(
        tone: Tone.success,
        title: l.payTitle(planName(lang, p['planEn'] as String?, p['planBn'] as String?, '${p['reference']}')),
        text: l.payBody('${p['reference']}'),
        action: l.openWebsite,
        onTap: () => openWebsite(lang == 'en' ? '/en${p['path']}' : '${p['path']}'),
      ));
    }
    for (final p in d.needsPurchase) {
      cards.add(InfoBanner(
        tone: Tone.success,
        title: l.purchaseNeededTitle('${p['reference']}'),
        text: l.purchaseNeededBody,
        onTap: () => context.push('/batches/${p['id']}'),
      ));
    }
    for (final m in d.moneyToSend) {
      cards.add(InfoBanner(
        tone: Tone.warning,
        title: l.moneyToSendTitle(bdt(m['amount'] as num)),
        text: l.moneyToSendBody('${m['reference']}'),
        onTap: () => context.push('/batches/${m['investmentId']}'),
      ));
    }
    if (me.isSteward && d.pendingTotal > 0) {
      cards.add(InfoBanner(
        tone: Tone.warning,
        title: l.approvalsWaitingTitle(d.pendingTotal),
        text: l.approvalsWaitingBody,
        onTap: () => context.go('/approvals'),
      ));
    }
    if (me.isSteward && d.awaitingFarmer > 0) {
      cards.add(InfoBanner(
        tone: Tone.info,
        title: l.awaitingFarmerTitle(d.awaitingFarmer),
        text: l.awaitingFarmerBody,
        action: l.openWebsite,
        onTap: () => openWebsite(lang == 'en' ? '/en/steward/investments' : '/steward/investments'),
      ));
    }
    return [for (final c in cards) Padding(padding: const EdgeInsets.only(bottom: 10), child: c)];
  }

  Widget _investorStats(BuildContext context, Dashboard d) {
    final l = context.l;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      StatGrid(children: [
        StatCard(label: l.statInvested, value: bdt(d.invested), icon: Icons.work_outline, highlight: true,
            onTap: () => context.go('/batches')),
        StatCard(label: l.statActiveBatches, value: '${d.activeBatches}', hint: l.unitsCount(d.activeUnits),
            icon: Icons.inventory_2_outlined, onTap: () => context.go('/batches')),
        StatCard(label: l.statWallet, value: bdt(d.walletBalance), icon: Icons.account_balance_wallet_outlined,
            onTap: () => context.go('/wallet')),
        StatCard(
          label: l.statReturns,
          value: '${d.returns > 0 ? '+' : ''}${bdt(d.returns)}',
          hint: l.statReturnsHint,
          icon: Icons.trending_up,
          valueColor: d.returns < 0 ? KColors.danger : (d.returns > 0 ? KColors.greenDeep : null),
        ),
      ]),
      if (d.interestsWaiting > 0) ...[
        const SizedBox(height: 10),
        InfoBanner(text: l.interestsWaiting(d.interestsWaiting), tone: Tone.info),
      ],
    ]);
  }

  Widget _farmerStats(BuildContext context, Dashboard d) {
    final l = context.l;
    return StatGrid(children: [
      StatCard(label: l.statActiveBatches, value: '${d.activeBatches}', hint: l.unitsCount(d.activeUnits),
          icon: Icons.inventory_2_outlined, highlight: true, onTap: () => context.go('/batches')),
      StatCard(label: l.statPendingFunds, value: '${d.pendingFundRequests}', icon: Icons.payments_outlined),
      StatCard(label: l.statPendingExpenses, value: '${d.pendingExpenses}', icon: Icons.receipt_long_outlined),
      StatCard(label: l.statWallet, value: bdt(d.walletBalance), icon: Icons.account_balance_wallet_outlined,
          onTap: () => context.go('/wallet')),
    ]);
  }

  Widget _stewardStats(BuildContext context, Dashboard d) {
    final l = context.l;
    return StatGrid(children: [
      StatCard(label: l.statApprovals, value: '${d.pendingTotal}', icon: Icons.fact_check_outlined, highlight: true,
          onTap: () => context.go('/approvals')),
      StatCard(label: l.statActiveBatches, value: '${d.activeBatches}', hint: l.unitsCount(d.activeUnits),
          icon: Icons.inventory_2_outlined, onTap: () => context.go('/batches')),
      StatCard(label: l.statPendingFunds, value: '${d.pendingCount('fundRequests')}', icon: Icons.payments_outlined,
          onTap: () => context.go('/approvals')),
      StatCard(label: l.statWallet, value: bdt(d.walletBalance), icon: Icons.account_balance_wallet_outlined,
          onTap: () => context.go('/wallet')),
    ]);
  }
}

class _Bell extends StatelessWidget {
  const _Bell({required this.count});
  final int count;

  @override
  Widget build(BuildContext context) => IconButton(
        tooltip: context.l.notificationsTitle,
        onPressed: () => context.push('/notifications'),
        icon: Badge(
          isLabelVisible: count > 0,
          label: Text(count > 99 ? '99+' : '$count'),
          child: const Icon(Icons.notifications_outlined),
        ),
      );
}

class _ActivityList extends StatelessWidget {
  const _ActivityList({required this.items});
  final List<Activity> items;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    return SectionCard(
      title: l.latestActivity,
      padding: EdgeInsets.zero,
      child: items.isEmpty
          ? Padding(padding: const EdgeInsets.all(16), child: Text(l.noActivity))
          : Column(children: [
              for (final a in items) ...[
                ListTile(
                  onTap: () => context.push('/batches/${a.investmentId}'),
                  title: Text(
                    a.title,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      decoration: a.superseded ? TextDecoration.lineThrough : null,
                      color: a.superseded ? KColors.inkMuted : KColors.ink,
                    ),
                  ),
                  subtitle: Text('${a.reference} · ${timeAgo(lang, a.createdAt)}'),
                  trailing: a.amount != null && a.amount! > 0
                      ? Text(bdt(a.amount!), style: const TextStyle(fontWeight: FontWeight.w700))
                      : null,
                ),
                if (a != items.last) const Divider(indent: 16, endIndent: 16),
              ],
            ]),
    );
  }
}
