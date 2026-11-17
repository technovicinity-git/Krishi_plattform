import { cn } from "@/lib/cn";

type SectionSize = "sm" | "md" | "lg" | "xl" | "2xl";

interface SectionProps {
  children: React.ReactNode;
  size?: SectionSize;
  className?: string;
  id?: string;
}

const sizeMap: Record<SectionSize, string> = {
  sm:  "py-16",          // 64px
  md:  "py-20",          // 80px
  lg:  "py-[100px]",     // 100px
  xl:  "py-[120px]",     // 120px
  "2xl": "py-[140px]",   // 140px
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