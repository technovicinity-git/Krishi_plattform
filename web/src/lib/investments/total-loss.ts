/**
 * When a batch can be closed as a total loss (every animal died).
 * Pure: shared by the steward page (to show the option) and the API.
 */
export type TotalLossBlocker =
  | "not_growing"        // batch is not in growing_care
  | "no_animals"         // animals are not tracked for this batch
  | "animals_alive"      // at least one animal is still active
  | "death_pending"      // a death report is waiting for the steward
  | "fund_requests"      // fund requests are waiting for the steward
  | "sale_exists";       // a sale (or closing) is already in progress

export function totalLossBlocker(input: {
  stage: string;
  animalStatuses: string[];
  pendingFundRequests: number;
  saleStatus: string | null;
}): TotalLossBlocker | null {
  if (input.saleStatus && input.saleStatus !== "rejected") return "sale_exists";
  if (input.stage !== "growing_care") return "not_growing";
  if (input.animalStatuses.length === 0) return "no_animals";
  if (input.animalStatuses.includes("death_reported")) return "death_pending";
  if (input.animalStatuses.some((s) => s !== "dead")) return "animals_alive";
  if (input.pendingFundRequests > 0) return "fund_requests";
  return null;
}
