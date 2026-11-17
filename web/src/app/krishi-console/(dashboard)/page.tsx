import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const [users, kycPending, investors, stewards, farmers] = await Promise.all([
    db.from("users").select("*", { count: "exact", head: true }),
    db
      .from("kyc_profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "investor"),
    db
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "steward"),
    db
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "farmer"),
  ]);

  const stats = [
    { label: "Total Users", value: users.count ?? 0, href: null },
    { label: "KYC Pending Review", value: kycPending.count ?? 0, href: "/krishi-console/kyc", highlight: (kycPending.count ?? 0) > 0 },
    { label: "Investors", value: investors.count ?? 0, href: "/krishi-console/investors" },
    { label: "Stewards", value: stewards.count ?? 0, href: "/krishi-console/stewards" },
    { label: "Farmers", value: farmers.count ?? 0, href: "/krishi-console/farmers" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          Welcome, {admin.fullName ?? "Admin"}
        </h1>
        <p className="text-[13px] text-ink-secondary">
          Overview of platform activity. Full admin features are being built incrementally.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const card = (
            <div
              className={`flex flex-col gap-1 rounded-2xl border bg-white p-6 transition-colors ${
                s.highlight ? "border-terracotta" : "border-border-light"
              } ${s.href ? "hover:bg-stone" : ""}`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
                {s.label}
              </span>
              <span className="font-serif text-[36px] leading-none text-ink">
                {s.value}
              </span>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href}>
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border-light bg-white p-6">
        <h2 className="font-serif text-[18px] leading-tight text-ink">
          Coming next
        </h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-[13px] text-ink-secondary">
          <li>• KYC review queue with approve / reject</li>
          <li>• Investor, steward, and farmer management</li>
          <li>• Admin audit log viewer</li>
        </ul>
      </div>
    </div>
  );
}