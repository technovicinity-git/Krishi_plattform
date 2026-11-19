import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/session.dart';
import 'l10n/app_localizations.dart';
import 'screens/approvals_screen.dart';
import 'screens/batch_detail_screen.dart';
import 'screens/batches_screen.dart';
import 'screens/home_screen.dart';
import 'screens/livestock_screen.dart';
import 'screens/login_screen.dart';
import 'screens/more_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/payout_screen.dart';
import 'screens/shell.dart';
import 'screens/wallet_screen.dart';
import 'ui/theme.dart';

class KrishiApp extends StatefulWidget {
  const KrishiApp({super.key});

  @override
  State<KrishiApp> createState() => _KrishiAppState();
}

class _KrishiAppState extends State<KrishiApp> {
  final _rootKey = GlobalKey<NavigatorState>();
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    final session = context.read<Session>();
    _router = GoRouter(
      navigatorKey: _rootKey,
      initialLocation: '/home',
      refreshListenable: session,
      redirect: (context, state) {
        final at = state.matchedLocation;
        if (!session.ready) return at == '/splash' ? null : '/splash';
        if (!session.signedIn) return at == '/login' ? null : '/login';
        if (at == '/login' || at == '/splash') return '/home';
        if (at == '/approvals' && !session.me!.isSteward) return '/home';
        return null;
      },
      routes: [
        GoRoute(path: '/splash', builder: (_, _) => const _Splash()),
        GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
        ShellRoute(
          builder: (_, state, child) => AppShell(location: state.matchedLocation, child: child),
          routes: [
            GoRoute(path: '/home', pageBuilder: (_, _) => const NoTransitionPage(child: HomeScreen())),
            GoRoute(path: '/batches', pageBuilder: (_, _) => const NoTransitionPage(child: BatchesScreen())),
            GoRoute(path: '/approvals', pageBuilder: (_, _) => const NoTransitionPage(child: ApprovalsScreen())),
            GoRoute(path: '/livestock', pageBuilder: (_, _) => const NoTransitionPage(child: LivestockScreen())),
            GoRoute(path: '/wallet', pageBuilder: (_, _) => const NoTransitionPage(child: WalletScreen())),
            GoRoute(path: '/more', pageBuilder: (_, _) => const NoTransitionPage(child: MoreScreen())),
          ],
        ),
        GoRoute(
          path: '/batches/:id',
          parentNavigatorKey: _rootKey,
          builder: (_, state) => BatchDetailScreen(id: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/notifications',
          parentNavigatorKey: _rootKey,
          builder: (_, _) => const NotificationsScreen(),
        ),
        GoRoute(
          path: '/payout',
          parentNavigatorKey: _rootKey,
          builder: (_, _) => const PayoutScreen(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.select<Session, String>((s) => s.locale);
    return MaterialApp.router(
      onGenerateTitle: (context) => AppLocalizations.of(context).appName,
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      locale: Locale(locale),
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: _router,
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) => const Scaffold(
        backgroundColor: KColors.greenDeep,
        body: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.eco_rounded, color: Colors.white, size: 56),
            SizedBox(height: 12),
            Text('Krishi', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800)),
            SizedBox(height: 24),
            SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.4)),
          ]),
        ),
      );
}
