import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { NavIcon } from "@/components/dashboard/NavIcon";
import {
  ButtonLink,
  DetailRow,
  PageHeader,
  Panel,
  StatusBadge,
  toneFor,
} from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function FarmerProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const [t, ts, locale] = await Promise.all([
    getTranslations("app.farmerProfile"),
    getTranslations("app.status"),
    getLocale(),
  ]);
  const bn = locale === "bn";
  const db = createAdminClient();

  const [{ data: me }, { data: kyc }] = await Promise.all([
    db
      .from("users")
      .select("created_at, assigned_steward_id")
      .eq("id", user.id)
      .maybeSingle(),
    db
      .from("kyc_profiles")
      .select("status, nid_number, present_address")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const { data: steward } = me?.assigned_steward_id
    ? await db
        .from("users")
        .select("full_name, phone, email")
        .eq("id", me.assigned_steward_id)
        .maybeSingle()
    : { data: null };

  const memberSince = me?.created_at
    ? new Date(me.created_at).toLocaleDateString(bn ? "bn-BD" : "en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title={t("account")}
          actions={
            <ButtonLink href="/farmer/settings" variant="secondary" className="h-[34px] px-3 text-[12px]">
              {t("editAccount")}
            </ButtonLink>
          }
        >
          <DetailRow label={t("fullName")} value={user.fullName ?? "—"} />
          <DetailRow label={t("phone")} value={user.phone ?? "—"} />
          <DetailRow label={t("email")} value={user.email ?? t("notProvided")} />
          <DetailRow label={t("memberSince")} value={memberSince} />
        </Panel>

        <Panel title={t("steward")} description={t("stewardHint")}>
          {steward ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand">
                  <NavIcon name="user" className="h-6 w-6" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-semibold text-ink">
                    {steward.full_name ?? "—"}
                  </span>
                  <span className="text-[13px] text-ink-secondary">{steward.phone ?? "—"}</span>
                </div>
              </div>
              {steward.phone && (
                <a
                  href={`tel:${steward.phone}`}
                  className="inline-flex h-[42px] w-fit items-center justify-center gap-2 rounded-[8px] bg-brand px-5 text-[13px] font-bold text-white hover:bg-brand-hover"
                >
                  {t("call")}
                </a>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-ink-muted">{t("noSteward")}</p>
          )}
        </Panel>
      </div>

      <Panel title={t("kyc")}>
        {kyc ? (
          <>
            <DetailRow
              label={t("kycStatus")}
              value={
                <StatusBadge tone={toneFor(kyc.status)}>
                  {ts.has(kyc.status) ? ts(kyc.status) : kyc.status}
                </StatusBadge>
              }
            />
            <DetailRow label={t("nid")} value={kyc.nid_number ?? "—"} />
            <DetailRow label={t("address")} value={kyc.present_address ?? "—"} />
          </>
        ) : (
          <p className="text-[13px] text-ink-muted">{t("noKyc")}</p>
        )}
      </Panel>
    </div>
  );
}
