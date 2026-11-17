import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSignedKycUrls } from "@/lib/admin/storage";

function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLE: Record<string, string> = {
  not_started: "bg-stone text-ink-muted",
  pending: "bg-[#FEF6E5] text-[#C48A2E]",
  under_review: "bg-[#FEF6E5] text-[#C48A2E]",
  verified: "bg-[#E8F0EA] text-green-deep",
  rejected: "bg-[#FAF0ED] text-danger",
  requires_update: "bg-[#FAF0ED] text-danger",
};

export default async function PortalKycPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = createAdminClient();
  const { data: kyc } = await db
    .from("kyc_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const t = await getTranslations("app.kycPage");
  const ts = await getTranslations("app.status");
  const locale = await getLocale();
  const status = kyc?.status ?? "not_started";
  const statusLabel = ts.has(status) ? ts(status) : status;
  const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.not_started;

  const urls = kyc
    ? await getSignedKycUrls({
        nidFront: kyc.nid_front_path,
        nidBack: kyc.nid_back_path,
        profile: kyc.profile_photo_path,
      })
    : { nidFront: null, nidBack: null, profile: null };

  const showResubmit = status === "rejected" || status === "requires_update";

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-[28px] leading-tight text-ink lg:text-[32px]">
          {t("title")}
        </h1>
        <span
          className={`inline-flex items-center rounded-[4px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.02em] ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </div>

      {status === "verified" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#A8CBB4] bg-[#E8F0EA] p-8">
          <h2 className="font-serif text-[24px] leading-tight text-green-deep">
            {t("verifiedTitle")}
          </h2>
          <p className="text-[14px] leading-[1.6] text-green-deep/90">
            {t("verifiedBody")}
          </p>
        </div>
      )}

      {(status === "pending" || status === "under_review") && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#F0D9A6] bg-[#FEF6E5] p-8">
          <h2 className="font-serif text-[24px] leading-tight text-[#7A5C1E]">
            {t("reviewTitle")}
          </h2>
          <p className="text-[14px] leading-[1.6] text-[#7A5C1E]/90">
            {t("reviewBody")}
          </p>
        </div>
      )}

      {status === "not_started" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-8">
          <h2 className="font-serif text-[24px] leading-tight text-ink">
            {t("startTitle")}
          </h2>
          <p className="text-[14px] leading-[1.6] text-ink-secondary">
            {t("startBody")}
          </p>
          <Link
            href="/onboarding/kyc"
            className="inline-flex h-[48px] w-fit items-center justify-center rounded-[8px] bg-brand px-6 text-[14px] font-bold text-white transition-colors hover:bg-brand-hover"
          >
            {t("startCta")}
          </Link>
        </div>
      )}

      {showResubmit && (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#F0C9C0] bg-[#FAF0ED] p-8">
          <h2 className="font-serif text-[24px] leading-tight text-danger">
            {t("rejectedTitle")}
          </h2>
          {kyc?.rejection_reason && (
            <p className="text-[14px] leading-[1.6] text-ink-secondary">
              <strong>{t("reason")}</strong> {kyc.rejection_reason}
            </p>
          )}
          <Link
            href="/onboarding/kyc"
            className="inline-flex h-[48px] w-fit items-center justify-center rounded-[8px] bg-brand px-6 text-[14px] font-bold text-white transition-colors hover:bg-brand-hover"
          >
            {t("resubmitCta")}
          </Link>
        </div>
      )}

      {kyc && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {t("detailsHeading")}
          </h2>
          <div className="flex flex-col">
            <Row label={t("nidNumber")} value={kyc.nid_number ?? "—"} />
            <Row label={t("presentAddress")} value={kyc.present_address ?? "—"} />
            <Row label={t("permanentAddress")} value={kyc.permanent_address ?? "—"} />
            <Row label={t("submitted")} value={formatDateTime(kyc.submitted_at, locale)} />
            <Row label={t("lastUpdated")} value={formatDateTime(kyc.updated_at, locale)} />
          </div>
        </div>
      )}

      {kyc && (urls.nidFront || urls.nidBack) && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {t("documentsHeading")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DocPreview label={t("nidFront")} url={urls.nidFront} emptyLabel={t("notProvided")} />
            <DocPreview label={t("nidBack")} url={urls.nidBack} emptyLabel={t("notProvided")} />
          </div>
        </div>
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

function DocPreview({ label, url, emptyLabel }: { label: string; url: string | null; emptyLabel: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold text-ink-muted">{label}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-[8px] border border-border-light bg-stone hover:border-brand"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="h-[180px] w-full object-cover" />
        </a>
      ) : (
        <div className="flex h-[180px] items-center justify-center rounded-[8px] border border-dashed border-border-light bg-stone text-[12px] text-ink-muted">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}