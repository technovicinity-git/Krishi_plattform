import { cn } from "@/lib/cn";

type BadgeVariant = "success" | "neutral" | "approved" | "funded";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  success: "bg-green-deep text-white px-[10px] py-[5px] text-[9px]",
  neutral: "bg-stone text-ink-secondary px-[10px] py-[5px] text-[9px]",
  approved: "bg-[#E8F0EA] text-green-deep px-[10px] py-[5px] text-[9px]",
  funded: "bg-[#F5EBE6] text-terracotta px-[10px] py-[5px] text-[9px]",
};

export function Badge({
  children,
  variant = "success",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[2px] font-bold uppercase tracking-wide",
        variantMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}