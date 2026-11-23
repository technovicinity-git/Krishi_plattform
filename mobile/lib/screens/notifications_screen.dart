import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _loader = GlobalKey<LoaderState<List<NotificationItem>>>();
  final Set<String> _readNow = {};

  Future<void> _markRead([List<String>? ids]) async {
    try {
      await context.api.post('/api/notifications/read', ids == null ? <String, dynamic>{} : {'ids': ids});
    } catch (_) {
      // Not critical: it is marked read next time.
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    return Scaffold(
      appBar: AppBar(
        title: Text(l.notificationsTitle),
        actions: [
          TextButton(
            onPressed: () async {
              await _markRead();
              if (!context.mounted) return;
              context.session.setUnread(0);
              _loader.currentState?.reload();
            },
            child: Text(l.markAllRead),
          ),
        ],
      ),
      body: Loader<List<NotificationItem>>(
        key: _loader,
        load: () async {
          final data = await context.api.get('/api/mobile/v1/notifications', query: {'limit': 100});
          if (context.mounted) context.session.setUnread((data['unread'] as num).toInt());
          _readNow.clear();
          return (data['items'] as List).map((e) => NotificationItem(Json.from(e as Map))).toList();
        },
        builder: (context, items, _) {
          if (items.isEmpty) {
            return ListView(children: [EmptyView(icon: Icons.notifications_none, title: l.noNotifications)]);
          }
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, _) => const Divider(),
            itemBuilder: (context, i) {
              final n = items[i];
              final unread = !n.read && !_readNow.contains(n.id);
              return ResponsiveBody(
                child: Container(
                  color: unread ? KColors.brandTint.withValues(alpha: 0.6) : null,
                  child: ListTile(
                    leading: Icon(unread ? Icons.circle : Icons.circle_outlined, size: 10,
                        color: unread ? KColors.brand : KColors.border),
                    minLeadingWidth: 10,
                    title: Text(n.title, style: TextStyle(fontWeight: unread ? FontWeight.w800 : FontWeight.w600)),
                    subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      if (n.body.isNotEmpty) Text(n.body),
                      const SizedBox(height: 2),
                      Text(timeAgo(lang, n.createdAt), style: const TextStyle(fontSize: 11.5, color: KColors.inkMuted)),
                    ]),
                    onTap: () {
                      if (unread) {
                        setState(() => _readNow.add(n.id));
                        _markRead([n.id]);
                        final me = context.session.me;
                        if (me != null) context.session.setUnread((me.unreadNotifications - 1).clamp(0, 1 << 30));
                      }
                      final href = n.j['href'] is String ? n.j['href'] as String : '';
                      final onboarding = RegExp(r'/onboarding/([A-Z0-9-]+)').firstMatch(href);
                      if (n.investmentId != null) {
                        context.push('/batches/${n.investmentId}');
                      } else if (onboarding != null) {
                        context.push('/onboarding/${onboarding.group(1)}');
                      } else if (href.contains('/portal/interests') || href.contains('/interest/')) {
                        context.push('/interests');
                      } else if (href.contains('/portal/kyc')) {
                        context.push('/kyc');
                      } else if (href.contains('/steward/interests')) {
                        context.go('/approvals');
                      } else if (href.contains('wallet')) {
                        context.go('/wallet');
                      }
                    },
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
