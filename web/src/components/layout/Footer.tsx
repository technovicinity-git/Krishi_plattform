import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { listPublicOfferings } from "@/lib/public/plans";
import { Logo } from "./Logo";

const LINK_GROUPS = [
  {
    titleKey: "resources",
    links: [
      { key: "howItWorks", href: "/how-it-works" },
      { key: "stewardVetting", href: "/stewards" },
      { key: "veterinary", href: "/how-it-works" },
      { key: "faq", href: "/faq" },
    ],
  },
  {
    titleKey: "company",
    links: [
      { key: "about", href: "/about" },
      { key: "legal", href: "/terms" },
      { key: "press", href: "/about" },
      { key: "contact", href: "/contact" },
    ],
  },
] as const;

export async function Footer() {
  const t = await getTranslations("footer");
  const locale = await getLocale();
  const { items } = await listPublicOfferings({ limit: 3, status: "all" });

  return (
    <footer className="border-t border-border-light bg-cream">
      <Container>
        <div className="flex flex-col gap-16 py-20 pb-12">
          {/* Top: brand + link columns */}
          <div className="flex flex-col gap-12 lg:flex-row lg:justify-between lg:gap-20">
            {/* Brand */}
            <div className="flex max-w-[320px] flex-col gap-6">
              <Logo />
              <p className="text-[13px] leading-[1.65] text-ink-tertiary">
                {t("description")}
              </p>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-12 sm:grid-cols-3 lg:gap-16">
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink">
                  {t("columns.investment.title")}
                </span>
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <li key={item.offeringId}>
                      <Link
                        href={`/plans/${item.offeringSlug}`}
                        className="text-[13px] leading-tight text-ink-tertiary transition-colors hover:text-ink"
                      >
                        {locale === "bn" ? item.planNameBn : item.planNameEn}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/plans"
                      className="text-[13px] leading-tight text-ink-tertiary transition-colors hover:text-ink"
                    >
                      {t("columns.investment.links.all")}
                    </Link>
                  </li>
                </ul>
              </div>
              {LINK_GROUPS.map((group) => (
                <div key={group.titleKey} className="flex flex-col gap-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink">
                    {t(`columns.${group.titleKey}.title`)}
                  </span>
                  <ul className="flex flex-col gap-3">
                    {group.links.map((link) => (
                      <li key={link.key}>
                        <Link
                          href={link.href}
                          className="text-[13px] leading-tight text-ink-tertiary transition-colors hover:text-ink"
                        >
                          {t(`columns.${group.titleKey}.links.${link.key}`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col items-start gap-4 border-t border-border-light pt-8 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[12px] leading-tight text-ink-muted">
              {t("bottom.copyright")}
            </span>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
              <Link
                href="/privacy"
                className="text-[12px] leading-tight text-ink-muted transition-colors hover:text-ink"
              >
                {t("bottom.privacy")}
              </Link>
              <Link
                href="/terms"
                className="text-[12px] leading-tight text-ink-muted transition-colors hover:text-ink"
              >
                {t("bottom.terms")}
              </Link>
              <span className="text-[12px] font-semibold leading-tight text-[#5C6B53]">
                {t("bottom.madeIn")}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}