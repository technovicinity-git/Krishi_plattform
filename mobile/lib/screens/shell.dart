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
/// Also refreshes the unread notification count whenever the app comes back
/// to the foreground (push notifications aren't set up yet).
class AppShell extends StatefulWidget {
  const AppShell({super.key, required this.location, required this.child});
  final String location;
  final Widget child;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) context.read<Session>().refreshMe().catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final location = widget.location;
    final child = widget.child;
    final me = context.watch<Session>().me;
    final l = context.l;
    if (me == null) return const SizedBox.shrink();

    final tabs = <_Tab>[
      _Tab('/home', Icons.home_outlined, Icons.home_rounded, l.navHome),
      if (me.isInvestor) _Tab('/plans', Icons.storefront_outlined, Icons.storefront, l.navPlans),
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
