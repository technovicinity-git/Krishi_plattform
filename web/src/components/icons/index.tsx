import { cn } from "@/lib/cn";

interface IconProps {
  className?: string;
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-3 w-3", className)}
      aria-hidden="true"
    >
      <path d="M2 6l3 3 5-6" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

export function AlertTriangleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-[18px] w-[18px]", className)}
      aria-hidden="true"
    >
      <path d="M9 2L1.5 15.5h15L9 2z" />
      <path d="M9 7v4" />
      <circle cx="9" cy="13" r="0.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Circle bullet with a check inside — used for the "verified spending" checklist.
 */
export function CheckBullet({ className }: IconProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-green-olive text-white",
        className,
      )}
    >
      <CheckIcon className="h-3 w-3" />
    </span>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={cn("h-5 w-5", className)} aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={cn("h-3.5 w-3.5", className)} aria-hidden="true">
      <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" />
      <circle cx="7" cy="7" r="1.8" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={cn("h-5 w-5", className)} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={cn("h-5 w-5", className)} aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={cn("h-3 w-3", className)} aria-hidden="true">
      <path d="M5 2H2v8h8V7M7 2h3v3M10 2L5 7" />
    </svg>
  );
}

/** Small green check circle used in role cards and info boxes */
export function CheckCircle({ className }: IconProps) {
  return (
    <span className={cn(
      "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-green-olive text-white",
      className,
    )}>
      <svg viewBox="0 0 10 10" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="h-2.5 w-2.5" aria-hidden="true">
        <path d="M1.5 5l2.5 2.5 4.5-5" />
      </svg>
    </span>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={cn("h-4 w-4", className)} aria-hidden="true">
      <path d="M8 1.5L2.5 3.5v4c0 3.3 2.3 6 5.5 7 3.2-1 5.5-3.7 5.5-7v-4L8 1.5z" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={cn("h-4 w-4", className)} aria-hidden="true">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l4 4" />
    </svg>
  );
}

export function XCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={cn("h-3 w-3", className)} aria-hidden="true">
      <circle cx="6" cy="6" r="5" />
      <path d="M4 4l4 4M8 4l-4 4" />
    </svg>
  );
}

export function ActivityIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={cn("h-4 w-4", className)} aria-hidden="true">
      <path d="M2 8h3l2-5 3 10 2-5h2" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      <path d="M8 1.5l2.05 4.15 4.58.67-3.31 3.23.78 4.56L8 11.97l-4.1 2.14.78-4.56L1.37 6.32l4.58-.67L8 1.5z" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

export function ArrowDownIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      <path d="M8 3v10M4 9l4 4 4-4" />
    </svg>
  );
}

export function PaperclipIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5", className)}
      aria-hidden="true"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export function CheckCircleOutlineIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}

export function InfoCircleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8h.01M11 12h1v4h1" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}