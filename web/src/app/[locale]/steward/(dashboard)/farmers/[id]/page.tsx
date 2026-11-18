import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { FarmerActivationPanel } from "@/components/steward/FarmerActivationPanel";
import { BackLink } from "@/components/ui/BackLink";
import { Link } from "@/i18n/navigation";
import { DetailRow, PageHeader, Panel, StatusBadge, toneFor } from "@/components/dashboard/ui";
import { showOtpOnScreen } from "@/lib/auth/dev-flags";

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
  const tst = await getTranslations("app.stage");
  const tinv = await getTranslations("app.stewardInvestments");
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
  if (!isActive && showOtpOnScreen() && farmer.phone) {
    const { data: otpRow } = await db
      .from("dev_otps")
      .select("otp")
      .eq("phone", farmer.phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    devOtp = otpRow?.otp ?? null;
  }

  const { data: batchRows } = await db
    .from("investments")
    .select(
      "id, reference, units, current_stage, offering:steward_plan_offerings!offering_id ( steward_id, investment_plans ( name_en, name_bn ) )",
    )
    .eq("farmer_id", farmer.id)
    .order("created_at", { ascending: false });
  const batches = ((batchRows ?? []) as unknown as {
    id: string;
    reference: string;
    units: number;
    current_stage: string;
    offering: { steward_id: string; investment_plans: { name_en: string | null; name_bn: string | null } | null } | null;
  }[]).filter((b) => b.offering?.steward_id === user.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={<BackLink href="/steward/farmers">{t("back")}</BackLink>}
        title={farmer.full_name ?? t("farmer")}
        actions={
          <StatusBadge tone={isActive ? "success" : "warning"} className="text-[11px]">
            {isActive ? t("active") : t("pendingActivation")}
          </StatusBadge>
        }
      />

      {!isActive && farmer.phone && (
        <FarmerActivationPanel
          farmerId={farmer.id}
          phone={farmer.phone}
          devOtp={devOtp}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title={t("contact")}>
          <DetailRow label={t("fullName")} value={farmer.full_name ?? "—"} />
          <DetailRow label={t("phone")} value={farmer.phone ?? "—"} />
          <DetailRow label={t("email")} value={farmer.email ?? "—"} />
          <DetailRow label={t("added")} value={formatDateTime(farmer.created_at, locale)} />
          <DetailRow
            label={t("activated")}
            value={farmer.phone_verified_at ? formatDateTime(farmer.phone_verified_at, locale) : "—"}
          />
        </Panel>

        <Panel title={t("kycDraft")}>
          {kyc ? (
            <>
              <DetailRow
                label={t("status")}
                value={
                  <StatusBadge tone={toneFor(kyc.status)}>
                    {ts.has(kyc.status) ? ts(kyc.status) : kyc.status}
                  </StatusBadge>
                }
              />
              <DetailRow label={t("nidNumber")} value={kyc.nid_number ?? "—"} />
              <DetailRow label={t("presentAddress")} value={kyc.present_address ?? "—"} />
            </>
          ) : (
            <p className="text-[13px] text-ink-muted">{t("noKyc")}</p>
          )}
        </Panel>
      </div>

      <Panel title={tinv("title")} bodyClassName={batches.length ? "p-0" : "p-6"}>
        {batches.length === 0 ? (
          <p className="text-[13px] text-ink-muted">{t("comingSoon")}</p>
        ) : (
          <ul className="divide-y divide-border-light">
            {batches.map((b) => {
              const plan = b.offering?.investment_plans;
              return (
                <li key={b.id}>
                  <Link
                    href={`/steward/investments/${b.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-brand-tint/40"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[14px] font-semibold text-ink">
                        {(locale === "bn" ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? b.reference}
                      </span>
                      <span className="font-mono text-[11px] text-ink-muted">{b.reference}</span>
                    </div>
                    <StatusBadge tone={toneFor(b.current_stage)}>
                      {tst.has(b.current_stage) ? tst(b.current_stage) : b.current_stage}
                    </StatusBadge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
