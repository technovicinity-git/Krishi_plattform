// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'Krishi';

  @override
  String get retry => 'Try again';

  @override
  String get cancel => 'Cancel';

  @override
  String get save => 'Save';

  @override
  String get send => 'Send';

  @override
  String get close => 'Close';

  @override
  String get view => 'View';

  @override
  String get seeAll => 'See all';

  @override
  String get approve => 'Approve';

  @override
  String get reject => 'Reject';

  @override
  String get notAccepted => 'Not accepted';

  @override
  String optional(Object label) {
    return '$label (optional)';
  }

  @override
  String get required => 'Required';

  @override
  String get errorNetwork =>
      'Can\'t reach Krishi. Check your internet connection.';

  @override
  String get errorGeneric => 'Something went wrong. Please try again.';

  @override
  String get reasonLabel => 'Reason';

  @override
  String get reasonHint => 'Explain why (at least 5 characters)';

  @override
  String get saved => 'Saved';

  @override
  String get signInTitle => 'Welcome to Krishi';

  @override
  String get signInSubtitle =>
      'Sign in to follow your livestock, money and work.';

  @override
  String get phoneLabel => 'Phone number';

  @override
  String get phoneHint => '01XXXXXXXXX';

  @override
  String get passwordLabel => 'Password';

  @override
  String get signIn => 'Sign in';

  @override
  String get sessionExpired => 'Your session ended. Please sign in again.';

  @override
  String get newHere => 'New to Krishi? Create an account on the website.';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get invalidPhone => 'Enter an 11-digit mobile number';

  @override
  String get navHome => 'Home';

  @override
  String get navBatches => 'Batches';

  @override
  String get navApprovals => 'Approvals';

  @override
  String get navLivestock => 'Livestock';

  @override
  String get navWallet => 'Wallet';

  @override
  String get navMore => 'More';

  @override
  String hello(Object name) {
    return 'Hello, $name';
  }

  @override
  String get helloNoName => 'Hello';

  @override
  String get homeSubtitleInvestor => 'Your batches and money at a glance.';

  @override
  String get homeSubtitleFarmer => 'Your batches and what to do next.';

  @override
  String get homeSubtitleSteward => 'Your batches and what needs a decision.';

  @override
  String get statInvested => 'Invested now';

  @override
  String get statActiveBatches => 'Active batches';

  @override
  String unitsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '# units',
      one: '# unit',
    );
    return '$_temp0';
  }

  @override
  String get statWallet => 'Wallet';

  @override
  String get statReturns => 'Returns so far';

  @override
  String get statReturnsHint => 'On settled batches';

  @override
  String get statPendingFunds => 'Fund requests waiting';

  @override
  String get statPendingExpenses => 'Expenses waiting';

  @override
  String get statApprovals => 'Waiting for you';

  @override
  String get kycStartTitle => 'Verify your identity';

  @override
  String get kycStartBody =>
      'Submit your NID once on the website so you can invest and withdraw.';

  @override
  String get kycFixTitle => 'Your KYC needs an update';

  @override
  String get kycFixBody =>
      'Krishi asked for a change. Update your documents on the website.';

  @override
  String get kycWaitingTitle => 'KYC under review';

  @override
  String get kycWaitingBody =>
      'Krishi is checking your documents. You\'ll get a notification.';

  @override
  String payTitle(Object plan) {
    return 'Ready to invest: $plan';
  }

  @override
  String payBody(Object reference) {
    return '$reference was approved. Make the payment on the website to start your batch.';
  }

  @override
  String get openWebsite => 'Open website';

  @override
  String interestsWaiting(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '# interests are waiting for a steward',
      one: '# interest is waiting for a steward',
    );
    return '$_temp0';
  }

  @override
  String purchaseNeededTitle(Object reference) {
    return 'Confirm the purchase for $reference';
  }

  @override
  String get purchaseNeededBody =>
      'Record what you paid for the animals once you\'ve bought them.';

  @override
  String moneyToSendTitle(Object amount) {
    return 'Send $amount to Krishi';
  }

  @override
  String moneyToSendBody(Object reference) {
    return '$reference: your steward confirmed it. Send the money and submit the details.';
  }

  @override
  String approvalsWaitingTitle(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '# items need your decision',
      one: '# item needs your decision',
    );
    return '$_temp0';
  }

  @override
  String get approvalsWaitingBody =>
      'Fund requests, expenses, sales and death reports from your farmers.';

  @override
  String awaitingFarmerTitle(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '# batches need a farmer',
      one: '# batch needs a farmer',
    );
    return '$_temp0';
  }

  @override
  String get awaitingFarmerBody => 'Assign a farmer on the website.';

  @override
  String get latestActivity => 'Latest activity';

  @override
  String get noActivity => 'Nothing has happened yet.';

  @override
  String get batchesTitle => 'Batches';

  @override
  String get activeBatches => 'Active';

  @override
  String get settledBatches => 'Settled';

  @override
  String get noBatches => 'No batches yet';

  @override
  String get noBatchesInvestor =>
      'Browse plans on the website and send an interest to start investing.';

  @override
  String get noBatchesFarmer =>
      'Batches appear here when a steward assigns you.';

  @override
  String get noBatchesSteward =>
      'Batches appear here when investors fund your plans.';

  @override
  String get invested => 'Invested';

  @override
  String get steward => 'Steward';

  @override
  String get farmer => 'Farmer';

  @override
  String get investor => 'Investor';

  @override
  String get notAssigned => 'Not assigned yet';

  @override
  String startedOn(Object date) {
    return 'Started $date';
  }

  @override
  String get overview => 'Overview';

  @override
  String get spentOnBatch => 'Spent on animals & care';

  @override
  String get paidOut => 'Paid out of capital';

  @override
  String get leftoverFunds => 'Unspent fund money';

  @override
  String get animalPurchase => 'Animal purchase';

  @override
  String get expensesApproved => 'Expenses approved';

  @override
  String get duration => 'Duration';

  @override
  String monthsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '# months',
      one: '# month',
    );
    return '$_temp0';
  }

  @override
  String get estReturn => 'Est. return';

  @override
  String get call => 'Call';

  @override
  String get actions => 'What you can do';

  @override
  String get animalsTitle => 'Animals';

  @override
  String animalsSummary(int active, int sold, int dead) {
    return '$active active · $sold sold · $dead died';
  }

  @override
  String get noAnimals => 'Animals appear once the purchase is confirmed.';

  @override
  String get fundRequestsTitle => 'Fund requests';

  @override
  String get noFundRequests => 'No fund requests yet.';

  @override
  String get expensesTitle => 'Expenses';

  @override
  String get noExpenses => 'No expenses yet.';

  @override
  String get timelineTitle => 'Updates & activity';

  @override
  String get noUpdates => 'No updates yet.';

  @override
  String get replaced => 'Replaced';

  @override
  String get receipt => 'Receipt';

  @override
  String get saleTitle => 'Sale';

  @override
  String get totalLossTitle => 'Total loss';

  @override
  String get soldFor => 'Sold for';

  @override
  String get animalsSold => 'Animals sold';

  @override
  String get saleDate => 'Sale date';

  @override
  String get closedOn => 'Closed on';

  @override
  String get buyer => 'Buyer';

  @override
  String get toSendLabel => 'Money to send';

  @override
  String get fundsReturned => 'Unspent fund money to return';

  @override
  String get salePendingReview =>
      'Waiting for the steward to confirm the sale.';

  @override
  String get salePendingReviewSteward =>
      'Check the price with the farmer, then confirm the sale or send it back.';

  @override
  String saleRejected(Object reason) {
    return 'The steward sent this sale back: $reason';
  }

  @override
  String awaitingRemittanceFarmer(Object amount) {
    return 'Your steward confirmed the sale. Send $amount to Krishi and submit the transfer details.';
  }

  @override
  String awaitingRemittance(Object amount) {
    return 'Waiting for the farmer to send $amount to Krishi.';
  }

  @override
  String remitRejected(Object reason) {
    return 'Krishi could not confirm the payment: $reason';
  }

  @override
  String get remittanceSubmitted =>
      'The money was sent. Krishi is checking the payment before settling.';

  @override
  String get settledNotice =>
      'Settled. Each share was added to the person\'s wallet.';

  @override
  String get totalLossPending =>
      'Every animal died. Krishi is checking before settling.';

  @override
  String totalLossReturnFarmer(Object amount) {
    return 'Every animal died. Send the $amount of fund money you didn\'t spend to Krishi.';
  }

  @override
  String totalLossRejected(Object reason) {
    return 'Krishi sent the total-loss closing back: $reason';
  }

  @override
  String get totalLossSettled =>
      'Closed as a total loss. The investor got back the unspent capital.';

  @override
  String get settlementTitle => 'Settlement';

  @override
  String resultProfit(Object amount) {
    return 'Profit $amount';
  }

  @override
  String resultLoss(Object amount) {
    return 'Loss $amount';
  }

  @override
  String get resultEven => 'Break-even';

  @override
  String get capital => 'Invested capital';

  @override
  String get totalReturn => 'Total returned';

  @override
  String get investorPayout => 'Investor gets';

  @override
  String get farmerShare => 'Farmer (60%)';

  @override
  String get stewardShare => 'Steward (5%)';

  @override
  String get platformShare => 'Krishi (5%)';

  @override
  String get actConfirmPurchase => 'Confirm purchase';

  @override
  String get actFundRequest => 'Request funds';

  @override
  String get actLogExpense => 'Log expense';

  @override
  String get actRecordSale => 'Record sale';

  @override
  String actSendMoney(Object amount) {
    return 'Send $amount to Krishi';
  }

  @override
  String get actPostUpdate => 'Post update';

  @override
  String get actConfirmSale => 'Confirm sale';

  @override
  String get actCloseTotalLoss => 'Close as total loss';

  @override
  String get waitPendingExpenses =>
      'Your steward must review your pending expenses before you can record the sale.';

  @override
  String get waitPendingFunds =>
      'Your steward must answer your pending fund requests before you can record the sale.';

  @override
  String get waitDeathReview =>
      'Your steward must review the reported death before you can record the sale.';

  @override
  String get allAnimalsDied =>
      'All animals in this batch died. Your steward will close it.';

  @override
  String get assignFarmerOnWeb =>
      'Assign a farmer to this batch on the website.';

  @override
  String get purchaseTitle => 'Confirm the purchase';

  @override
  String get animalsBought => 'Number of animals';

  @override
  String get totalCost => 'Total cost (BDT)';

  @override
  String get breed => 'Breed';

  @override
  String get avgWeight => 'Average weight (kg)';

  @override
  String get note => 'Note';

  @override
  String get photo => 'Photo';

  @override
  String get addPhoto => 'Add photo';

  @override
  String get takePhoto => 'Take photo';

  @override
  String get choosePhoto => 'Choose from gallery';

  @override
  String get removePhoto => 'Remove';

  @override
  String get fundRequestTitle => 'Request funds';

  @override
  String get purpose => 'Purpose';

  @override
  String get amountBdt => 'Amount (BDT)';

  @override
  String get budgetLeftHint => 'Requests can\'t exceed this batch\'s budget.';

  @override
  String get expenseTitle => 'Log an expense';

  @override
  String get category => 'Category';

  @override
  String get description => 'Description';

  @override
  String get receiptPhoto => 'Receipt photo';

  @override
  String get saleFormTitle => 'Record the sale';

  @override
  String whichAnimals(int count) {
    return 'Animals sold ($count)';
  }

  @override
  String get salePrice => 'Sale price (BDT)';

  @override
  String get buyerName => 'Buyer name';

  @override
  String get buyerPhone => 'Buyer phone';

  @override
  String get saleNoteHint => 'e.g. Sold at the local haat, about 320 kg each';

  @override
  String get deadNotSellable =>
      'Dead animals and animals with a death report can\'t be sold.';

  @override
  String get remitTitle => 'Send money to Krishi';

  @override
  String get remitAmount => 'Amount to send';

  @override
  String get method => 'Method';

  @override
  String get methodBank => 'Bank transfer';

  @override
  String get methodMfs => 'Mobile wallet';

  @override
  String get methodCash => 'Cash';

  @override
  String get sendTo => 'Send to';

  @override
  String get txnId => 'Transaction ID';

  @override
  String get sender => 'Sent from (number or account)';

  @override
  String get proof => 'Screenshot or photo of the transfer';

  @override
  String get proofRequired => 'Add a screenshot or photo of the transfer';

  @override
  String get updateTitle => 'Post an update';

  @override
  String get updateType => 'Type';

  @override
  String get updateHealth => 'Health check';

  @override
  String get updatePhoto => 'Photo update';

  @override
  String get updateNote => 'Note';

  @override
  String get titleLabel => 'Title';

  @override
  String get details => 'Details';

  @override
  String get addRecord => 'Add record';

  @override
  String recordTitle(Object tag) {
    return 'Add a record for $tag';
  }

  @override
  String get recordType => 'Type';

  @override
  String get date => 'Date';

  @override
  String get weightKg => 'Weight (kg)';

  @override
  String get recordNoteHint => 'What did you see or do?';

  @override
  String get reportDeath => 'Report death';

  @override
  String get recordDeath => 'Record death';

  @override
  String get saveRecord => 'Save record';

  @override
  String get deathCause => 'Cause of death';

  @override
  String get deathPhoto => 'Photo of the animal';

  @override
  String get vetDocument => 'Vet certificate photo';

  @override
  String get deathGuideTitle => 'If an animal dies';

  @override
  String get deathGuide1 =>
      'Don\'t move, sell or bury the body before taking photos.';

  @override
  String get deathGuide2 =>
      'Take a clear photo of the body that shows the ear tag.';

  @override
  String get deathGuide3 =>
      'Call your steward or a vet. If a vet examines it, photograph the certificate.';

  @override
  String get deathGuide4 =>
      'Report it here the same day. Your steward checks it and confirms.';

  @override
  String get deathGuide5 =>
      'If it may be a disease, keep the other animals away and follow the vet\'s advice.';

  @override
  String get reportWarning =>
      'Your steward reviews the report. Until then the batch can\'t be sold.';

  @override
  String get stewardDeathWarning =>
      'This marks the animal as dead straight away and tells the investor and farmer. It can\'t be undone.';

  @override
  String get noWeight => 'No weight yet';

  @override
  String earTag(Object tag) {
    return 'Ear tag $tag';
  }

  @override
  String get earTagLabel => 'Ear tag';

  @override
  String get history => 'History';

  @override
  String get noRecords => 'No records yet.';

  @override
  String get waitingSteward => 'Waiting for steward';

  @override
  String notAcceptedReason(Object reason) {
    return 'Not accepted: $reason';
  }

  @override
  String get vetCertificate => 'Vet certificate';

  @override
  String get causeLabel => 'Cause';

  @override
  String get bought => 'Bought';

  @override
  String get startWeight => 'Weight when bought';

  @override
  String get currentWeight => 'Current weight';

  @override
  String get approvalsTitle => 'Approvals';

  @override
  String get nothingToApprove => 'Nothing is waiting for you.';

  @override
  String get nothingToApproveHint =>
      'New fund requests, expenses, sales and death reports appear here.';

  @override
  String get deathReportsTitle => 'Death reports';

  @override
  String get salesTitle => 'Sales';

  @override
  String get confirmDeath => 'Confirm death';

  @override
  String reportedOn(Object date) {
    return 'Reported $date';
  }

  @override
  String get rejectTitle => 'Why isn\'t it accepted?';

  @override
  String get confirmSaleTitle => 'Confirm this sale?';

  @override
  String confirmSaleBody(Object amount) {
    return 'You confirm the animals were sold for $amount. The farmer will then send the money to Krishi.';
  }

  @override
  String get confirmDeathTitle => 'Confirm this death?';

  @override
  String get confirmDeathBody =>
      'The animal is marked dead and the investor is told. This can\'t be undone.';

  @override
  String get totalLossFormTitle => 'Close as a total loss';

  @override
  String get totalLossIntro =>
      'Every animal in this batch died, so there is nothing to sell. Krishi settles it: the investor gets back the money that wasn\'t spent and nobody gets a profit share.';

  @override
  String get whatHappened => 'What happened';

  @override
  String get blocker_death_pending => 'Review the reported deaths first.';

  @override
  String get blocker_fund_requests => 'Answer the pending fund requests first.';

  @override
  String get walletTitle => 'Wallet';

  @override
  String get available => 'Available';

  @override
  String get pendingWithdrawal => 'Being paid out';

  @override
  String get earned => 'Earned';

  @override
  String get withdrawn => 'Withdrawn';

  @override
  String get withdraw => 'Withdraw';

  @override
  String get withdrawTitle => 'Withdraw money';

  @override
  String minimumWithdrawal(Object amount) {
    return 'Minimum $amount';
  }

  @override
  String withdrawTo(Object destination) {
    return 'Paid to $destination';
  }

  @override
  String get withdrawRequested =>
      'Withdrawal requested. Krishi will pay it out soon.';

  @override
  String get payoutAccount => 'Payout account';

  @override
  String get addPayout => 'Add payout account';

  @override
  String get editPayout => 'Change';

  @override
  String get noPayout =>
      'Add where Krishi should send your money before withdrawing.';

  @override
  String get transactions => 'Transactions';

  @override
  String get withdrawals => 'Withdrawals';

  @override
  String get noTransactions => 'No transactions yet.';

  @override
  String get noWithdrawals => 'No withdrawals yet.';

  @override
  String get cancelWithdrawal => 'Cancel request';

  @override
  String get cancelWithdrawalConfirm =>
      'Cancel this withdrawal? The money goes back to your balance.';

  @override
  String get payoutMobile => 'Mobile wallet';

  @override
  String get payoutBank => 'Bank account';

  @override
  String get provider => 'Provider';

  @override
  String get mobileNumber => 'Mobile number';

  @override
  String get accountHolder => 'Account holder name';

  @override
  String get bankName => 'Bank name';

  @override
  String get accountNumber => 'Account number';

  @override
  String get branch => 'Branch';

  @override
  String get routingNumber => 'Routing number';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get markAllRead => 'Mark all read';

  @override
  String get noNotifications => 'No notifications yet.';

  @override
  String get moreTitle => 'More';

  @override
  String get language => 'Language';

  @override
  String get bangla => 'বাংলা';

  @override
  String get english => 'English';

  @override
  String get kycStatus => 'KYC';

  @override
  String get manageOnWebsite => 'Manage on the website';

  @override
  String get livestockTitle => 'Livestock';

  @override
  String get filterActive => 'Active';

  @override
  String get filterSold => 'Sold';

  @override
  String get filterDead => 'Died';

  @override
  String get filterAll => 'All';

  @override
  String get noAnimalsYet => 'No animals yet.';

  @override
  String get website => 'Krishi website';

  @override
  String get signOut => 'Sign out';

  @override
  String get signOutConfirm => 'Sign out of Krishi on this phone?';

  @override
  String get role_investor => 'Investor';

  @override
  String get role_steward => 'Steward';

  @override
  String get role_farmer => 'Farmer';

  @override
  String get email => 'Email';

  @override
  String get fullName => 'Full name';

  @override
  String get passwordHint =>
      'At least 8 characters, with a letter and a number';

  @override
  String get passwordRule =>
      'Use at least 8 characters with a letter and a number';

  @override
  String get confirmPassword => 'Confirm password';

  @override
  String get passwordsDontMatch => 'The passwords don\'t match';

  @override
  String get haveAccount => 'Already have an account? Sign in';

  @override
  String get noAccountYet => 'New to Krishi?';

  @override
  String get signUpInvestor => 'Create an investor account';

  @override
  String get becomeSteward => 'Become a steward';

  @override
  String get farmerActivateLink => 'I\'m a farmer with an activation code';

  @override
  String get browsePlans => 'Browse plans';

  @override
  String get registerTitle => 'Create your account';

  @override
  String get registerSubtitle =>
      'Invest in real livestock raised by trusted farmers.';

  @override
  String get createAccount => 'Create account';

  @override
  String get verifyTitle => 'Verify your phone';

  @override
  String verifyBody(Object phone) {
    return 'Enter the 6-digit code sent to $phone.';
  }

  @override
  String get codeLabel => '6-digit code';

  @override
  String get verify => 'Verify';

  @override
  String devCode(Object code) {
    return 'Test code: $code';
  }

  @override
  String get useAnotherNumber => 'Use a different number';

  @override
  String get forgotTitle => 'Reset your password';

  @override
  String get forgotBody => 'Enter your phone number. We\'ll send a code.';

  @override
  String get sendCode => 'Send code';

  @override
  String resetBody(Object phone) {
    return 'Enter the code sent to $phone and choose a new password.';
  }

  @override
  String get newPassword => 'New password';

  @override
  String get resetPassword => 'Reset password';

  @override
  String get passwordResetDone =>
      'Password changed. Sign in with your new password.';

  @override
  String get activateTitle => 'Activate your farmer account';

  @override
  String get activateBody =>
      'Enter the code your steward gave you and choose a password.';

  @override
  String get activate => 'Activate';

  @override
  String get stewardSignupTitle => 'Become a Krishi steward';

  @override
  String get stewardSignupBody =>
      'Manage livestock plans and the farmers who raise them. Krishi reviews every application.';

  @override
  String get continueLabel => 'Continue';

  @override
  String get stewardDetailsTitle => 'About your work';

  @override
  String get stewardType => 'You are';

  @override
  String get individual => 'An individual';

  @override
  String get organization => 'An organization';

  @override
  String get division => 'Division';

  @override
  String get district => 'District';

  @override
  String get upazila => 'Upazila / area';

  @override
  String get livestockYouRaise => 'Livestock you work with';

  @override
  String get experience => 'Your experience';

  @override
  String get experienceHint =>
      'Years with livestock, training, farmers you work with (at least 10 characters)';

  @override
  String get submitForReview => 'Submit for review';

  @override
  String get stewardPendingTitle => 'Waiting for Krishi\'s approval';

  @override
  String get stewardPendingBody =>
      'Thanks for applying. Krishi is reviewing your details and will notify you. This usually takes a few working days.';

  @override
  String get stewardRejectedTitle => 'Your application wasn\'t approved';

  @override
  String get checkAgain => 'Check again';

  @override
  String get cat_cattle => 'Cattle';

  @override
  String get cat_goats => 'Goats';

  @override
  String get cat_sheep => 'Sheep';

  @override
  String get cat_dumba => 'Dumba';

  @override
  String get cat_garoleSheep => 'Garole sheep';

  @override
  String get cat_other => 'Other';

  @override
  String get navPlans => 'Plans';

  @override
  String get plansTitle => 'Investment plans';

  @override
  String get searchPlans => 'Search plans';

  @override
  String get allCategories => 'All';

  @override
  String get planStatus_open => 'Open';

  @override
  String get planStatus_coming_soon => 'Coming soon';

  @override
  String get planStatus_fully_funded => 'Fully funded';

  @override
  String get planStatus_all => 'All';

  @override
  String unitsLeft(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '# units left',
      one: '# unit left',
      zero: 'No units left',
    );
    return '$_temp0';
  }

  @override
  String get unitPrice => 'Unit price';

  @override
  String get noPlans => 'No plans match.';

  @override
  String get noPlansHint => 'Try another category or status.';

  @override
  String get planAbout => 'About this plan';

  @override
  String get whereMoneyGoes => 'Where each unit\'s money goes';

  @override
  String get allocAnimals => 'Buying animals';

  @override
  String get allocCare => 'Feed, care and vet';

  @override
  String get risks => 'Risks';

  @override
  String get reviewsTitle => 'Investor reviews';

  @override
  String get noReviews => 'No reviews yet.';

  @override
  String ratingCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '# reviews',
      one: '# review',
    );
    return '$_temp0';
  }

  @override
  String get investInPlan => 'Invest in this plan';

  @override
  String get signInToInvest => 'Sign in to invest';

  @override
  String get interestTitle => 'How many units?';

  @override
  String get unitsLabel => 'Units';

  @override
  String get totalAmount => 'Total';

  @override
  String get sendInterest => 'Send interest';

  @override
  String get interestSent =>
      'Interest sent. The steward will review it and you\'ll get a notification.';

  @override
  String haveInterest(Object reference, Object status) {
    return 'You have an interest on this plan: $reference ($status).';
  }

  @override
  String fundedOf(int funded, int offered) {
    return '$funded of $offered units funded';
  }

  @override
  String get soldOut => 'All units are taken';

  @override
  String get myInterests => 'My interests';

  @override
  String get noInterests => 'No interests yet';

  @override
  String get noInterestsHint => 'Browse plans and send an interest to start.';

  @override
  String get continuePayment => 'Continue';

  @override
  String get openBatch => 'Open batch';

  @override
  String interestNotApproved(Object reason) {
    return 'Not approved: $reason';
  }

  @override
  String get onboardingTitle => 'Start your investment';

  @override
  String get stepKyc => 'Identity';

  @override
  String get stepPayout => 'Payout';

  @override
  String get stepPayment => 'Payment';

  @override
  String get stepReview => 'Check';

  @override
  String get kycNeeded => 'Verify your identity with your NID before paying.';

  @override
  String get kycPendingNote =>
      'Your documents are being checked. You\'ll get a notification when you can continue.';

  @override
  String kycRejectedNote(Object reason) {
    return 'Krishi asked for a change: $reason';
  }

  @override
  String get verifyNow => 'Verify now';

  @override
  String get payoutNeeded => 'Add where Krishi should send your returns.';

  @override
  String get amountToPay => 'Amount to pay';

  @override
  String get payOnline => 'Pay online';

  @override
  String get payOnlineHint =>
      'Card, bKash, Nagad or Rocket through SSLCommerz. Come back to the app when you\'re done.';

  @override
  String get orTransfer =>
      'Or send a bank or mobile transfer to Krishi, then report it.';

  @override
  String get reportTransfer => 'I\'ve sent the money';

  @override
  String depositReview(Object reference) {
    return 'Krishi is checking your payment $reference. You\'ll get a notification.';
  }

  @override
  String depositNotAccepted(Object reason) {
    return 'Your last payment wasn\'t accepted: $reason';
  }

  @override
  String get onboardingDone => 'Your batch has started.';

  @override
  String get interestClosed => 'This interest is no longer open for payment.';

  @override
  String notEnoughUnits(int count) {
    return 'Only $count units are left on this plan.';
  }

  @override
  String get refresh => 'Refresh';

  @override
  String get transferTitle => 'Report your transfer';

  @override
  String get dateSent => 'Date sent';

  @override
  String get senderNumber => 'Sent from (mobile number)';

  @override
  String get transferProof => 'Screenshot or photo of the transfer';

  @override
  String get kycTitle => 'Verify your identity';

  @override
  String get kycIntro =>
      'Krishi needs your National ID to keep investments safe. Photos must be clear and readable.';

  @override
  String get nidNumber => 'NID number';

  @override
  String get nidHint => '10 to 17 digits';

  @override
  String get presentAddress => 'Present address';

  @override
  String get permanentAddress => 'Permanent address';

  @override
  String get sameAsPresent => 'Same as present address';

  @override
  String get nidFront => 'NID front';

  @override
  String get nidBack => 'NID back';

  @override
  String get yourPhoto => 'Your photo';

  @override
  String get submit => 'Submit';

  @override
  String get kycSubmitted => 'Submitted. Krishi will review your documents.';

  @override
  String get interestsToReview => 'Interests';

  @override
  String get guest => 'Guest';

  @override
  String get approveInterestTitle => 'Approve this interest?';

  @override
  String approveInterestBody(Object name, int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '# units',
      one: '# unit',
    );
    return '$name can then pay for $_temp0.';
  }

  @override
  String get farmersTitle => 'Farmers';

  @override
  String get addFarmer => 'Add farmer';

  @override
  String get farmerAddress => 'Address';

  @override
  String get farmerAdded =>
      'Farmer added. Krishi sent them an activation code.';

  @override
  String activationCode(Object code) {
    return 'Activation code: $code';
  }

  @override
  String get resendCode => 'Resend code';

  @override
  String get codeSent => 'A new code was sent.';

  @override
  String get pendingActivation => 'Not activated yet';

  @override
  String activeBatchesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '# active batches',
      one: '# active batch',
      zero: 'No active batches',
    );
    return '$_temp0';
  }

  @override
  String get noFarmers => 'No farmers yet';

  @override
  String get noFarmersHint => 'Add the farmers who will raise your batches.';

  @override
  String get assignFarmer => 'Assign a farmer';

  @override
  String get chooseFarmer => 'Choose a farmer';

  @override
  String get farmerAssigned => 'Farmer assigned.';

  @override
  String get noActiveFarmers =>
      'No activated farmers yet. Add a farmer and ask them to activate their account.';

  @override
  String get myPlansTitle => 'My plans';

  @override
  String get noStewardPlans => 'No plans yet';

  @override
  String get noStewardPlansHint =>
      'Krishi adds you to plans; they appear here.';

  @override
  String openInterestsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '# interests to review',
      one: '# interest to review',
      zero: 'No interests to review',
    );
    return '$_temp0';
  }

  @override
  String get offeringStatus_approved => 'Live';

  @override
  String get offeringStatus_pending_approval => 'Pending approval';

  @override
  String get offeringStatus_paused => 'Paused';

  @override
  String get offeringStatus_closed => 'Closed';

  @override
  String get offeringStatus_rejected => 'Not approved';

  @override
  String get profileTitle => 'Profile';

  @override
  String get changePassword => 'Change password';

  @override
  String get currentPassword => 'Current password';

  @override
  String get passwordChanged => 'Password changed.';

  @override
  String get downloadStatement => 'Download statement (PDF)';

  @override
  String get rateSteward => 'Rate your steward';

  @override
  String get yourReview => 'Your review';

  @override
  String get reviewComment => 'Comment';

  @override
  String get submitReview => 'Submit review';

  @override
  String get reviewThanks => 'Thanks for your review.';
}
