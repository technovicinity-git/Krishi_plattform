import 'package:flutter/material.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'decisions.dart';
import 'forms.dart';

/// One animal: details, record history and the viewer's actions.
/// Returns true when something changed (so the batch reloads).
Future<bool?> showAnimalSheet(BuildContext context, {required Animal animal, required String role}) =>
    showFormSheet<bool>(context, builder: (_) => _AnimalSheet(animal: animal, role: role));

class _AnimalSheet extends StatelessWidget {
  const _AnimalSheet({required this.animal, required this.role});
  final Animal animal;
  final String role;

  Future<void> _record(BuildContext context, String kind) async {
    final saved = await showFormSheet<bool>(
      context,
      builder: (_) => AnimalRecordForm(animal: animal, role: role, initialKind: kind),
    );
    if (saved == true && context.mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final a = animal;
    final canRecord = (role == 'farmer' || role == 'steward') && a.active;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(a.tag, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
              Text(a.reference, style: const TextStyle(color: KColors.inkMuted, fontSize: 12)),
            ]),
          ),
          StatusChip(label(lang, 'animalStatus', a.status), tone: toneFor(a.status)),
        ]),
        const SizedBox(height: 14),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(children: [
              if (a.earTag != null) KeyValue(l.earTagLabel, a.earTag!),
              if (a.breed != null) KeyValue(l.breed, a.breed!),
              if (a.sex != null) KeyValue(l.sexLabel, a.sex == 'female' ? l.sexFemale : l.sexMale),
              KeyValue(l.bought, a.purchasePrice != null ? bdt(a.purchasePrice!) : '—'),
              KeyValue(l.startWeight, a.purchaseWeightKg != null ? kg(a.purchaseWeightKg!) : '—'),
              KeyValue(
                l.currentWeight,
                a.currentWeightKg == null
                    ? '—'
                    : '${kg(a.currentWeightKg!)}${a.gain != null ? '  (${a.gain! >= 0 ? '+' : ''}${kg(a.gain!)})' : ''}',
              ),
              if (a.status == 'sold' && a.salePrice != null) KeyValue(l.soldFor, bdt(a.salePrice!)),
              if (a.deathCause != null) KeyValue(l.causeLabel, label(lang, 'deathCause', a.deathCause)),
              if (a.diedAt != null) KeyValue(l.filterDead, dateText(lang, a.diedAt)),
            ]),
          ),
        ),
        if (a.notes?.isNotEmpty == true) ...[
          const SizedBox(height: 10),
          Text(a.notes!, style: const TextStyle(color: KColors.inkSecondary, fontSize: 13)),
        ],
        if (role == 'farmer') ...[
          const SizedBox(height: 14),
          OutlinedButton.icon(
            onPressed: () async {
              final saved = await showFormSheet<bool>(context, builder: (_) => AnimalEditForm(animal: a));
              if (saved == true && context.mounted) {
                showSnack(context, l.detailsSaved);
                Navigator.of(context).pop(true);
              }
            },
            icon: const Icon(Icons.edit_outlined),
            label: Text(l.editDetails),
          ),
        ],
        if (canRecord) ...[
          const SizedBox(height: 14),
          FilledButton.icon(
            onPressed: () => _record(context, 'weight'),
            icon: const Icon(Icons.add),
            label: Text(l.addRecord),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(foregroundColor: KColors.danger),
            onPressed: () => _record(context, 'death'),
            icon: const Icon(Icons.report_outlined),
            label: Text(role == 'farmer' ? l.reportDeath : l.recordDeath),
          ),
        ],
        if (role == 'steward' && a.status == 'death_reported') ...[
          const SizedBox(height: 14),
          DecisionButtons(
            approveLabel: l.confirmDeath,
            onApprove: () async {
              if (await Decisions.death(context, a.id, approve: true) && context.mounted) Navigator.of(context).pop(true);
            },
            onReject: () async {
              if (await Decisions.death(context, a.id, approve: false) && context.mounted) Navigator.of(context).pop(true);
            },
          ),
        ],
        const SizedBox(height: 18),
        Text(l.history, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
        const SizedBox(height: 8),
        if (a.records.isEmpty) Text(l.noRecords, style: const TextStyle(color: KColors.inkSecondary)),
        for (final r in a.records)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(
                          child: Text(
                            '${label(lang, 'recordKind', r.kind)}${r.weightKg != null ? ' · ${kg(r.weightKg!)}' : ''}',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: r.kind == 'death' && r.reviewStatus != 'rejected' ? KColors.danger : KColors.ink,
                            ),
                          ),
                        ),
                        Text(dateText(lang, r.recordedOn), style: const TextStyle(fontSize: 11.5, color: KColors.inkMuted)),
                      ]),
                      if (r.note?.isNotEmpty == true)
                        Text(r.note!, style: const TextStyle(color: KColors.inkSecondary, fontSize: 13)),
                      if (r.kind == 'death' && r.reviewStatus == 'pending')
                        Text(l.waitingSteward, style: const TextStyle(color: KColors.warning, fontWeight: FontWeight.w600, fontSize: 12)),
                      if (r.kind == 'death' && r.reviewStatus == 'rejected')
                        Text(l.notAcceptedReason(r.rejectionReason ?? ''),
                            style: const TextStyle(color: KColors.danger, fontWeight: FontWeight.w600, fontSize: 12)),
                    ]),
                  ),
                  if (r.photoUrl != null) ...[const SizedBox(width: 8), PhotoThumb(r.photoUrl!, size: 48)],
                  if (r.documentUrl != null) ...[const SizedBox(width: 6), PhotoThumb(r.documentUrl!, size: 48)],
                ]),
              ),
            ),
          ),
      ]),
    );
  }
}
