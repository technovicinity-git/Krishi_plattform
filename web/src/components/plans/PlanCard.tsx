import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type BadgeVariant = "success" | "approved" | "neutral" | "funded";
type CtaVariant = "dark" | "outline" | "disabled";

interface FundingProgress {
  label: string;
  value: string;
  percentage: number;
}

interface PlanCardProps {
  image: string;
  imageAlt: string;
  title: string;
  meta: string;
  status: string;
  statusVariant: BadgeVariant;
  estimatedReturn: string;
  estimatedReturnLabel: string;
  investmentPerUnit: string;
  investmentPerUnitLabel: string;
  breakdown: string;
  fundingProgress?: FundingProgress;
  ctaLabel: string;
  ctaHref?: string;
  ctaVariant: CtaVariant;
  muted?: boolean;
}

export function PlanCard({
  image,
  imageAlt,
  title,
  meta,
  status,
  statusVariant,
  estimatedReturn,
  estimatedReturnLabel,
  investmentPerUnit,
  investmentPerUnitLabel,
  breakdown,
  fundingProgress,
  ctaLabel,
  ctaHref,
  ctaVariant,
  muted,
}: PlanCardProps) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border-card transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_18px_40px_-22px_rgba(0,0,0,0.3)]",
        muted ? "bg-cream" : "bg-white",
      )}
    >
      {/* Image + status badge */}
      <div className="relative aspect-[410/220] w-full overflow-hidden">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 410px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute right-4 top-4">
          <Badge variant={statusVariant}>{status}</Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-[18px] p-6">
        {/* Title + meta */}
        <div className="flex flex-col gap-1.5">
          <h3
            className={cn(
              "font-serif text-[22px] leading-[1.35]",
              muted ? "text-ink-tertiary" : "text-ink",
            )}
          >
            {title}
          </h3>
          <p className="text-[12px] leading-tight text-ink-muted">{meta}</p>
        </div>

        {/* Return */}
        <div className="flex flex-col gap-1 border-y border-stone py-4">
          <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.02em] text-ink-muted">
            {estimatedReturnLabel}
          </span>
          <span
            className={cn(
              "text-[28px] font-bold leading-[34px]",
              muted ? "text-[#C0BAB2]" : "text-ink",
            )}
          >
            {estimatedReturn}
          </span>
        </div>

        {/* Unit price */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.02em] text-ink-muted">
            {investmentPerUnitLabel}
          </span>
          <div className="flex items-baseline justify-between gap-3">
            <span
              className={cn(
                "text-[22px] font-bold leading-[27px]",
                muted ? "text-ink-muted" : "text-ink",
              )}
            >
              {investmentPerUnit}
            </span>
            <span className="text-right text-[11px] leading-tight text-ink-muted">
              {breakdown}
            </span>
          </div>
        </div>

        {/* Funding progress (optional) */}
        {fundingProgress && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.02em] text-ink-muted">
                {fundingProgress.label}
              </span>
              <span
                className={cn(
                  "text-[11px] font-bold leading-none",
                  ctaVariant === "disabled" ? "text-ink-muted" : "text-ink",
                )}
              >
                {fundingProgress.value}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone">
              {fundingProgress.percentage > 0 && (
                <div
                  className="k-grow-x h-full rounded-full bg-green-deep"
                  style={{ width: `${fundingProgress.percentage}%` }}
                />
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <CtaButton label={ctaLabel} href={ctaHref} variant={ctaVariant} />
      </div>
    </article>
  );
}

function CtaButton({
  label,
  href,
  variant,
}: {
  label: string;
  href?: string;
  variant: CtaVariant;
}) {
  const base =
    "mt-auto inline-flex h-[44px] w-full items-center justify-center rounded-[6px] text-[13px] font-semibold leading-none transition-colors duration-300";

  if (variant === "disabled" || !href) {
    return (
      <span className={cn(base, "bg-stone text-ink-muted cursor-not-allowed")}>
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        variant === "dark" && "bg-ink text-white hover:bg-brand",
        variant === "outline" &&
          "border border-[#8A8480] text-ink-secondary hover:bg-stone",
      )}
    >
      {label}
    </Link>
  );
}