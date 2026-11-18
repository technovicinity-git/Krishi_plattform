import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "dark" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
}

const variantMap: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover transition-colors",
  secondary:
    "bg-transparent text-ink-button border border-line-strong hover:bg-stone transition-colors",
  dark:
    "bg-ink text-white hover:bg-[#2A2A2A] transition-colors",
  outline:
    "bg-transparent text-ink-button-muted border border-line-soft hover:bg-stone transition-colors",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "px-[22px] py-[11px] text-[13px] font-semibold",
  md: "px-7 py-[19px] text-[15px] font-medium",
  lg: "px-9 py-5 text-[15px] font-bold",
};

/**
 * Button primitive.
 * Renders as <Link> when `href` is provided, otherwise as <button>.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className,
  type = "button",
  disabled,
  fullWidth,
  onClick,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-[5px] whitespace-nowrap",
    variantMap[variant],
    sizeMap[size],
    fullWidth && "w-full",
    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}