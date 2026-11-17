import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function StewardDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const t = await getTranslations("app.stewardHome");
  const db = createAdminClient();

  const { count: farmerCount } = await db
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("assigned_steward_id", user.id)
    .eq("role", "farmer");

  const { count: pendingCount } = await db
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("assigned_steward_id", user.id)
    .eq("role", "farmer")
    .eq("status", "pending_activation");

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink lg:text-[32px]">
          {t("welcome", { name: user.fullName ?? t("steward") })}
        </h1>
        <p className="text-[14px] text-ink-secondary">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/steward/farmers"
          className="flex flex-col gap-1 rounded-2xl border border-border-light bg-white p-6 transition-colors hover:bg-stone"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
            {t("totalFarmers")}
          </span>
          <span className="font-serif text-[36px] leading-none text-ink">
            {farmerCount ?? 0}
          </span>
        </Link>

        <Link
          href="/steward/farmers?filter=pending"
          className={`flex flex-col gap-1 rounded-2xl border bg-white p-6 transition-colors hover:bg-stone ${
            (pendingCount ?? 0) > 0 ? "border-brand" : "border-border-light"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
            {t("pendingActivation")}
          </span>
          <span className="font-serif text-[36px] leading-none text-ink">
            {pendingCount ?? 0}
          </span>
        </Link>

        <Link
          href="/steward/farmers/new"
          className="flex flex-col items-start justify-center gap-2 rounded-2xl border border-border-light bg-ink p-6 text-white transition-colors hover:bg-[#2A2A2A]"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-white/70">
            {t("quickAction")}
          </span>
          <span className="font-serif text-[20px] leading-tight">
            {t("addFarmer")}
          </span>
        </Link>
      </div>

      <div className="rounded-2xl border border-border-light bg-white p-6">
        <h2 className="font-serif text-[18px] leading-tight text-ink">
          {t("comingNext")}
        </h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-[13px] text-ink-secondary">
          <li>• {t("next1")}</li>
          <li>• {t("next2")}</li>
          <li>• {t("next3")}</li>
          <li>• {t("next4")}</li>
        </ul>
      </div>
    </div>
  );
}