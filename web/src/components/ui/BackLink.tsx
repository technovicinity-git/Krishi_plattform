import NextLink from "next/link";
import { Link as LocaleLink } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const BASE =
  "group inline-flex w-fit items-center gap-2 text-[13px] font-semibold text-ink-secondary transition-colors hover:text-ink focus:outline-none focus-visible:text-ink disabled:opacity-60";

function BackChevron() {
  return (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-light bg-white text-ink-secondary transition-colors group-hover:border-brand group-hover:bg-brand-tint group-hover:text-brand group-focus-visible:ring-2 group-focus-visible:ring-brand/40"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
      >
        <path d="M10 3.5L5.5 8l4.5 4.5" />
      </svg>
    </span>
  );
}

interface BackLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  /**
   * Use the locale-aware link (keeps the /en prefix). Set to false for routes
   * outside [locale], such as the admin console.
   */
  localized?: boolean;
}

/** Consistent "Back to …" link: a circled chevron followed by the label. */
export function BackLink({ href, children, className, localized = true }: BackLinkProps) {
  const LinkComponent = localized ? LocaleLink : NextLink;
  return (
    <LinkComponent href={href} className={cn(BASE, className)}>
      <BackChevron />
      <span>{children}</span>
    </LinkComponent>
  );
}

/** Same look as BackLink, for in-page "go back a step" actions. */
export function BackButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={cn(BASE, className)}>
      <BackChevron />
      <span>{children}</span>
    </button>
  );
}
