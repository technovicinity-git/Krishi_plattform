import Image from "next/image";
import { useTranslations } from "next-intl";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CheckCircle } from "@/components/icons";

const ITEMS = [
  "photos",
  "receipt",
  "ledgers",
  "checkApproval",
  "biosecurity",
  "sale",
  "settlement",
] as const;

export function RealConnection() {
  const t = useTranslations("planDetail.realConnection");

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <Heading as="h2" size="subsection" className="lg:text-[36px]">
          {t("heading")}
        </Heading>
        <p className="text-[15px] leading-[1.6] text-ink-secondary">
          {t("paragraph")}
        </p>
      </div>

      <div className="relative aspect-[836/320] w-full overflow-hidden rounded-xl">
        <Image
          src="/images/plan-detail-livestock.png"
          alt={t("imageAlt")}
          fill
          sizes="(min-width: 1024px) 836px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col gap-4 pt-4">
        <span className="text-[14px] font-bold uppercase tracking-[0.02em] text-ink">
          {t("checklistLabel")}
        </span>
        <ul className="flex flex-col gap-2">
          {ITEMS.map((key) => (
            <li key={key} className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4" />
              <span className="text-[13px] text-ink-secondary">
                {t(`items.${key}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}