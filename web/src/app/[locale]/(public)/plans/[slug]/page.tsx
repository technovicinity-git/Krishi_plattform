import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/plan-detail/Breadcrumbs";
import { Hero } from "@/components/plan-detail/Hero";
import { AllocationSection } from "@/components/plan-detail/AllocationSection";
import { LifecycleSection } from "@/components/plan-detail/LifecycleSection";
import { EstimatedReturn } from "@/components/plan-detail/EstimatedReturn";
import { ProfitSharingSection } from "@/components/plan-detail/ProfitSharingSection";
import { RealConnection } from "@/components/plan-detail/RealConnection";
import { JourneyPreview } from "@/components/plan-detail/JourneyPreview";
import { ExpenseLedger } from "@/components/plan-detail/ExpenseLedger";
import { PeopleCards } from "@/components/plan-detail/PeopleCards";
import { InvestmentSidebar } from "@/components/plan-detail/InvestmentSidebar";
import { DocumentsPanel } from "@/components/plan-detail/DocumentsPanel";
import { RiskCard } from "@/components/plan-detail/RiskCard";
import { FinalCta } from "@/components/plan-detail/FinalCta";
import { RelatedPlans } from "@/components/plan-detail/RelatedPlans";
import { findPublicOfferingBySlug } from "@/lib/public/plans";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const offering = await findPublicOfferingBySlug(slug);
  if (!offering) notFound();

  const locale = await getLocale();
  const title = locale === "bn" ? offering.planNameBn : offering.planNameEn;

  return (
    <>
      <Breadcrumbs planTitle={title} />
      <Hero offering={offering} title={title} />

      <section className="bg-cream pb-20">
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
            <div className="flex flex-col gap-20">
              <AllocationSection
                animalAllocation={offering.animalAllocation}
                careAllocation={offering.careAllocation}
                unitPrice={offering.unitPrice}
              />
              <LifecycleSection />
              <EstimatedReturn roiMin={offering.roiMin} roiMax={offering.roiMax} />
              <ProfitSharingSection />
              <RealConnection />
              <JourneyPreview />
              <ExpenseLedger />
              <PeopleCards
                stewardName={offering.steward.name}
                stewardId={offering.steward.id}
              />
            </div>

            <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
              <InvestmentSidebar offering={offering} />
              <DocumentsPanel />
              <RiskCard />
            </aside>
          </div>
        </Container>
      </section>

      <FinalCta />
      <RelatedPlans offeringId={offering.offeringId} />
    </>
  );
}