import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/session.dart';
import '../ui/widgets.dart';

class _Tab {
  const _Tab(this.path, this.icon, this.selectedIcon, this.label);
  final String path;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

/// Bottom tabs, chosen by role. On tablets the tabs move to a side rail.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.location, required this.child});
  final String location;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final me = context.watch<Session>().me;
    final l = context.l;
    if (me == null) return const SizedBox.shrink();

    final tabs = <_Tab>[
      _Tab('/home', Icons.home_outlined, Icons.home_rounded, l.navHome),
      if (me.isSteward) _Tab('/approvals', Icons.fact_check_outlined, Icons.fact_check, l.navApprovals),
      _Tab('/batches', Icons.inventory_2_outlined, Icons.inventory_2, l.navBatches),
      if (me.isFarmer) _Tab('/livestock', Icons.pets_outlined, Icons.pets, l.navLivestock),
      _Tab('/wallet', Icons.account_balance_wallet_outlined, Icons.account_balance_wallet, l.navWallet),
      _Tab('/more', Icons.menu_rounded, Icons.menu_rounded, l.navMore),
    ];
    var index = tabs.indexWhere((t) => location.startsWith(t.path));
    if (index < 0) index = tabs.length - 1; // e.g. livestock opened from More

    void go(int i) => context.go(tabs[i].path);

    if (context.wide) {
      return Scaffold(
        body: Row(children: [
          NavigationRail(
            selectedIndex: index,
            onDestinationSelected: go,
            labelType: NavigationRailLabelType.all,
            destinations: [
              for (final t in tabs)
                NavigationRailDestination(icon: Icon(t.icon), selectedIcon: Icon(t.selectedIcon), label: Text(t.label)),
            ],
          ),
          const VerticalDivider(width: 1),
          Expanded(child: child),
        ]),
      );
    }

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: go,
        destinations: [
          for (final t in tabs)
            NavigationDestination(icon: Icon(t.icon), selectedIcon: Icon(t.selectedIcon), label: t.label),
        ],
      ),
    );
  }
}
