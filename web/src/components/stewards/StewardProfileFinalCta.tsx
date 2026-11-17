import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function StewardProfileFinalCta({ stewardName }: { stewardName: string }) {
  const t = useTranslations("stewardProfile.finalCta");

  return (
    <Section size="2xl" className="bg-dark">
      <Container>
        <div className="mx-auto flex max-w-[820px] flex-col items-center gap-10 text-center">
          <div className="flex flex-col items-center gap-5">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section" variant="onDark">
              {t("headingLine1")}
              <br />
              {t("headingLine2")}
              <br />
              {t("headingLine3")}
            </Heading>
            <p className="text-[15px] leading-[1.7] text-ink-muted">
              {t("paragraph", { name: stewardName })}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-[5px] bg-terracotta px-7 py-4 text-[15px] font-bold leading-none text-white transition-colors hover:bg-[#B3634A]"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/stewards"
              className="inline-flex items-center justify-center rounded-[5px] border border-white px-7 py-4 text-[15px] font-medium leading-none text-cream transition-colors hover:bg-white/5"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}