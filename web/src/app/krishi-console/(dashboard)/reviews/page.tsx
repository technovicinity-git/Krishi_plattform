import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState, PageHeader, StatusBadge, Tabs } from "@/components/dashboard/ui";
import { Stars } from "@/components/reviews/Stars";
import { ReviewModeration } from "@/components/admin/ReviewModeration";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  hidden_reason: string | null;
  created_at: string;
  investor: { full_name: string | null } | null;
  steward: { id: string; full_name: string | null } | null;
  investment: { reference: string } | null;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const { view: viewParam } = await searchParams;
  const view = viewParam === "hidden" ? "hidden" : viewParam === "low" ? "low" : "all";

  let query = createAdminClient()
    .from("steward_reviews")
    .select(`
      id, rating, comment, status, hidden_reason, created_at,
      investor:users!investor_id ( full_name ),
      steward:users!steward_id ( id, full_name ),
      investment:investments!investment_id ( reference )
    `)
    .order("created_at", { ascending: false })
    .limit(200);
  if (view === "hidden") query = query.eq("status", "hidden");
  if (view === "low") query = query.lte("rating", 2);

  const { data } = await query;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<>Reviews</>}
        description={<>Investor ratings of stewards. Hidden reviews don&apos;t show publicly or count toward the average.</>}
      />
      <Tabs
        localized={false}
        items={[
          { label: "All", href: "/krishi-console/reviews", active: view === "all" },
          { label: "1–2 stars", href: "/krishi-console/reviews?view=low", active: view === "low" },
          { label: "Hidden", href: "/krishi-console/reviews?view=hidden", active: view === "hidden" },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState icon="inbox" title={<>No reviews in this view.</>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 rounded-2xl border border-border-light bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={r.rating} />
                  {r.status === "hidden" && <StatusBadge tone="neutral">Hidden</StatusBadge>}
                </div>
                {r.comment && <p className="text-[13.5px] text-ink">“{r.comment}”</p>}
                <span className="text-[12px] text-ink-secondary">
                  {r.investor?.full_name ?? "—"} →{" "}
                  {r.steward ? (
                    <Link href={`/krishi-console/stewards/${r.steward.id}`} className="font-semibold text-brand hover:underline">
                      {r.steward.full_name ?? "Steward"}
                    </Link>
                  ) : (
                    "—"
                  )}{" "}
                  · <span className="font-mono">{r.investment?.reference}</span> ·{" "}
                  {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                {r.hidden_reason && <span className="text-[12px] text-ink-muted">Hidden: {r.hidden_reason}</span>}
              </div>
              <div className="shrink-0 sm:w-[260px] sm:text-right">
                <ReviewModeration id={r.id} hidden={r.status === "hidden"} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
