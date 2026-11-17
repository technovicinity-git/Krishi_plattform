import { useLocale } from "next-intl";
import { cn } from "@/lib/cn";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";
type HeadingSize = "hero" | "section" | "subsection" | "card";
type HeadingVariant = "default" | "onDark";

const sizeMap: Record<HeadingSize, { en: string; bn: string }> = {
  hero: {
    en: "text-[38px] sm:text-[46px] md:text-[52px] lg:text-[60px] leading-[1.08] lg:leading-[1.1]",
    bn: "text-[26px] sm:text-[30px] md:text-[36px] lg:text-[42px] leading-[1.25] lg:leading-[1.28]",
  },
  section: {
    en: "text-[32px] sm:text-[42px] md:text-[48px] lg:text-[56px] leading-[1.05]",
    bn: "text-[24px] sm:text-[30px] md:text-[34px] lg:text-[42px] leading-[1.22]",
  },
  subsection: {
    en: "text-[20px] sm:text-[22px] lg:text-[28px] leading-[1.3]",
    bn: "text-[18px] sm:text-[20px] lg:text-[24px] leading-[1.4]",
  },
  card: {
    en: "text-[20px] lg:text-[22px] leading-[1.35]",
    bn: "text-[18px] lg:text-[20px] leading-[1.45]",
  },
};

const variantMap: Record<HeadingVariant, string> = {
  default: "text-ink",
  onDark: "text-cream",
};

interface HeadingProps {
  as?: HeadingLevel;
  size?: HeadingSize;
  variant?: HeadingVariant;
  children: React.ReactNode;
  className?: string;
}

export function Heading({
  as: Tag = "h2",
  size = "section",
  variant = "default",
  children,
  className,
}: HeadingProps) {
  const locale = useLocale();
  const isBn = locale === "bn";
  const sizes = sizeMap[size];

  return (
    <Tag
      className={cn(
        "font-serif",
        variantMap[variant],
        isBn ? sizes.bn : sizes.en,
        className,
      )}
    >
      {children}
    </Tag>
  );
}