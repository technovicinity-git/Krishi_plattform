import type { BadgeTone } from "@/components/dashboard/ui";
import type { Animal } from "@/lib/animals";

export const ANIMAL_TONE: Record<string, BadgeTone> = {
  active: "success",
  death_reported: "warning",
  sold: "info",
  dead: "danger",
};

/**
 * kg gained since purchase. Without a purchase weight, the first weighing is
 * the starting point (once there is a later one). Null when unknown.
 */
export function weightGain(
  a: Pick<Animal, "purchaseWeightKg" | "currentWeightKg"> & { records?: Pick<Animal, "records">["records"] },
): number | null {
  if (a.currentWeightKg === null) return null;
  let start = a.purchaseWeightKg;
  if (start === null) {
    const weighings = (a.records ?? [])
      .filter((r) => r.kind === "weight" && r.weightKg !== null)
      .sort((x, y) => x.recordedOn.localeCompare(y.recordedOn) || x.createdAt.localeCompare(y.createdAt));
    if (weighings.length < 2) return null;
    start = weighings[0].weightKg;
  }
  if (start === null) return null;
  return Math.round((a.currentWeightKg - start) * 10) / 10;
}
