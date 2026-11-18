import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { DetailRow, PageHeader, Panel, StatusBadge } from "@/components/dashboard/ui";
import { getStewardRatings, getStewardReviews } from "@/lib/reviews";
import { ReviewList } from "@/components/reviews/ReviewList";

export const dynamic = "force-dynamic";

interface NamePair {
  name_en: string | null;
  name_bn: string | null;
}

interface StewardProfileRow {
  steward_type: "individual" | "organization" | null;
  upazila: string | null;
  categories: string[] | null;
  experience: string | null;
  districts: NamePair | null;
  divisions: NamePair | null;
}

const KYC_LABEL_KEYS = {
  not_started: "kycStatusNotStarted",
  pending: "kycStatusPending",
  under_review: "kycStatusUnderReview",
  verified: "kycStatusVerified",
  rejected: "kycStatusRejected",
  requires_update: "kycStatusRequiresUpdate",
} as const;

export default async function StewardProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "steward") redirect("/portal/profile");

  const [ratingMap, myReviews, trv] = await Promise.all([
    getStewardRatings([user.id]),
    getStewardReviews(user.id, 50),
    getTranslations("app.review"),
  ]);
  const myRating = ratingMap.get(user.id) ?? null;
  const t = await getTranslations("app.stewardAccount");
  const tk = await getTranslations("portal.profile");
  const tr = await getTranslations("app.roles");
  const ts = await getTranslations("stewardRegister.step2");
  const bn = (await getLocale()) === "bn";

  const db = createAdminClient();
  const { data } = await db
    .from("steward_profiles")
    .select(
      `
      steward_type, upazila, categories, experience,
      districts ( name_en, name_bn ),
      divisions ( name_en, name_bn )
      `,
    )
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = data as unknown as StewardProfileRow | null;

  const localName = (n: NamePair | null) =>
    (bn ? n?.name_bn : n?.name_en) ?? n?.name_en ?? null;

  const area = profile
    ? [profile.upazila, localName(profile.districts), localName(profile.divisions)]
        .filter(Boolean)
        .join(", ")
    : "";

  const categories = (profile?.categories ?? [])
    .map((c) => (ts.has(`categories.${c}`) ? ts(`categories.${c}`) : c))
    .join(", ");

  const kycVerified = user.kycStatus === "verified";

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title={t("account")}>
          <Row label={t("accountType")} value={tr("steward")} />
          <Row label={t("fullName")} value={user.fullName ?? "—"} />
          <Row label={t("phone")} value={user.phone ?? "—"} />
          <Row label={t("email")} value={user.email ?? t("notProvided")} />
          <Link
            href="/steward/settings"
            className="mt-4 text-[13px] font-semibold text-brand hover:underline"
          >
            {t("editAccount")}
          </Link>
        </Card>

        <Card title={t("kyc")}>
          <Row
            label={t("kycStatus")}
            value={tk(KYC_LABEL_KEYS[user.kycStatus] ?? "kycStatusNotStarted")}
            accent={kycVerified}
          />
          {!kycVerified && (
            <Link
              href="/onboarding/kyc"
              className="mt-4 inline-flex h-[42px] w-fit items-center justify-center rounded-[8px] bg-brand px-5 text-[13px] font-bold text-white hover:bg-brand-hover"
            >
              {user.kycStatus === "not_started"
                ? tk("kycCta")
                : user.kycStatus === "rejected" || user.kycStatus === "requires_update"
                  ? tk("kycCtaResubmit")
                  : tk("kycCtaView")}
            </Link>
          )}
        </Card>
      </div>

      <Card title={t("details")}>
        {profile ? (
          <>
            <Row
              label={t("type")}
              value={
                profile.steward_type === "organization"
                  ? ts("typeOrganization")
                  : ts("typeIndividual")
              }
            />
            <Row label={t("area")} value={area || "—"} />
            <Row label={t("categories")} value={categories || "—"} />
            {profile.experience && (
              <div className="flex flex-col gap-1.5 pt-3">
                <span className="text-[12px] text-ink-muted">
                  {t("experience")}
                </span>
                <p className="whitespace-pre-line text-[13px] leading-[1.6] text-ink">
                  {profile.experience}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[13px] text-ink-muted">{t("noDetails")}</p>
            <Link
              href="/steward/register/details"
              className="text-[13px] font-semibold text-brand hover:underline"
            >
              {t("completeDetails")}
            </Link>
          </div>
        )}
      </Card>

      <Panel title={trv("yourReviews")}>
        {myRating ? (
          <ReviewList rating={myRating} reviews={myReviews} />
        ) : (
          <p className="text-[13px] text-ink-muted">{trv("noneYet")}</p>
        )}
      </Panel>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel title={title} className="h-fit" bodyClassName="flex flex-col gap-0 p-6">
      {children}
    </Panel>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <DetailRow
      label={label}
      value={accent ? <StatusBadge tone="success">{value}</StatusBadge> : value}
    />
  );
}
