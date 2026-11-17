import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Krishi — home"
      className={cn("relative block h-[62px] w-[168px]", className)}
    >
      <Image
        src="/logo.png"
        alt="Krishi"
        fill
        priority
        sizes="168px"
        className="object-contain object-left"
      />
    </Link>
  );
}