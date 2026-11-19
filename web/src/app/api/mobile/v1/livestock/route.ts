import { requireMobileUser, json, investmentIdsFor } from "@/lib/mobile/api";
import { getAnimalsForInvestments } from "@/lib/animals";

export const runtime = "nodejs";

/** Every animal across the user's batches, with records and photo links. */
export async function GET() {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  const animals = await getAnimalsForInvestments(await investmentIdsFor(user));
  return json({ animals });
}
