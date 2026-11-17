import { StewardsHero } from "@/components/stewards/StewardsHero";
import { StewardsIntro } from "@/components/stewards/StewardsIntro";
import { StewardsDirectory } from "@/components/stewards/StewardsDirectory";
import { StewardsJourney } from "@/components/stewards/StewardsJourney";
import { StewardsVisibility } from "@/components/stewards/StewardsVisibility";
import { StewardsFinalCta } from "@/components/stewards/StewardsFinalCta";
import { listPublicStewards } from "@/lib/public/stewards";

export const dynamic = "force-dynamic";

export default async function StewardsPage() {
  // Fetch up to 50 stewards for now (pagination can be added later)
  const { items } = await listPublicStewards({ limit: 50 });

  return (
    <>
      <StewardsHero />
      <StewardsIntro />
      <StewardsDirectory items={items} />
      <StewardsJourney />
      <StewardsVisibility />
      <StewardsFinalCta />
    </>
  );
}