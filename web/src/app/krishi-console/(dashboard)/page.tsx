import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";
import { ArrowRightIcon } from "@/components/icons";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const db = createAdminClient();
  const count = { count: "exact" as const, head: true };

  const [
    investors,
    stewards,
    farmers,
    kycPending,
    depositsPending,
    stewardsPending,
    { data: investments },
    { data: audit },
  ] = await Promise.all([
    db.from("users").select("*", count).eq("role", "investor"),
    db.from("users").select("*", count).eq("role", "steward"),
    db.from("users").select("*", count).eq("role", "farmer"),
    db.from("kyc_profiles").select("*", count).eq("status", "pending"),
    db.from("deposits").select("*", count).eq("status", "pending"),
    db.from("users").select("*", count).eq("role", "steward").eq("steward_approval_status", "pending"),
    db.from("investments").select("amount, current_stage"),
    db
      .from("admin_audit_log")
      .select("id, action, created_at, admin:users!admin_id ( full_name )")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const invested = (investments ?? []).reduce((s, i) => s + Number(i.amount), 0);
  const awaitingFarmer = (investments ?? []).filter((i) => i.current_stage === "awaiting_farmer").length;

  const queues: { icon: NavIconName; label: string; count: number; href: string }[] = [
    { icon: "shield", label: "KYC submissions to review", count: kycPending.count ?? 0, href: "/krishi-console/kyc" },
    { icon: "coins", label: "Deposits to verify", count: depositsPending.count ?? 0, href: "/krishi-console/deposits" },
    { icon: "users", label: "Steward applications", count: stewardsPending.count ?? 0, href: "/krishi-console/stewards" },
  ];
  const recent = (audit ?? []) as unknown as {
    id: string;
    action: string;
    created_at: string;
    admin: { full_name: string | null } | null;
  }[];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Krishi Console"
        title={`Welcome, ${admin.fullName?.split(" ")[0] ?? "Admin"}`}
        description="Platform activity and the queues that need an admin decision."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard localized={false} label="Investors" value={investors.count ?? 0} icon="briefcase" href="/krishi-console/investors" />
        <StatCard localized={false} label="Stewards" value={stewards.count ?? 0} icon="users" href="/krishi-console/stewards" />
        <StatCard localized={false} label="Farmers" value={farmers.count ?? 0} icon="leaf" href="/krishi-console/farmers" />
        <StatCard
          label="Capital invested"
          value={formatBDT(invested)}
          hint={`${investments?.length ?? 0} investments · ${awaitingFarmer} awaiting farmer`}
          icon="coins"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Review queues" description="Items waiting for an admin decision" bodyClassName="p-0">
          <ul className="divide-y divide-border-light">
            {queues.map((q) => (
              <li key={q.href}>
                <Link
                  href={q.href}
                  className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-brand-tint/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                    <NavIcon name={q.icon} />
                  </span>
                  <span className="flex-1 text-[14px] font-semibold text-ink">{q.label}</span>
                  {q.count > 0 ? (
                    <span className="rounded-full bg-brand px-2.5 py-0.5 text-[12px] font-bold text-white">
                      {q.count}
                    </span>
                  ) : (
                    <StatusBadge tone="success">Clear</StatusBadge>
                  )}
                  <ArrowRightIcon className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Recent activity"
          actions={
            <Link href="/krishi-console/audit" className="text-[12.5px] font-semibold text-brand hover:underline">
              View all
            </Link>
          }
          bodyClassName="p-0"
        >
          {recent.length === 0 ? (
            <p className="px-6 py-6 text-[13px] text-ink-muted">No admin activity yet.</p>
          ) : (
            <ul className="divide-y divide-border-light">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-mono text-[12px] font-semibold text-ink">{r.action}</span>
                    <span className="truncate text-[11.5px] text-ink-muted">{r.admin?.full_name ?? "—"}</span>
                  </div>
                  <span className="shrink-0 text-[11.5px] text-ink-muted">{timeAgo(r.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
