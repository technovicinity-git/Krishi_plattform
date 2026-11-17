import { Hero } from "@/components/home/Hero";
import { Ecosystem } from "@/components/home/Ecosystem";
import { Opportunities } from "@/components/home/Opportunities";
import { Transparency } from "@/components/home/Transparency";
import { Lifecycle } from "@/components/home/Lifecycle";
import { DashboardPreview } from "@/components/home/DashboardPreview";
import { TrustGrid } from "@/components/home/TrustGrid";
import { RiskDisclosure } from "@/components/home/RiskDisclosure";
import { WhyKrishi } from "@/components/home/WhyKrishi";
import { Faq } from "@/components/home/Faq";
import { FinalCta } from "@/components/home/FinalCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Ecosystem />
      <Opportunities />
      <Transparency />
      <Lifecycle />
      <DashboardPreview />
      <TrustGrid />
      <RiskDisclosure />
      <WhyKrishi />
      <Faq />
      <FinalCta />
    </>
  );
}