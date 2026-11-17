import { cn } from "@/lib/cn";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Page content container.
 * Max width 1440px, gutter 80px on desktop (matches Figma).
 */
export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1440px] px-5 sm:px-8 md:px-12 lg:px-20",
        className,
      )}
    >
      {children}
    </div>
  );
}