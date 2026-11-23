import { createTranslator } from "next-intl";
import { requireMobileUser, json, localeOf, messagesFor } from "@/lib/mobile/api";
import { getLedger, kindsFor, parseLedgerFilters, type LedgerScope, type TxEntry } from "@/lib/transactions";

export const runtime = "nodejs";

type Translate = ((key: string, values?: Record<string, string | number>) => string) & { has: (key: string) => boolean };

/**
 * The signed-in person's transaction history (same as the website's
 * Transactions page), with labels in the app's language.
 * GET ?type=&from=&to=
 */
export async function GET(request: Request) {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;

  const locale = localeOf(request);
  const messages = await messagesFor(locale);
  const t = createTranslator({ locale, messages, namespace: "app.txn" }) as unknown as Translate;
  const tPurpose = createTranslator({ locale, messages, namespace: "app.purpose" }) as unknown as Translate;

  const scope: LedgerScope = { kind: "user", userId: user.id, role: user.role };
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const { entries, summary } = await getLedger(scope, parseLedgerFilters(params));

  const detail = (e: TxEntry) => {
    if (!e.detail) return null;
    if (e.kind === "deposit" && t.has(`method.${e.detail}`)) return t(`method.${e.detail}`);
    if (e.kind === "fund_release") return tPurpose.has(e.detail) ? tPurpose(e.detail) : e.detail.replace(/_/g, " ");
    if (e.kind === "remittance") {
      const [method, ...rest] = e.detail.split(" · ");
      return [t.has(`method.${method}`) ? t(`method.${method}`) : method, ...rest].join(" · ");
    }
    return e.detail;
  };

  return json({
    summary,
    kinds: kindsFor(scope).map((k) => ({ kind: k, label: t(`kind.${k}`), summaryLabel: t.has(`sum_${k}`) ? t(`sum_${k}`) : t(`kind.${k}`) })),
    entries: entries.map((e) => ({
      id: e.id,
      at: e.at,
      kind: e.kind,
      label: t(`kind.${e.kind}`),
      direction: e.direction,
      amount: e.amount,
      status: e.status,
      statusLabel: t.has(`status.${e.status}`) ? t(`status.${e.status}`) : e.status,
      reference: e.reference,
      detail: detail(e),
      investmentId: e.investmentId,
      investmentRef: e.investmentRef,
    })),
  });
}
