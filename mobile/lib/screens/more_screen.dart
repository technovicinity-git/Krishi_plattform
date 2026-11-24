import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/format.dart';
import '../core/session.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final me = session.me!;
    final l = context.l;
    final lang = session.locale;
    final roleLabel = switch (me.role) {
      'investor' => l.role_investor,
      'steward' => l.role_steward,
      _ => l.role_farmer,
    };
    final webHome = switch (me.role) {
      'investor' => '/portal',
      'steward' => '/steward',
      _ => '/farmer',
    };
    return Scaffold(
      appBar: AppBar(title: Text(l.moreTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        children: [
          ResponsiveBody(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: KColors.brandTint,
                      child: Text(
                        (me.fullName?.isNotEmpty == true ? me.fullName![0] : '?').toUpperCase(),
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: KColors.greenDeep),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(me.fullName ?? '—', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                        Text(me.phone ?? '', style: const TextStyle(color: KColors.inkSecondary)),
                        const SizedBox(height: 4),
                        StatusChip(roleLabel, tone: Tone.success),
                      ]),
                    ),
                  ]),
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: Column(children: [
                  ListTile(
                    leading: const Icon(Icons.person_outline),
                    title: Text(l.profileTitle),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/profile'),
                  ),
                  const Divider(indent: 16, endIndent: 16),
                  if (me.isInvestor) ...[
                    ListTile(
                      leading: const Icon(Icons.inbox_outlined),
                      title: Text(l.myInterests),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.push('/interests'),
                    ),
                    const Divider(indent: 16, endIndent: 16),
                  ],
                  if (me.isSteward) ...[
                    ListTile(
                      leading: const Icon(Icons.groups_outlined),
                      title: Text(l.farmersTitle),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.push('/farmers'),
                    ),
                    const Divider(indent: 16, endIndent: 16),
                    ListTile(
                      leading: const Icon(Icons.assignment_outlined),
                      title: Text(l.myPlansTitle),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.push('/steward-plans'),
                    ),
                    const Divider(indent: 16, endIndent: 16),
                  ],
                  ListTile(
                    leading: const Icon(Icons.receipt_long_outlined),
                    title: Text(l.transactions),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/transactions'),
                  ),
                  const Divider(indent: 16, endIndent: 16),
                  ListTile(
                    leading: const Icon(Icons.notifications_outlined),
                    title: Text(l.notificationsTitle),
                    trailing: me.unreadNotifications > 0
                        ? Badge(label: Text('${me.unreadNotifications}'))
                        : const Icon(Icons.chevron_right),
                    onTap: () => context.push('/notifications'),
                  ),
                  if (!me.isFarmer) ...[
                    const Divider(indent: 16, endIndent: 16),
                    ListTile(
                      leading: const Icon(Icons.pets_outlined),
                      title: Text(l.livestockTitle),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.go('/livestock'),
                    ),
                  ],
                  if (me.isInvestor) ...[
                    const Divider(indent: 16, endIndent: 16),
                    ListTile(
                      leading: const Icon(Icons.verified_user_outlined),
                      title: Text(l.kycStatus),
                      subtitle: Text(label(lang, 'status', me.kycStatus)),
                      trailing: me.kycStatus == 'verified' || me.kycStatus == 'pending' || me.kycStatus == 'under_review'
                          ? null
                          : const Icon(Icons.chevron_right),
                      onTap: me.kycStatus == 'verified' || me.kycStatus == 'pending' || me.kycStatus == 'under_review'
                          ? null
                          : () => context.push('/kyc'),
                    ),
                  ],
                ]),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(l.language, style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    SegmentedButton<String>(
                      showSelectedIcon: false,
                      segments: [
                        ButtonSegment(value: 'bn', label: Text(l.bangla)),
                        ButtonSegment(value: 'en', label: Text(l.english)),
                      ],
                      selected: {lang},
                      onSelectionChanged: (v) => session.setLocale(v.first),
                    ),
                  ]),
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: Column(children: [
                  ListTile(
                    leading: const Icon(Icons.language),
                    title: Text(l.website),
                    subtitle: Text(l.manageOnWebsite),
                    trailing: const Icon(Icons.open_in_new, size: 18),
                    onTap: () => openWebsite(lang == 'en' ? '/en$webHome' : webHome),
                  ),
                  const Divider(indent: 16, endIndent: 16),
                  ListTile(
                    leading: const Icon(Icons.devices_outlined),
                    title: Text(l.signOutAll),
                    subtitle: Text(l.signOutAllHint),
                    onTap: () async {
                      if (await confirmDialog(context, title: l.signOutAll, body: l.signOutAllBody, confirm: l.signOutAll, danger: true)) {
                        try {
                          await session.signOutEverywhere();
                        } catch (e) {
                          if (context.mounted) showSnack(context, errorText(context, e), error: true);
                        }
                      }
                    },
                  ),
                  const Divider(indent: 16, endIndent: 16),
                  ListTile(
                    leading: const Icon(Icons.logout, color: KColors.danger),
                    title: Text(l.signOut, style: const TextStyle(color: KColors.danger, fontWeight: FontWeight.w600)),
                    onTap: () async {
                      if (await confirmDialog(context, title: l.signOut, body: l.signOutConfirm, confirm: l.signOut, danger: true)) {
                        await session.signOut();
                      }
                    },
                  ),
                ]),
              ),
            ]),
          ),
        ],
      ),
    );
  }
}
