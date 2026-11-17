import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BackLink } from "@/components/ui/BackLink";

interface OnboardingShellProps {
  children: React.ReactNode;
  /** Left column — heading + progress + optional context */
  aside: React.ReactNode;
  /** Right column — the form */
  main: React.ReactNode;
  exitLabel?: string;
}

export function OnboardingShell({
  children,
  aside,
  main,
  exitLabel,
}: OnboardingShellProps) {
  const t = useTranslations("onboarding.shell");
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
          <BackLink href="/portal/profile">{exitLabel ?? t("exitDefault")}</BackLink>
        </div>
      </header>

      <main className="flex flex-1 flex-col lg:flex-row">
        <aside className="w-full border-b border-border-light px-6 py-8 sm:px-10 lg:w-[440px] lg:shrink-0 lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
          {aside}
        </aside>
        <div className="flex flex-1 flex-col px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
          {main}
        </div>
      </main>

      {children}
    </div>
  );
}