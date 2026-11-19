/**
 * Language-neutral timeline entries.
 *
 * System-written investment updates store a message key and its values in
 * `metadata.i18n`, so each reader sees them in their own language. The
 * English `title`/`body` columns are still written, as a fallback for older
 * readers and for entries people type themselves. Pure: safe on client and
 * server.
 */

export type TimelineKey =
  | "purchase"
  | "fund_request"
  | "fund_approved"
  | "fund_rejected"
  | "expense_logged"
  | "expense_rejected"
  | "sale_recorded"
  | "sale_confirmed"
  | "sale_rejected"
  | "remitted"
  | "remit_rejected"
  | "settled_profit"
  | "settled_loss"
  | "settled_even"
  | "settlement_corrected"
  | "animal_died"
  | "death_reported"
  | "death_rejected"
  | "total_loss_requested"
  | "total_loss_rejected"
  | "settled_total_loss";

/** Values shown in the message. Money keys (amount, net, purchase) are formatted as BDT. */
export type TimelineParams = Record<string, string | number>;

export interface TimelineI18n {
  key: TimelineKey;
  params: TimelineParams;
  /** The body is text the person typed (a note): show it as written. */
  userNote?: boolean;
}

/** Builds the metadata.i18n value for an entry. */
export function timeline(key: TimelineKey, params: TimelineParams = {}, userNote?: string | null): TimelineI18n {
  return userNote ? { key, params, userNote: true } : { key, params };
}

export const MONEY_PARAMS = ["amount", "net", "purchase"] as const;

type Translate = ((key: string, values?: Record<string, string | number>) => string) & {
  has: (key: string) => boolean;
};

/**
 * Title and body of an update in the reader's language.
 * `t` is the "app.timeline" translator, `tPurpose` the "app.purpose" one.
 */
export function localizeUpdate(
  u: { title: string; body: string | null; i18n?: TimelineI18n | null },
  t: Translate,
  tPurpose: Translate,
  formatMoney: (n: number) => string,
): { title: string; body: string | null } {
  const i = u.i18n;
  if (!i || !t.has(`${i.key}.title`)) return { title: u.title, body: u.body };

  const values: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(i.params)) {
    if ((MONEY_PARAMS as readonly string[]).includes(k) && typeof v === "number") values[k] = formatMoney(v);
    else if (k === "purpose" && typeof v === "string") values[k] = tPurpose.has(v) ? tPurpose(v) : v.replace(/_/g, " ");
    else values[k] = v;
  }

  const title = t(`${i.key}.title`, values);
  if (i.userNote) return { title, body: u.body };
  const bodyKey = values.txn && t.has(`${i.key}.bodyTxn`) ? `${i.key}.bodyTxn` : `${i.key}.body`;
  return { title, body: t.has(bodyKey) ? t(bodyKey, values) : u.body };
}
