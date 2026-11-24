import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_bn.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('bn'),
    Locale('en'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'Krishi'**
  String get appName;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get retry;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @send.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get send;

  /// No description provided for @close.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// No description provided for @view.
  ///
  /// In en, this message translates to:
  /// **'View'**
  String get view;

  /// No description provided for @seeAll.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get seeAll;

  /// No description provided for @approve.
  ///
  /// In en, this message translates to:
  /// **'Approve'**
  String get approve;

  /// No description provided for @reject.
  ///
  /// In en, this message translates to:
  /// **'Reject'**
  String get reject;

  /// No description provided for @notAccepted.
  ///
  /// In en, this message translates to:
  /// **'Not accepted'**
  String get notAccepted;

  /// No description provided for @optional.
  ///
  /// In en, this message translates to:
  /// **'{label} (optional)'**
  String optional(Object label);

  /// No description provided for @required.
  ///
  /// In en, this message translates to:
  /// **'Required'**
  String get required;

  /// No description provided for @errorNetwork.
  ///
  /// In en, this message translates to:
  /// **'Can\'t reach Krishi. Check your internet connection.'**
  String get errorNetwork;

  /// No description provided for @errorGeneric.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get errorGeneric;

  /// No description provided for @reasonLabel.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get reasonLabel;

  /// No description provided for @reasonHint.
  ///
  /// In en, this message translates to:
  /// **'Explain why (at least 5 characters)'**
  String get reasonHint;

  /// No description provided for @saved.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get saved;

  /// No description provided for @signInTitle.
  ///
  /// In en, this message translates to:
  /// **'Welcome to Krishi'**
  String get signInTitle;

  /// No description provided for @signInSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in to follow your livestock, money and work.'**
  String get signInSubtitle;

  /// No description provided for @phoneLabel.
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get phoneLabel;

  /// No description provided for @phoneHint.
  ///
  /// In en, this message translates to:
  /// **'01XXXXXXXXX'**
  String get phoneHint;

  /// No description provided for @passwordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get passwordLabel;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signIn;

  /// No description provided for @sessionExpired.
  ///
  /// In en, this message translates to:
  /// **'Your session ended. Please sign in again.'**
  String get sessionExpired;

  /// No description provided for @newHere.
  ///
  /// In en, this message translates to:
  /// **'New to Krishi? Create an account on the website.'**
  String get newHere;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgotPassword;

  /// No description provided for @invalidPhone.
  ///
  /// In en, this message translates to:
  /// **'Enter an 11-digit mobile number'**
  String get invalidPhone;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navBatches.
  ///
  /// In en, this message translates to:
  /// **'Batches'**
  String get navBatches;

  /// No description provided for @navApprovals.
  ///
  /// In en, this message translates to:
  /// **'Approvals'**
  String get navApprovals;

  /// No description provided for @navLivestock.
  ///
  /// In en, this message translates to:
  /// **'Livestock'**
  String get navLivestock;

  /// No description provided for @navWallet.
  ///
  /// In en, this message translates to:
  /// **'Wallet'**
  String get navWallet;

  /// No description provided for @navMore.
  ///
  /// In en, this message translates to:
  /// **'More'**
  String get navMore;

  /// No description provided for @hello.
  ///
  /// In en, this message translates to:
  /// **'Hello, {name}'**
  String hello(Object name);

  /// No description provided for @helloNoName.
  ///
  /// In en, this message translates to:
  /// **'Hello'**
  String get helloNoName;

  /// No description provided for @homeSubtitleInvestor.
  ///
  /// In en, this message translates to:
  /// **'Your batches and money at a glance.'**
  String get homeSubtitleInvestor;

  /// No description provided for @homeSubtitleFarmer.
  ///
  /// In en, this message translates to:
  /// **'Your batches and what to do next.'**
  String get homeSubtitleFarmer;

  /// No description provided for @homeSubtitleSteward.
  ///
  /// In en, this message translates to:
  /// **'Your batches and what needs a decision.'**
  String get homeSubtitleSteward;

  /// No description provided for @statInvested.
  ///
  /// In en, this message translates to:
  /// **'Invested now'**
  String get statInvested;

  /// No description provided for @statActiveBatches.
  ///
  /// In en, this message translates to:
  /// **'Active batches'**
  String get statActiveBatches;

  /// No description provided for @unitsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one{# unit} other{# units}}'**
  String unitsCount(int count);

  /// No description provided for @statWallet.
  ///
  /// In en, this message translates to:
  /// **'Wallet'**
  String get statWallet;

  /// No description provided for @statReturns.
  ///
  /// In en, this message translates to:
  /// **'Returns so far'**
  String get statReturns;

  /// No description provided for @statReturnsHint.
  ///
  /// In en, this message translates to:
  /// **'On settled batches'**
  String get statReturnsHint;

  /// No description provided for @statPendingFunds.
  ///
  /// In en, this message translates to:
  /// **'Fund requests waiting'**
  String get statPendingFunds;

  /// No description provided for @statPendingExpenses.
  ///
  /// In en, this message translates to:
  /// **'Expenses waiting'**
  String get statPendingExpenses;

  /// No description provided for @statApprovals.
  ///
  /// In en, this message translates to:
  /// **'Waiting for you'**
  String get statApprovals;

  /// No description provided for @kycStartTitle.
  ///
  /// In en, this message translates to:
  /// **'Verify your identity'**
  String get kycStartTitle;

  /// No description provided for @kycStartBody.
  ///
  /// In en, this message translates to:
  /// **'Submit your NID once on the website so you can invest and withdraw.'**
  String get kycStartBody;

  /// No description provided for @kycFixTitle.
  ///
  /// In en, this message translates to:
  /// **'Your KYC needs an update'**
  String get kycFixTitle;

  /// No description provided for @kycFixBody.
  ///
  /// In en, this message translates to:
  /// **'Krishi asked for a change. Update your documents on the website.'**
  String get kycFixBody;

  /// No description provided for @kycWaitingTitle.
  ///
  /// In en, this message translates to:
  /// **'KYC under review'**
  String get kycWaitingTitle;

  /// No description provided for @kycWaitingBody.
  ///
  /// In en, this message translates to:
  /// **'Krishi is checking your documents. You\'ll get a notification.'**
  String get kycWaitingBody;

  /// No description provided for @payTitle.
  ///
  /// In en, this message translates to:
  /// **'Ready to invest: {plan}'**
  String payTitle(Object plan);

  /// No description provided for @payBody.
  ///
  /// In en, this message translates to:
  /// **'{reference} was approved. Make the payment on the website to start your batch.'**
  String payBody(Object reference);

  /// No description provided for @openWebsite.
  ///
  /// In en, this message translates to:
  /// **'Open website'**
  String get openWebsite;

  /// No description provided for @interestsWaiting.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one{# interest is waiting for a steward} other{# interests are waiting for a steward}}'**
  String interestsWaiting(int count);

  /// No description provided for @purchaseNeededTitle.
  ///
  /// In en, this message translates to:
  /// **'Confirm the purchase for {reference}'**
  String purchaseNeededTitle(Object reference);

  /// No description provided for @purchaseNeededBody.
  ///
  /// In en, this message translates to:
  /// **'Record what you paid for the animals once you\'ve bought them.'**
  String get purchaseNeededBody;

  /// No description provided for @moneyToSendTitle.
  ///
  /// In en, this message translates to:
  /// **'Send {amount} to Krishi'**
  String moneyToSendTitle(Object amount);

  /// No description provided for @moneyToSendBody.
  ///
  /// In en, this message translates to:
  /// **'{reference}: your steward confirmed it. Send the money and submit the details.'**
  String moneyToSendBody(Object reference);

  /// No description provided for @approvalsWaitingTitle.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one{# item needs your decision} other{# items need your decision}}'**
  String approvalsWaitingTitle(int count);

  /// No description provided for @approvalsWaitingBody.
  ///
  /// In en, this message translates to:
  /// **'Fund requests, expenses, sales and death reports from your farmers.'**
  String get approvalsWaitingBody;

  /// No description provided for @awaitingFarmerTitle.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one{# batch needs a farmer} other{# batches need a farmer}}'**
  String awaitingFarmerTitle(int count);

  /// No description provided for @awaitingFarmerBody.
  ///
  /// In en, this message translates to:
  /// **'Assign a farmer on the website.'**
  String get awaitingFarmerBody;

  /// No description provided for @latestActivity.
  ///
  /// In en, this message translates to:
  /// **'Latest activity'**
  String get latestActivity;

  /// No description provided for @noActivity.
  ///
  /// In en, this message translates to:
  /// **'Nothing has happened yet.'**
  String get noActivity;

  /// No description provided for @batchesTitle.
  ///
  /// In en, this message translates to:
  /// **'Batches'**
  String get batchesTitle;

  /// No description provided for @activeBatches.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get activeBatches;

  /// No description provided for @settledBatches.
  ///
  /// In en, this message translates to:
  /// **'Settled'**
  String get settledBatches;

  /// No description provided for @noBatches.
  ///
  /// In en, this message translates to:
  /// **'No batches yet'**
  String get noBatches;

  /// No description provided for @noBatchesInvestor.
  ///
  /// In en, this message translates to:
  /// **'Browse plans on the website and send an interest to start investing.'**
  String get noBatchesInvestor;

  /// No description provided for @noBatchesFarmer.
  ///
  /// In en, this message translates to:
  /// **'Batches appear here when a steward assigns you.'**
  String get noBatchesFarmer;

  /// No description provided for @noBatchesSteward.
  ///
  /// In en, this message translates to:
  /// **'Batches appear here when investors fund your plans.'**
  String get noBatchesSteward;

  /// No description provided for @invested.
  ///
  /// In en, this message translates to:
  /// **'Invested'**
  String get invested;

  /// No description provided for @steward.
  ///
  /// In en, this message translates to:
  /// **'Steward'**
  String get steward;

  /// No description provided for @farmer.
  ///
  /// In en, this message translates to:
  /// **'Farmer'**
  String get farmer;

  /// No description provided for @investor.
  ///
  /// In en, this message translates to:
  /// **'Investor'**
  String get investor;

  /// No description provided for @notAssigned.
  ///
  /// In en, this message translates to:
  /// **'Not assigned yet'**
  String get notAssigned;

  /// No description provided for @startedOn.
  ///
  /// In en, this message translates to:
  /// **'Started {date}'**
  String startedOn(Object date);

  /// No description provided for @overview.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get overview;

  /// No description provided for @spentOnBatch.
  ///
  /// In en, this message translates to:
  /// **'Spent on animals & care'**
  String get spentOnBatch;

  /// No description provided for @paidOut.
  ///
  /// In en, this message translates to:
  /// **'Paid out of capital'**
  String get paidOut;

  /// No description provided for @leftoverFunds.
  ///
  /// In en, this message translates to:
  /// **'Unspent fund money'**
  String get leftoverFunds;

  /// No description provided for @animalPurchase.
  ///
  /// In en, this message translates to:
  /// **'Animal purchase'**
  String get animalPurchase;

  /// No description provided for @expensesApproved.
  ///
  /// In en, this message translates to:
  /// **'Expenses approved'**
  String get expensesApproved;

  /// No description provided for @duration.
  ///
  /// In en, this message translates to:
  /// **'Duration'**
  String get duration;

  /// No description provided for @monthsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one{# month} other{# months}}'**
  String monthsCount(int count);

  /// No description provided for @estReturn.
  ///
  /// In en, this message translates to:
  /// **'Est. return'**
  String get estReturn;

  /// No description provided for @call.
  ///
  /// In en, this message translates to:
  /// **'Call'**
  String get call;

  /// No description provided for @actions.
  ///
  /// In en, this message translates to:
  /// **'What you can do'**
  String get actions;

  /// No description provided for @animalsTitle.
  ///
  /// In en, this message translates to:
  /// **'Animals'**
  String get animalsTitle;

  /// No description provided for @animalsSummary.
  ///
  /// In en, this message translates to:
  /// **'{active} active · {sold} sold · {dead} died'**
  String animalsSummary(int active, int sold, int dead);

  /// No description provided for @noAnimals.
  ///
  /// In en, this message translates to:
  /// **'Animals appear once the purchase is confirmed.'**
  String get noAnimals;

  /// No description provided for @fundRequestsTitle.
  ///
  /// In en, this message translates to:
  /// **'Fund requests'**
  String get fundRequestsTitle;

  /// No description provided for @noFundRequests.
  ///
  /// In en, this message translates to:
  /// **'No fund requests yet.'**
  String get noFundRequests;

  /// No description provided for @expensesTitle.
  ///
  /// In en, this message translates to:
  /// **'Expenses'**
  String get expensesTitle;

  /// No description provided for @noExpenses.
  ///
  /// In en, this message translates to:
  /// **'No expenses yet.'**
  String get noExpenses;

  /// No description provided for @timelineTitle.
  ///
  /// In en, this message translates to:
  /// **'Updates & activity'**
  String get timelineTitle;

  /// No description provided for @noUpdates.
  ///
  /// In en, this message translates to:
  /// **'No updates yet.'**
  String get noUpdates;

  /// No description provided for @replaced.
  ///
  /// In en, this message translates to:
  /// **'Replaced'**
  String get replaced;

  /// No description provided for @receipt.
  ///
  /// In en, this message translates to:
  /// **'Receipt'**
  String get receipt;

  /// No description provided for @saleTitle.
  ///
  /// In en, this message translates to:
  /// **'Sale'**
  String get saleTitle;

  /// No description provided for @totalLossTitle.
  ///
  /// In en, this message translates to:
  /// **'Total loss'**
  String get totalLossTitle;

  /// No description provided for @soldFor.
  ///
  /// In en, this message translates to:
  /// **'Sold for'**
  String get soldFor;

  /// No description provided for @animalsSold.
  ///
  /// In en, this message translates to:
  /// **'Animals sold'**
  String get animalsSold;

  /// No description provided for @saleDate.
  ///
  /// In en, this message translates to:
  /// **'Sale date'**
  String get saleDate;

  /// No description provided for @closedOn.
  ///
  /// In en, this message translates to:
  /// **'Closed on'**
  String get closedOn;

  /// No description provided for @buyer.
  ///
  /// In en, this message translates to:
  /// **'Buyer'**
  String get buyer;

  /// No description provided for @toSendLabel.
  ///
  /// In en, this message translates to:
  /// **'Money to send'**
  String get toSendLabel;

  /// No description provided for @fundsReturned.
  ///
  /// In en, this message translates to:
  /// **'Unspent fund money to return'**
  String get fundsReturned;

  /// No description provided for @salePendingReview.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the steward to confirm the sale.'**
  String get salePendingReview;

  /// No description provided for @salePendingReviewSteward.
  ///
  /// In en, this message translates to:
  /// **'Check the price with the farmer, then confirm the sale or send it back.'**
  String get salePendingReviewSteward;

  /// No description provided for @saleRejected.
  ///
  /// In en, this message translates to:
  /// **'The steward sent this sale back: {reason}'**
  String saleRejected(Object reason);

  /// No description provided for @awaitingRemittanceFarmer.
  ///
  /// In en, this message translates to:
  /// **'Your steward confirmed the sale. Send {amount} to Krishi and submit the transfer details.'**
  String awaitingRemittanceFarmer(Object amount);

  /// No description provided for @awaitingRemittance.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the farmer to send {amount} to Krishi.'**
  String awaitingRemittance(Object amount);

  /// No description provided for @remitRejected.
  ///
  /// In en, this message translates to:
  /// **'Krishi could not confirm the payment: {reason}'**
  String remitRejected(Object reason);

  /// No description provided for @remittanceSubmitted.
  ///
  /// In en, this message translates to:
  /// **'The money was sent. Krishi is checking the payment before settling.'**
  String get remittanceSubmitted;

  /// No description provided for @settledNotice.
  ///
  /// In en, this message translates to:
  /// **'Settled. Each share was added to the person\'s wallet.'**
  String get settledNotice;

  /// No description provided for @totalLossPending.
  ///
  /// In en, this message translates to:
  /// **'Every animal died. Krishi is checking before settling.'**
  String get totalLossPending;

  /// No description provided for @totalLossReturnFarmer.
  ///
  /// In en, this message translates to:
  /// **'Every animal died. Send the {amount} of fund money you didn\'t spend to Krishi.'**
  String totalLossReturnFarmer(Object amount);

  /// No description provided for @totalLossRejected.
  ///
  /// In en, this message translates to:
  /// **'Krishi sent the total-loss closing back: {reason}'**
  String totalLossRejected(Object reason);

  /// No description provided for @totalLossSettled.
  ///
  /// In en, this message translates to:
  /// **'Closed as a total loss. The investor got back the unspent capital.'**
  String get totalLossSettled;

  /// No description provided for @settlementTitle.
  ///
  /// In en, this message translates to:
  /// **'Settlement'**
  String get settlementTitle;

  /// No description provided for @resultProfit.
  ///
  /// In en, this message translates to:
  /// **'Profit {amount}'**
  String resultProfit(Object amount);

  /// No description provided for @resultLoss.
  ///
  /// In en, this message translates to:
  /// **'Loss {amount}'**
  String resultLoss(Object amount);

  /// No description provided for @resultEven.
  ///
  /// In en, this message translates to:
  /// **'Break-even'**
  String get resultEven;

  /// No description provided for @capital.
  ///
  /// In en, this message translates to:
  /// **'Invested capital'**
  String get capital;

  /// No description provided for @totalReturn.
  ///
  /// In en, this message translates to:
  /// **'Total returned'**
  String get totalReturn;

  /// No description provided for @investorPayout.
  ///
  /// In en, this message translates to:
  /// **'Investor gets'**
  String get investorPayout;

  /// No description provided for @farmerShare.
  ///
  /// In en, this message translates to:
  /// **'Farmer (60%)'**
  String get farmerShare;

  /// No description provided for @stewardShare.
  ///
  /// In en, this message translates to:
  /// **'Steward (5%)'**
  String get stewardShare;

  /// No description provided for @platformShare.
  ///
  /// In en, this message translates to:
  /// **'Krishi (5%)'**
  String get platformShare;

  /// No description provided for @actConfirmPurchase.
  ///
  /// In en, this message translates to:
  /// **'Confirm purchase'**
  String get actConfirmPurchase;

  /// No description provided for @actFundRequest.
  ///
  /// In en, this message translates to:
  /// **'Request funds'**
  String get actFundRequest;

  /// No description provided for @actLogExpense.
  ///
  /// In en, this message translates to:
  /// **'Log expense'**
  String get actLogExpense;

  /// No description provided for @actRecordSale.
  ///
  /// In en, this message translates to:
  /// **'Record sale'**
  String get actRecordSale;

  /// No description provided for @actSendMoney.
  ///
  /// In en, this message translates to:
  /// **'Send {amount} to Krishi'**
  String actSendMoney(Object amount);

  /// No description provided for @actPostUpdate.
  ///
  /// In en, this message translates to:
  /// **'Post update'**
  String get actPostUpdate;

  /// No description provided for @actConfirmSale.
  ///
  /// In en, this message translates to:
  /// **'Confirm sale'**
  String get actConfirmSale;

  /// No description provided for @actCloseTotalLoss.
  ///
  /// In en, this message translates to:
  /// **'Close as total loss'**
  String get actCloseTotalLoss;

  /// No description provided for @waitPendingExpenses.
  ///
  /// In en, this message translates to:
  /// **'Your steward must review your pending expenses before you can record the sale.'**
  String get waitPendingExpenses;

  /// No description provided for @waitPendingFunds.
  ///
  /// In en, this message translates to:
  /// **'Your steward must answer your pending fund requests before you can record the sale.'**
  String get waitPendingFunds;

  /// No description provided for @waitDeathReview.
  ///
  /// In en, this message translates to:
  /// **'Your steward must review the reported death before you can record the sale.'**
  String get waitDeathReview;

  /// No description provided for @allAnimalsDied.
  ///
  /// In en, this message translates to:
  /// **'All animals in this batch died. Your steward will close it.'**
  String get allAnimalsDied;

  /// No description provided for @assignFarmerOnWeb.
  ///
  /// In en, this message translates to:
  /// **'Assign a farmer to this batch on the website.'**
  String get assignFarmerOnWeb;

  /// No description provided for @purchaseTitle.
  ///
  /// In en, this message translates to:
  /// **'Confirm the purchase'**
  String get purchaseTitle;

  /// No description provided for @animalsBought.
  ///
  /// In en, this message translates to:
  /// **'Number of animals'**
  String get animalsBought;

  /// No description provided for @totalCost.
  ///
  /// In en, this message translates to:
  /// **'Total cost (BDT)'**
  String get totalCost;

  /// No description provided for @breed.
  ///
  /// In en, this message translates to:
  /// **'Breed'**
  String get breed;

  /// No description provided for @avgWeight.
  ///
  /// In en, this message translates to:
  /// **'Average weight (kg)'**
  String get avgWeight;

  /// No description provided for @note.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get note;

  /// No description provided for @photo.
  ///
  /// In en, this message translates to:
  /// **'Photo'**
  String get photo;

  /// No description provided for @addPhoto.
  ///
  /// In en, this message translates to:
  /// **'Add photo'**
  String get addPhoto;

  /// No description provided for @takePhoto.
  ///
  /// In en, this message translates to:
  /// **'Take photo'**
  String get takePhoto;

  /// No description provided for @choosePhoto.
  ///
  /// In en, this message translates to:
  /// **'Choose from gallery'**
  String get choosePhoto;

  /// No description provided for @removePhoto.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get removePhoto;

  /// No description provided for @fundRequestTitle.
  ///
  /// In en, this message translates to:
  /// **'Request funds'**
  String get fundRequestTitle;

  /// No description provided for @purpose.
  ///
  /// In en, this message translates to:
  /// **'Purpose'**
  String get purpose;

  /// No description provided for @amountBdt.
  ///
  /// In en, this message translates to:
  /// **'Amount (BDT)'**
  String get amountBdt;

  /// No description provided for @budgetLeftHint.
  ///
  /// In en, this message translates to:
  /// **'Requests can\'t exceed this batch\'s budget.'**
  String get budgetLeftHint;

  /// No description provided for @expenseTitle.
  ///
  /// In en, this message translates to:
  /// **'Log an expense'**
  String get expenseTitle;

  /// No description provided for @category.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get category;

  /// No description provided for @description.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get description;

  /// No description provided for @receiptPhoto.
  ///
  /// In en, this message translates to:
  /// **'Receipt photo'**
  String get receiptPhoto;

  /// No description provided for @saleFormTitle.
  ///
  /// In en, this message translates to:
  /// **'Record the sale'**
  String get saleFormTitle;

  /// No description provided for @whichAnimals.
  ///
  /// In en, this message translates to:
  /// **'Animals sold ({count})'**
  String whichAnimals(int count);

  /// No description provided for @salePrice.
  ///
  /// In en, this message translates to:
  /// **'Sale price (BDT)'**
  String get salePrice;

  /// No description provided for @buyerName.
  ///
  /// In en, this message translates to:
  /// **'Buyer name'**
  String get buyerName;

  /// No description provided for @buyerPhone.
  ///
  /// In en, this message translates to:
  /// **'Buyer phone'**
  String get buyerPhone;

  /// No description provided for @saleNoteHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. Sold at the local haat, about 320 kg each'**
  String get saleNoteHint;

  /// No description provided for @deadNotSellable.
  ///
  /// In en, this message translates to:
  /// **'Dead animals and animals with a death report can\'t be sold.'**
  String get deadNotSellable;

  /// No description provided for @remitTitle.
  ///
  /// In en, this message translates to:
  /// **'Send money to Krishi'**
  String get remitTitle;

  /// No description provided for @remitAmount.
  ///
  /// In en, this message translates to:
  /// **'Amount to send'**
  String get remitAmount;

  /// No description provided for @method.
  ///
  /// In en, this message translates to:
  /// **'Method'**
  String get method;

  /// No description provided for @methodBank.
  ///
  /// In en, this message translates to:
  /// **'Bank transfer'**
  String get methodBank;

  /// No description provided for @methodMfs.
  ///
  /// In en, this message translates to:
  /// **'Mobile wallet'**
  String get methodMfs;

  /// No description provided for @methodCash.
  ///
  /// In en, this message translates to:
  /// **'Cash'**
  String get methodCash;

  /// No description provided for @sendTo.
  ///
  /// In en, this message translates to:
  /// **'Send to'**
  String get sendTo;

  /// No description provided for @txnId.
  ///
  /// In en, this message translates to:
  /// **'Transaction ID'**
  String get txnId;

  /// No description provided for @sender.
  ///
  /// In en, this message translates to:
  /// **'Sent from (number or account)'**
  String get sender;

  /// No description provided for @proof.
  ///
  /// In en, this message translates to:
  /// **'Screenshot or photo of the transfer'**
  String get proof;

  /// No description provided for @proofRequired.
  ///
  /// In en, this message translates to:
  /// **'Add a screenshot or photo of the transfer'**
  String get proofRequired;

  /// No description provided for @updateTitle.
  ///
  /// In en, this message translates to:
  /// **'Post an update'**
  String get updateTitle;

  /// No description provided for @updateType.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get updateType;

  /// No description provided for @updateHealth.
  ///
  /// In en, this message translates to:
  /// **'Health check'**
  String get updateHealth;

  /// No description provided for @updatePhoto.
  ///
  /// In en, this message translates to:
  /// **'Photo update'**
  String get updatePhoto;

  /// No description provided for @updateNote.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get updateNote;

  /// No description provided for @titleLabel.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get titleLabel;

  /// No description provided for @details.
  ///
  /// In en, this message translates to:
  /// **'Details'**
  String get details;

  /// No description provided for @addRecord.
  ///
  /// In en, this message translates to:
  /// **'Add record'**
  String get addRecord;

  /// No description provided for @recordTitle.
  ///
  /// In en, this message translates to:
  /// **'Add a record for {tag}'**
  String recordTitle(Object tag);

  /// No description provided for @recordType.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get recordType;

  /// No description provided for @date.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get date;

  /// No description provided for @weightKg.
  ///
  /// In en, this message translates to:
  /// **'Weight (kg)'**
  String get weightKg;

  /// No description provided for @recordNoteHint.
  ///
  /// In en, this message translates to:
  /// **'What did you see or do?'**
  String get recordNoteHint;

  /// No description provided for @reportDeath.
  ///
  /// In en, this message translates to:
  /// **'Report death'**
  String get reportDeath;

  /// No description provided for @recordDeath.
  ///
  /// In en, this message translates to:
  /// **'Record death'**
  String get recordDeath;

  /// No description provided for @saveRecord.
  ///
  /// In en, this message translates to:
  /// **'Save record'**
  String get saveRecord;

  /// No description provided for @deathCause.
  ///
  /// In en, this message translates to:
  /// **'Cause of death'**
  String get deathCause;

  /// No description provided for @deathPhoto.
  ///
  /// In en, this message translates to:
  /// **'Photo of the animal'**
  String get deathPhoto;

  /// No description provided for @vetDocument.
  ///
  /// In en, this message translates to:
  /// **'Vet certificate photo'**
  String get vetDocument;

  /// No description provided for @deathGuideTitle.
  ///
  /// In en, this message translates to:
  /// **'If an animal dies'**
  String get deathGuideTitle;

  /// No description provided for @deathGuide1.
  ///
  /// In en, this message translates to:
  /// **'Don\'t move, sell or bury the body before taking photos.'**
  String get deathGuide1;

  /// No description provided for @deathGuide2.
  ///
  /// In en, this message translates to:
  /// **'Take a clear photo of the body that shows the ear tag.'**
  String get deathGuide2;

  /// No description provided for @deathGuide3.
  ///
  /// In en, this message translates to:
  /// **'Call your steward or a vet. If a vet examines it, photograph the certificate.'**
  String get deathGuide3;

  /// No description provided for @deathGuide4.
  ///
  /// In en, this message translates to:
  /// **'Report it here the same day. Your steward checks it and confirms.'**
  String get deathGuide4;

  /// No description provided for @deathGuide5.
  ///
  /// In en, this message translates to:
  /// **'If it may be a disease, keep the other animals away and follow the vet\'s advice.'**
  String get deathGuide5;

  /// No description provided for @reportWarning.
  ///
  /// In en, this message translates to:
  /// **'Your steward reviews the report. Until then the batch can\'t be sold.'**
  String get reportWarning;

  /// No description provided for @stewardDeathWarning.
  ///
  /// In en, this message translates to:
  /// **'This marks the animal as dead straight away and tells the investor and farmer. It can\'t be undone.'**
  String get stewardDeathWarning;

  /// No description provided for @noWeight.
  ///
  /// In en, this message translates to:
  /// **'No weight yet'**
  String get noWeight;

  /// No description provided for @earTag.
  ///
  /// In en, this message translates to:
  /// **'Ear tag {tag}'**
  String earTag(Object tag);

  /// No description provided for @earTagLabel.
  ///
  /// In en, this message translates to:
  /// **'Ear tag'**
  String get earTagLabel;

  /// No description provided for @history.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get history;

  /// No description provided for @noRecords.
  ///
  /// In en, this message translates to:
  /// **'No records yet.'**
  String get noRecords;

  /// No description provided for @waitingSteward.
  ///
  /// In en, this message translates to:
  /// **'Waiting for steward'**
  String get waitingSteward;

  /// No description provided for @notAcceptedReason.
  ///
  /// In en, this message translates to:
  /// **'Not accepted: {reason}'**
  String notAcceptedReason(Object reason);

  /// No description provided for @vetCertificate.
  ///
  /// In en, this message translates to:
  /// **'Vet certificate'**
  String get vetCertificate;

  /// No description provided for @causeLabel.
  ///
  /// In en, this message translates to:
  /// **'Cause'**
  String get causeLabel;

  /// No description provided for @bought.
  ///
  /// In en, this message translates to:
  /// **'Bought'**
  String get bought;

  /// No description provided for @startWeight.
  ///
  /// In en, this message translates to:
  /// **'Weight when bought'**
  String get startWeight;

  /// No description provided for @currentWeight.
  ///
  /// In en, this message translates to:
  /// **'Current weight'**
  String get currentWeight;

  /// No description provided for @approvalsTitle.
  ///
  /// In en, this message translates to:
  /// **'Approvals'**
  String get approvalsTitle;

  /// No description provided for @nothingToApprove.
  ///
  /// In en, this message translates to:
  /// **'Nothing is waiting for you.'**
  String get nothingToApprove;

  /// No description provided for @nothingToApproveHint.
  ///
  /// In en, this message translates to:
  /// **'New fund requests, expenses, sales and death reports appear here.'**
  String get nothingToApproveHint;

  /// No description provided for @deathReportsTitle.
  ///
  /// In en, this message translates to:
  /// **'Death reports'**
  String get deathReportsTitle;

  /// No description provided for @salesTitle.
  ///
  /// In en, this message translates to:
  /// **'Sales'**
  String get salesTitle;

  /// No description provided for @confirmDeath.
  ///
  /// In en, this message translates to:
  /// **'Confirm death'**
  String get confirmDeath;

  /// No description provided for @reportedOn.
  ///
  /// In en, this message translates to:
  /// **'Reported {date}'**
  String reportedOn(Object date);

  /// No description provided for @rejectTitle.
  ///
  /// In en, this message translates to:
  /// **'Why isn\'t it accepted?'**
  String get rejectTitle;

  /// No description provided for @confirmSaleTitle.
  ///
  /// In en, this message translates to:
  /// **'Confirm this sale?'**
  String get confirmSaleTitle;

  /// No description provided for @confirmSaleBody.
  ///
  /// In en, this message translates to:
  /// **'You confirm the animals were sold for {amount}. The farmer will then send the money to Krishi.'**
  String confirmSaleBody(Object amount);

  /// No description provided for @confirmDeathTitle.
  ///
  /// In en, this message translates to:
  /// **'Confirm this death?'**
  String get confirmDeathTitle;

  /// No description provided for @confirmDeathBody.
  ///
  /// In en, this message translates to:
  /// **'The animal is marked dead and the investor is told. This can\'t be undone.'**
  String get confirmDeathBody;

  /// No description provided for @totalLossFormTitle.
  ///
  /// In en, this message translates to:
  /// **'Close as a total loss'**
  String get totalLossFormTitle;

  /// No description provided for @totalLossIntro.
  ///
  /// In en, this message translates to:
  /// **'Every animal in this batch died, so there is nothing to sell. Krishi settles it: the investor gets back the money that wasn\'t spent and nobody gets a profit share.'**
  String get totalLossIntro;

  /// No description provided for @whatHappened.
  ///
  /// In en, this message translates to:
  /// **'What happened'**
  String get whatHappened;

  /// No description provided for @blocker_death_pending.
  ///
  /// In en, this message translates to:
  /// **'Review the reported deaths first.'**
  String get blocker_death_pending;

  /// No description provided for @blocker_fund_requests.
  ///
  /// In en, this message translates to:
  /// **'Answer the pending fund requests first.'**
  String get blocker_fund_requests;

  /// No description provided for @walletTitle.
  ///
  /// In en, this message translates to:
  /// **'Wallet'**
  String get walletTitle;

  /// No description provided for @available.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get available;

  /// No description provided for @pendingWithdrawal.
  ///
  /// In en, this message translates to:
  /// **'Being paid out'**
  String get pendingWithdrawal;

  /// No description provided for @earned.
  ///
  /// In en, this message translates to:
  /// **'Earned'**
  String get earned;

  /// No description provided for @withdrawn.
  ///
  /// In en, this message translates to:
  /// **'Withdrawn'**
  String get withdrawn;

  /// No description provided for @withdraw.
  ///
  /// In en, this message translates to:
  /// **'Withdraw'**
  String get withdraw;

  /// No description provided for @withdrawTitle.
  ///
  /// In en, this message translates to:
  /// **'Withdraw money'**
  String get withdrawTitle;

  /// No description provided for @minimumWithdrawal.
  ///
  /// In en, this message translates to:
  /// **'Minimum {amount}'**
  String minimumWithdrawal(Object amount);

  /// No description provided for @withdrawTo.
  ///
  /// In en, this message translates to:
  /// **'Paid to {destination}'**
  String withdrawTo(Object destination);

  /// No description provided for @withdrawRequested.
  ///
  /// In en, this message translates to:
  /// **'Withdrawal requested. Krishi will pay it out soon.'**
  String get withdrawRequested;

  /// No description provided for @payoutAccount.
  ///
  /// In en, this message translates to:
  /// **'Payout account'**
  String get payoutAccount;

  /// No description provided for @addPayout.
  ///
  /// In en, this message translates to:
  /// **'Add payout account'**
  String get addPayout;

  /// No description provided for @editPayout.
  ///
  /// In en, this message translates to:
  /// **'Change'**
  String get editPayout;

  /// No description provided for @noPayout.
  ///
  /// In en, this message translates to:
  /// **'Add where Krishi should send your money before withdrawing.'**
  String get noPayout;

  /// No description provided for @transactions.
  ///
  /// In en, this message translates to:
  /// **'Transactions'**
  String get transactions;

  /// No description provided for @withdrawals.
  ///
  /// In en, this message translates to:
  /// **'Withdrawals'**
  String get withdrawals;

  /// No description provided for @noTransactions.
  ///
  /// In en, this message translates to:
  /// **'No transactions yet.'**
  String get noTransactions;

  /// No description provided for @noWithdrawals.
  ///
  /// In en, this message translates to:
  /// **'No withdrawals yet.'**
  String get noWithdrawals;

  /// No description provided for @cancelWithdrawal.
  ///
  /// In en, this message translates to:
  /// **'Cancel request'**
  String get cancelWithdrawal;

  /// No description provided for @cancelWithdrawalConfirm.
  ///
  /// In en, this message translates to:
  /// **'Cancel this withdrawal? The money goes back to your balance.'**
  String get cancelWithdrawalConfirm;

  /// No description provided for @payoutMobile.
  ///
  /// In en, this message translates to:
  /// **'Mobile wallet'**
  String get payoutMobile;

  /// No description provided for @payoutBank.
  ///
  /// In en, this message translates to:
  /// **'Bank account'**
  String get payoutBank;

  /// No description provided for @provider.
  ///
  /// In en, this message translates to:
  /// **'Provider'**
  String get provider;

  /// No description provided for @mobileNumber.
  ///
  /// In en, this message translates to:
  /// **'Mobile number'**
  String get mobileNumber;

  /// No description provided for @accountHolder.
  ///
  /// In en, this message translates to:
  /// **'Account holder name'**
  String get accountHolder;

  /// No description provided for @bankName.
  ///
  /// In en, this message translates to:
  /// **'Bank name'**
  String get bankName;

  /// No description provided for @accountNumber.
  ///
  /// In en, this message translates to:
  /// **'Account number'**
  String get accountNumber;

  /// No description provided for @branch.
  ///
  /// In en, this message translates to:
  /// **'Branch'**
  String get branch;

  /// No description provided for @routingNumber.
  ///
  /// In en, this message translates to:
  /// **'Routing number'**
  String get routingNumber;

  /// No description provided for @notificationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notificationsTitle;

  /// No description provided for @markAllRead.
  ///
  /// In en, this message translates to:
  /// **'Mark all read'**
  String get markAllRead;

  /// No description provided for @noNotifications.
  ///
  /// In en, this message translates to:
  /// **'No notifications yet.'**
  String get noNotifications;

  /// No description provided for @moreTitle.
  ///
  /// In en, this message translates to:
  /// **'More'**
  String get moreTitle;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @bangla.
  ///
  /// In en, this message translates to:
  /// **'বাংলা'**
  String get bangla;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @kycStatus.
  ///
  /// In en, this message translates to:
  /// **'KYC'**
  String get kycStatus;

  /// No description provided for @manageOnWebsite.
  ///
  /// In en, this message translates to:
  /// **'Manage on the website'**
  String get manageOnWebsite;

  /// No description provided for @livestockTitle.
  ///
  /// In en, this message translates to:
  /// **'Livestock'**
  String get livestockTitle;

  /// No description provided for @filterActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get filterActive;

  /// No description provided for @filterSold.
  ///
  /// In en, this message translates to:
  /// **'Sold'**
  String get filterSold;

  /// No description provided for @filterDead.
  ///
  /// In en, this message translates to:
  /// **'Died'**
  String get filterDead;

  /// No description provided for @filterAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get filterAll;

  /// No description provided for @noAnimalsYet.
  ///
  /// In en, this message translates to:
  /// **'No animals yet.'**
  String get noAnimalsYet;

  /// No description provided for @website.
  ///
  /// In en, this message translates to:
  /// **'Krishi website'**
  String get website;

  /// No description provided for @signOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get signOut;

  /// No description provided for @signOutConfirm.
  ///
  /// In en, this message translates to:
  /// **'Sign out of Krishi on this phone?'**
  String get signOutConfirm;

  /// No description provided for @role_investor.
  ///
  /// In en, this message translates to:
  /// **'Investor'**
  String get role_investor;

  /// No description provided for @role_steward.
  ///
  /// In en, this message translates to:
  /// **'Steward'**
  String get role_steward;

  /// No description provided for @role_farmer.
  ///
  /// In en, this message translates to:
  /// **'Farmer'**
  String get role_farmer;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get fullName;

  /// No description provided for @passwordHint.
  ///
  /// In en, this message translates to:
  /// **'At least 8 characters, with a letter and a number'**
  String get passwordHint;

  /// No description provided for @passwordRule.
  ///
  /// In en, this message translates to:
  /// **'Use at least 8 characters with a letter and a number'**
  String get passwordRule;

  /// No description provided for @confirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get confirmPassword;

  /// No description provided for @passwordsDontMatch.
  ///
  /// In en, this message translates to:
  /// **'The passwords don\'t match'**
  String get passwordsDontMatch;

  /// No description provided for @haveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account? Sign in'**
  String get haveAccount;

  /// No description provided for @noAccountYet.
  ///
  /// In en, this message translates to:
  /// **'New to Krishi?'**
  String get noAccountYet;

  /// No description provided for @signUpInvestor.
  ///
  /// In en, this message translates to:
  /// **'Create an investor account'**
  String get signUpInvestor;

  /// No description provided for @becomeSteward.
  ///
  /// In en, this message translates to:
  /// **'Become a steward'**
  String get becomeSteward;

  /// No description provided for @farmerActivateLink.
  ///
  /// In en, this message translates to:
  /// **'I\'m a farmer with an activation code'**
  String get farmerActivateLink;

  /// No description provided for @browsePlans.
  ///
  /// In en, this message translates to:
  /// **'Browse plans'**
  String get browsePlans;

  /// No description provided for @registerTitle.
  ///
  /// In en, this message translates to:
  /// **'Create your account'**
  String get registerTitle;

  /// No description provided for @registerSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Invest in real livestock raised by trusted farmers.'**
  String get registerSubtitle;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get createAccount;

  /// No description provided for @verifyTitle.
  ///
  /// In en, this message translates to:
  /// **'Verify your phone'**
  String get verifyTitle;

  /// No description provided for @verifyBody.
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code sent to {phone}.'**
  String verifyBody(Object phone);

  /// No description provided for @codeLabel.
  ///
  /// In en, this message translates to:
  /// **'6-digit code'**
  String get codeLabel;

  /// No description provided for @verify.
  ///
  /// In en, this message translates to:
  /// **'Verify'**
  String get verify;

  /// No description provided for @devCode.
  ///
  /// In en, this message translates to:
  /// **'Test code: {code}'**
  String devCode(Object code);

  /// No description provided for @useAnotherNumber.
  ///
  /// In en, this message translates to:
  /// **'Use a different number'**
  String get useAnotherNumber;

  /// No description provided for @forgotTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset your password'**
  String get forgotTitle;

  /// No description provided for @forgotBody.
  ///
  /// In en, this message translates to:
  /// **'Enter your phone number. We\'ll send a code.'**
  String get forgotBody;

  /// No description provided for @sendCode.
  ///
  /// In en, this message translates to:
  /// **'Send code'**
  String get sendCode;

  /// No description provided for @resetBody.
  ///
  /// In en, this message translates to:
  /// **'Enter the code sent to {phone} and choose a new password.'**
  String resetBody(Object phone);

  /// No description provided for @newPassword.
  ///
  /// In en, this message translates to:
  /// **'New password'**
  String get newPassword;

  /// No description provided for @resetPassword.
  ///
  /// In en, this message translates to:
  /// **'Reset password'**
  String get resetPassword;

  /// No description provided for @passwordResetDone.
  ///
  /// In en, this message translates to:
  /// **'Password changed. Sign in with your new password.'**
  String get passwordResetDone;

  /// No description provided for @activateTitle.
  ///
  /// In en, this message translates to:
  /// **'Activate your farmer account'**
  String get activateTitle;

  /// No description provided for @activateBody.
  ///
  /// In en, this message translates to:
  /// **'Enter the code your steward gave you and choose a password.'**
  String get activateBody;

  /// No description provided for @activate.
  ///
  /// In en, this message translates to:
  /// **'Activate'**
  String get activate;

  /// No description provided for @stewardSignupTitle.
  ///
  /// In en, this message translates to:
  /// **'Become a Krishi steward'**
  String get stewardSignupTitle;

  /// No description provided for @stewardSignupBody.
  ///
  /// In en, this message translates to:
  /// **'Manage livestock plans and the farmers who raise them. Krishi reviews every application.'**
  String get stewardSignupBody;

  /// No description provided for @continueLabel.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueLabel;

  /// No description provided for @stewardDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'About your work'**
  String get stewardDetailsTitle;

  /// No description provided for @stewardType.
  ///
  /// In en, this message translates to:
  /// **'You are'**
  String get stewardType;

  /// No description provided for @individual.
  ///
  /// In en, this message translates to:
  /// **'An individual'**
  String get individual;

  /// No description provided for @organization.
  ///
  /// In en, this message translates to:
  /// **'An organization'**
  String get organization;

  /// No description provided for @division.
  ///
  /// In en, this message translates to:
  /// **'Division'**
  String get division;

  /// No description provided for @district.
  ///
  /// In en, this message translates to:
  /// **'District'**
  String get district;

  /// No description provided for @upazila.
  ///
  /// In en, this message translates to:
  /// **'Upazila / area'**
  String get upazila;

  /// No description provided for @livestockYouRaise.
  ///
  /// In en, this message translates to:
  /// **'Livestock you work with'**
  String get livestockYouRaise;

  /// No description provided for @experience.
  ///
  /// In en, this message translates to:
  /// **'Your experience'**
  String get experience;

  /// No description provided for @experienceHint.
  ///
  /// In en, this message translates to:
  /// **'Years with livestock, training, farmers you work with (at least 10 characters)'**
  String get experienceHint;

  /// No description provided for @submitForReview.
  ///
  /// In en, this message translates to:
  /// **'Submit for review'**
  String get submitForReview;

  /// No description provided for @stewardPendingTitle.
  ///
  /// In en, this message translates to:
  /// **'Waiting for Krishi\'s approval'**
  String get stewardPendingTitle;

  /// No description provided for @stewardPendingBody.
  ///
  /// In en, this message translates to:
  /// **'Thanks for applying. Krishi is reviewing your details and will notify you. This usually takes a few working days.'**
  String get stewardPendingBody;

  /// No description provided for @stewardRejectedTitle.
  ///
  /// In en, this message translates to:
  /// **'Your application wasn\'t approved'**
  String get stewardRejectedTitle;

  /// No description provided for @checkAgain.
  ///
  /// In en, this message translates to:
  /// **'Check again'**
  String get checkAgain;

  /// No description provided for @cat_cattle.
  ///
  /// In en, this message translates to:
  /// **'Cattle'**
  String get cat_cattle;

  /// No description provided for @cat_goats.
  ///
  /// In en, this message translates to:
  /// **'Goats'**
  String get cat_goats;

  /// No description provided for @cat_sheep.
  ///
  /// In en, this message translates to:
  /// **'Sheep'**
  String get cat_sheep;

  /// No description provided for @cat_dumba.
  ///
  /// In en, this message translates to:
  /// **'Dumba'**
  String get cat_dumba;

  /// No description provided for @cat_garoleSheep.
  ///
  /// In en, this message translates to:
  /// **'Garole sheep'**
  String get cat_garoleSheep;

  /// No description provided for @cat_other.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get cat_other;

  /// No description provided for @navPlans.
  ///
  /// In en, this message translates to:
  /// **'Plans'**
  String get navPlans;

  /// No description provided for @plansTitle.
  ///
  /// In en, this message translates to:
  /// **'Investment plans'**
  String get plansTitle;

  /// No description provided for @searchPlans.
  ///
  /// In en, this message translates to:
  /// **'Search plans'**
  String get searchPlans;

  /// No description provided for @allCategories.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get allCategories;

  /// No description provided for @planStatus_open.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get planStatus_open;

  /// No description provided for @planStatus_coming_soon.
  ///
  /// In en, this message translates to:
  /// **'Coming soon'**
  String get planStatus_coming_soon;

  /// No description provided for @planStatus_fully_funded.
  ///
  /// In en, this message translates to:
  /// **'Fully funded'**
  String get planStatus_fully_funded;

  /// No description provided for @planStatus_all.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get planStatus_all;

  /// No description provided for @unitsLeft.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No units left} one{# unit left} other{# units left}}'**
  String unitsLeft(int count);

  /// No description provided for @unitPrice.
  ///
  /// In en, this message translates to:
  /// **'Unit price'**
  String get unitPrice;

  /// No description provided for @noPlans.
  ///
  /// In en, this message translates to:
  /// **'No plans match.'**
  String get noPlans;

  /// No description provided for @noPlansHint.
  ///
  /// In en, this message translates to:
  /// **'Try another category or status.'**
  String get noPlansHint;

  /// No description provided for @planAbout.
  ///
  /// In en, this message translates to:
  /// **'About this plan'**
  String get planAbout;

  /// No description provided for @whereMoneyGoes.
  ///
  /// In en, this message translates to:
  /// **'Where each unit\'s money goes'**
  String get whereMoneyGoes;

  /// No description provided for @allocAnimals.
  ///
  /// In en, this message translates to:
  /// **'Buying animals'**
  String get allocAnimals;

  /// No description provided for @allocCare.
  ///
  /// In en, this message translates to:
  /// **'Feed, care and vet'**
  String get allocCare;

  /// No description provided for @risks.
  ///
  /// In en, this message translates to:
  /// **'Risks'**
  String get risks;

  /// No description provided for @reviewsTitle.
  ///
  /// In en, this message translates to:
  /// **'Investor reviews'**
  String get reviewsTitle;

  /// No description provided for @noReviews.
  ///
  /// In en, this message translates to:
  /// **'No reviews yet.'**
  String get noReviews;

  /// No description provided for @ratingCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one{# review} other{# reviews}}'**
  String ratingCount(int count);

  /// No description provided for @investInPlan.
  ///
  /// In en, this message translates to:
  /// **'Invest in this plan'**
  String get investInPlan;

  /// No description provided for @signInToInvest.
  ///
  /// In en, this message translates to:
  /// **'Sign in to invest'**
  String get signInToInvest;

  /// No description provided for @interestTitle.
  ///
  /// In en, this message translates to:
  /// **'How many units?'**
  String get interestTitle;

  /// No description provided for @unitsLabel.
  ///
  /// In en, this message translates to:
  /// **'Units'**
  String get unitsLabel;

  /// No description provided for @totalAmount.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get totalAmount;

  /// No description provided for @sendInterest.
  ///
  /// In en, this message translates to:
  /// **'Send interest'**
  String get sendInterest;

  /// No description provided for @interestSent.
  ///
  /// In en, this message translates to:
  /// **'Interest sent. The steward will review it and you\'ll get a notification.'**
  String get interestSent;

  /// No description provided for @haveInterest.
  ///
  /// In en, this message translates to:
  /// **'You have an interest on this plan: {reference} ({status}).'**
  String haveInterest(Object reference, Object status);

  /// No description provided for @fundedOf.
  ///
  /// In en, this message translates to:
  /// **'{funded} of {offered} units funded'**
  String fundedOf(int funded, int offered);

  /// No description provided for @soldOut.
  ///
  /// In en, this message translates to:
  /// **'All units are taken'**
  String get soldOut;

  /// No description provided for @myInterests.
  ///
  /// In en, this message translates to:
  /// **'My interests'**
  String get myInterests;

  /// No description provided for @noInterests.
  ///
  /// In en, this message translates to:
  /// **'No interests yet'**
  String get noInterests;

  /// No description provided for @noInterestsHint.
  ///
  /// In en, this message translates to:
  /// **'Browse plans and send an interest to start.'**
  String get noInterestsHint;

  /// No description provided for @continuePayment.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continuePayment;

  /// No description provided for @openBatch.
  ///
  /// In en, this message translates to:
  /// **'Open batch'**
  String get openBatch;

  /// No description provided for @interestNotApproved.
  ///
  /// In en, this message translates to:
  /// **'Not approved: {reason}'**
  String interestNotApproved(Object reason);

  /// No description provided for @onboardingTitle.
  ///
  /// In en, this message translates to:
  /// **'Start your investment'**
  String get onboardingTitle;

  /// No description provided for @stepKyc.
  ///
  /// In en, this message translates to:
  /// **'Identity'**
  String get stepKyc;

  /// No description provided for @stepPayout.
  ///
  /// In en, this message translates to:
  /// **'Payout'**
  String get stepPayout;

  /// No description provided for @stepPayment.
  ///
  /// In en, this message translates to:
  /// **'Payment'**
  String get stepPayment;

  /// No description provided for @stepReview.
  ///
  /// In en, this message translates to:
  /// **'Check'**
  String get stepReview;

  /// No description provided for @kycNeeded.
  ///
  /// In en, this message translates to:
  /// **'Verify your identity with your NID before paying.'**
  String get kycNeeded;

  /// No description provided for @kycPendingNote.
  ///
  /// In en, this message translates to:
  /// **'Your documents are being checked. You\'ll get a notification when you can continue.'**
  String get kycPendingNote;

  /// No description provided for @kycRejectedNote.
  ///
  /// In en, this message translates to:
  /// **'Krishi asked for a change: {reason}'**
  String kycRejectedNote(Object reason);

  /// No description provided for @verifyNow.
  ///
  /// In en, this message translates to:
  /// **'Verify now'**
  String get verifyNow;

  /// No description provided for @payoutNeeded.
  ///
  /// In en, this message translates to:
  /// **'Add where Krishi should send your returns.'**
  String get payoutNeeded;

  /// No description provided for @amountToPay.
  ///
  /// In en, this message translates to:
  /// **'Amount to pay'**
  String get amountToPay;

  /// No description provided for @payOnline.
  ///
  /// In en, this message translates to:
  /// **'Pay online'**
  String get payOnline;

  /// No description provided for @payOnlineHint.
  ///
  /// In en, this message translates to:
  /// **'Card, bKash, Nagad or Rocket through SSLCommerz. Come back to the app when you\'re done.'**
  String get payOnlineHint;

  /// No description provided for @orTransfer.
  ///
  /// In en, this message translates to:
  /// **'Or send a bank or mobile transfer to Krishi, then report it.'**
  String get orTransfer;

  /// No description provided for @reportTransfer.
  ///
  /// In en, this message translates to:
  /// **'I\'ve sent the money'**
  String get reportTransfer;

  /// No description provided for @depositReview.
  ///
  /// In en, this message translates to:
  /// **'Krishi is checking your payment {reference}. You\'ll get a notification.'**
  String depositReview(Object reference);

  /// No description provided for @depositNotAccepted.
  ///
  /// In en, this message translates to:
  /// **'Your last payment wasn\'t accepted: {reason}'**
  String depositNotAccepted(Object reason);

  /// No description provided for @onboardingDone.
  ///
  /// In en, this message translates to:
  /// **'Your batch has started.'**
  String get onboardingDone;

  /// No description provided for @interestClosed.
  ///
  /// In en, this message translates to:
  /// **'This interest is no longer open for payment.'**
  String get interestClosed;

  /// No description provided for @notEnoughUnits.
  ///
  /// In en, this message translates to:
  /// **'Only {count} units are left on this plan.'**
  String notEnoughUnits(int count);

  /// No description provided for @refresh.
  ///
  /// In en, this message translates to:
  /// **'Refresh'**
  String get refresh;

  /// No description provided for @transferTitle.
  ///
  /// In en, this message translates to:
  /// **'Report your transfer'**
  String get transferTitle;

  /// No description provided for @dateSent.
  ///
  /// In en, this message translates to:
  /// **'Date sent'**
  String get dateSent;

  /// No description provided for @senderNumber.
  ///
  /// In en, this message translates to:
  /// **'Sent from (mobile number)'**
  String get senderNumber;

  /// No description provided for @transferProof.
  ///
  /// In en, this message translates to:
  /// **'Screenshot or photo of the transfer'**
  String get transferProof;

  /// No description provided for @kycTitle.
  ///
  /// In en, this message translates to:
  /// **'Verify your identity'**
  String get kycTitle;

  /// No description provided for @kycIntro.
  ///
  /// In en, this message translates to:
  /// **'Krishi needs your National ID to keep investments safe. Photos must be clear and readable.'**
  String get kycIntro;

  /// No description provided for @nidNumber.
  ///
  /// In en, this message translates to:
  /// **'NID number'**
  String get nidNumber;

  /// No description provided for @nidHint.
  ///
  /// In en, this message translates to:
  /// **'10 to 17 digits'**
  String get nidHint;

  /// No description provided for @presentAddress.
  ///
  /// In en, this message translates to:
  /// **'Present address'**
  String get presentAddress;

  /// No description provided for @permanentAddress.
  ///
  /// In en, this message translates to:
  /// **'Permanent address'**
  String get permanentAddress;

  /// No description provided for @sameAsPresent.
  ///
  /// In en, this message translates to:
  /// **'Same as present address'**
  String get sameAsPresent;

  /// No description provided for @nidFront.
  ///
  /// In en, this message translates to:
  /// **'NID front'**
  String get nidFront;

  /// No description provided for @nidBack.
  ///
  /// In en, this message translates to:
  /// **'NID back'**
  String get nidBack;

  /// No description provided for @yourPhoto.
  ///
  /// In en, this message translates to:
  /// **'Your photo'**
  String get yourPhoto;

  /// No description provided for @submit.
  ///
  /// In en, this message translates to:
  /// **'Submit'**
  String get submit;

  /// No description provided for @kycSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Submitted. Krishi will review your documents.'**
  String get kycSubmitted;

  /// No description provided for @interestsToReview.
  ///
  /// In en, this message translates to:
  /// **'Interests'**
  String get interestsToReview;

  /// No description provided for @guest.
  ///
  /// In en, this message translates to:
  /// **'Guest'**
  String get guest;

  /// No description provided for @approveInterestTitle.
  ///
  /// In en, this message translates to:
  /// **'Approve this interest?'**
  String get approveInterestTitle;

  /// No description provided for @approveInterestBody.
  ///
  /// In en, this message translates to:
  /// **'{name} can then pay for {count, plural, one{# unit} other{# units}}.'**
  String approveInterestBody(Object name, int count);

  /// No description provided for @farmersTitle.
  ///
  /// In en, this message translates to:
  /// **'Farmers'**
  String get farmersTitle;

  /// No description provided for @addFarmer.
  ///
  /// In en, this message translates to:
  /// **'Add farmer'**
  String get addFarmer;

  /// No description provided for @farmerAddress.
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get farmerAddress;

  /// No description provided for @farmerAdded.
  ///
  /// In en, this message translates to:
  /// **'Farmer added. Krishi sent them an activation code.'**
  String get farmerAdded;

  /// No description provided for @activationCode.
  ///
  /// In en, this message translates to:
  /// **'Activation code: {code}'**
  String activationCode(Object code);

  /// No description provided for @resendCode.
  ///
  /// In en, this message translates to:
  /// **'Resend code'**
  String get resendCode;

  /// No description provided for @codeSent.
  ///
  /// In en, this message translates to:
  /// **'A new code was sent.'**
  String get codeSent;

  /// No description provided for @pendingActivation.
  ///
  /// In en, this message translates to:
  /// **'Not activated yet'**
  String get pendingActivation;

  /// No description provided for @activeBatchesCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No active batches} one{# active batch} other{# active batches}}'**
  String activeBatchesCount(int count);

  /// No description provided for @noFarmers.
  ///
  /// In en, this message translates to:
  /// **'No farmers yet'**
  String get noFarmers;

  /// No description provided for @noFarmersHint.
  ///
  /// In en, this message translates to:
  /// **'Add the farmers who will raise your batches.'**
  String get noFarmersHint;

  /// No description provided for @assignFarmer.
  ///
  /// In en, this message translates to:
  /// **'Assign a farmer'**
  String get assignFarmer;

  /// No description provided for @chooseFarmer.
  ///
  /// In en, this message translates to:
  /// **'Choose a farmer'**
  String get chooseFarmer;

  /// No description provided for @farmerAssigned.
  ///
  /// In en, this message translates to:
  /// **'Farmer assigned.'**
  String get farmerAssigned;

  /// No description provided for @noActiveFarmers.
  ///
  /// In en, this message translates to:
  /// **'No activated farmers yet. Add a farmer and ask them to activate their account.'**
  String get noActiveFarmers;

  /// No description provided for @myPlansTitle.
  ///
  /// In en, this message translates to:
  /// **'My plans'**
  String get myPlansTitle;

  /// No description provided for @noStewardPlans.
  ///
  /// In en, this message translates to:
  /// **'No plans yet'**
  String get noStewardPlans;

  /// No description provided for @noStewardPlansHint.
  ///
  /// In en, this message translates to:
  /// **'Krishi adds you to plans; they appear here.'**
  String get noStewardPlansHint;

  /// No description provided for @openInterestsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No interests to review} one{# interest to review} other{# interests to review}}'**
  String openInterestsCount(int count);

  /// No description provided for @offeringStatus_approved.
  ///
  /// In en, this message translates to:
  /// **'Live'**
  String get offeringStatus_approved;

  /// No description provided for @offeringStatus_pending_approval.
  ///
  /// In en, this message translates to:
  /// **'Pending approval'**
  String get offeringStatus_pending_approval;

  /// No description provided for @offeringStatus_paused.
  ///
  /// In en, this message translates to:
  /// **'Paused'**
  String get offeringStatus_paused;

  /// No description provided for @offeringStatus_closed.
  ///
  /// In en, this message translates to:
  /// **'Closed'**
  String get offeringStatus_closed;

  /// No description provided for @offeringStatus_rejected.
  ///
  /// In en, this message translates to:
  /// **'Not approved'**
  String get offeringStatus_rejected;

  /// No description provided for @profileTitle.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profileTitle;

  /// No description provided for @changePassword.
  ///
  /// In en, this message translates to:
  /// **'Change password'**
  String get changePassword;

  /// No description provided for @currentPassword.
  ///
  /// In en, this message translates to:
  /// **'Current password'**
  String get currentPassword;

  /// No description provided for @passwordChanged.
  ///
  /// In en, this message translates to:
  /// **'Password changed.'**
  String get passwordChanged;

  /// No description provided for @downloadStatement.
  ///
  /// In en, this message translates to:
  /// **'Download statement (PDF)'**
  String get downloadStatement;

  /// No description provided for @rateSteward.
  ///
  /// In en, this message translates to:
  /// **'Rate your steward'**
  String get rateSteward;

  /// No description provided for @yourReview.
  ///
  /// In en, this message translates to:
  /// **'Your review'**
  String get yourReview;

  /// No description provided for @reviewComment.
  ///
  /// In en, this message translates to:
  /// **'Comment'**
  String get reviewComment;

  /// No description provided for @submitReview.
  ///
  /// In en, this message translates to:
  /// **'Submit review'**
  String get submitReview;

  /// No description provided for @reviewThanks.
  ///
  /// In en, this message translates to:
  /// **'Thanks for your review.'**
  String get reviewThanks;

  /// No description provided for @editDetails.
  ///
  /// In en, this message translates to:
  /// **'Edit details'**
  String get editDetails;

  /// No description provided for @editAnimalTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit {tag}'**
  String editAnimalTitle(String tag);

  /// No description provided for @sexLabel.
  ///
  /// In en, this message translates to:
  /// **'Sex'**
  String get sexLabel;

  /// No description provided for @sexMale.
  ///
  /// In en, this message translates to:
  /// **'Male'**
  String get sexMale;

  /// No description provided for @sexFemale.
  ///
  /// In en, this message translates to:
  /// **'Female'**
  String get sexFemale;

  /// No description provided for @notesLabel.
  ///
  /// In en, this message translates to:
  /// **'Notes'**
  String get notesLabel;

  /// No description provided for @detailsSaved.
  ///
  /// In en, this message translates to:
  /// **'Details saved.'**
  String get detailsSaved;

  /// No description provided for @weightsFromRecords.
  ///
  /// In en, this message translates to:
  /// **'Weights come from weight records: add a record to update them.'**
  String get weightsFromRecords;

  /// No description provided for @downloadCsv.
  ///
  /// In en, this message translates to:
  /// **'Download CSV'**
  String get downloadCsv;

  /// No description provided for @csvNoApp.
  ///
  /// In en, this message translates to:
  /// **'Saved, but no app on this phone opens CSV files. Install a spreadsheet app such as Google Sheets.'**
  String get csvNoApp;

  /// No description provided for @payoutUpdated.
  ///
  /// In en, this message translates to:
  /// **'Last changed {date}'**
  String payoutUpdated(String date);

  /// No description provided for @signOutAll.
  ///
  /// In en, this message translates to:
  /// **'Sign out of all devices'**
  String get signOutAll;

  /// No description provided for @signOutAllHint.
  ///
  /// In en, this message translates to:
  /// **'Every phone and browser, including this one'**
  String get signOutAllHint;

  /// No description provided for @signOutAllBody.
  ///
  /// In en, this message translates to:
  /// **'You will be signed out everywhere, including this phone. Use this if a phone was lost or you signed in somewhere you shouldn\'t have.'**
  String get signOutAllBody;

  /// No description provided for @payoutNeededTitle.
  ///
  /// In en, this message translates to:
  /// **'Add a payout account first'**
  String get payoutNeededTitle;

  /// No description provided for @payoutNeededBody.
  ///
  /// In en, this message translates to:
  /// **'Tell Krishi where to send your money (bKash, Nagad, Rocket or a bank account). Then you can withdraw.'**
  String get payoutNeededBody;

  /// No description provided for @minimumNotReachedTitle.
  ///
  /// In en, this message translates to:
  /// **'Not enough to withdraw yet'**
  String get minimumNotReachedTitle;

  /// No description provided for @minimumNotReachedBody.
  ///
  /// In en, this message translates to:
  /// **'The minimum withdrawal is {min}. Your balance is {balance}.'**
  String minimumNotReachedBody(String min, String balance);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['bn', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'bn':
      return AppLocalizationsBn();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
