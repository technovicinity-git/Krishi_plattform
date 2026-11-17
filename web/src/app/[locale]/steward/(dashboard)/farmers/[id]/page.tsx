import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { FarmerActivationPanel } from "@/components/steward/FarmerActivationPanel";

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

export default async function StewardFarmerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const t = await getTranslations("app.stewardFarmer");
  const ts = await getTranslations("app.status");
  const locale = await getLocale();
  const db = createAdminClient();

  const { data: farmer } = await db
    .from("users")
    .select(
      "id, full_name, phone, email, status, created_at, phone_verified_at",
    )
    .eq("id", id)
    .eq("role", "farmer")
    .eq("assigned_steward_id", user.id)
    .maybeSingle();

  if (!farmer) notFound();

  const { data: kyc } = await db
    .from("kyc_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  const isActive = farmer.status === "active";

  // Dev-only: fetch the current plaintext OTP for the activation panel
  let devOtp: string | null = null;
  if (!isActive && process.env.DEV_SHOW_OTP === "true" && farmer.phone) {
    const { data: otpRow } = await db
      .from("dev_otps")
      .select("otp")
      .eq("phone", farmer.phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    devOtp = otpRow?.otp ?? null;
  }

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/steward/farmers"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-ink-secondary hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          {t("back")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-[28px] leading-tight text-ink">
            {farmer.full_name ?? t("farmer")}
          </h1>
          <span
            className={`inline-flex items-center rounded-[4px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.02em] ${
              isActive
                ? "bg-[#E8F0EA] text-green-deep"
                : "bg-[#FEF6E5] text-[#C48A2E]"
            }`}
          >
            {isActive ? t("active") : t("pendingActivation")}
          </span>
        </div>
      </div>

      {!isActive && farmer.phone && (
        <FarmerActivationPanel
          farmerId={farmer.id}
          phone={farmer.phone}
          devOtp={devOtp}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-white p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {t("contact")}
          </h2>
          <Row label={t("fullName")} value={farmer.full_name ?? "—"} />
          <Row label={t("phone")} value={farmer.phone ?? "—"} />
          <Row label={t("email")} value={farmer.email ?? "—"} />
          <Row label={t("added")} value={formatDateTime(farmer.created_at, locale)} />
          <Row
            label={t("activated")}
            value={
              farmer.phone_verified_at
                ? formatDateTime(farmer.phone_verified_at, locale)
                : "—"
            }
          />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-white p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {t("kycDraft")}
          </h2>
          {kyc ? (
            <>
              <Row label={t("status")} value={ts.has(kyc.status) ? ts(kyc.status) : kyc.status} />
              <Row label={t("nidNumber")} value={kyc.nid_number ?? "—"} />
              <Row label={t("presentAddress")} value={kyc.present_address ?? "—"} />
            </>
          ) : (
            <p className="text-[13px] text-ink-muted">
              {t("noKyc")}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border-light bg-stone/40 p-6">
        <p className="text-[13px] leading-[1.6] text-ink-secondary">
          {t("comingSoon")}
        </p>
      </div>
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
