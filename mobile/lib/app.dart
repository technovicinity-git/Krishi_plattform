import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/session.dart';
import 'l10n/app_localizations.dart';
import 'screens/approvals_screen.dart';
import 'screens/auth_screens.dart';
import 'screens/batch_detail_screen.dart';
import 'screens/batches_screen.dart';
import 'screens/home_screen.dart';
import 'screens/interests_screens.dart';
import 'screens/livestock_screen.dart';
import 'screens/login_screen.dart';
import 'screens/more_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/payout_screen.dart';
import 'screens/plans_screens.dart';
import 'screens/profile_screen.dart';
import 'screens/shell.dart';
import 'screens/steward_screens.dart';
import 'screens/wallet_screen.dart';
import 'ui/theme.dart';

/// Screens anyone can open without signing in.
bool _isPublic(String at) =>
    const {'/login', '/register', '/forgot', '/activate', '/steward-register'}.contains(at) || at.startsWith('/explore');

/// Screens that finish setting up a new account.
const _setupScreens = {'/verify', '/steward-details', '/steward-pending'};

const _stewardOnly = ['/approvals', '/farmers', '/steward-plans'];
const _investorOnly = ['/plans', '/interests', '/onboarding', '/kyc'];

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
        if (!session.signedIn) return _isPublic(at) ? null : '/login';

        // A new account finishes setting up first.
        final me = session.me!;
        final setup = me.needsPhoneVerification
            ? '/verify'
            : me.needsStewardDetails
                ? '/steward-details'
                : me.stewardWaiting
                    ? '/steward-pending'
                    : null;
        if (setup != null) return at == setup ? null : setup;
        if (at == '/splash' || _setupScreens.contains(at) || (_isPublic(at) && !at.startsWith('/explore'))) return '/home';

        if (!me.isSteward && _stewardOnly.any(at.startsWith)) return '/home';
        if (!me.isInvestor && _investorOnly.any(at.startsWith)) return '/home';
        return null;
      },
      routes: [
        GoRoute(path: '/splash', builder: (_, _) => const _Splash()),
        GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
        GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
        GoRoute(path: '/forgot', builder: (_, _) => const ForgotPasswordScreen()),
        GoRoute(path: '/activate', builder: (_, _) => const FarmerActivateScreen()),
        GoRoute(path: '/steward-register', builder: (_, _) => const StewardRegisterScreen()),
        GoRoute(path: '/verify', builder: (_, state) => VerifyPhoneScreen(devCode: state.extra as String?)),
        GoRoute(path: '/steward-details', builder: (_, _) => const StewardDetailsScreen()),
        GoRoute(path: '/steward-pending', builder: (_, _) => const StewardPendingScreen()),
        // Plans before signing in.
        GoRoute(path: '/explore', builder: (_, _) => const PlansScreen()),
        GoRoute(path: '/explore/:id', builder: (_, state) => PlanDetailScreen(id: state.pathParameters['id']!)),
        ShellRoute(
          builder: (_, state, child) => AppShell(location: state.matchedLocation, child: child),
          routes: [
            GoRoute(path: '/home', pageBuilder: (_, _) => const NoTransitionPage(child: HomeScreen())),
            GoRoute(path: '/plans', pageBuilder: (_, _) => const NoTransitionPage(child: PlansScreen())),
            GoRoute(path: '/batches', pageBuilder: (_, _) => const NoTransitionPage(child: BatchesScreen())),
            GoRoute(path: '/approvals', pageBuilder: (_, _) => const NoTransitionPage(child: ApprovalsScreen())),
            GoRoute(path: '/livestock', pageBuilder: (_, _) => const NoTransitionPage(child: LivestockScreen())),
            GoRoute(path: '/wallet', pageBuilder: (_, _) => const NoTransitionPage(child: WalletScreen())),
            GoRoute(path: '/more', pageBuilder: (_, _) => const NoTransitionPage(child: MoreScreen())),
          ],
        ),
        GoRoute(
          path: '/plans/:id',
          parentNavigatorKey: _rootKey,
          builder: (_, state) => PlanDetailScreen(id: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/batches/:id',
          parentNavigatorKey: _rootKey,
          builder: (_, state) => BatchDetailScreen(id: state.pathParameters['id']!),
        ),
        GoRoute(path: '/interests', parentNavigatorKey: _rootKey, builder: (_, _) => const InterestsScreen()),
        GoRoute(
          path: '/onboarding/:reference',
          parentNavigatorKey: _rootKey,
          builder: (_, state) => OnboardingScreen(reference: state.pathParameters['reference']!),
        ),
        GoRoute(path: '/kyc', parentNavigatorKey: _rootKey, builder: (_, _) => const KycScreen()),
        GoRoute(path: '/farmers', parentNavigatorKey: _rootKey, builder: (_, _) => const FarmersScreen()),
        GoRoute(path: '/steward-plans', parentNavigatorKey: _rootKey, builder: (_, _) => const StewardPlansScreen()),
        GoRoute(path: '/profile', parentNavigatorKey: _rootKey, builder: (_, _) => const ProfileScreen()),
        GoRoute(path: '/notifications', parentNavigatorKey: _rootKey, builder: (_, _) => const NotificationsScreen()),
        GoRoute(path: '/payout', parentNavigatorKey: _rootKey, builder: (_, _) => const PayoutScreen()),
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
