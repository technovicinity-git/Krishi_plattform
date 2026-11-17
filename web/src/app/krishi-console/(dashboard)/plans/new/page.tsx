import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { PlanForm } from "@/components/admin/PlanForm";

export default async function NewPlanPage() {
  await requireAdmin();
  const db = createAdminClient();

  const [{ data: categories }, { data: divisions }, { data: districts }] =
    await Promise.all([
      db
        .from("livestock_categories")
        .select("id, name_en, name_bn, is_active")
        .order("sort_order", { ascending: true }),
      db
        .from("divisions")
        .select("id, name_en, name_bn")
        .order("sort_order", { ascending: true }),
      db
        .from("districts")
        .select("id, division_id, name_en, name_bn")
        .order("sort_order", { ascending: true }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/krishi-console/plans"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-ink-secondary hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          Back to Plans
        </Link>
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          Create Investment Plan
        </h1>
      </div>

      <PlanForm
        mode="create"
        categories={categories ?? []}
        divisions={divisions ?? []}
        districts={districts ?? []}
      />
    </div>
  );
}