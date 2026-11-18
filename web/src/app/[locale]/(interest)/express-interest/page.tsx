import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findPublicOfferingById } from "@/lib/public/plans";
import { ExpressInterestForm } from "@/components/interest/ExpressInterestForm";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function ExpressInterestPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const offeringId = readStr(params.offering);
  const t = await getTranslations("app.expressInterest");

  if (!offeringId) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-4 px-6 py-24 text-center">
        <h1 className="font-serif text-[28px] text-ink">{t("choosePlanTitle")}</h1>
        <p className="text-[14px] text-ink-secondary">
          {t("choosePlanBody")}
        </p>
        <Link
          href="/plans"
          className="mt-4 inline-flex h-[44px] items-center justify-center rounded-[4px] bg-ink px-6 text-[13px] font-semibold text-white hover:bg-[#2A2A2A]"
        >
          {t("explorePlans")}
        </Link>
      </div>
    );
  }

  const offering = await findPublicOfferingById(offeringId);
  if (!offering) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-4 px-6 py-24 text-center">
        <h1 className="font-serif text-[28px] text-ink">{t("unavailableTitle")}</h1>
        <p className="text-[14px] text-ink-secondary">
          {t("unavailableBody")}
        </p>
        <Link
          href="/plans"
          className="mt-4 inline-flex h-[44px] items-center justify-center rounded-[4px] bg-ink px-6 text-[13px] font-semibold text-white hover:bg-[#2A2A2A]"
        >
          {t("explorePlans")}
        </Link>
      </div>
    );
  }

  const user = await getCurrentUser();
  const locale = await getLocale();
  const planName = locale === "bn" ? offering.planNameBn : offering.planNameEn;

  return (
    <ExpressInterestForm
      offering={offering}
      planName={planName}
      currentUser={
        user
          ? {
              id: user.id,
              role: user.role,
              fullName: user.fullName,
              phone: user.phone,
              email: user.email,
            }
          : null
      }
    />
  );
}