import { PlansHero } from "@/components/plans/PlansHero";
import { PlanListing } from "@/components/plans/PlanListing";
import { TrustIndicators } from "@/components/plans/TrustIndicators";
import { PlansRiskDisclosure } from "@/components/plans/PlansRiskDisclosure";
import { listPublicOfferings, type PlanFilters } from "@/lib/public/plans";
import { RevealOnScroll } from "@/components/home/RevealOnScroll";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readStr(
  v: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function PlansPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = Number(readStr(params.page)) || 1;

  const { items, total, hasMore } = await listPublicOfferings({
    search: readStr(params.search),
    categorySlug: readStr(params.category),
    divisionSlug: readStr(params.division),
    districtSlug: readStr(params.district),
    thanaSlug: readStr(params.thana),
    // Unknown values are ignored by listPublicOfferings.
    durationBucket: readStr(params.duration) as PlanFilters["durationBucket"],
    roiBucket: readStr(params.roi) as PlanFilters["roiBucket"],
    status: (readStr(params.status) as PlanFilters["status"]) ?? "open",
    sort: readStr(params.sort) as PlanFilters["sort"],
    page,
    limit: 12,
  });

  return (
    <>
      <PlansHero />
      <PlanListing
        items={items}
        total={total}
        page={page}
        hasMore={hasMore}
      />
      <TrustIndicators />
      <PlansRiskDisclosure />
      <RevealOnScroll auto />
    </>
  );
}