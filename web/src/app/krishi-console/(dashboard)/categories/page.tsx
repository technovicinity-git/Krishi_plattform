import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: categories } = await db
    .from("livestock_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: breedCounts } = await db
    .from("breeds")
    .select("category_id");

  const breedCountMap = new Map<string, number>();
  for (const row of breedCounts ?? []) {
    breedCountMap.set(
      row.category_id,
      (breedCountMap.get(row.category_id) ?? 0) + 1,
    );
  }

  const rows = (categories ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    nameEn: c.name_en,
    nameBn: c.name_bn,
    icon: c.icon,
    isActive: c.is_active,
    sortOrder: c.sort_order,
    breedCount: breedCountMap.get(c.id) ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          Livestock Categories
        </h1>
        <p className="text-[13px] text-ink-secondary">
          Categories used when creating investment plans. Deactivate to hide
          from plan creation without deleting existing records.
        </p>
      </div>

      <CategoryManager categories={rows} />
    </div>
  );
}