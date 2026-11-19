import type { BadgeTone } from "@/components/dashboard/ui";
import type { Animal } from "@/lib/animals";

export const ANIMAL_TONE: Record<string, BadgeTone> = {
  active: "success",
  death_reported: "warning",
  sold: "info",
  dead: "danger",
};

/** kg gained since purchase, or null if either weight is unknown. */
export function weightGain(a: Pick<Animal, "purchaseWeightKg" | "currentWeightKg">): number | null {
  if (a.purchaseWeightKg === null || a.currentWeightKg === null) return null;
  return Math.round((a.currentWeightKg - a.purchaseWeightKg) * 10) / 10;
}
