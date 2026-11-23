import NextLink from "next/link";
import { Link as LocaleLink } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { NavIcon, type NavIconName } from "./NavIcon";

/*
 * Building blocks shared by every dashboard page so the investor, steward,
 * farmer and admin panels look the same. All are server-safe (no hooks).
 */

function AnyLink({
  localized = true,
  ...props
}: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  localized?: boolean;
  href: string;
}) {
  return localized ? <LocaleLink {...props} /> : <NextLink {...props} />;
}

/* ─── Page header ─────────────────────────────────────────── */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** A <BackLink> rendered above the title. */
  back?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {back}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          {eyebrow && (
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-brand">
              {eyebrow}
            </span>
          )}
          <h1 className="font-serif text-[28px] leading-[1.15] text-ink lg:text-[32px]">
            {title}
          </h1>
          {description && (
            <p className="max-w-[640px] text-[14px] leading-[1.6] text-ink-secondary">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ─── Buttons (as links) ──────────────────────────────────── */

const BUTTON = {
  primary:
    "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand/40",
  secondary:
    "border border-border-light bg-white text-ink-nav hover:bg-stone focus-visible:ring-brand/30",
} as const;

export function buttonClass(variant: keyof typeof BUTTON = "primary", className?: string) {
  return cn(
    "inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] px-5 text-[13px] font-bold transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-60",
    BUTTON[variant],
    className,
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  localized,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof BUTTON;
  localized?: boolean;
  className?: string;
}) {
  return (
    <AnyLink href={href} localized={localized} className={buttonClass(variant, className)}>
      {children}
    </AnyLink>
  );
}

/* ─── Row actions (table action cells) ────────────────────── */

/**
 * A small action button for a table row ("Edit", "View", "Review").
 * `primary` is filled (the row's main action); the default is outlined.
 * Put several in a <RowActions> so they line up on the right.
 */
export function RowAction({
  href,
  children,
  icon,
  primary = false,
  localized = false,
}: {
  href: string;
  children: React.ReactNode;
  icon?: NavIconName;
  primary?: boolean;
  localized?: boolean;
}) {
  return (
    <AnyLink
      href={href}
      localized={localized}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
        primary
          ? "bg-brand text-white hover:bg-brand-hover"
          : "border border-border-light bg-white text-ink-nav hover:border-brand/40 hover:bg-brand-tint hover:text-green-deep",
      )}
    >
      {icon && <NavIcon name={icon} className="h-[15px] w-[15px]" />}
      {children}
    </AnyLink>
  );
}

export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-2">{children}</div>;
}

/* ─── Stat card ───────────────────────────────────────────── */

const STAT_TONE = {
  default: "border-border-light",
  brand: "border-brand/40 ring-1 ring-brand/15",
  warning: "border-[#F0D9A6]",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  tone = "default",
  localized,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: NavIconName;
  href?: string;
  tone?: keyof typeof STAT_TONE;
  localized?: boolean;
}) {
  const body = (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border bg-white p-5 transition-colors",
        STAT_TONE[tone],
        href && "hover:border-brand/50 hover:bg-brand-tint/40",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
          {label}
        </span>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-tint text-brand">
            <NavIcon name={icon} className="h-4 w-4" />
          </span>
        )}
      </div>
      <span className="font-serif text-[34px] leading-none text-ink">{value}</span>
      {hint && <span className="text-[12px] text-ink-secondary">{hint}</span>}
    </div>
  );
  return href ? (
    <AnyLink href={href} localized={localized} className="block">
      {body}
    </AnyLink>
  ) : (
    body
  );
}

/* ─── Panel (titled card) ─────────────────────────────────── */

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border-light bg-white", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-light px-6 py-4">
          <div className="flex flex-col gap-0.5">
            {title && (
              <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            )}
            {description && (
              <p className="text-[12.5px] text-ink-muted">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className={cn("p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Label / value row for detail panels. */
export function DetailRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-light py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="shrink-0 text-[12.5px] text-ink-muted">{label}</span>
      <span className="text-right text-[13px] font-medium text-ink">{value}</span>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────── */

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: {
  icon?: NavIconName;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-light bg-white px-8 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand">
        <NavIcon name={icon} className="h-[22px] w-[22px]" />
      </span>
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && (
        <p className="max-w-[420px] text-[13px] leading-[1.6] text-ink-secondary">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ─── Status badge ────────────────────────────────────────── */

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info";

const BADGE_TONE: Record<BadgeTone, string> = {
  success: "bg-[#E8F0EA] text-green-deep",
  warning: "bg-[#FEF6E5] text-[#9A6B1F]",
  danger: "bg-[#FAF0ED] text-danger",
  neutral: "bg-stone text-ink-secondary",
  info: "bg-[#EAF1F6] text-[#2F5D7C]",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.04em]",
        BADGE_TONE[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {children}
    </span>
  );
}

/** Map common workflow statuses/stages to a badge tone. */
export function toneFor(status: string): BadgeTone {
  switch (status) {
    case "approved":
    case "active":
    case "verified":
    case "converted":
    case "disbursed":
    case "growing_care":
    case "sold":
    case "settled":
      return "success";
    case "rejected":
    case "not_approved":
    case "requires_update":
    case "failure":
      return "danger";
    case "expired":
    case "cancelled":
    case "closed":
    case "paused":
    case "not_started":
      return "neutral";
    case "sale_pending":
      return "info";
    default:
      return "warning";
  }
}

/* ─── Tabs (link based) ───────────────────────────────────── */

export function Tabs({
  items,
  localized = true,
}: {
  items: { label: React.ReactNode; href: string; active: boolean; count?: number }[];
  localized?: boolean;
}) {
  return (
    <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-border-light bg-white p-1">
      {items.map((item) => (
        <AnyLink
          key={item.href}
          href={item.href}
          localized={localized}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-[13px] transition-colors",
            item.active
              ? "bg-brand font-semibold text-white"
              : "font-medium text-ink-secondary hover:bg-stone/60 hover:text-ink",
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                item.active ? "bg-white/25 text-white" : "bg-stone text-ink-secondary",
              )}
            >
              {item.count}
            </span>
          )}
        </AnyLink>
      ))}
    </div>
  );
}
