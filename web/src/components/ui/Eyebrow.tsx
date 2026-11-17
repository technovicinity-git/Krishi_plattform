import { cn } from "@/lib/cn";

type EyebrowVariant = "default" | "onDark";

const variantMap: Record<EyebrowVariant, string> = {
  default: "text-sage",
  onDark: "text-sage",
};

interface EyebrowProps {
  children: React.ReactNode;
  variant?: EyebrowVariant;
  className?: string;
}

export function Eyebrow({
  children,
  variant = "default",
  className,
}: EyebrowProps) {
  return (
    <span
      className={cn(
        "block text-[11px] font-semibold uppercase tracking-[0.02em]",
        variantMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}