import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  const t = useTranslations("app.userMenu");
  return (
    <Link
      href="/"
      aria-label={t("home")}
      className={cn("relative block h-[62px] w-[168px]", className)}
    >
      <Image
        src="/logo.png"
        alt={t("brand")}
        fill
        priority
        sizes="168px"
        className="object-contain object-left"
      />
    </Link>
  );
}