"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { UserMenu } from "@/components/layout/UserMenu";

interface PortalHeaderProps {
  fullName: string;
  phone?: string | null;
  menuItems: { label: string; href: string }[];
}

export function PortalHeader({
  fullName,
  phone,
  menuItems,
}: PortalHeaderProps) {
  const t = useTranslations("app.userMenu");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const switchLanguage = (newLocale: "bn" | "en") => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <header className="border-b border-border-light bg-white">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-3.5 sm:px-10 lg:px-12">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label={t("home")} className="relative block h-10 w-28">
            <Image
              src="/logo.png"
              alt={t("brand")}
              fill
              priority
              sizes="112px"
              className="object-contain object-left"
            />
          </Link>
          <span className="inline-flex items-center rounded-[4px] bg-[#E8F0EA] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.02em] text-green-deep">
            {t("portal")}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="hidden items-center gap-1.5 text-[13px] font-medium text-ink-nav hover:text-ink sm:inline-flex"
          >
            <span aria-hidden="true">←</span>
            {t("backToKrishi")}
          </Link>

          <div className="flex items-center gap-1.5 border-l border-border-light pl-5">
            <button
              onClick={() => switchLanguage("en")}
              className={locale === "en" ? "text-[12px] font-bold text-ink" : "text-[12px] text-ink-tertiary hover:text-ink"}
            >
              EN
            </button>
            <span className="text-[12px] text-ink-muted" aria-hidden="true">|</span>
            <button
              onClick={() => switchLanguage("bn")}
              className={locale === "bn" ? "text-[12px] font-bold text-ink" : "text-[12px] text-ink-tertiary hover:text-ink"}
            >
              বাংলা
            </button>
          </div>

          <UserMenu fullName={fullName} phone={phone} items={menuItems} logoutRedirect={locale === "bn" ? "/login" : "/en/login"} />
        </div>
      </div>
    </header>
  );
}