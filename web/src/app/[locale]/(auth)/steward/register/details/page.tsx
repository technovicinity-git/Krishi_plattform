import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionFromCookie } from "@/lib/auth/session";
import { AuthCard } from "@/components/auth/AuthCard";
import { StewardDetailsForm } from "@/components/auth/StewardDetailsForm";

export default async function StewardDetailsPage() {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "steward") {
    redirect("/steward/register");
  }

  const db = createAdminClient();

  const [{ data: divisions }, { data: districts }] = await Promise.all([
    db.from("divisions").select("id, name_en, name_bn").order("sort_order", { ascending: true }),
    db
      .from("districts")
      .select("id, division_id, name_en, name_bn")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <AuthCard width="lg">
      <StewardDetailsForm
        divisions={divisions ?? []}
        districts={districts ?? []}
      />
    </AuthCard>
  );
}