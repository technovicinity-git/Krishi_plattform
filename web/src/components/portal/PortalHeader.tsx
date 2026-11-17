"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { UserMenu } from "@/components/layout/UserMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { BackLink } from "@/components/ui/BackLink";

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
  const locale = useLocale();

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
          <div className="hidden sm:block">
            <BackLink href="/">{t("backToKrishi")}</BackLink>
          </div>

          <LanguageSwitcher />

          <UserMenu fullName={fullName} phone={phone} items={menuItems} logoutRedirect={locale === "bn" ? "/login" : "/en/login"} />
        </div>
      </div>
    </header>
  );
}