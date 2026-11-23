import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/session.dart';
import '../core/validate.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

/// Name, email and password. Same APIs as the website
/// (PUT /api/account/profile, POST /api/account/change-password).
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final _name = TextEditingController(text: context.read<Session>().me?.fullName ?? '');
  late final _email = TextEditingController(text: context.read<Session>().me?.email ?? '');
  final _current = TextEditingController();
  final _new = TextEditingController();
  bool _savingProfile = false;
  bool _savingPassword = false;
  String? _profileError;
  String? _passwordError;

  Future<void> _saveProfile() async {
    setState(() {
      _savingProfile = true;
      _profileError = null;
    });
    final session = context.read<Session>();
    try {
      await context.api.put('/api/account/profile', {'fullName': _name.text.trim(), 'email': _email.text.trim()});
      await session.refreshMe();
      if (mounted) showSnack(context, context.l.saved);
    } catch (e) {
      if (mounted) setState(() => _profileError = errorText(context, e));
    } finally {
      if (mounted) setState(() => _savingProfile = false);
    }
  }

  Future<void> _savePassword() async {
    setState(() {
      _savingPassword = true;
      _passwordError = null;
    });
    try {
      await context.api.post('/api/account/change-password', {'currentPassword': _current.text, 'newPassword': _new.text});
      _current.clear();
      _new.clear();
      if (mounted) showSnack(context, context.l.passwordChanged);
    } catch (e) {
      if (mounted) setState(() => _passwordError = errorText(context, e));
    } finally {
      if (mounted) setState(() => _savingPassword = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final me = context.watch<Session>().me;
    Widget error(String? e) =>
        e == null ? const SizedBox.shrink() : Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(e, style: const TextStyle(color: KColors.danger)));
    return Scaffold(
      appBar: AppBar(title: Text(l.profileTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ResponsiveBody(
            maxWidth: 560,
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              SectionCard(
                title: l.profileTitle,
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  TextField(controller: _name, textCapitalization: TextCapitalization.words, onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(labelText: l.fullName)),
                  const SizedBox(height: 12),
                  TextField(controller: _email, keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(labelText: l.optional(l.email))),
                  const SizedBox(height: 12),
                  KeyValue(l.phoneLabel, me?.phone ?? '—'),
                  const SizedBox(height: 10),
                  error(_profileError),
                  FilledButton(
                    onPressed: _savingProfile || _name.text.trim().length < 2 ? null : _saveProfile,
                    child: Text(l.save),
                  ),
                ]),
              ),
              const SizedBox(height: 12),
              SectionCard(
                title: l.changePassword,
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  TextField(controller: _current, obscureText: true, onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(labelText: l.currentPassword)),
                  const SizedBox(height: 12),
                  TextField(controller: _new, obscureText: true, onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(labelText: l.newPassword, helperText: l.passwordHint, helperMaxLines: 2)),
                  const SizedBox(height: 12),
                  error(_passwordError),
                  FilledButton(
                    onPressed: _savingPassword || _current.text.isEmpty || !isStrongPassword(_new.text) ? null : _savePassword,
                    child: Text(l.changePassword),
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
