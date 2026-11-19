// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Bengali Bangla (`bn`).
class AppLocalizationsBn extends AppLocalizations {
  AppLocalizationsBn([String locale = 'bn']) : super(locale);

  @override
  String get appName => 'কৃষি';

  @override
  String get retry => 'আবার চেষ্টা করুন';

  @override
  String get cancel => 'বাতিল';

  @override
  String get save => 'সংরক্ষণ';

  @override
  String get send => 'পাঠান';

  @override
  String get close => 'বন্ধ';

  @override
  String get view => 'দেখুন';

  @override
  String get seeAll => 'সব দেখুন';

  @override
  String get approve => 'অনুমোদন';

  @override
  String get reject => 'প্রত্যাখ্যান';

  @override
  String get notAccepted => 'গ্রহণ করা হয়নি';

  @override
  String optional(Object label) {
    return '$label (ঐচ্ছিক)';
  }

  @override
  String get required => 'আবশ্যক';

  @override
  String get errorNetwork =>
      'কৃষির সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট সংযোগ দেখুন।';

  @override
  String get errorGeneric => 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।';

  @override
  String get reasonLabel => 'কারণ';

  @override
  String get reasonHint => 'কারণ লিখুন (অন্তত ৫ অক্ষর)';

  @override
  String get saved => 'সংরক্ষিত হয়েছে';

  @override
  String get signInTitle => 'কৃষিতে স্বাগতম';

  @override
  String get signInSubtitle =>
      'আপনার পশু, টাকা ও কাজের খোঁজ রাখতে সাইন ইন করুন।';

  @override
  String get phoneLabel => 'ফোন নম্বর';

  @override
  String get phoneHint => '01XXXXXXXXX';

  @override
  String get passwordLabel => 'পাসওয়ার্ড';

  @override
  String get signIn => 'সাইন ইন';

  @override
  String get sessionExpired => 'আপনার সেশন শেষ হয়েছে। আবার সাইন ইন করুন।';

  @override
  String get newHere => 'কৃষিতে নতুন? ওয়েবসাইটে অ্যাকাউন্ট খুলুন।';

  @override
  String get forgotPassword => 'পাসওয়ার্ড ভুলে গেছেন?';

  @override
  String get invalidPhone => '১১ সংখ্যার মোবাইল নম্বর দিন';

  @override
  String get navHome => 'হোম';

  @override
  String get navBatches => 'ব্যাচ';

  @override
  String get navApprovals => 'অনুমোদন';

  @override
  String get navLivestock => 'পশু';

  @override
  String get navWallet => 'ওয়ালেট';

  @override
  String get navMore => 'আরও';

  @override
  String hello(Object name) {
    return 'হ্যালো, $name';
  }

  @override
  String get helloNoName => 'হ্যালো';

  @override
  String get homeSubtitleInvestor => 'আপনার ব্যাচ ও টাকার সংক্ষিপ্ত চিত্র।';

  @override
  String get homeSubtitleFarmer => 'আপনার ব্যাচ এবং এরপর কী করতে হবে।';

  @override
  String get homeSubtitleSteward =>
      'আপনার ব্যাচ এবং যেসব বিষয়ে সিদ্ধান্ত দরকার।';

  @override
  String get statInvested => 'বর্তমান বিনিয়োগ';

  @override
  String get statActiveBatches => 'সক্রিয় ব্যাচ';

  @override
  String unitsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countটি ইউনিট',
    );
    return '$_temp0';
  }

  @override
  String get statWallet => 'ওয়ালেট';

  @override
  String get statReturns => 'এ পর্যন্ত রিটার্ন';

  @override
  String get statReturnsHint => 'নিষ্পত্তি হওয়া ব্যাচে';

  @override
  String get statPendingFunds => 'অপেক্ষমাণ তহবিল অনুরোধ';

  @override
  String get statPendingExpenses => 'অপেক্ষমাণ খরচ';

  @override
  String get statApprovals => 'আপনার অপেক্ষায়';

  @override
  String get kycStartTitle => 'আপনার পরিচয় যাচাই করুন';

  @override
  String get kycStartBody =>
      'বিনিয়োগ ও উত্তোলনের জন্য ওয়েবসাইটে একবার আপনার এনআইডি জমা দিন।';

  @override
  String get kycFixTitle => 'আপনার KYC হালনাগাদ করতে হবে';

  @override
  String get kycFixBody =>
      'কৃষি পরিবর্তন চেয়েছে। ওয়েবসাইটে কাগজপত্র হালনাগাদ করুন।';

  @override
  String get kycWaitingTitle => 'KYC যাচাই চলছে';

  @override
  String get kycWaitingBody =>
      'কৃষি আপনার কাগজপত্র যাচাই করছে। আপনি নোটিফিকেশন পাবেন।';

  @override
  String payTitle(Object plan) {
    return 'বিনিয়োগের জন্য প্রস্তুত: $plan';
  }

  @override
  String payBody(Object reference) {
    return '$reference অনুমোদিত হয়েছে। ব্যাচ শুরু করতে ওয়েবসাইটে পেমেন্ট করুন।';
  }

  @override
  String get openWebsite => 'ওয়েবসাইট খুলুন';

  @override
  String interestsWaiting(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countটি আগ্রহ স্টুয়ার্ডের অপেক্ষায়',
    );
    return '$_temp0';
  }

  @override
  String purchaseNeededTitle(Object reference) {
    return '$reference-এর পশু কেনা নিশ্চিত করুন';
  }

  @override
  String get purchaseNeededBody => 'পশু কেনার পর কত টাকা দিয়েছেন তা লিখুন।';

  @override
  String moneyToSendTitle(Object amount) {
    return 'কৃষিতে $amount পাঠান';
  }

  @override
  String moneyToSendBody(Object reference) {
    return '$reference: আপনার স্টুয়ার্ড নিশ্চিত করেছেন। টাকা পাঠিয়ে বিবরণ জমা দিন।';
  }

  @override
  String approvalsWaitingTitle(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countটি বিষয়ে আপনার সিদ্ধান্ত দরকার',
    );
    return '$_temp0';
  }

  @override
  String get approvalsWaitingBody =>
      'আপনার কৃষকদের তহবিল অনুরোধ, খরচ, বিক্রয় ও মৃত্যুর খবর।';

  @override
  String awaitingFarmerTitle(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countটি ব্যাচে কৃষক দরকার',
    );
    return '$_temp0';
  }

  @override
  String get awaitingFarmerBody => 'ওয়েবসাইটে কৃষক নির্ধারণ করুন।';

  @override
  String get latestActivity => 'সাম্প্রতিক কার্যক্রম';

  @override
  String get noActivity => 'এখনো কিছু ঘটেনি।';

  @override
  String get batchesTitle => 'ব্যাচ';

  @override
  String get activeBatches => 'সক্রিয়';

  @override
  String get settledBatches => 'নিষ্পত্তি হয়েছে';

  @override
  String get noBatches => 'এখনো কোনো ব্যাচ নেই';

  @override
  String get noBatchesInvestor =>
      'বিনিয়োগ শুরু করতে ওয়েবসাইটে প্ল্যান দেখে আগ্রহ পাঠান।';

  @override
  String get noBatchesFarmer =>
      'স্টুয়ার্ড আপনাকে নির্ধারণ করলে ব্যাচ এখানে দেখা যাবে।';

  @override
  String get noBatchesSteward =>
      'বিনিয়োগকারীরা আপনার প্ল্যানে বিনিয়োগ করলে ব্যাচ এখানে দেখা যাবে।';

  @override
  String get invested => 'বিনিয়োগ';

  @override
  String get steward => 'স্টুয়ার্ড';

  @override
  String get farmer => 'কৃষক';

  @override
  String get investor => 'বিনিয়োগকারী';

  @override
  String get notAssigned => 'এখনো নির্ধারিত হয়নি';

  @override
  String startedOn(Object date) {
    return 'শুরু $date';
  }

  @override
  String get overview => 'সারসংক্ষেপ';

  @override
  String get spentOnBatch => 'পশু ও পরিচর্যায় খরচ';

  @override
  String get paidOut => 'মূলধন থেকে দেওয়া';

  @override
  String get leftoverFunds => 'অব্যবহৃত তহবিল';

  @override
  String get animalPurchase => 'পশু ক্রয়';

  @override
  String get expensesApproved => 'অনুমোদিত খরচ';

  @override
  String get duration => 'মেয়াদ';

  @override
  String monthsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count মাস',
    );
    return '$_temp0';
  }

  @override
  String get estReturn => 'আনুমানিক রিটার্ন';

  @override
  String get call => 'কল করুন';

  @override
  String get actions => 'আপনি যা করতে পারেন';

  @override
  String get animalsTitle => 'পশু';

  @override
  String animalsSummary(int active, int sold, int dead) {
    return '$activeটি সক্রিয় · $soldটি বিক্রি · $deadটি মৃত';
  }

  @override
  String get noAnimals => 'কেনা নিশ্চিত হলে পশু এখানে দেখা যাবে।';

  @override
  String get fundRequestsTitle => 'তহবিল অনুরোধ';

  @override
  String get noFundRequests => 'এখনো কোনো তহবিল অনুরোধ নেই।';

  @override
  String get expensesTitle => 'খরচ';

  @override
  String get noExpenses => 'এখনো কোনো খরচ নেই।';

  @override
  String get timelineTitle => 'আপডেট ও কার্যক্রম';

  @override
  String get noUpdates => 'এখনো কোনো আপডেট নেই।';

  @override
  String get replaced => 'বাতিল';

  @override
  String get receipt => 'রসিদ';

  @override
  String get saleTitle => 'বিক্রয়';

  @override
  String get totalLossTitle => 'সম্পূর্ণ ক্ষতি';

  @override
  String get soldFor => 'বিক্রয় মূল্য';

  @override
  String get animalsSold => 'বিক্রিত পশু';

  @override
  String get saleDate => 'বিক্রয়ের তারিখ';

  @override
  String get closedOn => 'বন্ধের তারিখ';

  @override
  String get buyer => 'ক্রেতা';

  @override
  String get toSendLabel => 'পাঠাতে হবে';

  @override
  String get fundsReturned => 'ফেরতযোগ্য অব্যবহৃত তহবিল';

  @override
  String get salePendingReview =>
      'স্টুয়ার্ডের বিক্রয় নিশ্চিত করার অপেক্ষায়।';

  @override
  String get salePendingReviewSteward =>
      'কৃষকের সাথে দাম মিলিয়ে বিক্রয় নিশ্চিত করুন বা ফেরত পাঠান।';

  @override
  String saleRejected(Object reason) {
    return 'স্টুয়ার্ড বিক্রয়টি ফেরত পাঠিয়েছেন: $reason';
  }

  @override
  String awaitingRemittanceFarmer(Object amount) {
    return 'আপনার স্টুয়ার্ড বিক্রয় নিশ্চিত করেছেন। কৃষিতে $amount পাঠিয়ে বিবরণ জমা দিন।';
  }

  @override
  String awaitingRemittance(Object amount) {
    return 'কৃষকের কৃষিতে $amount পাঠানোর অপেক্ষায়।';
  }

  @override
  String remitRejected(Object reason) {
    return 'কৃষি পেমেন্ট নিশ্চিত করতে পারেনি: $reason';
  }

  @override
  String get remittanceSubmitted =>
      'টাকা পাঠানো হয়েছে। নিষ্পত্তির আগে কৃষি পেমেন্ট যাচাই করছে।';

  @override
  String get settledNotice =>
      'নিষ্পত্তি হয়েছে। প্রত্যেকের ভাগ ওয়ালেটে যোগ হয়েছে।';

  @override
  String get totalLossPending =>
      'সব পশু মারা গেছে। নিষ্পত্তির আগে কৃষি যাচাই করছে।';

  @override
  String totalLossReturnFarmer(Object amount) {
    return 'সব পশু মারা গেছে। খরচ না হওয়া $amount তহবিল কৃষিতে পাঠান।';
  }

  @override
  String totalLossRejected(Object reason) {
    return 'কৃষি সম্পূর্ণ ক্ষতির আবেদন ফেরত পাঠিয়েছে: $reason';
  }

  @override
  String get totalLossSettled =>
      'সম্পূর্ণ ক্ষতি হিসেবে বন্ধ হয়েছে। বিনিয়োগকারী অব্যবহৃত মূলধন ফেরত পেয়েছেন।';

  @override
  String get settlementTitle => 'নিষ্পত্তি';

  @override
  String resultProfit(Object amount) {
    return 'লাভ $amount';
  }

  @override
  String resultLoss(Object amount) {
    return 'ক্ষতি $amount';
  }

  @override
  String get resultEven => 'লাভ-ক্ষতি নেই';

  @override
  String get capital => 'বিনিয়োগকৃত মূলধন';

  @override
  String get totalReturn => 'মোট ফেরত';

  @override
  String get investorPayout => 'বিনিয়োগকারী পাবেন';

  @override
  String get farmerShare => 'কৃষক (৬০%)';

  @override
  String get stewardShare => 'স্টুয়ার্ড (৫%)';

  @override
  String get platformShare => 'কৃষি (৫%)';

  @override
  String get actConfirmPurchase => 'কেনা নিশ্চিত করুন';

  @override
  String get actFundRequest => 'তহবিল চান';

  @override
  String get actLogExpense => 'খরচ লিখুন';

  @override
  String get actRecordSale => 'বিক্রয় লিখুন';

  @override
  String actSendMoney(Object amount) {
    return 'কৃষিতে $amount পাঠান';
  }

  @override
  String get actPostUpdate => 'আপডেট দিন';

  @override
  String get actConfirmSale => 'বিক্রয় নিশ্চিত করুন';

  @override
  String get actCloseTotalLoss => 'সম্পূর্ণ ক্ষতি হিসেবে বন্ধ করুন';

  @override
  String get waitPendingExpenses =>
      'বিক্রয় লেখার আগে আপনার অপেক্ষমাণ খরচগুলো স্টুয়ার্ডকে যাচাই করতে হবে।';

  @override
  String get waitPendingFunds =>
      'বিক্রয় লেখার আগে আপনার অপেক্ষমাণ তহবিল অনুরোধের উত্তর স্টুয়ার্ডকে দিতে হবে।';

  @override
  String get waitDeathReview =>
      'বিক্রয় লেখার আগে মৃত্যুর খবরটি স্টুয়ার্ডকে যাচাই করতে হবে।';

  @override
  String get allAnimalsDied =>
      'এই ব্যাচের সব পশু মারা গেছে। আপনার স্টুয়ার্ড এটি বন্ধ করবেন।';

  @override
  String get assignFarmerOnWeb => 'ওয়েবসাইটে এই ব্যাচে কৃষক নির্ধারণ করুন।';

  @override
  String get purchaseTitle => 'কেনা নিশ্চিত করুন';

  @override
  String get animalsBought => 'পশুর সংখ্যা';

  @override
  String get totalCost => 'মোট খরচ (টাকা)';

  @override
  String get breed => 'জাত';

  @override
  String get avgWeight => 'গড় ওজন (কেজি)';

  @override
  String get note => 'নোট';

  @override
  String get photo => 'ছবি';

  @override
  String get addPhoto => 'ছবি যোগ করুন';

  @override
  String get takePhoto => 'ছবি তুলুন';

  @override
  String get choosePhoto => 'গ্যালারি থেকে নিন';

  @override
  String get removePhoto => 'সরান';

  @override
  String get fundRequestTitle => 'তহবিল চান';

  @override
  String get purpose => 'উদ্দেশ্য';

  @override
  String get amountBdt => 'পরিমাণ (টাকা)';

  @override
  String get budgetLeftHint => 'অনুরোধ এই ব্যাচের বাজেটের বেশি হতে পারবে না।';

  @override
  String get expenseTitle => 'খরচ লিখুন';

  @override
  String get category => 'খাত';

  @override
  String get description => 'বিবরণ';

  @override
  String get receiptPhoto => 'রসিদের ছবি';

  @override
  String get saleFormTitle => 'বিক্রয় লিখুন';

  @override
  String whichAnimals(int count) {
    return 'বিক্রিত পশু ($count)';
  }

  @override
  String get salePrice => 'বিক্রয় মূল্য (টাকা)';

  @override
  String get buyerName => 'ক্রেতার নাম';

  @override
  String get buyerPhone => 'ক্রেতার ফোন';

  @override
  String get saleNoteHint =>
      'যেমন: স্থানীয় হাটে বিক্রি, প্রতিটি প্রায় ৩২০ কেজি';

  @override
  String get deadNotSellable =>
      'মৃত পশু বা যে পশুর মৃত্যুর খবর অপেক্ষমাণ, সেগুলো বিক্রি করা যাবে না।';

  @override
  String get remitTitle => 'কৃষিতে টাকা পাঠান';

  @override
  String get remitAmount => 'পাঠানোর পরিমাণ';

  @override
  String get method => 'মাধ্যম';

  @override
  String get methodBank => 'ব্যাংক ট্রান্সফার';

  @override
  String get methodMfs => 'মোবাইল ওয়ালেট';

  @override
  String get methodCash => 'নগদ';

  @override
  String get sendTo => 'যেখানে পাঠাবেন';

  @override
  String get txnId => 'ট্রানজেকশন আইডি';

  @override
  String get sender => 'যে নম্বর বা অ্যাকাউন্ট থেকে';

  @override
  String get proof => 'ট্রান্সফারের স্ক্রিনশট বা ছবি';

  @override
  String get proofRequired => 'ট্রান্সফারের স্ক্রিনশট বা ছবি দিন';

  @override
  String get updateTitle => 'আপডেট দিন';

  @override
  String get updateType => 'ধরন';

  @override
  String get updateHealth => 'স্বাস্থ্য পরীক্ষা';

  @override
  String get updatePhoto => 'ছবি আপডেট';

  @override
  String get updateNote => 'নোট';

  @override
  String get titleLabel => 'শিরোনাম';

  @override
  String get details => 'বিস্তারিত';

  @override
  String get addRecord => 'রেকর্ড যোগ করুন';

  @override
  String recordTitle(Object tag) {
    return '$tag-এর রেকর্ড যোগ করুন';
  }

  @override
  String get recordType => 'ধরন';

  @override
  String get date => 'তারিখ';

  @override
  String get weightKg => 'ওজন (কেজি)';

  @override
  String get recordNoteHint => 'কী দেখেছেন বা করেছেন?';

  @override
  String get reportDeath => 'মৃত্যুর খবর দিন';

  @override
  String get recordDeath => 'মৃত্যু লিখুন';

  @override
  String get saveRecord => 'রেকর্ড সংরক্ষণ';

  @override
  String get deathCause => 'মৃত্যুর কারণ';

  @override
  String get deathPhoto => 'পশুর ছবি';

  @override
  String get vetDocument => 'চিকিৎসকের সনদের ছবি';

  @override
  String get deathGuideTitle => 'পশু মারা গেলে যা করবেন';

  @override
  String get deathGuide1 =>
      'ছবি তোলার আগে মৃতদেহ সরাবেন না, বিক্রি করবেন না বা কবর দেবেন না।';

  @override
  String get deathGuide2 => 'কানের ট্যাগসহ মৃতদেহের একটি পরিষ্কার ছবি তুলুন।';

  @override
  String get deathGuide3 =>
      'আপনার স্টুয়ার্ড বা পশু চিকিৎসককে ফোন করুন। চিকিৎসক দেখলে সনদের ছবি তুলুন।';

  @override
  String get deathGuide4 =>
      'একই দিনে এখানে জানান। আপনার স্টুয়ার্ড যাচাই করে নিশ্চিত করবেন।';

  @override
  String get deathGuide5 =>
      'রোগে মারা গেলে অন্য পশুদের দূরে রাখুন এবং চিকিৎসকের পরামর্শ মানুন।';

  @override
  String get reportWarning =>
      'আপনার স্টুয়ার্ড খবরটি যাচাই করবেন। ততক্ষণ ব্যাচ বিক্রি করা যাবে না।';

  @override
  String get stewardDeathWarning =>
      'এতে পশুটি সঙ্গে সঙ্গে মৃত হিসেবে চিহ্নিত হবে এবং বিনিয়োগকারী ও কৃষককে জানানো হবে। এটি ফেরানো যাবে না।';

  @override
  String get noWeight => 'এখনো ওজন নেই';

  @override
  String earTag(Object tag) {
    return 'কানের ট্যাগ $tag';
  }

  @override
  String get earTagLabel => 'কানের ট্যাগ';

  @override
  String get history => 'ইতিহাস';

  @override
  String get noRecords => 'এখনো কোনো রেকর্ড নেই।';

  @override
  String get waitingSteward => 'স্টুয়ার্ডের অপেক্ষায়';

  @override
  String notAcceptedReason(Object reason) {
    return 'গ্রহণ করা হয়নি: $reason';
  }

  @override
  String get vetCertificate => 'চিকিৎসকের সনদ';

  @override
  String get causeLabel => 'কারণ';

  @override
  String get bought => 'কেনা';

  @override
  String get startWeight => 'কেনার সময় ওজন';

  @override
  String get currentWeight => 'বর্তমান ওজন';

  @override
  String get approvalsTitle => 'অনুমোদন';

  @override
  String get nothingToApprove => 'আপনার জন্য কিছু অপেক্ষায় নেই।';

  @override
  String get nothingToApproveHint =>
      'নতুন তহবিল অনুরোধ, খরচ, বিক্রয় ও মৃত্যুর খবর এখানে দেখা যাবে।';

  @override
  String get deathReportsTitle => 'মৃত্যুর খবর';

  @override
  String get salesTitle => 'বিক্রয়';

  @override
  String get confirmDeath => 'মৃত্যু নিশ্চিত করুন';

  @override
  String reportedOn(Object date) {
    return 'জানানো হয়েছে $date';
  }

  @override
  String get rejectTitle => 'কেন গ্রহণ করা হয়নি?';

  @override
  String get confirmSaleTitle => 'বিক্রয়টি নিশ্চিত করবেন?';

  @override
  String confirmSaleBody(Object amount) {
    return 'আপনি নিশ্চিত করছেন পশুগুলো $amount-এ বিক্রি হয়েছে। এরপর কৃষক টাকা কৃষিতে পাঠাবেন।';
  }

  @override
  String get confirmDeathTitle => 'মৃত্যু নিশ্চিত করবেন?';

  @override
  String get confirmDeathBody =>
      'পশুটি মৃত হিসেবে চিহ্নিত হবে এবং বিনিয়োগকারীকে জানানো হবে। এটি ফেরানো যাবে না।';

  @override
  String get totalLossFormTitle => 'সম্পূর্ণ ক্ষতি হিসেবে বন্ধ করুন';

  @override
  String get totalLossIntro =>
      'এই ব্যাচের সব পশু মারা গেছে, তাই বিক্রির কিছু নেই। কৃষি নিষ্পত্তি করবে: বিনিয়োগকারী অব্যবহৃত টাকা ফেরত পাবেন, কেউ লাভের ভাগ পাবেন না।';

  @override
  String get whatHappened => 'কী ঘটেছে';

  @override
  String get blocker_death_pending => 'আগে মৃত্যুর খবরগুলো যাচাই করুন।';

  @override
  String get blocker_fund_requests => 'আগে অপেক্ষমাণ তহবিল অনুরোধের উত্তর দিন।';

  @override
  String get walletTitle => 'ওয়ালেট';

  @override
  String get available => 'উত্তোলনযোগ্য';

  @override
  String get pendingWithdrawal => 'প্রক্রিয়াধীন';

  @override
  String get earned => 'আয়';

  @override
  String get withdrawn => 'উত্তোলিত';

  @override
  String get withdraw => 'উত্তোলন';

  @override
  String get withdrawTitle => 'টাকা উত্তোলন';

  @override
  String minimumWithdrawal(Object amount) {
    return 'সর্বনিম্ন $amount';
  }

  @override
  String withdrawTo(Object destination) {
    return 'পাঠানো হবে $destination-এ';
  }

  @override
  String get withdrawRequested =>
      'উত্তোলনের অনুরোধ করা হয়েছে। কৃষি শীঘ্রই পাঠাবে।';

  @override
  String get payoutAccount => 'পেআউট অ্যাকাউন্ট';

  @override
  String get addPayout => 'পেআউট অ্যাকাউন্ট যোগ করুন';

  @override
  String get editPayout => 'পরিবর্তন';

  @override
  String get noPayout => 'উত্তোলনের আগে কৃষি কোথায় টাকা পাঠাবে তা যোগ করুন।';

  @override
  String get transactions => 'লেনদেন';

  @override
  String get withdrawals => 'উত্তোলন';

  @override
  String get noTransactions => 'এখনো কোনো লেনদেন নেই।';

  @override
  String get noWithdrawals => 'এখনো কোনো উত্তোলন নেই।';

  @override
  String get cancelWithdrawal => 'অনুরোধ বাতিল করুন';

  @override
  String get cancelWithdrawalConfirm =>
      'এই উত্তোলন বাতিল করবেন? টাকা আপনার ব্যালেন্সে ফিরে যাবে।';

  @override
  String get payoutMobile => 'মোবাইল ওয়ালেট';

  @override
  String get payoutBank => 'ব্যাংক অ্যাকাউন্ট';

  @override
  String get provider => 'প্রদানকারী';

  @override
  String get mobileNumber => 'মোবাইল নম্বর';

  @override
  String get accountHolder => 'অ্যাকাউন্টধারীর নাম';

  @override
  String get bankName => 'ব্যাংকের নাম';

  @override
  String get accountNumber => 'অ্যাকাউন্ট নম্বর';

  @override
  String get branch => 'শাখা';

  @override
  String get routingNumber => 'রাউটিং নম্বর';

  @override
  String get notificationsTitle => 'নোটিফিকেশন';

  @override
  String get markAllRead => 'সব পড়া হয়েছে';

  @override
  String get noNotifications => 'এখনো কোনো নোটিফিকেশন নেই।';

  @override
  String get moreTitle => 'আরও';

  @override
  String get language => 'ভাষা';

  @override
  String get bangla => 'বাংলা';

  @override
  String get english => 'English';

  @override
  String get kycStatus => 'KYC';

  @override
  String get manageOnWebsite => 'ওয়েবসাইটে পরিচালনা করুন';

  @override
  String get livestockTitle => 'পশু';

  @override
  String get filterActive => 'সক্রিয়';

  @override
  String get filterSold => 'বিক্রিত';

  @override
  String get filterDead => 'মৃত';

  @override
  String get filterAll => 'সব';

  @override
  String get noAnimalsYet => 'এখনো কোনো পশু নেই।';

  @override
  String get website => 'কৃষি ওয়েবসাইট';

  @override
  String get signOut => 'সাইন আউট';

  @override
  String get signOutConfirm => 'এই ফোনে কৃষি থেকে সাইন আউট করবেন?';

  @override
  String get role_investor => 'বিনিয়োগকারী';

  @override
  String get role_steward => 'স্টুয়ার্ড';

  @override
  String get role_farmer => 'কৃষক';
}
