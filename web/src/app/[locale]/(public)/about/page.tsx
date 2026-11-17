import { AboutHero } from "@/components/about/AboutHero";
import { WhyKrishiExists } from "@/components/about/WhyKrishiExists";
import { ConnectedJourney } from "@/components/about/ConnectedJourney";
import { InvestmentLifecycle } from "@/components/about/InvestmentLifecycle";
import { Transparency } from "@/components/about/Transparency";
import { ClearRoles } from "@/components/about/ClearRoles";
import { InvestmentAllocation } from "@/components/about/InvestmentAllocation";
import { RealLivestock } from "@/components/about/RealLivestock";
import { Principles } from "@/components/about/Principles";
import { HonestReturns } from "@/components/about/HonestReturns";
import { IsIsNot } from "@/components/about/IsIsNot";
import { MeetStewardsCta } from "@/components/about/MeetStewardsCta";
import { AboutFinalCta } from "@/components/about/AboutFinalCta";

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <WhyKrishiExists />
      <ConnectedJourney />
      <InvestmentLifecycle />
      <Transparency />
      <ClearRoles />
      <InvestmentAllocation />
      <RealLivestock />
      <Principles />
      <HonestReturns />
      <IsIsNot />
      <MeetStewardsCta />
      <AboutFinalCta />
    </>
  );
}