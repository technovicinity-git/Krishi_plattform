import { useTranslations } from "next-intl";
import { Logo } from "@/components/layout/Logo";
import { BackLink } from "@/components/ui/BackLink";

export default function InterestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("app.userMenu");
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-border-light bg-cream">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 md:px-12 lg:px-20">
          <Logo />
          <BackLink href="/plans">{t("backToKrishi")}</BackLink>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}