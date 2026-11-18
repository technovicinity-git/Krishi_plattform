import { createTranslator } from "next-intl";
import { formatBDT } from "@/lib/utils";
import type { InvestmentDetail } from "@/lib/investments/detail";
import type { Wallet } from "@/lib/wallet";
import { PdfReport } from "./doc";

export type ReportLocale = "en" | "bn";

async function translator(locale: ReportLocale) {
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return {
    t: createTranslator({ locale, messages, namespace: "app.pdf" }),
    tStage: createTranslator({ locale, messages, namespace: "app.stage" }),
    tStatus: createTranslator({ locale, messages, namespace: "app.status" }),
    tPurpose: createTranslator({ locale, messages, namespace: "app.purpose" }),
    tSale: createTranslator({ locale, messages, namespace: "app.saleStatus" }),
    tAnimal: createTranslator({ locale, messages, namespace: "app.animals" }),
    tWallet: createTranslator({ locale, messages, namespace: "app.wallet" }),
  };
}

const money = (n: number) => (n < 0 ? `−${formatBDT(Math.abs(n))}` : formatBDT(n));

function dateFmt(locale: ReportLocale) {
  return (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
          timeZone: "Asia/Dhaka",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
}

function pick<T extends (key: string) => string>(t: T & { has: (k: string) => boolean }, key: string): string {
  return t.has(key) ? t(key) : key.replace(/_/g, " ");
}

/** Full statement of one investment: money, animals, requests, expenses, timeline. */
export async function investmentStatementPdf(
  inv: InvestmentDetail,
  locale: ReportLocale,
): Promise<Buffer> {
  const { t, tStage, tStatus, tPurpose, tSale, tAnimal } = await translator(locale);
  const date = dateFmt(locale);
  const bn = locale === "bn";
  const plan = bn ? inv.offering.planNameBn : inv.offering.planNameEn;
  const generated = new Date().toLocaleString(bn ? "bn-BD" : "en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const pdf = new PdfReport({
    title: t("investmentTitle"),
    subtitle: `${plan} · ${inv.reference}`,
    meta: [
      [t("investor"), inv.investor.fullName ?? "—"],
      [t("stage"), pick(tStage, inv.currentStage)],
      [t("steward"), inv.steward.fullName ?? "—"],
      [t("farmer"), inv.farmer?.fullName ?? t("unassigned")],
      [t("started"), date(inv.createdAt)],
      [t("generated"), generated],
    ],
    footerLeft: t("footer", { reference: inv.reference }),
    pageLabel: (n, total) => t("page", { n, total }),
  });

  // ── Summary
  pdf.section(t("summary"));
  pdf.keyValues([
    [t("plan"), plan],
    [t("category"), (bn ? inv.offering.categoryNameBn : inv.offering.categoryName) ?? "—"],
    [t("district"), (bn ? inv.offering.districtNameBn : inv.offering.districtName) ?? "—"],
    [t("duration"), t("months", { count: inv.offering.durationMonths })],
    [t("units"), String(inv.units)],
    [t("unitPrice"), money(inv.offering.unitPrice)],
    [t("estReturn"), `${inv.offering.roiMin}–${inv.offering.roiMax}%`],
    [t("status"), pick(tStatus, inv.status)],
    [t("invested"), money(inv.amount)],
  ], { highlightLast: true });

  // ── Money
  pdf.section(t("money"));
  pdf.keyValues([
    [t("animalBudget"), money(inv.stats.animalBudgetTotal)],
    [t("careBudget"), money(inv.stats.careBudgetTotal)],
    [t("animalPurchase"), money(inv.stats.purchaseCost)],
    [t("fundRequestsApproved"), money(inv.stats.fundsDisbursed)],
    [t("fundsReleased"), money(inv.stats.capitalSpent)],
    [t("expensesApproved"), money(inv.stats.expensesApproved)],
  ]);

  // ── Sale & settlement
  if (inv.sale && inv.sale.status !== "rejected") {
    pdf.section(t("sale"));
    pdf.keyValues([
      [t("saleReference"), inv.sale.reference],
      [t("saleStatus"), pick(tSale, inv.sale.status)],
      [t("saleDate"), date(inv.sale.saleDate)],
      [t("animalsSold"), String(inv.sale.animalsSold)],
      [t("saleAmount"), money(inv.sale.saleAmount)],
    ], { highlightLast: true });
  }
  if (inv.settlement) {
    const s = inv.settlement;
    pdf.section(t("settlement"));
    pdf.paragraph(
      s.outcome === "profit"
        ? t("resultProfit", { amount: money(s.netResult) })
        : s.outcome === "loss"
          ? t("resultLoss", { amount: money(Math.abs(s.netResult)) })
          : t("resultEven"),
      s.outcome === "loss" ? "#A13D2B" : "#2D5A37",
    );
    pdf.keyValues([
      [t("capital"), money(s.capital)],
      [t("fundsReleased"), money(s.fundsReleased)],
      [t("unspent"), money(Math.max(0, s.capital - s.fundsReleased))],
      [t("saleAmount"), money(s.saleAmount)],
      [t("totalReturn"), money(s.totalReturn)],
      [t("netResult"), money(s.netResult)],
      [t("farmerShare"), money(s.farmerShare)],
      [t("stewardShare"), money(s.stewardShare)],
      [t("platformShare"), money(s.platformShare)],
      [t("settledOn"), date(s.settledAt)],
      [t("investorPayout"), money(s.investorPayout)],
    ], { highlightLast: true });
  }

  // ── Animals
  pdf.section(t("animals"));
  pdf.table(
    [
      { header: t("colAnimal"), width: 0.17 },
      { header: t("colBreed"), width: 0.17 },
      { header: t("colBought"), width: 0.16, align: "right" },
      { header: t("colStartWeight"), width: 0.13, align: "right" },
      { header: t("colWeight"), width: 0.13, align: "right" },
      { header: t("colStatus"), width: 0.11 },
      { header: t("colSalePrice"), width: 0.13, align: "right" },
    ],
    inv.animals.map((a) => [
      a.earTag ? `${a.tag} (${a.earTag})` : a.tag,
      a.breed ?? "—",
      a.purchasePrice !== null ? money(a.purchasePrice) : "—",
      a.purchaseWeightKg !== null ? tAnimal("kg", { value: a.purchaseWeightKg }) : "—",
      a.currentWeightKg !== null ? tAnimal("kg", { value: a.currentWeightKg }) : "—",
      tAnimal(`status.${a.status}`),
      a.salePrice !== null ? money(a.salePrice) : "—",
    ]),
    t("noAnimals"),
  );

  // ── Fund requests
  pdf.section(t("fundRequests"));
  pdf.table(
    [
      { header: t("colDate"), width: 0.17 },
      { header: t("colReference"), width: 0.2 },
      { header: t("colPurpose"), width: 0.25 },
      { header: t("colStatus"), width: 0.18 },
      { header: t("colAmount"), width: 0.2, align: "right" },
    ],
    inv.fundRequests.map((r) => [
      date(r.createdAt),
      r.reference,
      pick(tPurpose, r.purpose),
      pick(tStatus, r.status),
      money(r.amount),
    ]),
    t("noFundRequests"),
  );

  // ── Expenses
  pdf.section(t("expenses"));
  pdf.table(
    [
      { header: t("colDate"), width: 0.17 },
      { header: t("colCategory"), width: 0.22 },
      { header: t("colDescription"), width: 0.25 },
      { header: t("colStatus"), width: 0.16 },
      { header: t("colAmount"), width: 0.2, align: "right" },
    ],
    inv.expenses.map((e) => [
      date(e.createdAt),
      pick(tPurpose, e.category),
      e.description ?? "—",
      pick(tStatus, e.status),
      money(e.amount),
    ]),
    t("noExpenses"),
  );

  // ── Timeline (latest first, as recorded)
  pdf.section(t("timeline"));
  pdf.table(
    [
      { header: t("colDate"), width: 0.17 },
      { header: t("colUpdate"), width: 0.63 },
      { header: t("colAmount"), width: 0.2, align: "right" },
    ],
    inv.updates.map((u) => [
      date(u.createdAt),
      u.body ? `${u.title} — ${u.body}` : u.title,
      u.amount !== null ? money(u.amount) : "",
    ]),
    t("noUpdates"),
  );

  return pdf.finish();
}

/** Wallet statement: balance, every transaction and withdrawal. */
export async function walletStatementPdf(
  user: { fullName: string | null; phone: string | null; role: string },
  wallet: Wallet,
  locale: ReportLocale,
): Promise<Buffer> {
  const { t, tWallet } = await translator(locale);
  const date = dateFmt(locale);
  const bn = locale === "bn";
  const generated = new Date().toLocaleString(bn ? "bn-BD" : "en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const pdf = new PdfReport({
    title: t("walletTitle"),
    subtitle: user.fullName ?? undefined,
    meta: [
      [t("accountHolder"), user.fullName ?? "—"],
      [t("phone"), user.phone ?? "—"],
      [t("role"), t(`roles.${user.role}`)],
      [t("generated"), generated],
    ],
    footerLeft: t("walletFooter"),
    pageLabel: (n, total) => t("page", { n, total }),
  });

  pdf.section(t("balances"));
  pdf.keyValues([
    [tWallet("earned"), money(wallet.earned)],
    [tWallet("withdrawn"), money(wallet.withdrawn)],
    [tWallet("pending"), money(wallet.pending)],
    [tWallet("available"), money(wallet.balance)],
  ], { highlightLast: true });

  pdf.section(tWallet("transactions"));
  // Oldest first with a running balance, like a bank statement.
  let running = 0;
  const rows = [...wallet.transactions].reverse().map((tx) => {
    running += tx.amount;
    return [
      date(tx.createdAt),
      tWallet.has(`type.${tx.type}`) ? tWallet(`type.${tx.type}`) : tx.type,
      tx.description ?? "",
      tx.amount > 0 ? money(tx.amount) : "",
      tx.amount < 0 ? money(Math.abs(tx.amount)) : "",
      money(running),
    ];
  });
  pdf.table(
    [
      { header: t("colDate"), width: 0.14 },
      { header: t("colType"), width: 0.18 },
      { header: t("colDescription"), width: 0.26 },
      { header: t("colIn"), width: 0.14, align: "right" },
      { header: t("colOut"), width: 0.14, align: "right" },
      { header: t("colBalance"), width: 0.14, align: "right" },
    ],
    rows,
    tWallet("noTransactions"),
  );

  pdf.section(tWallet("withdrawals"));
  pdf.table(
    [
      { header: t("colDate"), width: 0.16 },
      { header: t("colReference"), width: 0.2 },
      { header: t("colDestination"), width: 0.26 },
      { header: t("colStatus"), width: 0.18 },
      { header: t("colAmount"), width: 0.2, align: "right" },
    ],
    wallet.withdrawals.map((w) => [
      date(w.createdAt),
      w.reference,
      w.destination,
      tWallet.has(`status.${w.status}`) ? tWallet(`status.${w.status}`) : w.status,
      money(w.amount),
    ]),
    tWallet("noWithdrawals"),
  );

  return pdf.finish();
}
