import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../core/session.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

/// Where plan detail pages live: inside the investor's tabs when signed in,
/// or at /explore before signing in.
String planPath(BuildContext context, String id) =>
    context.read<Session>().signedIn ? '/plans/$id' : '/explore/$id';

/// Investment plans: search, filter by livestock and status.
class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key});

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  final _search = TextEditingController();
  Timer? _debounce;
  String? _category;
  String _status = 'open';
  List<PlanItem> _items = const [];
  List<Json> _categories = const [];
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = false;
  int _page = 1;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _load({bool more = false}) async {
    setState(() {
      if (more) {
        _loadingMore = true;
      } else {
        _loading = _items.isEmpty;
        _error = null;
      }
    });
    try {
      final page = more ? _page + 1 : 1;
      final data = await context.api.get('/api/mobile/v1/plans', query: {
        'status': _status,
        'page': page,
        if (_category != null) 'category': _category,
        if (_search.text.trim().isNotEmpty) 'search': _search.text.trim(),
      });
      if (!mounted) return;
      final items = (data['items'] as List).map((e) => PlanItem(Json.from(e as Map))).toList();
      setState(() {
        _items = more ? [..._items, ...items] : items;
        _categories = (data['categories'] as List).map((e) => Json.from(e as Map)).toList();
        _hasMore = data['hasMore'] == true;
        _page = page;
      });
    } catch (e) {
      if (mounted) {
        if (_items.isEmpty) {
          setState(() => _error = e);
        } else {
          showSnack(context, errorText(context, e), error: true);
        }
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          _loadingMore = false;
        });
      }
    }
  }

  void _onSearch(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), _load);
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final signedIn = context.watch<Session>().signedIn;
    String statusLabel(String s) => switch (s) {
          'open' => l.planStatus_open,
          'coming_soon' => l.planStatus_coming_soon,
          'fully_funded' => l.planStatus_fully_funded,
          _ => l.planStatus_all,
        };
    return Scaffold(
      appBar: AppBar(
        title: Text(l.plansTitle),
        actions: [
          if (!signedIn) TextButton(onPressed: () => context.go('/login'), child: Text(l.signIn)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: KColors.brand,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          children: [
            ResponsiveBody(
              maxWidth: 980,
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                TextField(
                  controller: _search,
                  onChanged: _onSearch,
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: l.searchPlans),
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(children: [
                    for (final s in ['open', 'coming_soon', 'fully_funded', 'all'])
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(statusLabel(s)),
                          selected: _status == s,
                          onSelected: (_) {
                            setState(() => _status = s);
                            _load();
                          },
                        ),
                      ),
                  ]),
                ),
                if (_categories.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(l.allCategories),
                          selected: _category == null,
                          onSelected: (_) {
                            setState(() => _category = null);
                            _load();
                          },
                        ),
                      ),
                      for (final c in _categories)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: Text(planName(lang, c['nameEn'] as String?, c['nameBn'] as String?)),
                            selected: _category == c['slug'],
                            onSelected: (_) {
                              setState(() => _category = c['slug'] as String);
                              _load();
                            },
                          ),
                        ),
                    ]),
                  ),
                ],
                const SizedBox(height: 12),
                if (_loading)
                  const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()))
                else if (_error != null)
                  ErrorView(message: errorText(context, _error!), onRetry: _load)
                else if (_items.isEmpty)
                  EmptyView(icon: Icons.search_off, title: l.noPlans, body: l.noPlansHint)
                else
                  LayoutBuilder(builder: (context, c) {
                    final cols = c.maxWidth >= 900 ? 3 : (c.maxWidth >= 600 ? 2 : 1);
                    const gap = 12.0;
                    final w = (c.maxWidth - gap * (cols - 1)) / cols;
                    return Wrap(
                      spacing: gap,
                      runSpacing: gap,
                      children: [for (final p in _items) SizedBox(width: w, child: PlanCard(plan: p))],
                    );
                  }),
                if (_hasMore) ...[
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: _loadingMore ? null : () => _load(more: true),
                    child: _loadingMore
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : Text(l.seeAll),
                  ),
                ],
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class PlanCard extends StatelessWidget {
  const PlanCard({super.key, required this.plan});
  final PlanItem plan;

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final p = plan;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push(planPath(context, p.id)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: p.imageUrl == null
                ? Container(color: KColors.brandTint, child: const Icon(Icons.agriculture, size: 48, color: KColors.greenDeep))
                : CachedNetworkImage(
                    imageUrl: p.imageUrl!,
                    fit: BoxFit.cover,
                    placeholder: (_, _) => Container(color: KColors.stone),
                    errorWidget: (_, _, _) => Container(color: KColors.brandTint),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${p.category(lang)} · ${p.district(lang)}',
                  style: const TextStyle(fontSize: 12, color: KColors.inkMuted, fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(p.name(lang), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              Row(children: [
                _Fact(l.unitPrice, bdt(p.unitPrice)),
                _Fact(l.estReturn, roiText(p.roiMin, p.roiMax)),
                _Fact(l.duration, l.monthsCount(p.durationMonths)),
              ]),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(value: p.fundedShare, minHeight: 6, backgroundColor: KColors.stone, color: KColors.brand),
              ),
              const SizedBox(height: 6),
              Text(
                p.unitsLeft > 0 ? l.unitsLeft(p.unitsLeft) : l.soldOut,
                style: TextStyle(fontSize: 12, color: p.unitsLeft > 0 ? KColors.inkSecondary : KColors.danger),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 11.5, color: KColors.inkMuted)),
          Text(value, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700)),
        ]),
      );
}

/// One plan: what it is, where the money goes, risks, the steward's reviews,
/// and the button to invest.
class PlanDetailScreen extends StatefulWidget {
  const PlanDetailScreen({super.key, required this.id});
  final String id;

  @override
  State<PlanDetailScreen> createState() => _PlanDetailScreenState();
}

class _PlanDetailScreenState extends State<PlanDetailScreen> {
  final _loader = GlobalKey<LoaderState<PlanItem>>();

  Future<void> _invest(PlanItem p) async {
    final session = context.read<Session>();
    if (!session.signedIn) {
      context.go('/login');
      return;
    }
    final sent = await showFormSheet<bool>(context, builder: (_) => _InterestForm(plan: p));
    if (sent == true && mounted) {
      showSnack(context, context.l.interestSent);
      _loader.currentState?.reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final lang = context.lang;
    final me = context.watch<Session>().me;
    return Scaffold(
      appBar: AppBar(),
      body: Loader<PlanItem>(
        key: _loader,
        load: () async => PlanItem(await context.api.get('/api/mobile/v1/plans/${widget.id}')),
        builder: (context, p, _) {
          final mine = p.myInterest;
          final canInvest = (me == null || me.isInvestor) && mine == null && p.unitsLeft > 0 && p.status == 'open';
          return Column(children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                children: [
                  ResponsiveBody(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: AspectRatio(
                          aspectRatio: 16 / 9,
                          child: p.imageUrl == null
                              ? Container(color: KColors.brandTint, child: const Icon(Icons.agriculture, size: 56, color: KColors.greenDeep))
                              : CachedNetworkImage(imageUrl: p.imageUrl!, fit: BoxFit.cover),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text('${p.category(lang)} · ${p.district(lang)}',
                          style: const TextStyle(color: KColors.inkMuted, fontWeight: FontWeight.w600)),
                      Text(p.name(lang), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 14),
                      StatGrid(children: [
                        StatCard(label: l.unitPrice, value: bdt(p.unitPrice), highlight: true),
                        StatCard(label: l.estReturn, value: roiText(p.roiMin, p.roiMax)),
                        StatCard(label: l.duration, value: l.monthsCount(p.durationMonths)),
                        StatCard(
                          label: l.unitsLabel,
                          value: p.unitsLeft > 0 ? l.unitsLeft(p.unitsLeft) : l.soldOut,
                          hint: l.fundedOf(p.unitsFunded, p.unitsOffered),
                        ),
                      ]),
                      if (mine != null) ...[
                        const SizedBox(height: 12),
                        InfoBanner(
                          tone: Tone.success,
                          text: l.haveInterest('${mine['reference']}', label(lang, 'status', mine['status'] as String?)),
                          onTap: () => context.push('/interests'),
                        ),
                      ],
                      if (p.description(lang)?.isNotEmpty == true) ...[
                        const SizedBox(height: 12),
                        SectionCard(title: l.planAbout, child: Text(p.description(lang)!, style: const TextStyle(height: 1.5))),
                      ],
                      const SizedBox(height: 12),
                      SectionCard(
                        title: l.whereMoneyGoes,
                        child: Column(children: [
                          KeyValue(l.allocAnimals, bdt(p.animalAllocation)),
                          KeyValue(l.allocCare, bdt(p.careAllocation)),
                          KeyValue(l.unitPrice, bdt(p.unitPrice), bold: true),
                        ]),
                      ),
                      if (p.riskInformation?.isNotEmpty == true) ...[
                        const SizedBox(height: 12),
                        SectionCard(title: l.risks, child: Text(p.riskInformation!, style: const TextStyle(height: 1.5))),
                      ],
                      const SizedBox(height: 12),
                      SectionCard(
                        title: l.steward,
                        child: Row(children: [
                          const CircleAvatar(backgroundColor: KColors.brandTint, child: Icon(Icons.person, color: KColors.greenDeep)),
                          const SizedBox(width: 12),
                          Expanded(child: Text(p.stewardName, style: const TextStyle(fontWeight: FontWeight.w700))),
                          if (p.stewardRating != null) ...[
                            const Icon(Icons.star_rounded, color: Color(0xFFE0A100)),
                            Text(' ${p.stewardRating!.toStringAsFixed(1)} · ${l.ratingCount(p.stewardRatingCount)}'),
                          ],
                        ]),
                      ),
                      const SizedBox(height: 12),
                      SectionCard(
                        title: l.reviewsTitle,
                        child: p.reviews.isEmpty
                            ? Text(l.noReviews, style: const TextStyle(color: KColors.inkSecondary))
                            : Column(children: [
                                for (final r in p.reviews)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Row(children: [
                                        for (var i = 0; i < 5; i++)
                                          Icon(i < ((r['rating'] as num?)?.toInt() ?? 0) ? Icons.star_rounded : Icons.star_outline_rounded,
                                              size: 18, color: const Color(0xFFE0A100)),
                                        const SizedBox(width: 8),
                                        Text('${r['reviewer'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
                                      ]),
                                      if ((r['comment'] as String?)?.isNotEmpty == true) Text('${r['comment']}'),
                                    ]),
                                  ),
                              ]),
                      ),
                    ]),
                  ),
                ],
              ),
            ),
            if (canInvest || me == null)
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: ResponsiveBody(
                    child: FilledButton.icon(
                      onPressed: canInvest ? () => _invest(p) : null,
                      icon: const Icon(Icons.trending_up),
                      label: Text(me == null ? l.signInToInvest : l.investInPlan),
                    ),
                  ),
                ),
              ),
          ]);
        },
      ),
    );
  }
}

class _InterestForm extends StatefulWidget {
  const _InterestForm({required this.plan});
  final PlanItem plan;
  @override
  State<_InterestForm> createState() => _InterestFormState();
}

class _InterestFormState extends State<_InterestForm> {
  int _units = 1;
  final _message = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.api.post('/api/interests', {
        'offering_id': widget.plan.id,
        'requested_units': _units,
        if (_message.text.trim().isNotEmpty) 'message': _message.text.trim(),
      });
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l;
    final p = widget.plan;
    final max = p.unitsLeft.clamp(1, 1000);
    return FormSheet(
      title: l.interestTitle,
      submitLabel: l.sendInterest,
      busy: _busy,
      error: _error,
      onSubmit: _send,
      children: [
        Row(children: [
          IconButton.filledTonal(onPressed: _units > 1 ? () => setState(() => _units--) : null, icon: const Icon(Icons.remove)),
          Expanded(
            child: Column(children: [
              Text('$_units', style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w800)),
              Text(l.unitsLabel, style: const TextStyle(color: KColors.inkSecondary)),
            ]),
          ),
          IconButton.filledTonal(onPressed: _units < max ? () => setState(() => _units++) : null, icon: const Icon(Icons.add)),
        ]),
        Text(l.unitsLeft(p.unitsLeft), textAlign: TextAlign.center, style: const TextStyle(color: KColors.inkMuted)),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: KeyValue(l.totalAmount, bdt(p.unitPrice * _units), bold: true, valueColor: KColors.greenDeep),
          ),
        ),
        TextField(controller: _message, minLines: 2, maxLines: 4, decoration: InputDecoration(labelText: l.optional(l.note))),
      ],
    );
  }
}
