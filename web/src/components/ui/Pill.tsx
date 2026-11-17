import { cn } from "@/lib/cn";

export function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-[2px] bg-stone px-3 py-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.01em] text-sage",
        className,
      )}
    >
      {children}
    </span>
  );
}