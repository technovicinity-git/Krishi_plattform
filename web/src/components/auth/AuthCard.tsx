import { cn } from "@/lib/cn";

interface AuthCardProps {
  children: React.ReactNode;
  width?: "md" | "lg";
  className?: string;
}

export function AuthCard({ children, width = "md", className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-border-light bg-white",
        width === "md" && "max-w-[720px]",
        width === "lg" && "max-w-[860px]",
        "px-8 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14",
        className,
      )}
    >
      {children}
    </div>
  );
}