import { cn } from "@/lib/cn";

type SectionSize = "sm" | "md" | "lg" | "xl" | "2xl";

interface SectionProps {
  children: React.ReactNode;
  size?: SectionSize;
  className?: string;
  id?: string;
}

// Desktop keeps the Figma values; phones get tighter spacing so long pages
// don't turn into endless scrolling.
const sizeMap: Record<SectionSize, string> = {
  sm:  "py-12 md:py-16",               // 48 → 64px
  md:  "py-14 md:py-20",               // 56 → 80px
  lg:  "py-16 md:py-20 lg:py-[100px]", // 64 → 100px
  xl:  "py-16 md:py-24 lg:py-[120px]", // 64 → 120px
  "2xl": "py-20 md:py-28 lg:py-[140px]", // 80 → 140px
};

/**
 * Vertical rhythm wrapper for page sections.
 * Sizes map directly to the Figma values.
 */
export function Section({
  children,
  size = "xl",
  className,
  id,
}: SectionProps) {
  return (
    <section id={id} className={cn(sizeMap[size], className)}>
      {children}
    </section>
  );
}