import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/session.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _hide = true;
  String? _error;

  // Same rule as the website (lib/auth/phone.ts): 01XXXXXXXXX, 8801XXXXXXXXX or +8801XXXXXXXXX.
  bool get _validPhone {
    var digits = _phone.text.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('0')) digits = digits.substring(1);
    if (digits.startsWith('880')) digits = digits.substring(3);
    return RegExp(r'^1[3-9]\d{8}$').hasMatch(digits);
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_validPhone) {
      setState(() => _error = context.l.invalidPhone);
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<Session>().signIn(_phone.text, _password.text);
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final session = context.watch<Session>();
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: AutofillGroup(
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Align(
                    alignment: Alignment.centerRight,
                    child: SegmentedButton<String>(
                      showSelectedIcon: false,
                      segments: [
                        ButtonSegment(value: 'bn', label: Text(l.bangla)),
                        ButtonSegment(value: 'en', label: Text(l.english)),
                      ],
                      selected: {session.locale},
                      onSelectionChanged: (v) => session.setLocale(v.first),
                    ),
                  ),
                  const SizedBox(height: 28),
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(color: KColors.greenDeep, borderRadius: BorderRadius.circular(18)),
                    child: const Icon(Icons.eco_rounded, color: Colors.white, size: 36),
                  ),
                  const SizedBox(height: 20),
                  Text(l.signInTitle, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(l.signInSubtitle, style: const TextStyle(color: KColors.inkSecondary, fontSize: 15)),
                  const SizedBox(height: 28),
                  if (session.sessionExpired) ...[
                    InfoBanner(text: l.sessionExpired, tone: Tone.warning),
                    const SizedBox(height: 16),
                  ],
                  TextField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    autofillHints: const [AutofillHints.telephoneNumber],
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(
                      labelText: l.phoneLabel,
                      hintText: l.phoneHint,
                      prefixIcon: const Icon(Icons.phone_outlined),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _password,
                    obscureText: _hide,
                    autofillHints: const [AutofillHints.password],
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _submit(),
                    decoration: InputDecoration(
                      labelText: l.passwordLabel,
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(_hide ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        onPressed: () => setState(() => _hide = !_hide),
                      ),
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, style: const TextStyle(color: KColors.danger, fontWeight: FontWeight.w600)),
                  ],
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: _busy ? null : _submit,
                    child: _busy
                        ? const SizedBox(
                            width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                        : Text(l.signIn),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => openWebsite(session.locale == 'en' ? '/en/forgot-password' : '/forgot-password'),
                    child: Text(l.forgotPassword),
                  ),
                  TextButton(
                    onPressed: () => openWebsite(session.locale == 'en' ? '/en/register' : '/register'),
                    child: Text(l.newHere, textAlign: TextAlign.center),
                  ),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
