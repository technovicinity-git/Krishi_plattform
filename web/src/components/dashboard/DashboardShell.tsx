import Image from "next/image";
import NextLink from "next/link";
import { Link as LocaleLink } from "@/i18n/navigation";
import { UserMenu } from "@/components/layout/UserMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  DashboardMobileNav,
  DashboardSidebar,
  type DashboardNavSection,
} from "./DashboardNav";

export interface DashboardShellProps {
  children: React.ReactNode;
  /** Short role name shown as a badge next to the logo, e.g. "Steward". */
  roleLabel: string;
  /** Sidebar heading (e.g. "Steward Console") and optional sub-line. */
  title: string;
  subtitle?: string;
  sections: DashboardNavSection[];
  lockedLabel?: string;
  user: { fullName: string; phone?: string | null };
  /** Extra links in the avatar menu. Hrefs are unprefixed paths. */
  menuItems: { label: string; href: string }[];
  /** Locale of the page; "bn" is the unprefixed default. Omit for the admin console. */
  locale?: string;
  logoutEndpoint?: string;
  logoutRedirect: string;
  labels: { signOut: string; signingOut: string; home: string; brand: string };
  /** Extra header controls before the language switch, e.g. a notification bell. */
  headerActions?: React.ReactNode;
}

/**
 * Shared frame for every signed-in panel (investor, steward, farmer, admin):
 * sticky header with logo, role badge, language switch and avatar menu; a
 * green-accented sidebar on desktop and a scrolling pill nav on mobile.
 */
export function DashboardShell({
  children,
  roleLabel,
  title,
  subtitle,
  sections,
  lockedLabel,
  user,
  menuItems,
  locale,
  logoutEndpoint = "/api/auth/logout",
  logoutRedirect,
  labels,
  headerActions,
}: DashboardShellProps) {
  const localized = locale !== undefined;
  // The avatar menu uses plain links, so add the /en prefix ourselves.
  const prefix = localized && locale !== "bn" ? `/${locale}` : "";
  const menu = menuItems.map((m) => ({ ...m, href: prefix + m.href }));
  const homeHref = localized ? "/" : sections[0]?.items[0]?.href ?? "/";
  const HomeLink = localized ? LocaleLink : NextLink;

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 h-16 border-b border-border-light bg-white/95 backdrop-blur">
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <HomeLink
              href={homeHref}
              aria-label={labels.home}
              className="relative block h-9 w-[100px] shrink-0"
            >
              <Image
                src="/logo.png"
                alt={labels.brand}
                fill
                priority
                sizes="100px"
                className="object-contain object-left"
              />
            </HomeLink>
            <span className="h-5 w-px bg-border-light" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-green-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {headerActions}
            {localized && <LanguageSwitcher className="hidden sm:inline-flex" />}
            <UserMenu
              fullName={user.fullName}
              phone={user.phone}
              items={menu}
              logoutEndpoint={logoutEndpoint}
              logoutRedirect={logoutRedirect}
            />
          </div>
        </div>
      </header>

      <div className="flex">
        <DashboardSidebar
          sections={sections}
          localized={localized}
          lockedLabel={lockedLabel}
          title={title}
          subtitle={subtitle}
          signOutLabel={labels.signOut}
          signingOutLabel={labels.signingOut}
          logoutEndpoint={logoutEndpoint}
          logoutRedirect={logoutRedirect}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardMobileNav sections={sections} localized={localized} />
          {localized && (
            <div className="flex justify-end px-4 pt-4 sm:hidden">
              <LanguageSwitcher />
            </div>
          )}
          <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
