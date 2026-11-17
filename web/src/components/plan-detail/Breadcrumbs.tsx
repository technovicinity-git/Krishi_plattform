import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";

export function Breadcrumbs({ planTitle }: { planTitle: string }) {
  const t = useTranslations("planDetail.breadcrumbs");

  return (
    <Container>
      <div className="flex items-center gap-2 pt-6 pb-2 text-[13px]">
        <Link href="/plans" className="font-medium text-ink-muted hover:text-ink">
          {t("home")}
        </Link>
        <span className="text-ink-muted">/</span>
        <span className="font-semibold text-ink">{planTitle}</span>
      </div>
    </Container>
  );
}