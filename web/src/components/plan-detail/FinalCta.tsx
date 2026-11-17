import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function FinalCta() {
  const t = useTranslations("planDetail.finalCta");

  return (
    <Section size="lg" className="bg-dark">
      <Container>
        <div className="mx-auto flex max-w-[760px] flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section" variant="onDark">
              {t("heading")}
            </Heading>
            <p className="text-[15px] leading-[1.7] text-ink-muted">
              {t("paragraph")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-[4px] bg-terracotta px-9 py-4 text-[14px] font-bold text-white transition-colors hover:bg-[#B3634A]"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-[4px] border border-ink-muted px-7 py-[15px] text-[14px] font-semibold text-ink-muted transition-colors hover:border-cream hover:text-cream"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}