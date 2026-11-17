import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { StewardApprovalActions } from "@/components/admin/StewardApprovalActions";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminStewardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();

  const { data: steward } = await db
    .from("users")
    .select("*")
    .eq("id", id)
    .eq("role", "steward")
    .maybeSingle();

  if (!steward) notFound();

  const status = steward.steward_approval_status ?? "pending";
  const style =
    status === "approved"
      ? "bg-[#E8F0EA] text-green-deep"
      : status === "rejected"
        ? "bg-[#FAF0ED] text-danger"
        : "bg-[#FEF6E5] text-[#C48A2E]";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/krishi-console/stewards"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-ink-secondary hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          Back to Stewards
        </Link>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-serif text-[28px] leading-tight text-ink">
            {steward.full_name ?? "Steward"}
          </h1>
          <span
            className={`inline-flex items-center rounded-[4px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.02em] ${style}`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-white p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            Contact
          </h2>
          <Row label="Full Name" value={steward.full_name ?? "—"} />
          <Row label="Phone" value={steward.phone ?? "—"} />
          <Row label="Email" value={steward.email ?? "—"} />
          <Row label="Applied" value={formatDateTime(steward.created_at)} />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-white p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            Account
          </h2>
          <Row label="Status" value={steward.status} />
          <Row label="Role" value={steward.role} />
          <Row
            label="Approval"
            value={steward.steward_approval_status ?? "pending"}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border-light bg-stone/40 p-6">
        <p className="text-[13px] leading-[1.6] text-ink-secondary">
          Full steward application details (operating division, district,
          livestock categories, experience) will appear here once the steward
          registration flow is wired to save them.
        </p>
      </div>

      {status !== "approved" && (
        <StewardApprovalActions stewardId={steward.id} />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-light py-3 last:border-b-0">
      <span className="shrink-0 text-[12px] text-ink-muted">{label}</span>
      <span className="text-right text-[13px] font-medium text-ink">{value}</span>
    </div>
  );
}