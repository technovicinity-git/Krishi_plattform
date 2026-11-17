import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { ArrowRightIcon } from "@/components/icons";

export function StepRealAnimal() {
  const t = useTranslations("howItWorks.stepRealAnimal");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="max-w-[720px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
              {t("paragraph")}
            </p>
          </div>

          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-stretch">
            {/* Batch card */}
            <div className="flex w-full flex-col gap-6 rounded-lg bg-stone p-8 lg:w-[420px] lg:shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
                {t("batchCard.label")}
              </span>
              <div className="flex flex-col gap-3">
                <span className="font-serif text-[24px] leading-[1.35] text-ink">
                  {t("batchCard.batchId")}
                </span>
                <div className="flex items-center gap-3 text-[14px]">
                  <span className="font-semibold text-terracotta">
                    {t("batchCard.units")}
                  </span>
                  <span className="text-ink-muted">·</span>
                  <span className="font-bold text-ink">{t("batchCard.amount")}</span>
                </div>
              </div>
              <div className="h-px w-full bg-border-light" />
              <p className="text-[13px] leading-[1.5] text-ink-secondary">
                {t("batchCard.description")}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex shrink-0 items-center justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-stone text-terracotta">
                <ArrowRightIcon />
              </span>
            </div>

            {/* Animal cards */}
            <div className="flex w-full flex-col gap-4">
              <AnimalCard tKey="sahiwal" image="/images/sahiwal-male.png" />
                <AnimalCard tKey="redChittagong" image="/images/red-chittagong-male.png" />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function AnimalCard({ tKey, image }: { tKey: "sahiwal" | "redChittagong"; image: string }) {
  const t = useTranslations("howItWorks.stepRealAnimal.animals");
  return (
    <div className="flex items-center gap-6 rounded-[8px] border border-border-light bg-cream p-6">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[6px]">
        <Image src={image} alt={t(`${tKey}.name`)} fill sizes="80px" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <span className="font-serif text-[20px] leading-tight text-ink">
            {t(`${tKey}.name`)}
          </span>
          <span className="text-[12px] font-bold text-green-olive">
            {t(`${tKey}.tag`)}
          </span>
        </div>
        <div className="flex flex-wrap gap-6">
          <MetaCell label={t(`${tKey}.farmerLabel`)} value={t(`${tKey}.farmer`)} />
          <MetaCell label={t(`${tKey}.stewardLabel`)} value={t(`${tKey}.steward`)} />
          <MetaCell label={t(`${tKey}.weightLabel`)} value={t(`${tKey}.weight`)} />
        </div>
      </div>
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] leading-tight text-ink-muted">{label}</span>
      <span className="text-[13px] font-semibold leading-tight text-ink">{value}</span>
    </div>
  );
}