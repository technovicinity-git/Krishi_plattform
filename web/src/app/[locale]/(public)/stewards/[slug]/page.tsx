import { notFound } from "next/navigation";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { findPublicStewardBySlug } from "@/lib/public/stewards";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { StarIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { planImageUrl } from "@/lib/admin/plan-helpers";
import { formatBDT } from "@/lib/utils";
import { getStewardRatings, getStewardReviews } from "@/lib/reviews";
import { Stars } from "@/components/reviews/Stars";
import { ReviewList } from "@/components/reviews/ReviewList";

export const dynamic = "force-dynamic";

function buildOfferingSlug(
  planSlug: string,
  districtSlug: string,
  stewardName: string,
): string {
  const steward = stewardName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${planSlug}-${districtSlug}-${steward}`;
}

export default async function StewardProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const steward = await findPublicStewardBySlug(slug);
  if (!steward) notFound();

  const locale = await getLocale();
  const t = await getTranslations("app.stewardProfile");
  const bn = locale === "bn";
  const profile = Array.isArray(steward.steward_profiles)
    ? steward.steward_profiles[0]
    : steward.steward_profiles;

  // Supabase may type this many-to-one join as an array; normalise it.
  const rawDistrict = profile?.districts as unknown;
  const district = (Array.isArray(rawDistrict) ? rawDistrict[0] : rawDistrict) as
    | { name_en: string | null; name_bn: string | null }
    | null
    | undefined;

  // Supabase can't infer the shape of this join; describe what we selected.
  type PublicOffering = {
    id: string;
    status: string;
    investment_plans: {
      status: string;
      slug: string;
      name_en: string;
      name_bn: string | null;
      duration_months: number;
      image_path: string | null;
      estimated_roi_min: number;
      estimated_roi_max: number;
      unit_price: number;
      districts: { slug: string | null; name_en: string | null; name_bn: string | null } | null;
    } | null;
  };
  const allOfferings = (steward.steward_plan_offerings ?? []) as unknown as PublicOffering[];
  const activeOfferings = allOfferings.filter(
    (o) => o.status === "approved" && o.investment_plans?.status === "open",
  );

  const operatingArea = profile
    ? [profile.upazila, (bn ? district?.name_bn : null) ?? district?.name_en].filter(Boolean).join(", ")
    : t("bangladesh");

  const [ratingMap, reviews] = await Promise.all([
    getStewardRatings([steward.id]),
    getStewardReviews(steward.id),
  ]);
  const rating = ratingMap.get(steward.id) ?? null;
  const tr = await getTranslations("app.review");

  const categories: string[] = profile?.categories ?? [];
  const experience: string = profile?.experience ?? "";
  const stewardName = steward.full_name ?? t("steward");
  const isOrg = profile?.steward_type === "organization";

  return (
    <>
      {/* HERO */}
      <section className="bg-cream">
        <Container>
          <div className="grid grid-cols-1 gap-12 pt-14 pb-16 md:pt-16 lg:grid-cols-[minmax(0,1fr)_480px]">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-green-olive">
                  {t("steward")}
                </span>
                <h1 className="font-serif text-[36px] leading-[1.1] text-ink sm:text-[44px] lg:text-[52px]">
                  {stewardName}
                </h1>
                <div className="text-[13px] font-semibold text-sage">
                  {isOrg ? t("typeOrgLong") : t("typeIndividualLong")}
                </div>
                <p className="text-[13px] text-ink-secondary">{operatingArea}</p>
                {rating ? (
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                    <Stars value={rating.avg} size={15} label={tr("avgLabel", { avg: rating.avg.toFixed(1) })} />
                    {rating.avg.toFixed(1)}
                    <span className="font-medium text-ink-muted">· {tr("count", { count: rating.count })}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-muted">
                    <StarIcon className="h-3.5 w-3.5 text-brand" />
                    {t("noReviews")}
                  </div>
                )}
              </div>
              <p className="max-w-[560px] text-[15px] leading-[1.65] text-ink-secondary">
                {experience ||
                  t("defaultExperience")}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/plans"
                  className="inline-flex h-[48px] items-center justify-center rounded-[4px] bg-brand px-6 text-[13px] font-bold text-white hover:bg-brand-hover"
                >
                  {t("exploreOpportunities")}
                </Link>
                <Link
                  href="/stewards"
                  className="inline-flex h-[48px] items-center justify-center rounded-[4px] border border-border-light px-6 text-[13px] font-semibold text-ink-nav hover:bg-stone"
                >
                  {t("backToStewards")}
                </Link>
              </div>
            </div>
            <div className="relative aspect-[480/560] w-full overflow-hidden rounded-2xl bg-stone">
              <Image
                src="/images/why-visual.png"
                alt={stewardName}
                fill
                sizes="(min-width: 1024px) 480px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ABOUT */}
      {experience && (
        <section className="bg-stone/40 py-16">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-green-olive">
                  {t("aboutEyebrow")}
                </span>
                <h2 className="mt-3 font-serif text-[28px] leading-tight text-ink md:text-[36px]">
                  {t("aboutHeading")}
                </h2>
              </div>
              <div>
                <p className="whitespace-pre-line text-[15px] leading-[1.65] text-ink-secondary">
                  {experience}
                </p>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* AT A GLANCE */}
      <section className="bg-cream py-16">
        <Container>
          <h2 className="font-serif text-[28px] leading-tight text-ink md:text-[36px]">
            {t("atAGlance")}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <GlanceCard label={t("operatingArea")} value={operatingArea} />
            <GlanceCard
              label={t("livestockFocus")}
              value={categories.length ? categories.join(", ") : "—"}
            />
            <GlanceCard
              label={t("stewardType")}
              value={isOrg ? t("typeOrg") : t("typeIndividual")}
            />
            <GlanceCard
              label={t("currentOpportunities")}
              value={String(activeOfferings.length)}
            />
          </div>
        </Container>
      </section>

      {/* REVIEWS */}
      <section className="bg-stone/40 py-16">
        <Container>
          <h2 className="font-serif text-[28px] leading-tight text-ink md:text-[36px]">
            {t("reviewsHeading")}
          </h2>
          <p className="mt-2 text-[13px] text-ink-secondary">
            {t("reviewsSubtitle")}
          </p>
          {rating && reviews.length > 0 ? (
            <div className="mt-8">
              <ReviewList rating={rating} reviews={reviews} />
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-border-light bg-white p-10 text-center">
              <StarIcon className="mx-auto h-8 w-8 text-ink-muted/40" />
              <p className="mt-3 text-[14px] font-semibold text-ink-secondary">
                {t("noReviews")}
              </p>
              <p className="mt-1 text-[12px] text-ink-muted">
                {t("reviewsEmpty")}
              </p>
            </div>
          )}
        </Container>
      </section>

      {/* CURRENT OPPORTUNITIES */}
      <section className="bg-cream py-16">
        <Container>
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-green-olive">
              {t("opportunitiesEyebrow")}
            </span>
            <h2 className="font-serif text-[28px] leading-tight text-ink md:text-[36px]">
              {t("plansBy", { name: stewardName })}
            </h2>
            <p className="text-[13px] text-ink-secondary">
              {t("plansSubtitle")}
            </p>
          </div>

          {activeOfferings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border-light bg-stone p-12 text-center">
              <p className="text-[14px] font-semibold text-ink-secondary">
                {t("noOpportunities")}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeOfferings.map((o) => {
                const plan = o.investment_plans;
                if (!plan) return null;
                const districtSlug = plan.districts?.slug ?? "district";
                const offeringSlug = buildOfferingSlug(
                  plan.slug,
                  districtSlug,
                  stewardName,
                );
                const planName =
                  (locale === "bn" ? plan.name_bn : null) ?? plan.name_en;
                const imageUrl = planImageUrl(plan.image_path);
                return (
                  <article
                    key={o.id}
                    className="flex flex-col overflow-hidden rounded-[8px] border border-border-card bg-white"
                  >
                    <div className="relative aspect-[410/220] w-full bg-stone">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={planName}
                          fill
                          sizes="(min-width: 1024px) 410px, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[12px] text-ink-muted">
                          {t("noImage")}
                        </div>
                      )}
                      <div className="absolute right-4 top-4">
                        <Badge variant="approved">
                          {t("acceptingInvestors")}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 p-6">
                      <div>
                        <h3 className="font-serif text-[22px] leading-[1.35] text-ink">
                          {planName}
                        </h3>
                        <p className="mt-1 text-[12px] text-ink-muted">
                          {(bn ? plan.districts?.name_bn : null) ?? plan.districts?.name_en} ·{" "}
                          {t("months", { count: plan.duration_months })}
                        </p>
                      </div>
                      <div className="border-y border-stone py-3">
                        <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.02em] text-ink-muted">
                          {t("estimatedRoi")}
                        </span>
                        <div className="mt-1 text-[22px] font-bold text-ink">
                          {plan.estimated_roi_min}–{plan.estimated_roi_max}%
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.02em] text-ink-muted">
                          {t("perUnit")}
                        </span>
                        <div className="mt-1 text-[20px] font-bold text-ink">
                          {formatBDT(Number(plan.unit_price))}
                        </div>
                      </div>
                      <Link
                        href={`/plans/${offeringSlug}`}
                        className="mt-1 inline-flex h-[44px] w-full items-center justify-center rounded-[4px] bg-ink text-[13px] font-semibold text-white hover:bg-[#2A2A2A]"
                      >
                        {t("viewPlan")}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      {/* HOW THEY SUPPORT */}
      <section className="bg-stone/40 py-16">
        <Container>
          <h2 className="font-serif text-[28px] leading-tight text-ink md:text-[36px]">
            {t("supportHeading")}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SupportCard
              n="01"
              title={t("support1Title")}
              body={t("support1Body")}
            />
            <SupportCard
              n="02"
              title={t("support2Title")}
              body={t("support2Body")}
            />
            <SupportCard
              n="03"
              title={t("support3Title")}
              body={t("support3Body")}
            />
            <SupportCard
              n="04"
              title={t("support4Title")}
              body={t("support4Body")}
            />
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="bg-ink py-20">
        <Container>
          <div className="mx-auto flex max-w-[820px] flex-col items-center gap-6 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-white/60">
              {t("ctaEyebrow")}
            </span>
            <h2 className="font-serif text-[32px] leading-[1.15] text-white md:text-[48px]">
              {t("ctaHeading")}
            </h2>
            <p className="max-w-[620px] text-[14px] leading-[1.65] text-white/70">
              {t("ctaBody")}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/plans"
                className="inline-flex h-[48px] items-center justify-center rounded-[4px] bg-brand px-6 text-[13px] font-bold text-white hover:bg-brand-hover"
              >
                {t("explorePlans")}
              </Link>
              <Link
                href="/stewards"
                className="inline-flex h-[48px] items-center justify-center rounded-[4px] border border-white/30 px-6 text-[13px] font-semibold text-white hover:bg-white/10"
              >
                {t("otherStewards")}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function GlanceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-light bg-white p-6">
      <span className="text-[10px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
        {label}
      </span>
      <div className="mt-2 text-[15px] font-semibold capitalize text-ink">
        {value}
      </div>
    </div>
  );
}

function SupportCard({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border-light bg-white p-6">
      <span className="text-[11px] font-bold text-brand">{n}</span>
      <h3 className="mt-2 text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-[13px] leading-[1.6] text-ink-secondary">
        {body}
      </p>
    </div>
  );
}