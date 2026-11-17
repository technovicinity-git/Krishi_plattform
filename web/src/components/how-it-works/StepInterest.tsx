import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { ChevronDownIcon } from "@/components/icons";

export function StepInterest() {
  const t = useTranslations("howItWorks.stepInterest");

  return (
    <Section size="xl" className="bg-stone">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[480px_minmax(0,1fr)] lg:items-center lg:gap-20">
          {/* Form card */}
          <div className="rounded-xl border border-border-light bg-white p-10">
            <h3 className="mb-6 font-serif text-[24px] leading-[1.35] text-ink">
              {t("form.title")}
            </h3>
            <div className="flex flex-col gap-4">
              <Field label={t("form.fullName")} value={t("form.fullNamePlaceholder")} muted />
              <Field label={t("form.phone")} value={t("form.phonePlaceholder")} muted />
              <Field label={t("form.plan")} value={t("form.planValue")} withChevron />
              <Field label={t("form.units")} value={t("form.unitsValue")} withChevron />
              <Field label={t("form.message")} value={t("form.messagePlaceholder")} muted tall />
              <button
                type="button"
                className="mt-2 inline-flex w-full items-center justify-center rounded-[4px] bg-terracotta py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#B3634A]"
              >
                {t("form.submit")}
              </button>
            </div>
          </div>

          {/* Right content */}
          <div className="flex flex-col gap-6">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
              {t("paragraph")}
            </p>

            <div className="rounded-lg border-l-4 border-terracotta bg-cream p-6">
              <div className="flex flex-col gap-3">
                <span className="text-[14px] font-bold text-terracotta">
                  {t("notice.title")}
                </span>
                <p className="text-[13px] leading-[1.5] text-ink-secondary">
                  {t("notice.body")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Field({
  label,
  value,
  muted,
  tall,
  withChevron,
}: {
  label: string;
  value: string;
  muted?: boolean;
  tall?: boolean;
  withChevron?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-ink-secondary">{label}</span>
      <div
        className={`flex items-center justify-between rounded-[4px] border border-border-light bg-cream px-3 ${tall ? "py-3" : "py-3"}`}
      >
        <span className={`text-[14px] ${muted ? "text-ink-muted" : "text-ink"}`}>
          {value}
        </span>
        {withChevron && <ChevronDownIcon className="h-3 w-3 text-ink-secondary" />}
      </div>
    </div>
  );
}