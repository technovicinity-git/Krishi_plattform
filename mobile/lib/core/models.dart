// Typed views of the Krishi mobile API (web/src/app/api/mobile/v1).

typedef Json = Map<String, dynamic>;

double _num(Object? v) => v == null ? 0 : (v is num ? v.toDouble() : double.tryParse('$v') ?? 0);
double? _numOrNull(Object? v) => v == null ? null : _num(v);
String? _str(Object? v) => v == null ? null : '$v';
List<Json> _list(Object? v) => v is List ? v.whereType<Map>().map((e) => Json.from(e)).toList() : const [];

class Me {
  Me({
    required this.id,
    required this.role,
    this.fullName,
    this.phone,
    this.email,
    required this.kycStatus,
    this.kycRejectionReason,
    this.unreadNotifications = 0,
    this.phoneVerified = true,
    this.stewardApprovalStatus,
    this.stewardRejectionReason,
    this.stewardDetailsDone,
  });

  factory Me.fromJson(Json j) => Me(
        id: j['id'] as String,
        role: j['role'] as String,
        fullName: _str(j['fullName']),
        phone: _str(j['phone']),
        email: _str(j['email']),
        kycStatus: _str(j['kycStatus']) ?? 'not_started',
        kycRejectionReason: _str(j['kycRejectionReason']),
        unreadNotifications: (j['unreadNotifications'] as num?)?.toInt() ?? 0,
        phoneVerified: j['phoneVerified'] != false,
        stewardApprovalStatus: _str(j['stewardApprovalStatus']),
        stewardRejectionReason: _str(j['stewardRejectionReason']),
        stewardDetailsDone: j['stewardDetailsDone'] as bool?,
      );

  final String id;
  final String role;
  final String? fullName;
  final String? phone;
  final String? email;
  final String kycStatus;
  final String? kycRejectionReason;
  final int unreadNotifications;
  final bool phoneVerified;
  final String? stewardApprovalStatus;
  final String? stewardRejectionReason;
  final bool? stewardDetailsDone;

  /// Investors verify their phone right after sign-up.
  bool get needsPhoneVerification => role == 'investor' && !phoneVerified;

  /// Stewards fill in their details, then wait for Krishi's approval.
  bool get needsStewardDetails => role == 'steward' && stewardDetailsDone == false;
  bool get stewardWaiting => role == 'steward' && !needsStewardDetails && stewardApprovalStatus != 'approved';

  bool get isInvestor => role == 'investor';
  bool get isFarmer => role == 'farmer';
  bool get isSteward => role == 'steward';
  String get firstName => (fullName ?? '').split(' ').first;

  Me copyWith({int? unreadNotifications}) => Me(
        id: id,
        role: role,
        fullName: fullName,
        phone: phone,
        email: email,
        kycStatus: kycStatus,
        kycRejectionReason: kycRejectionReason,
        unreadNotifications: unreadNotifications ?? this.unreadNotifications,
        phoneVerified: phoneVerified,
        stewardApprovalStatus: stewardApprovalStatus,
        stewardRejectionReason: stewardRejectionReason,
        stewardDetailsDone: stewardDetailsDone,
      );
}

/// A plan name in the reader's language.
String planName(String locale, String? en, String? bn, [String fallback = '']) {
  final value = locale == 'bn' ? (bn?.isNotEmpty == true ? bn : en) : en;
  return value?.isNotEmpty == true ? value! : fallback;
}

class InvestmentSummary {
  InvestmentSummary(this.j);
  final Json j;

  String get id => j['id'] as String;
  String get reference => j['reference'] as String;
  int get units => (j['units'] as num).toInt();
  double get amount => _num(j['amount']);
  String get stage => _str(j['stage']) ?? '';
  DateTime get createdAt => DateTime.parse(j['createdAt'] as String);
  String plan(String locale) => planName(locale, _str(j['planEn']), _str(j['planBn']), reference);
  String? get investorName => _str(j['investorName']);
  String? get farmerName => _str(j['farmerName']);
  String? get stewardName => _str(j['stewardName']);
  bool get settled => stage == 'settled';
}

class Activity {
  Activity(this.j);
  final Json j;
  String get id => j['id'] as String;
  String get investmentId => j['investmentId'] as String;
  String get reference => _str(j['reference']) ?? '';
  String get title => _str(j['title']) ?? '';
  double? get amount => _numOrNull(j['amount']);
  bool get superseded => j['superseded'] == true;
  DateTime get createdAt => DateTime.parse(j['createdAt'] as String);
}

class Dashboard {
  Dashboard(this.j);
  final Json j;

  double get walletBalance => _num(j['walletBalance']);
  int get activeBatches => (j['activeBatches'] as num?)?.toInt() ?? 0;
  int get activeUnits => (j['activeUnits'] as num?)?.toInt() ?? 0;
  int get unread => (j['unreadNotifications'] as num?)?.toInt() ?? 0;
  List<Activity> get activity => _list(j['activity']).map(Activity.new).toList();

  // Investor
  double get invested => _num(j['invested']);
  double get returns => _num(j['returns']);
  int get interestsWaiting => (j['interestsWaiting'] as num?)?.toInt() ?? 0;
  List<Json> get toPay => _list(j['toPay']);

  // Farmer
  int get pendingFundRequests => (j['pendingFundRequests'] as num?)?.toInt() ?? 0;
  int get pendingExpenses => (j['pendingExpenses'] as num?)?.toInt() ?? 0;
  List<Json> get needsPurchase => _list(j['needsPurchase']);
  List<Json> get moneyToSend => _list(j['moneyToSend']);

  // Steward
  Json get pending => (j['pending'] as Map?)?.cast<String, dynamic>() ?? const {};
  int pendingCount(String key) => (pending[key] as num?)?.toInt() ?? 0;
  int get pendingTotal =>
      pendingCount('fundRequests') + pendingCount('expenses') + pendingCount('sales') + pendingCount('deathReports');
  int get awaitingFarmer => (j['awaitingFarmer'] as num?)?.toInt() ?? 0;
}

class Stats {
  Stats(this.j);
  final Json j;
  double get purchaseCost => _num(j['purchaseCost']);
  double get fundsReleased => _num(j['fundsReleased']);
  double get capitalSpent => _num(j['capitalSpent']);
  double get leftover => _num(j['leftover']);
  double get expensesApproved => _num(j['expensesApproved']);
  double get animalBudget => _num(j['animalBudgetTotal']);
  double get careBudget => _num(j['careBudgetTotal']);
}

class Sale {
  Sale(this.j);
  final Json j;
  String get id => j['id'] as String;
  String get reference => _str(j['reference']) ?? '';
  bool get totalLoss => j['kind'] == 'total_loss';
  String get status => _str(j['status']) ?? '';
  double get saleAmount => _num(j['saleAmount']);
  double get fundsReturned => _num(j['fundsReturned']);
  double get toSend => saleAmount + fundsReturned;
  int get animalsSold => (j['animalsSold'] as num?)?.toInt() ?? 0;
  String? get saleDate => _str(j['saleDate']);
  String? get buyerName => _str(j['buyerName']);
  String? get buyerPhone => _str(j['buyerPhone']);
  String? get note => _str(j['note']);
  String? get photoUrl => _str(j['photoUrl']);
  String? get rejectionReason => _str(j['rejectionReason']);
  String? get remitMethod => _str(j['remitMethod']);
  String? get remitTxnId => _str(j['remitTxnId']);
  String? get remitProofUrl => _str(j['remitProofUrl']);
  String? get remitRejectionReason => _str(j['remitRejectionReason']);
  String? get remittedAt => _str(j['remittedAt']);
}

class Settlement {
  Settlement(this.j);
  final Json j;
  double get capital => _num(j['capital']);
  double get fundsReleased => _num(j['fundsReleased']);
  double get saleAmount => _num(j['saleAmount']);
  double get totalReturn => _num(j['totalReturn']);
  double get netResult => _num(j['netResult']);
  String get outcome => _str(j['outcome']) ?? '';
  double get investorPayout => _num(j['investorPayout']);
  double get farmerShare => _num(j['farmerShare']);
  double get stewardShare => _num(j['stewardShare']);
  double get platformShare => _num(j['platformShare']);
  String? get note => _str(j['note']);
  String? get settledAt => _str(j['settledAt']);
}

class AnimalRecord {
  AnimalRecord(this.j);
  final Json j;
  String get id => j['id'] as String;
  String get kind => _str(j['kind']) ?? '';
  double? get weightKg => _numOrNull(j['weightKg']);
  String? get note => _str(j['note']);
  String? get photoUrl => _str(j['photoUrl']);
  String? get documentUrl => _str(j['documentUrl']);
  String get recordedOn => _str(j['recordedOn']) ?? '';
  String? get authorRole => _str(j['authorRole']);
  String? get reviewStatus => _str(j['reviewStatus']);
  String? get rejectionReason => _str(j['rejectionReason']);
}

class Animal {
  Animal(this.j);
  final Json j;
  String get id => j['id'] as String;
  String get reference => _str(j['reference']) ?? '';
  String get investmentId => _str(j['investmentId']) ?? '';
  String get tag => _str(j['tag']) ?? '';
  String? get earTag => _str(j['earTag']);
  String? get breed => _str(j['breed']);
  String? get sex => _str(j['sex']);
  String? get notes => _str(j['notes']);
  double? get purchasePrice => _numOrNull(j['purchasePrice']);
  double? get purchaseWeightKg => _numOrNull(j['purchaseWeightKg']);
  double? get currentWeightKg => _numOrNull(j['currentWeightKg']);
  String get status => _str(j['status']) ?? 'active';
  double? get salePrice => _numOrNull(j['salePrice']);
  String? get diedAt => _str(j['diedAt']);
  String? get deathCause => _str(j['deathCause']);
  List<AnimalRecord> get records => _list(j['records']).map(AnimalRecord.new).toList();
  bool get active => status == 'active';

  /// kg gained since purchase. Without a purchase weight, the first weighing
  /// is the starting point (once there is a later one), as on the website.
  double? get gain {
    final current = currentWeightKg;
    if (current == null) return null;
    var start = purchaseWeightKg;
    if (start == null) {
      final weighings = records.where((r) => r.kind == 'weight' && r.weightKg != null).toList()
        ..sort((a, b) => a.recordedOn.compareTo(b.recordedOn));
      if (weighings.length < 2) return null;
      start = weighings.first.weightKg;
    }
    if (start == null) return null;
    return ((current - start) * 10).round() / 10;
  }

  /// Livestock list only: which batch the animal is in.
  Json get batch => (j['batch'] as Map?)?.cast<String, dynamic>() ?? const {};
}

class FundRequest {
  FundRequest(this.j);
  final Json j;
  String get id => j['id'] as String;
  String get reference => _str(j['reference']) ?? '';
  double get amount => _num(j['amount']);
  String get purpose => _str(j['purpose']) ?? '';
  String get status => _str(j['status']) ?? '';
  String? get rejectionReason => _str(j['rejectionReason']);
  DateTime get createdAt => DateTime.parse(j['createdAt'] as String);
}

class Expense {
  Expense(this.j);
  final Json j;
  String get id => j['id'] as String;
  double get amount => _num(j['amount']);
  String get category => _str(j['category']) ?? '';
  String? get description => _str(j['description']);
  String? get receiptUrl => _str(j['receiptUrl']);
  String get status => _str(j['status']) ?? '';
  String? get rejectionReason => _str(j['rejectionReason']);
  DateTime get createdAt => DateTime.parse(j['createdAt'] as String);
}

class TimelineEntry {
  TimelineEntry(this.j);
  final Json j;
  String get id => j['id'] as String;
  String get type => _str(j['type']) ?? '';
  String get title => _str(j['title']) ?? '';
  String? get body => _str(j['body']);
  double? get amount => _numOrNull(j['amount']);
  String? get photoUrl => _str(j['photoUrl']);
  String? get authorRole => _str(j['authorRole']);
  bool get superseded => j['superseded'] == true;
  DateTime get createdAt => DateTime.parse(j['createdAt'] as String);
}

class InvestmentDetail {
  InvestmentDetail(this.j);
  final Json j;

  String get id => j['id'] as String;
  String get reference => j['reference'] as String;
  int get units => (j['units'] as num).toInt();
  double get amount => _num(j['amount']);
  String get stage => _str(j['currentStage']) ?? '';
  DateTime get createdAt => DateTime.parse(j['createdAt'] as String);
  String get viewerRole => _str(j['viewerRole']) ?? '';

  Json get _offering => (j['offering'] as Map).cast<String, dynamic>();
  String plan(String locale) => planName(locale, _str(_offering['planNameEn']), _str(_offering['planNameBn']), reference);
  int get durationMonths => (_offering['durationMonths'] as num?)?.toInt() ?? 0;
  double get roiMin => _num(_offering['roiMin']);
  double get roiMax => _num(_offering['roiMax']);

  Json? _person(String key) => (j[key] as Map?)?.cast<String, dynamic>();
  String? get investorName => _str(_person('investor')?['fullName']);
  String? get investorPhone => _str(_person('investor')?['phone']);
  String? get farmerName => _str(_person('farmer')?['fullName']);
  String? get farmerPhone => _str(_person('farmer')?['phone']);
  String? get stewardName => _str(_person('steward')?['fullName']);

  Stats get stats => Stats((j['stats'] as Map).cast<String, dynamic>());
  Sale? get sale => j['sale'] is Map ? Sale((j['sale'] as Map).cast<String, dynamic>()) : null;
  Settlement? get settlement =>
      j['settlement'] is Map ? Settlement((j['settlement'] as Map).cast<String, dynamic>()) : null;
  List<Animal> get animals => _list(j['animals']).map(Animal.new).toList();
  List<FundRequest> get fundRequests => _list(j['fundRequests']).map(FundRequest.new).toList();
  List<Expense> get expenses => _list(j['expenses']).map(Expense.new).toList();
  List<TimelineEntry> get updates => _list(j['updates']).map(TimelineEntry.new).toList();
  List<Json> get platformAccounts => _list(j['platformAccounts']);
  bool get canCloseTotalLoss => j['canCloseTotalLoss'] == true;
  bool get canReview => j['canReview'] == true;
  Json? get review => (j['review'] as Map?)?.cast<String, dynamic>();
  String? get totalLossBlocker => _str(j['totalLossBlocker']);

  bool get isFarmer => viewerRole == 'farmer';
  bool get isSteward => viewerRole == 'steward';
  bool get raising => stage == 'growing_care';
  bool get anyDeathPending => animals.any((a) => a.status == 'death_reported');
}

class WalletData {
  WalletData(this.j);
  final Json j;
  double get balance => _num(j['balance']);
  double get pending => _num(j['pending']);
  double get earned => _num(j['earned']);
  double get withdrawn => _num(j['withdrawn']);
  double get minimum => _num(j['minimumWithdrawal']);
  List<Json> get transactions => _list(j['transactions']);
  List<Json> get withdrawals => _list(j['withdrawals']);
  Json? get payout => (j['payout'] as Map?)?.cast<String, dynamic>();
}

class NotificationItem {
  NotificationItem(this.j);
  final Json j;
  String get id => j['id'] as String;
  String get title => _str(j['title']) ?? '';
  String get body => _str(j['body']) ?? '';
  String? get investmentId => _str(j['investmentId']);
  bool get read => j['read'] == true;
  DateTime get createdAt => DateTime.parse(j['createdAt'] as String);
}

/// A plan someone can invest in (an offering by a steward).
class PlanItem {
  PlanItem(this.j);
  final Json j;
  String get id => j['offeringId'] as String;
  String name(String locale) => planName(locale, _str(j['planNameEn']), _str(j['planNameBn']));
  String category(String locale) => planName(locale, _str(j['categoryNameEn']), _str(j['categoryNameBn']));
  String district(String locale) => planName(locale, _str(j['districtNameEn']), _str(j['districtNameBn']));
  String? get imageUrl => _str(j['imageUrl']);
  int get durationMonths => (j['durationMonths'] as num?)?.toInt() ?? 0;
  double get roiMin => _num(j['roiMin']);
  double get roiMax => _num(j['roiMax']);
  double get unitPrice => _num(j['unitPrice']);
  double get animalAllocation => _num(j['animalAllocation']);
  double get careAllocation => _num(j['careAllocation']);
  int get unitsOffered => (j['unitsOffered'] as num?)?.toInt() ?? 0;
  int get unitsFunded => (j['unitsFunded'] as num?)?.toInt() ?? 0;
  int get unitsLeft => (j['unitsLeft'] as num?)?.toInt() ?? 0;
  String get status => _str(j['status']) ?? 'open';
  String get stewardName => _str((j['steward'] as Map?)?['name']) ?? '';
  double get fundedShare => unitsOffered == 0 ? 0 : (unitsFunded / unitsOffered).clamp(0, 1).toDouble();

  // Detail only
  String? description(String locale) => locale == 'bn' ? _str(j['descriptionBn']) : _str(j['descriptionEn']);
  String? get riskInformation => _str(j['riskInformation']);
  double? get stewardRating => _numOrNull((j['stewardRating'] as Map?)?['avg']);
  int get stewardRatingCount => ((j['stewardRating'] as Map?)?['count'] as num?)?.toInt() ?? 0;
  List<Json> get reviews => _list(j['reviews']);
  Json? get myInterest => (j['myInterest'] as Map?)?.cast<String, dynamic>();
}

class InterestItem {
  InterestItem(this.j);
  final Json j;
  String get id => j['id'] as String;
  String get reference => j['reference'] as String;
  String get status => _str(j['status']) ?? '';
  int get units => (j['units'] as num?)?.toInt() ?? 0;
  double get amount => _num(j['amount']);
  String plan(String locale) => planName(locale, _str(j['planEn']), _str(j['planBn']), reference);
  String? get stewardName => _str(j['stewardName']);
  String? get rejectionReason => _str(j['rejectionReason']);
  String? get investmentId => _str(j['investmentId']);
  String? get offeringId => _str(j['offeringId']);
  DateTime get createdAt => DateTime.parse(j['createdAt'] as String);
  bool get readyToPay => status == 'approved' || status == 'onboarding';
}

/// The steps from an approved interest to a running batch.
class Onboarding {
  Onboarding(this.j);
  final Json j;
  String get step => _str(j['step']) ?? 'closed';
  Json get interest => (j['interest'] as Map).cast<String, dynamic>();
  String get interestId => interest['id'] as String;
  String get reference => interest['reference'] as String;
  double get amount => _num(interest['amount']);
  int get units => (interest['units'] as num?)?.toInt() ?? 0;
  String plan(String locale) => planName(locale, _str(interest['planEn']), _str(interest['planBn']), reference);
  String? get investmentId => _str(j['investmentId']);
  String get kycStatus => _str(j['kycStatus']) ?? 'not_started';
  String? get kycRejectionReason => _str(j['kycRejectionReason']);
  Json? get deposit => (j['deposit'] as Map?)?.cast<String, dynamic>();
  List<Json> get platformAccounts => _list(j['platformAccounts']);
  bool get onlineEnabled => (j['onlinePayment'] as Map?)?['enabled'] == true;
  int get unitsLeft => (j['unitsLeft'] as num?)?.toInt() ?? 0;
}
