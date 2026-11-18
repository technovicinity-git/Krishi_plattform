import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { BackLink } from "@/components/ui/BackLink";

interface AuthShellProps {
  children: React.ReactNode;
  /** Where the top-right back link goes. Defaults to "/" (homepage). */
  backHref?: string;
  /** Custom label for the back link. If omitted, uses the default translation. */
  backLabel?: string;
}

export function AuthShell({
  children,
  backHref = "/",
  backLabel,
}: AuthShellProps) {
  const t = useTranslations("authShell");
  const tu = useTranslations("app.userMenu");

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-border-light bg-cream">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-4 sm:px-10 lg:px-20">
          <Link href="/" aria-label={tu("home")} className="relative block h-10 w-32">
            <Image
              src="/logo.png"
              alt={tu("brand")}
              fill
              priority
              sizes="128px"
              className="object-contain object-left"
            />
          </Link>

          <div className="flex items-center gap-6">
            <BackLink href={backHref}>{backLabel ?? t("backToKrishi")}</BackLink>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-12 sm:px-10 lg:py-20">
        {children}
      </main>

      <footer className="border-t border-border-light bg-cream">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-20">
          <span className="text-[13px] text-ink-muted">{t("footerCopyright")}</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-[13px] text-ink-nav hover:text-ink">
              {t("privacy")}
            </Link>
            <Link href="/terms" className="text-[13px] text-ink-nav hover:text-ink">
              {t("terms")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}