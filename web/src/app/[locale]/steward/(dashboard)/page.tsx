import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";
import { ArrowRightIcon } from "@/components/icons";
import { ButtonLink, PageHeader, Panel, StatCard } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function StewardDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  const [t, td] = await Promise.all([
    getTranslations("app.stewardHome"),
    getTranslations("app.stewardDash"),
  ]);
  const db = createAdminClient();

  const [{ data: farmers }, { data: offerings }] = await Promise.all([
    db
      .from("users")
      .select("status")
      .eq("assigned_steward_id", user.id)
      .eq("role", "farmer"),
    db.from("steward_plan_offerings").select("id").eq("steward_id", user.id),
  ]);
  const offeringIds = (offerings ?? []).map((o) => o.id);

  const [{ count: pendingInterests }, { data: investments }] = offeringIds.length
    ? await Promise.all([
        db
          .from("investment_interests")
          .select("*", { count: "exact", head: true })
          .in("offering_id", offeringIds)
          .in("status", ["submitted", "under_review"]),
        db.from("investments").select("id, current_stage").in("offering_id", offeringIds),
      ])
    : [{ count: 0 }, { data: [] as { id: string; current_stage: string }[] }];

  const investmentIds = (investments ?? []).map((i) => i.id);
  const { count: pendingFunds } = investmentIds.length
    ? await db
        .from("fund_requests")
        .select("*", { count: "exact", head: true })
        .in("investment_id", investmentIds)
        .eq("status", "pending")
    : { count: 0 };

  const farmerTotal = farmers?.length ?? 0;
  const farmerPending = (farmers ?? []).filter((f) => f.status === "pending_activation").length;
  const awaitingFarmer = (investments ?? []).filter((i) => i.current_stage === "awaiting_farmer").length;

  const attentionItems: { icon: NavIconName; label: string; count: number; href: string }[] = [
    { icon: "inbox", label: td("reviewInterests"), count: pendingInterests ?? 0, href: "/steward/interests" },
    { icon: "coins", label: td("reviewFunds"), count: pendingFunds ?? 0, href: "/steward/fund-requests" },
    { icon: "briefcase", label: td("assignFarmers"), count: awaitingFarmer, href: "/steward/investments" },
    { icon: "users", label: t("pendingActivation"), count: farmerPending, href: "/steward/farmers?filter=pending" },
  ];
  const attention = attentionItems.filter((a) => a.count > 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={td("eyebrow")}
        title={t("welcome", { name: user.fullName?.split(" ")[0] ?? t("steward") })}
        description={t("subtitle")}
        actions={<ButtonLink href="/steward/farmers/new">{t("addFarmer")}</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("totalFarmers")}
          value={farmerTotal}
          hint={td("activeFarmers", { count: farmerTotal - farmerPending })}
          icon="users"
          href="/steward/farmers"
        />
        <StatCard
          label={td("pendingInterests")}
          value={pendingInterests ?? 0}
          icon="inbox"
          href="/steward/interests"
          tone={(pendingInterests ?? 0) > 0 ? "brand" : "default"}
        />
        <StatCard
          label={td("activeInvestments")}
          value={investments?.length ?? 0}
          hint={td("needsFarmer", { count: awaitingFarmer })}
          icon="briefcase"
          href="/steward/investments"
          tone={awaitingFarmer > 0 ? "warning" : "default"}
        />
        <StatCard
          label={td("pendingFunds")}
          value={pendingFunds ?? 0}
          icon="coins"
          href="/steward/fund-requests"
          tone={(pendingFunds ?? 0) > 0 ? "brand" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title={td("attention")} bodyClassName="p-0">
          {attention.length === 0 ? (
            <div className="flex items-center gap-4 px-6 py-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                <NavIcon name="shield" />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-ink">{td("allClear")}</p>
                <p className="text-[13px] text-ink-secondary">{td("allClearHint")}</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border-light">
              {attention.map((a) => (
                <li key={a.href}>
                  <Link
                    href={a.href}
                    className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-brand-tint/40"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                      <NavIcon name={a.icon} />
                    </span>
                    <span className="flex-1 text-[14px] font-semibold text-ink">{a.label}</span>
                    <span className="rounded-full bg-brand px-2.5 py-0.5 text-[12px] font-bold text-white">
                      {a.count}
                    </span>
                    <ArrowRightIcon className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={td("quickActions")} bodyClassName="flex flex-col gap-2 p-4">
          {[
            { href: "/steward/farmers/new", icon: "users" as const, label: t("addFarmer") },
            { href: "/steward/interests", icon: "inbox" as const, label: td("reviewInterests") },
            { href: "/steward/fund-requests", icon: "coins" as const, label: td("reviewFunds") },
            { href: "/steward/investments", icon: "briefcase" as const, label: td("assignFarmers") },
          ].map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-ink-secondary transition-colors hover:bg-brand-tint/60 hover:text-green-deep"
            >
              <NavIcon name={q.icon} className="text-brand" />
              {q.label}
            </Link>
          ))}
        </Panel>
      </div>
    </div>
  );
}
