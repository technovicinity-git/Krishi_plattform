import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
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
import { findPublicOfferingBySlug } from "@/lib/public/plans";
import { RevealOnScroll } from "@/components/home/RevealOnScroll";
import { delay } from "@/components/home/motion";

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
            <div className="flex min-w-0 flex-col gap-20">
              <div data-reveal>
                <AllocationSection
                animalAllocation={offering.animalAllocation}
                careAllocation={offering.careAllocation}
                unitPrice={offering.unitPrice}
              />
              </div>
              <div data-reveal>
                <LifecycleSection />
              </div>
              <div data-reveal>
                <EstimatedReturn roiMin={offering.roiMin} roiMax={offering.roiMax} />
              </div>
              <div data-reveal>
                <ProfitSharingSection />
              </div>
              <div data-reveal>
                <RealConnection />
              </div>
              <div data-reveal>
                <JourneyPreview />
              </div>
              <div data-reveal>
                <ExpenseLedger />
              </div>
              <div data-reveal>
                <PeopleCards
                stewardName={offering.steward.name}
                stewardId={offering.steward.id}
              />
              </div>
              <div data-reveal>
                <DocumentsPanel />
              </div>
            </div>

            {/* Stays in view while the details scroll (short enough to fit the screen). */}
            <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
              <div data-reveal="right">
                <InvestmentSidebar offering={offering} />
              </div>
              <div data-reveal="right" style={delay(150)}>
                <RiskCard />
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <FinalCta />
      <RevealOnScroll />
    </>
  );
}