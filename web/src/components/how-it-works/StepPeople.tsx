import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { CheckCircle, UserIcon, BriefcaseIcon } from "@/components/icons";

const FARMER_ITEMS = ["care", "logs", "trade"] as const;
const STEWARD_ITEMS = ["audit", "escrow", "reports"] as const;
const FLOW_KEYS = ["investor", "escrow", "steward", "farmer", "livestock"] as const;

export function StepPeople() {
  const t = useTranslations("howItWorks.stepPeople");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="max-w-[640px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
              {t("paragraph")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RoleCard
              icon={<UserIcon className="text-terracotta" />}
              iconBg="bg-stone"
              role={t("farmer.role")}
              subrole={t("farmer.subrole")}
              subroleColor="text-terracotta"
              description={t("farmer.description")}
              items={FARMER_ITEMS.map((k) => t(`farmer.items.${k}`))}
            />
            <RoleCard
              icon={<BriefcaseIcon className="text-green-olive" />}
              iconBg="bg-[#E8F0EA]"
              role={t("steward.role")}
              subrole={t("steward.subrole")}
              subroleColor="text-green-olive"
              description={t("steward.description")}
              items={STEWARD_ITEMS.map((k) => t(`steward.items.${k}`))}
            />
          </div>

          {/* Flow diagram */}
          <div className="rounded-[8px] bg-stone p-8">
            <p className="mb-6 text-center text-[12px] font-bold uppercase tracking-[0.02em] text-ink-tertiary">
              {t("flowLabel")}
            </p>
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:gap-2">
              {FLOW_KEYS.map((key, i) => (
                <div key={key} className="flex items-center gap-2 md:gap-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className={`text-[14px] font-bold ${
                      key === "escrow" ? "text-terracotta"
                      : key === "steward" || key === "livestock" ? "text-green-olive"
                      : "text-ink"
                    }`}>
                      {t(`flow.${key}.title`)}
                    </span>
                    <span className="text-[11px] text-ink-tertiary">
                      {t(`flow.${key}.subtitle`)}
                    </span>
                  </div>
                  {i < FLOW_KEYS.length - 1 && (
                    <svg viewBox="0 0 32 16" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="hidden h-4 w-8 shrink-0 text-ink-tertiary md:block"
                      aria-hidden="true">
                      <path d="M2 8h28M24 3l6 5-6 5" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function RoleCard({
  icon, iconBg, role, subrole, subroleColor, description, items,
}: {
  icon: React.ReactNode;
  iconBg: string;
  role: string;
  subrole: string;
  subroleColor: string;
  description: string;
  items: string[];
}) {
  return (
    <article className="flex flex-col gap-7 rounded-xl border border-border-light bg-white p-10">
      <div className="flex items-center gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          {icon}
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-[24px] leading-[1.35] text-ink">{role}</h3>
          <span className={`text-[12px] font-semibold uppercase tracking-[0.02em] ${subroleColor}`}>
            {subrole}
          </span>
        </div>
      </div>
      <p className="text-[15px] leading-[1.6] text-ink-secondary">{description}</p>
      <div className="h-px w-full bg-border-divider" />
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3">
            <CheckCircle />
            <span className="text-[14px] text-ink-button">{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}