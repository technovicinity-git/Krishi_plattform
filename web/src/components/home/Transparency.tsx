import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CheckBullet } from "@/components/icons";
import { listPublicOfferings } from "@/lib/public/plans";
import { formatBDT } from "@/lib/utils";
import { delay } from "./motion";

// Profit split after a sale: farmer / investor / steward / Krishi.
const SHARES = [
  { key: "shareFarmer", pct: 60, color: "bg-green-olive" },
  { key: "shareInvestor", pct: 30, color: "bg-brand" },
  { key: "shareSteward", pct: 5, color: "bg-camel" },
  { key: "sharePlatform", pct: 5, color: "bg-sage" },
] as const;

/** Where one unit's money goes, using a live plan's real split when there is one. */
export async function Transparency() {
  const t = await getTranslations("home.transparency");
  const locale = await getLocale();
  const { items } = await listPublicOfferings({ limit: 1, status: "open" }).catch(() => ({ items: [] }));
  const plan = items[0];
  const price = plan?.unitPrice || 100000;
  const animal = plan ? plan.animalAllocation : 70000;
  const care = plan ? plan.careAllocation : 30000;
  const pct = (n: number) => Math.round((n / price) * 100);

  const rows = [
    { key: "animal" as const, amount: animal, bar: "bg-green-olive", text: "text-green-olive" },
    { key: "care" as const, amount: care, bar: "bg-camel", text: "text-camel" },
  ];

  return (
    <Section size="xl" className="bg-stone">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center lg:gap-24">
          <div data-reveal="left" className="flex flex-col gap-8 lg:gap-10">
            <div className="flex flex-col gap-4">
              <Eyebrow>{t("eyebrow")}</Eyebrow>
              <Heading as="h2" size="section">
                {t("heading")}
              </Heading>
            </div>
            <p className="text-[15px] leading-[1.75] text-ink-secondary md:text-[16px]">{t("paragraph")}</p>
            <ul className="flex flex-col gap-4 lg:gap-5">
              {(["item1", "item2", "item3"] as const).map((key) => (
                <li key={key} className="flex items-start gap-3.5">
                  <CheckBullet />
                  <span className="pt-[1px] text-[14px] leading-[1.5] text-ink-button">{t(`checklist.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal="right" style={delay(150)} className="flex flex-col gap-7 rounded-xl border border-border-light bg-white p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)] md:p-10">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">{t("breakdown.label")}</span>
              <span className="font-serif text-[24px] leading-[1.35] text-ink md:text-[26px]">
                {t("breakdown.perUnit", { price: formatBDT(price) })}
              </span>
              {plan && (
                <span className="text-[12px] text-ink-tertiary">
                  {t("breakdown.examplePlan", { plan: locale === "bn" ? plan.planNameBn || plan.planNameEn : plan.planNameEn })}
                </span>
              )}
            </div>

            {/* One stacked bar for the whole unit, then a line per part. */}
            <div style={delay(500)} className="k-grow-x flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-stone">
              {rows.map((r) => (
                <div key={r.key} className={r.bar} style={{ width: `${pct(r.amount)}%` }} />
              ))}
            </div>

            <div className="flex flex-col gap-5">
              {rows.map((r) => (
                <div key={r.key} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${r.bar}`} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[14px] font-semibold text-ink-button">{t(`breakdown.rows.${r.key}.title`)}</span>
                      <span className={`whitespace-nowrap text-[15px] font-bold ${r.text}`}>
                        {formatBDT(r.amount)} · {pct(r.amount)}%
                      </span>
                    </div>
                    <span className="text-[12px] leading-snug text-ink-tertiary">{t(`breakdown.rows.${r.key}.note`)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px w-full bg-stone" />

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-semibold text-ink-button">{t("breakdown.saleTitle")}</span>
                <span className="text-[12px] leading-snug text-ink-tertiary">{t("breakdown.saleNote")}</span>
              </div>
              <div style={delay(900)} className="k-grow-x flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
                {SHARES.map((s) => (
                  <div key={s.key} className={s.color} style={{ width: `${s.pct}%` }} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                {SHARES.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 text-[12px] text-ink-secondary">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.color}`} />
                    <span>{t(`breakdown.${s.key}`)}</span>
                    <span className="font-bold text-ink">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
