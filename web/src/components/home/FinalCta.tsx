import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function FinalCta() {
  const t = useTranslations("home.finalCta");

  return (
    <Section size="2xl" className="bg-dark">
      <Container>
        <div className="mx-auto flex max-w-[760px] flex-col items-center gap-10 text-center">
          <div className="flex flex-col items-center gap-5">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section" variant="onDark">
              {t("heading")}
            </Heading>
            {/* Figma: #6B6560 — bumped to ink-muted for accessibility on dark. */}
            <p className="text-[15px] leading-[1.7] text-ink-muted">
              {t("paragraph")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-[5px] bg-terracotta px-9 py-5 text-[15px] font-bold leading-none text-white transition-colors hover:bg-[#B3634A]"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-[5px] border border-ink-button px-7 py-[19px] text-[15px] font-medium leading-none text-ink-tertiary transition-colors hover:border-ink-secondary hover:text-cream"
            >
              {t("ctaSecondary")}
            </Link>
          </div>

          {/* TODO (legal): Verify "regulated accounts" claim before launch.
              See §36 — do not assert regulatory status without confirmation. */}
          <p className="text-[12px] leading-tight text-[#4A4844]">
            {t("footnote")}
          </p>
        </div>
      </Container>
    </Section>
  );
}