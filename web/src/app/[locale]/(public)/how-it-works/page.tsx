import { Hero } from "@/components/how-it-works/Hero";
import { Journey } from "@/components/how-it-works/Journey";
import { StepExplore } from "@/components/how-it-works/StepExplore";
import { StepInterest } from "@/components/how-it-works/StepInterest";
import { StepOnboarding } from "@/components/how-it-works/StepOnboarding";
import { StepDeposit } from "@/components/how-it-works/StepDeposit";
import { StepRealAnimal } from "@/components/how-it-works/StepRealAnimal";
import { StepPeople } from "@/components/how-it-works/StepPeople";
import { StepPurchaseCare } from "@/components/how-it-works/StepPurchaseCare";
import { StepUpdates } from "@/components/how-it-works/StepUpdates";
import { StepExpenses } from "@/components/how-it-works/StepExpenses";
import { StepSale } from "@/components/how-it-works/StepSale";
import { ProfitSharing } from "@/components/how-it-works/ProfitSharing";
import { Settlement } from "@/components/how-it-works/Settlement";
import { Visibility } from "@/components/how-it-works/Visibility";
import { FaqPreview } from "@/components/how-it-works/FaqPreview";
import { FinalCta } from "@/components/how-it-works/FinalCta";
import { RevealOnScroll } from "@/components/home/RevealOnScroll";

export default function HowItWorksPage() {
  return (
    <>
      <Hero />
      <Journey />
      <StepExplore />
      <StepInterest />
      <StepOnboarding />
      <StepDeposit />
      <StepRealAnimal />
      <StepPeople />
      <StepPurchaseCare />
      <StepUpdates />
      <StepExpenses />
      <StepSale />
      <ProfitSharing />
      <Settlement />
      <Visibility />
      <FaqPreview />
      <FinalCta />
      <RevealOnScroll auto />
    </>
  );
}