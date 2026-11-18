import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { compressIfNeeded } from "@/lib/admin/image-upload";

const BUCKET = "plan-images";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const baseSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    name_en: z.string().trim().min(2).max(120),
    name_bn: z.string().trim().min(1).max(120),
    description_en: z.string().trim().max(2000).optional().or(z.literal("")),
    description_bn: z.string().trim().max(2000).optional().or(z.literal("")),
    category_id: z.string().uuid(),
    division_id: z.string().uuid(),
    district_id: z.string().uuid(),
    duration_months: z.coerce.number().int().min(1).max(60),
    unit_price: z.coerce.number().positive(),
    animal_allocation: z.coerce.number().min(0),
    care_allocation: z.coerce.number().min(0),
    estimated_roi_min: z.coerce.number().min(0).max(500),
    estimated_roi_max: z.coerce.number().min(0).max(500),
    risk_information: z.string().trim().max(3000).optional().or(z.literal("")),
    status: z.enum(["draft", "open", "coming_soon", "fully_funded", "closed"]),
  })
  .refine((d) => d.estimated_roi_max >= d.estimated_roi_min, {
    message: "Max ROI must be greater than or equal to Min ROI",
    path: ["estimated_roi_max"],
  })
  .refine(
    (d) =>
      Math.abs(d.animal_allocation + d.care_allocation - d.unit_price) < 0.01,
    {
      message: "Animal + Care allocations must equal the Unit price exactly",
      path: ["unit_price"],
    },
  );

export interface ParsedPlanInput {
  slug: string;
  name_en: string;
  name_bn: string;
  description_en: string | null;
  description_bn: string | null;
  category_id: string;
  division_id: string;
  district_id: string;
  duration_months: number;
  unit_price: number;
  animal_allocation: number;
  care_allocation: number;
  estimated_roi_min: number;
  estimated_roi_max: number;
  risk_information: string | null;
  image_path: string | null;
  status: "draft" | "open" | "coming_soon" | "fully_funded" | "closed";
}

export type ParseResult =
  | { ok: true; data: ParsedPlanInput }
  | { ok: false; error: string };

export async function parsePlanFormData(
  form: FormData,
  opts: { requireImage: boolean },
): Promise<ParseResult> {
  const fields: Record<string, FormDataEntryValue | null> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") fields[key] = value;
  }

  const candidate = {
    slug: String(fields.slug ?? ""),
    name_en: String(fields.name_en ?? ""),
    name_bn: String(fields.name_bn ?? ""),
    description_en: String(fields.description_en ?? ""),
    description_bn: String(fields.description_bn ?? ""),
    category_id: String(fields.category_id ?? ""),
    division_id: String(fields.division_id ?? ""),
    district_id: String(fields.district_id ?? ""),
    duration_months: String(fields.duration_months ?? ""),
    unit_price: String(fields.unit_price ?? ""),
    animal_allocation: String(fields.animal_allocation ?? ""),
    care_allocation: String(fields.care_allocation ?? ""),
    estimated_roi_min: String(fields.estimated_roi_min ?? ""),
    estimated_roi_max: String(fields.estimated_roi_max ?? ""),
    risk_information: String(fields.risk_information ?? ""),
    status: String(fields.status ?? "draft"),
  };

  const parsed = baseSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const db = createAdminClient();
  const { data: district } = await db
    .from("districts")
    .select("id, division_id")
    .eq("id", parsed.data.district_id)
    .maybeSingle();

  if (!district || district.division_id !== parsed.data.division_id) {
    return { ok: false, error: "District does not belong to the selected division" };
  }

  const imageFile = form.get("image");
  let imagePath: string | null = null;

  if (imageFile instanceof File && imageFile.size > 0) {
    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return { ok: false, error: "Image must be JPG, PNG, or WebP" };
    }
    if (imageFile.size > MAX_FILE_BYTES) {
      return { ok: false, error: "Image exceeds 5 MB" };
    }

    const compressed = await compressIfNeeded(imageFile);
    const ext = compressed.type === "image/png" ? "png" : "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await compressed.arrayBuffer();

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: compressed.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[plans] image upload failed:", uploadError);
      return { ok: false, error: "Failed to upload image" };
    }

    imagePath = path;
  } else if (opts.requireImage) {
    return { ok: false, error: "Cover image is required" };
  } else {
    const existing = fields.existing_image_path;
    if (typeof existing === "string" && existing.length > 0) {
      imagePath = existing;
    }
  }

  return {
    ok: true,
    data: {
      slug: parsed.data.slug,
      name_en: parsed.data.name_en,
      name_bn: parsed.data.name_bn,
      description_en: parsed.data.description_en || null,
      description_bn: parsed.data.description_bn || null,
      category_id: parsed.data.category_id,
      division_id: parsed.data.division_id,
      district_id: parsed.data.district_id,
      duration_months: parsed.data.duration_months,
      unit_price: parsed.data.unit_price,
      animal_allocation: parsed.data.animal_allocation,
      care_allocation: parsed.data.care_allocation,
      estimated_roi_min: parsed.data.estimated_roi_min,
      estimated_roi_max: parsed.data.estimated_roi_max,
      risk_information: parsed.data.risk_information || null,
      image_path: imagePath,
      status: parsed.data.status,
    },
  };
}

export function planImageUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
/** Row shape of a steward_plan_offerings query joined with thanas + users. */
export interface OfferingQueryRow {
  id: string;
  units_offered: number;
  units_funded: number;
  status: string;
  approved_at: string | null;
  rejection_reason: string | null;
  thana_id: string | null;
  thanas: { name_en: string | null } | null;
  users: { id: string; full_name: string | null } | null;
}
