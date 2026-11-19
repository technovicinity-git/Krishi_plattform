import 'package:flutter/material.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'animal_sheet.dart';

/// Every animal across the person's batches, filterable by status.
class LivestockScreen extends StatefulWidget {
  const LivestockScreen({super.key});

  @override
  State<LivestockScreen> createState() => _LivestockScreenState();
}

class _LivestockScreenState extends State<LivestockScreen> {
  final _loader = GlobalKey<LoaderState<List<Animal>>>();
  String _filter = 'active';

  bool _matches(Animal a) => switch (_filter) {
        'active' => a.status == 'active' || a.status == 'death_reported',
        'all' => true,
        _ => a.status == _filter,
      };

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final role = context.session.me!.role;
    return Scaffold(
      appBar: AppBar(title: Text(l.livestockTitle)),
      body: Loader<List<Animal>>(
        key: _loader,
        load: () async {
          final data = await context.api.get('/api/mobile/v1/livestock');
          return (data['animals'] as List).map((e) => Animal(Json.from(e as Map))).toList();
        },
        builder: (context, animals, reload) {
          final shown = animals.where(_matches).toList();
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            children: [
              ResponsiveBody(
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(children: [
                      for (final (key, text) in [
                        ('active', l.filterActive),
                        ('sold', l.filterSold),
                        ('dead', l.filterDead),
                        ('all', l.filterAll),
                      ])
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(text),
                            selected: _filter == key,
                            onSelected: (_) => setState(() => _filter = key),
                          ),
                        ),
                    ]),
                  ),
                  const SizedBox(height: 10),
                  if (shown.isEmpty)
                    EmptyView(icon: Icons.pets_outlined, title: l.noAnimalsYet)
                  else
                    for (final a in shown)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Card(
                          child: ListTile(
                            onTap: () async {
                              final changed = await showAnimalSheet(context, animal: a, role: role);
                              if (changed == true) reload();
                            },
                            leading: CircleAvatar(
                              backgroundColor: KColors.brandTint,
                              child: Text(a.tag,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: KColors.greenDeep)),
                            ),
                            title: Text(
                              a.currentWeightKg != null ? kg(a.currentWeightKg!) : l.noWeight,
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                            subtitle: Text(
                              '${planName(lang, a.batch['planEn'] as String?, a.batch['planBn'] as String?)} · ${a.batch['reference'] ?? ''}'
                              '${a.gain != null ? '\n${a.gain! >= 0 ? '+' : ''}${kg(a.gain!)}' : ''}',
                            ),
                            trailing: StatusChip(label(lang, 'animalStatus', a.status), tone: toneFor(a.status)),
                          ),
                        ),
                      ),
                ]),
              ),
            ],
          );
        },
      ),
    );
  }
}
