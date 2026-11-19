import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api.dart';
import '../core/config.dart';
import '../core/session.dart';
import '../l10n/app_localizations.dart';
import 'theme.dart';

extension ContextX on BuildContext {
  AppLocalizations get l => AppLocalizations.of(this);
  Session get session => read<Session>();
  Api get api => read<Session>().api;
  String get lang => read<Session>().locale;
  bool get wide => MediaQuery.sizeOf(this).width >= 700;
}

/// A readable message for any error.
String errorText(BuildContext context, Object error) {
  if (error is ApiException) {
    return error.message == 'network' ? context.l.errorNetwork : error.message;
  }
  return context.l.errorGeneric;
}

void showSnack(BuildContext context, String text, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text(text),
      backgroundColor: error ? KColors.danger : KColors.greenDeep,
    ));
}

Future<void> openWebsite(String path) async {
  final uri = Uri.parse('${AppConfig.webBaseUrl}$path');
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<void> callPhone(String phone) => launchUrl(Uri(scheme: 'tel', path: phone));

/// Keeps content at a comfortable width on tablets.
class ResponsiveBody extends StatelessWidget {
  const ResponsiveBody({super.key, required this.child, this.maxWidth = 760});
  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) => Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(constraints: BoxConstraints(maxWidth: maxWidth), child: child),
      );
}

/// Loads data, shows a spinner / error with retry, and supports pull-to-refresh.
class Loader<T> extends StatefulWidget {
  const Loader({super.key, required this.load, required this.builder});
  final Future<T> Function() load;
  final Widget Function(BuildContext context, T data, Future<void> Function() reload) builder;

  @override
  State<Loader<T>> createState() => LoaderState<T>();
}

class LoaderState<T> extends State<Loader<T>> {
  T? _data;
  Object? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    reload();
  }

  Future<void> reload() async {
    setState(() {
      _loading = _data == null;
      _error = null;
    });
    try {
      final data = await widget.load();
      if (!mounted) return;
      setState(() {
        _data = data;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
      if (_data != null) showSnack(context, errorText(context, e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _data == null) return const Center(child: CircularProgressIndicator());
    if (_data == null) {
      return ErrorView(message: errorText(context, _error ?? 'error'), onRetry: reload);
    }
    return RefreshIndicator(
      onRefresh: reload,
      color: KColors.brand,
      child: widget.builder(context, _data as T, reload),
    );
  }
}

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.cloud_off_rounded, size: 48, color: KColors.inkMuted),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: KColors.inkSecondary)),
            const SizedBox(height: 16),
            OutlinedButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh), label: Text(context.l.retry)),
          ]),
        ),
      );
}

class EmptyView extends StatelessWidget {
  const EmptyView({super.key, required this.icon, required this.title, this.body});
  final IconData icon;
  final String title;
  final String? body;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
        child: Column(children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: const BoxDecoration(color: KColors.brandTint, shape: BoxShape.circle),
            child: Icon(icon, color: KColors.greenDeep, size: 30),
          ),
          const SizedBox(height: 14),
          Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          if (body != null) ...[
            const SizedBox(height: 6),
            Text(body!, textAlign: TextAlign.center, style: const TextStyle(color: KColors.inkSecondary)),
          ],
        ]),
      );
}

enum Tone { success, warning, danger, info, neutral }

Tone toneFor(String status) {
  switch (status) {
    case 'approved':
    case 'verified':
    case 'settled':
    case 'paid':
    case 'active':
    case 'growing_care':
    case 'completed':
    case 'disbursed':
      return Tone.success;
    case 'pending':
    case 'pending_review':
    case 'under_review':
    case 'awaiting_remittance':
    case 'awaiting_purchase':
    case 'awaiting_farmer':
    case 'death_reported':
    case 'requires_update':
      return Tone.warning;
    case 'rejected':
    case 'dead':
    case 'cancelled':
    case 'not_approved':
      return Tone.danger;
    case 'sold':
    case 'sale_pending':
    case 'remittance_submitted':
      return Tone.info;
    default:
      return Tone.neutral;
  }
}

(Color, Color) toneColors(Tone tone) => switch (tone) {
      Tone.success => (KColors.brandTint, KColors.greenDeep),
      Tone.warning => (KColors.warningTint, KColors.warning),
      Tone.danger => (KColors.dangerTint, KColors.danger),
      Tone.info => (KColors.infoTint, KColors.info),
      Tone.neutral => (KColors.stone, KColors.inkSecondary),
    };

class StatusChip extends StatelessWidget {
  const StatusChip(this.text, {super.key, this.tone = Tone.neutral});
  final String text;
  final Tone tone;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = toneColors(tone);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(text, style: TextStyle(color: fg, fontSize: 11.5, fontWeight: FontWeight.w700)),
    );
  }
}

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.label,
    required this.value,
    this.hint,
    this.icon,
    this.onTap,
    this.highlight = false,
    this.valueColor,
  });
  final String label;
  final String value;
  final String? hint;
  final IconData? icon;
  final VoidCallback? onTap;
  final bool highlight;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) => Card(
        color: highlight ? KColors.greenDeep : Colors.white,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(
                  child: Text(label,
                      maxLines: 2,
                      style: TextStyle(
                          fontSize: 12.5,
                          color: highlight ? Colors.white70 : KColors.inkSecondary,
                          fontWeight: FontWeight.w500)),
                ),
                if (icon != null) Icon(icon, size: 18, color: highlight ? Colors.white70 : KColors.inkMuted),
              ]),
              const SizedBox(height: 8),
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(value,
                    style: TextStyle(
                        fontSize: 21,
                        fontWeight: FontWeight.w800,
                        color: valueColor ?? (highlight ? Colors.white : KColors.ink))),
              ),
              if (hint != null) ...[
                const SizedBox(height: 2),
                Text(hint!,
                    style: TextStyle(fontSize: 11.5, color: highlight ? Colors.white60 : KColors.inkMuted)),
              ],
            ]),
          ),
        ),
      );
}

/// 2 columns on phones, 4 on tablets.
class StatGrid extends StatelessWidget {
  const StatGrid({super.key, required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (context, c) {
        final cols = c.maxWidth >= 640 ? 4 : 2;
        const gap = 10.0;
        final w = (c.maxWidth - gap * (cols - 1)) / cols;
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: [for (final child in children) SizedBox(width: w, child: child)],
        );
      });
}

class SectionCard extends StatelessWidget {
  const SectionCard({super.key, required this.title, this.subtitle, this.trailing, required this.child, this.padding});
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final Widget child;
  final EdgeInsets? padding;

  @override
  Widget build(BuildContext context) => Card(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 10),
            child: Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  if (subtitle != null)
                    Text(subtitle!, style: const TextStyle(fontSize: 12, color: KColors.inkSecondary)),
                ]),
              ),
              ?trailing,
            ]),
          ),
          const Divider(),
          Padding(padding: padding ?? const EdgeInsets.all(16), child: child),
        ]),
      );
}

class InfoBanner extends StatelessWidget {
  const InfoBanner({super.key, required this.text, this.title, this.tone = Tone.info, this.action, this.onTap});
  final String? title;
  final String text;
  final Tone tone;
  final String? action;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = toneColors(tone);
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                if (title != null)
                  Text(title!, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: KColors.ink)),
                if (title != null) const SizedBox(height: 2),
                Text(text, style: TextStyle(fontSize: 13, color: title == null ? fg : KColors.inkSecondary)),
              ]),
            ),
            if (action != null) ...[
              const SizedBox(width: 10),
              Text(action!, style: const TextStyle(color: KColors.brand, fontWeight: FontWeight.w700)),
              const Icon(Icons.chevron_right, color: KColors.brand),
            ] else if (onTap != null)
              const Icon(Icons.chevron_right, color: KColors.inkMuted),
          ]),
        ),
      ),
    );
  }
}

class KeyValue extends StatelessWidget {
  const KeyValue(this.label, this.value, {super.key, this.bold = false, this.valueColor});
  final String label;
  final String value;
  final bool bold;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: Text(label, style: const TextStyle(color: KColors.inkSecondary, fontSize: 13.5))),
          const SizedBox(width: 12),
          Flexible(
            child: Text(value,
                textAlign: TextAlign.right,
                style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
                    color: valueColor ?? KColors.ink)),
          ),
        ]),
      );
}

/// Small photo that opens full screen.
class PhotoThumb extends StatelessWidget {
  const PhotoThumb(this.url, {super.key, this.size = 56});
  final String url;
  final double size;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => Navigator.of(context).push(MaterialPageRoute(
          fullscreenDialog: true,
          builder: (_) => Scaffold(
            backgroundColor: Colors.black,
            appBar: AppBar(backgroundColor: Colors.black, foregroundColor: Colors.white),
            body: Center(child: InteractiveViewer(child: CachedNetworkImage(imageUrl: url))),
          ),
        )),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: CachedNetworkImage(
            imageUrl: url,
            width: size,
            height: size,
            fit: BoxFit.cover,
            placeholder: (_, _) => Container(width: size, height: size, color: KColors.stone),
            errorWidget: (_, _, _) => Container(
              width: size,
              height: size,
              color: KColors.stone,
              child: const Icon(Icons.broken_image_outlined, color: KColors.inkMuted),
            ),
          ),
        ),
      );
}

/// Pick a photo from the camera or gallery, shown as a preview.
class PhotoField extends StatelessWidget {
  const PhotoField({super.key, required this.label, required this.file, required this.onChanged, this.required = false});
  final String label;
  final XFile? file;
  final ValueChanged<XFile?> onChanged;
  final bool required;

  Future<void> _pick(BuildContext context, ImageSource source) async {
    final picked = await ImagePicker().pickImage(source: source, maxWidth: 1800, imageQuality: 80);
    if (picked != null) onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(required ? label : l.optional(label),
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: KColors.inkSecondary)),
      const SizedBox(height: 6),
      if (file != null)
        Row(children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.file(File(file!.path), width: 72, height: 72, fit: BoxFit.cover),
          ),
          const SizedBox(width: 12),
          TextButton.icon(
            onPressed: () => onChanged(null),
            icon: const Icon(Icons.close, size: 18),
            label: Text(l.removePhoto),
          ),
        ])
      else
        Wrap(spacing: 8, runSpacing: 8, children: [
          OutlinedButton.icon(
            onPressed: () => _pick(context, ImageSource.camera),
            icon: const Icon(Icons.photo_camera_outlined),
            label: Text(l.takePhoto),
          ),
          OutlinedButton.icon(
            onPressed: () => _pick(context, ImageSource.gallery),
            icon: const Icon(Icons.photo_library_outlined),
            label: Text(l.choosePhoto),
          ),
        ]),
    ]);
  }
}

Future<bool> confirmDialog(BuildContext context,
    {required String title, required String body, required String confirm, bool danger = false}) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: Text(body),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(context.l.cancel)),
        FilledButton(
          style: danger ? FilledButton.styleFrom(backgroundColor: KColors.danger) : null,
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(confirm),
        ),
      ],
    ),
  );
  return ok ?? false;
}

/// Asks for a reason (at least [minLength] characters). Returns null if cancelled.
Future<String?> reasonDialog(BuildContext context, {String? title, int minLength = 5}) {
  final controller = TextEditingController();
  return showDialog<String>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => AlertDialog(
        title: Text(title ?? context.l.rejectTitle),
        content: TextField(
          controller: controller,
          autofocus: true,
          minLines: 2,
          maxLines: 4,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(hintText: context.l.reasonHint),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(context.l.cancel)),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: KColors.danger),
            onPressed: controller.text.trim().length >= minLength
                ? () => Navigator.pop(ctx, controller.text.trim())
                : null,
            child: Text(context.l.send),
          ),
        ],
      ),
    ),
  );
}

/// A bottom sheet form with a title, scrollable content and a submit button.
Future<T?> showFormSheet<T>(BuildContext context, {required WidgetBuilder builder}) =>
    showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: KColors.cream,
      showDragHandle: true,
      constraints: const BoxConstraints(maxWidth: 680),
      builder: builder,
    );

class FormSheet extends StatelessWidget {
  const FormSheet({
    super.key,
    required this.title,
    required this.children,
    required this.submitLabel,
    required this.onSubmit,
    this.busy = false,
    this.enabled = true,
    this.error,
    this.danger = false,
  });
  final String title;
  final List<Widget> children;
  final String submitLabel;
  final VoidCallback onSubmit;
  final bool busy;
  final bool enabled;
  final String? error;
  final bool danger;

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            for (final c in children) ...[c, const SizedBox(height: 14)],
            if (error != null) ...[
              Text(error!, style: const TextStyle(color: KColors.danger, fontWeight: FontWeight.w600)),
              const SizedBox(height: 10),
            ],
            FilledButton(
              style: danger ? FilledButton.styleFrom(backgroundColor: KColors.danger) : null,
              onPressed: busy || !enabled ? null : onSubmit,
              child: busy
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                  : Text(submitLabel),
            ),
          ]),
        ),
      );
}

/// Label above a dropdown of enum values.
class ChoiceField extends StatelessWidget {
  const ChoiceField({super.key, required this.label, required this.value, required this.options, required this.onChanged});
  final String label;
  final String? value;
  final Map<String, String> options;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) => DropdownButtonFormField<String>(
        initialValue: value,
        isExpanded: true,
        decoration: InputDecoration(labelText: label),
        items: [
          for (final e in options.entries) DropdownMenuItem(value: e.key, child: Text(e.value)),
        ],
        onChanged: onChanged,
      );
}
