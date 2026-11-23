import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/models.dart';
import '../core/session.dart';
import '../core/validate.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

// Sign-up, phone verification, password reset, farmer activation and steward
// sign-up. Each posts to the same API as the website; sign-in routes return a
// token to the app (see Session).

/// Centered, scrollable form used by every auth screen.
class _AuthPage extends StatelessWidget {
  const _AuthPage({required this.title, this.subtitle, required this.children, this.showBack = true});
  final String title;
  final String? subtitle;
  final List<Widget> children;
  final bool showBack;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: showBack ? AppBar() : null,
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Text(title, style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w800)),
                  if (subtitle != null) ...[
                    const SizedBox(height: 6),
                    Text(subtitle!, style: const TextStyle(color: KColors.inkSecondary, fontSize: 15)),
                  ],
                  const SizedBox(height: 24),
                  for (final c in children) ...[c, const SizedBox(height: 14)],
                ]),
              ),
            ),
          ),
        ),
      );
}

class _SubmitButton extends StatelessWidget {
  const _SubmitButton({required this.label, required this.busy, required this.onPressed});
  final String label;
  final bool busy;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) => FilledButton(
        onPressed: busy ? null : onPressed,
        child: busy
            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
            : Text(label),
      );
}

class _ErrorText extends StatelessWidget {
  const _ErrorText(this.text);
  final String? text;

  @override
  Widget build(BuildContext context) => text == null
      ? const SizedBox.shrink()
      : Text(text!, style: const TextStyle(color: KColors.danger, fontWeight: FontWeight.w600));
}

class _PasswordField extends StatefulWidget {
  const _PasswordField({required this.controller, required this.label, this.helper, this.onChanged});
  final TextEditingController controller;
  final String label;
  final String? helper;
  final ValueChanged<String>? onChanged;

  @override
  State<_PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<_PasswordField> {
  bool _hide = true;

  @override
  Widget build(BuildContext context) => TextField(
        controller: widget.controller,
        obscureText: _hide,
        onChanged: widget.onChanged,
        autofillHints: const [AutofillHints.newPassword],
        decoration: InputDecoration(
          labelText: widget.label,
          helperText: widget.helper,
          helperMaxLines: 2,
          prefixIcon: const Icon(Icons.lock_outline),
          suffixIcon: IconButton(
            icon: Icon(_hide ? Icons.visibility_outlined : Icons.visibility_off_outlined),
            onPressed: () => setState(() => _hide = !_hide),
          ),
        ),
      );
}

TextField _phoneField(BuildContext context, TextEditingController c, {ValueChanged<String>? onChanged}) => TextField(
      controller: c,
      keyboardType: TextInputType.phone,
      autofillHints: const [AutofillHints.telephoneNumber],
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: context.l.phoneLabel,
        hintText: context.l.phoneHint,
        prefixIcon: const Icon(Icons.phone_outlined),
      ),
    );

TextField _codeField(BuildContext context, TextEditingController c, {ValueChanged<String>? onChanged}) => TextField(
      controller: c,
      keyboardType: TextInputType.number,
      maxLength: 6,
      autofillHints: const [AutofillHints.oneTimeCode],
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      onChanged: onChanged,
      style: const TextStyle(fontSize: 22, letterSpacing: 8, fontWeight: FontWeight.w700),
      textAlign: TextAlign.center,
      decoration: InputDecoration(labelText: context.l.codeLabel, counterText: ''),
    );

/// Shows the code when the server returns it (development / staging only).
class _DevCode extends StatelessWidget {
  const _DevCode(this.code);
  final String? code;

  @override
  Widget build(BuildContext context) =>
      code == null ? const SizedBox.shrink() : InfoBanner(text: context.l.devCode(code!), tone: Tone.info);
}

// ─── Investor sign-up ────────────────────────────────────────────────────────

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    final l = context.l;
    String? problem;
    if (_name.text.trim().length < 2) problem = l.fullName;
    if (problem == null && !isValidBdPhone(_phone.text)) problem = l.invalidPhone;
    if (problem == null && !isStrongPassword(_password.text)) problem = l.passwordRule;
    if (problem != null) {
      setState(() => _error = problem == l.fullName ? '${l.fullName}: ${l.required}' : problem);
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final devCode = await context.read<Session>().registerInvestor(
            name: _name.text,
            phone: _phone.text,
            email: _email.text,
            password: _password.text,
          );
      // The router sends a new investor to /verify; pass the test code along.
      if (mounted) context.go('/verify', extra: devCode);
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return _AuthPage(
      title: l.registerTitle,
      subtitle: l.registerSubtitle,
      children: [
        TextField(controller: _name, textCapitalization: TextCapitalization.words, autofillHints: const [AutofillHints.name],
            decoration: InputDecoration(labelText: l.fullName, prefixIcon: const Icon(Icons.person_outline))),
        _phoneField(context, _phone),
        TextField(controller: _email, keyboardType: TextInputType.emailAddress, autofillHints: const [AutofillHints.email],
            decoration: InputDecoration(labelText: l.optional(l.email), prefixIcon: const Icon(Icons.mail_outline))),
        _PasswordField(controller: _password, label: l.passwordLabel, helper: l.passwordHint),
        _ErrorText(_error),
        _SubmitButton(label: l.createAccount, busy: _busy, onPressed: _submit),
        TextButton(onPressed: () => context.go('/login'), child: Text(l.haveAccount)),
      ],
    );
  }
}

// ─── Phone verification (right after investor sign-up) ───────────────────────

class VerifyPhoneScreen extends StatefulWidget {
  const VerifyPhoneScreen({super.key, this.devCode});
  final String? devCode;
  @override
  State<VerifyPhoneScreen> createState() => _VerifyPhoneScreenState();
}

class _VerifyPhoneScreenState extends State<VerifyPhoneScreen> {
  final _code = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<Session>().verifyPhone(_code.text);
      // The router moves on to the home screen once the phone is verified.
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
    return _AuthPage(
      showBack: false,
      title: l.verifyTitle,
      subtitle: l.verifyBody(session.me?.phone ?? ''),
      children: [
        _DevCode(widget.devCode),
        _codeField(context, _code, onChanged: (_) => setState(() {})),
        _ErrorText(_error),
        _SubmitButton(label: l.verify, busy: _busy, onPressed: isSixDigitCode(_code.text) ? _submit : null),
        TextButton(onPressed: () => session.signOut(), child: Text(l.useAnotherNumber)),
      ],
    );
  }
}

// ─── Forgot password: phone → code + new password ────────────────────────────

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _phone = TextEditingController();
  final _code = TextEditingController();
  final _password = TextEditingController();
  bool _codeSent = false;
  String? _devCode;
  bool _busy = false;
  String? _error;

  Future<void> _run(Future<void> Function() call) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await call();
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _sendCode() => _run(() async {
        if (!isValidBdPhone(_phone.text)) throw Exception();
        final data = await context.api.post('/api/auth/forgot-password', {'phone': _phone.text.trim()});
        setState(() {
          _codeSent = true;
          _devCode = data['devOtp'] as String?;
        });
      });

  Future<void> _reset() => _run(() async {
        final api = context.api;
        await api.post('/api/auth/verify-reset-otp', {'phone': _phone.text.trim(), 'otp': _code.text.trim()});
        await api.post('/api/auth/reset-password', {'phone': _phone.text.trim(), 'newPassword': _password.text});
        if (!mounted) return;
        showSnack(context, context.l.passwordResetDone);
        context.go('/login');
      });

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    if (!_codeSent) {
      return _AuthPage(
        title: l.forgotTitle,
        subtitle: l.forgotBody,
        children: [
          _phoneField(context, _phone, onChanged: (_) => setState(() {})),
          _ErrorText(_error),
          _SubmitButton(label: l.sendCode, busy: _busy, onPressed: isValidBdPhone(_phone.text) ? _sendCode : null),
        ],
      );
    }
    return _AuthPage(
      title: l.forgotTitle,
      subtitle: l.resetBody(_phone.text.trim()),
      children: [
        _DevCode(_devCode),
        _codeField(context, _code, onChanged: (_) => setState(() {})),
        _PasswordField(controller: _password, label: l.newPassword, helper: l.passwordHint, onChanged: (_) => setState(() {})),
        _ErrorText(_error),
        _SubmitButton(
          label: l.resetPassword,
          busy: _busy,
          onPressed: isSixDigitCode(_code.text) && isStrongPassword(_password.text) ? _reset : null,
        ),
        TextButton(onPressed: _busy ? null : _sendCode, child: Text(l.resendCode)),
      ],
    );
  }
}

// ─── Farmer activation (code from the steward) ───────────────────────────────

class FarmerActivateScreen extends StatefulWidget {
  const FarmerActivateScreen({super.key});
  @override
  State<FarmerActivateScreen> createState() => _FarmerActivateScreenState();
}

class _FarmerActivateScreenState extends State<FarmerActivateScreen> {
  final _phone = TextEditingController();
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    final l = context.l;
    if (_password.text != _confirm.text) {
      setState(() => _error = l.passwordsDontMatch);
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<Session>().activateFarmer(phone: _phone.text, code: _code.text, password: _password.text);
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final ready = isValidBdPhone(_phone.text) && isSixDigitCode(_code.text) && isStrongPassword(_password.text);
    return _AuthPage(
      title: l.activateTitle,
      subtitle: l.activateBody,
      children: [
        _phoneField(context, _phone, onChanged: (_) => setState(() {})),
        _codeField(context, _code, onChanged: (_) => setState(() {})),
        _PasswordField(controller: _password, label: l.newPassword, helper: l.passwordHint, onChanged: (_) => setState(() {})),
        _PasswordField(controller: _confirm, label: l.confirmPassword),
        _ErrorText(_error),
        _SubmitButton(label: l.activate, busy: _busy, onPressed: ready ? _submit : null),
      ],
    );
  }
}

// ─── Steward sign-up (step 1: account) ───────────────────────────────────────

class StewardRegisterScreen extends StatefulWidget {
  const StewardRegisterScreen({super.key});
  @override
  State<StewardRegisterScreen> createState() => _StewardRegisterScreenState();
}

class _StewardRegisterScreenState extends State<StewardRegisterScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    final l = context.l;
    if (!isValidBdPhone(_phone.text)) return setState(() => _error = l.invalidPhone);
    if (!isStrongPassword(_password.text)) return setState(() => _error = l.passwordRule);
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<Session>().registerSteward(
            name: _name.text,
            phone: _phone.text,
            email: _email.text,
            password: _password.text,
          );
      // The router sends a steward without details to /steward-details.
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return _AuthPage(
      title: l.stewardSignupTitle,
      subtitle: l.stewardSignupBody,
      children: [
        TextField(controller: _name, textCapitalization: TextCapitalization.words, onChanged: (_) => setState(() {}),
            decoration: InputDecoration(labelText: l.fullName, prefixIcon: const Icon(Icons.person_outline))),
        _phoneField(context, _phone),
        TextField(controller: _email, keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: l.optional(l.email), prefixIcon: const Icon(Icons.mail_outline))),
        _PasswordField(controller: _password, label: l.passwordLabel, helper: l.passwordHint),
        _ErrorText(_error),
        _SubmitButton(label: l.continueLabel, busy: _busy, onPressed: _name.text.trim().length >= 2 ? _submit : null),
        TextButton(onPressed: () => context.go('/login'), child: Text(l.haveAccount)),
      ],
    );
  }
}

// ─── Steward sign-up (step 2: details) ───────────────────────────────────────

const kStewardCategories = ['cattle', 'goats', 'sheep', 'dumba', 'garoleSheep', 'other'];

class StewardDetailsScreen extends StatefulWidget {
  const StewardDetailsScreen({super.key});
  @override
  State<StewardDetailsScreen> createState() => _StewardDetailsScreenState();
}

class _StewardDetailsScreenState extends State<StewardDetailsScreen> {
  String _type = 'individual';
  String? _division;
  String? _district;
  final _upazila = TextEditingController();
  final _experience = TextEditingController();
  final Set<String> _categories = {};
  List<Json> _divisions = const [];
  List<Json> _districts = const [];
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadLocations();
  }

  Future<void> _loadLocations() async {
    try {
      final data = await context.api.get('/api/mobile/v1/locations');
      if (!mounted) return;
      setState(() {
        _divisions = (data['divisions'] as List).map((e) => Json.from(e as Map)).toList();
        _districts = (data['districts'] as List).map((e) => Json.from(e as Map)).toList();
      });
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    }
  }

  String _category(String key) {
    final l = context.l;
    return switch (key) {
      'cattle' => l.cat_cattle,
      'goats' => l.cat_goats,
      'sheep' => l.cat_sheep,
      'dumba' => l.cat_dumba,
      'garoleSheep' => l.cat_garoleSheep,
      _ => l.cat_other,
    };
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final session = context.read<Session>();
    try {
      await context.api.post('/api/auth/steward-details', {
        'stewardType': _type,
        'divisionId': _division,
        'districtId': _district,
        'upazila': _upazila.text.trim(),
        'categories': _categories.toList(),
        'experience': _experience.text.trim(),
      });
      await session.refreshMe();
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final bn = context.lang == 'bn';
    String name(Json j) => '${bn ? j['nameBn'] : j['nameEn']}';
    final districts = _districts.where((d) => d['divisionId'] == _division).toList();
    final ready = _division != null && _district != null && _categories.isNotEmpty && _experience.text.trim().length >= 10;
    return _AuthPage(
      showBack: false,
      title: l.stewardDetailsTitle,
      children: [
        Text(l.stewardType, style: const TextStyle(fontWeight: FontWeight.w600)),
        SegmentedButton<String>(
          showSelectedIcon: false,
          segments: [
            ButtonSegment(value: 'individual', label: Text(l.individual)),
            ButtonSegment(value: 'organization', label: Text(l.organization)),
          ],
          selected: {_type},
          onSelectionChanged: (v) => setState(() => _type = v.first),
        ),
        ChoiceField(
          label: l.division,
          value: _division,
          options: {for (final d in _divisions) '${d['id']}': name(d)},
          onChanged: (v) => setState(() {
            _division = v;
            if (!districts.any((d) => d['id'] == _district)) _district = null;
          }),
        ),
        ChoiceField(
          key: ValueKey(_division),
          label: l.district,
          value: _district,
          options: {for (final d in districts) '${d['id']}': name(d)},
          onChanged: (v) => setState(() => _district = v),
        ),
        TextField(controller: _upazila, decoration: InputDecoration(labelText: l.optional(l.upazila))),
        Text(l.livestockYouRaise, style: const TextStyle(fontWeight: FontWeight.w600)),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final c in kStewardCategories)
            FilterChip(
              label: Text(_category(c)),
              selected: _categories.contains(c),
              onSelected: (on) => setState(() => on ? _categories.add(c) : _categories.remove(c)),
            ),
        ]),
        TextField(
          controller: _experience,
          minLines: 3,
          maxLines: 6,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(labelText: l.experience, helperText: l.experienceHint, helperMaxLines: 2),
        ),
        _ErrorText(_error),
        _SubmitButton(label: l.submitForReview, busy: _busy, onPressed: ready ? _submit : null),
        TextButton(onPressed: () => context.read<Session>().signOut(), child: Text(l.signOut)),
      ],
    );
  }
}

// ─── Steward waiting for approval (or rejected) ──────────────────────────────

class StewardPendingScreen extends StatefulWidget {
  const StewardPendingScreen({super.key});
  @override
  State<StewardPendingScreen> createState() => _StewardPendingScreenState();
}

class _StewardPendingScreenState extends State<StewardPendingScreen> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final session = context.watch<Session>();
    final me = session.me!;
    final rejected = me.stewardApprovalStatus == 'rejected';
    return _AuthPage(
      showBack: false,
      title: rejected ? l.stewardRejectedTitle : l.stewardPendingTitle,
      children: [
        Icon(rejected ? Icons.info_outline : Icons.hourglass_top_rounded, size: 56,
            color: rejected ? KColors.danger : KColors.brand),
        Text(
          rejected ? (me.stewardRejectionReason ?? '') : l.stewardPendingBody,
          style: const TextStyle(color: KColors.inkSecondary, fontSize: 15),
        ),
        OutlinedButton.icon(
          onPressed: _busy
              ? null
              : () async {
                  setState(() => _busy = true);
                  try {
                    await session.refreshMe();
                  } catch (_) {}
                  if (mounted) setState(() => _busy = false);
                },
          icon: const Icon(Icons.refresh),
          label: Text(l.checkAgain),
        ),
        TextButton(onPressed: () => session.signOut(), child: Text(l.signOut)),
      ],
    );
  }
}
