import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { BackLink } from "@/components/ui/BackLink";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import { SendNotificationForm } from "@/components/admin/SendNotificationForm";
import { pushConfigured, usersWithPhones } from "@/lib/notifications/push";

export const dynamic = "force-dynamic";

const AUDIENCE_LABEL: Record<string, string> = {
  all: "Everyone",
  investor: "Investors",
  steward: "Stewards",
  farmer: "Farmers",
  user: "One person",
};

const CHANNEL_LABEL: Record<string, string> = {
  both: "App + push",
  inapp: "In-app only",
  push: "Push only",
};

interface Sent {
  id: string;
  audience: string;
  title_en: string;
  title_bn: string | null;
  body_en: string;
  recipients: number;
  channels: string;
  pushed: number;
  created_at: string;
  admin: { full_name: string | null } | null;
  person: { full_name: string | null; phone: string | null } | null;
}

/** Write a custom notification for a group or one person, and see what was sent. */
export default async function SendNotificationPage() {
  await requireAdmin();
  const db = createAdminClient();
  const count = (role?: string) => {
    let q = db.from("users").select("id", { count: "exact", head: true }).eq("status", "active").neq("role", "admin");
    if (role) q = q.eq("role", role);
    return q;
  };
  const [all, investor, steward, farmer, appAll, appInvestor, appSteward, appFarmer, { data: history }] = await Promise.all([
    count(),
    count("investor"),
    count("steward"),
    count("farmer"),
    usersWithPhones("all"),
    usersWithPhones("all", "investor"),
    usersWithPhones("all", "steward"),
    usersWithPhones("all", "farmer"),
    db
      .from("notification_broadcasts")
      .select(`
        id, audience, title_en, title_bn, body_en, recipients, channels, pushed, created_at,
        admin:users!admin_id ( full_name ),
        person:users!user_id ( full_name, phone )
      `)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const sent = (history ?? []) as unknown as Sent[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={
          <BackLink href="/krishi-console/notifications" localized={false}>
            Back to Notifications
          </BackLink>
        }
        title="Send a notification"
        description="Write a message for investors, stewards, farmers or one person. Show it in their notifications, send it as a push to their phones, or both."
      />

      <Panel>
        <SendNotificationForm
          counts={{ all: all.count ?? 0, investor: investor.count ?? 0, steward: steward.count ?? 0, farmer: farmer.count ?? 0 }}
          withApp={{ all: appAll, investor: appInvestor, steward: appSteward, farmer: appFarmer }}
          pushReady={pushConfigured()}
        />
      </Panel>

      <Panel title="Sent" description="The last 50 notifications sent from the console." bodyClassName="p-0">
        {sent.length === 0 ? (
          <div className="p-6">
            <EmptyState icon="bell" title="Nothing sent yet." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-border-light bg-cream">
                <tr>
                  {["Sent", "To", "Message", "Delivery", "By"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {sent.map((s) => (
                  <tr key={s.id} className="align-top">
                    <td className="whitespace-nowrap px-5 py-3.5 text-[12px] text-ink-secondary">
                      {new Date(s.created_at).toLocaleString("en-GB", {
                        timeZone: "Asia/Dhaka",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px] text-ink">
                      <span className="font-semibold">{AUDIENCE_LABEL[s.audience] ?? s.audience}</span>
                      {s.audience === "user" && (
                        <div className="text-[11.5px] text-ink-muted">{s.person?.full_name ?? s.person?.phone ?? "Deleted account"}</div>
                      )}
                    </td>
                    <td className="max-w-[420px] px-5 py-3.5">
                      <div className="text-[13px] font-semibold text-ink">{s.title_en}</div>
                      <div className="line-clamp-2 text-[12px] text-ink-secondary">{s.body_en}</div>
                      {s.title_bn && <div className="mt-0.5 text-[11px] text-ink-muted">+ Bangla version</div>}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-ink-secondary">
                      <div className="font-semibold text-ink">{CHANNEL_LABEL[s.channels] ?? s.channels}</div>
                      {s.channels !== "push" && <div>{s.recipients.toLocaleString("en-US")} in-app</div>}
                      {s.channels !== "inapp" && <div>{s.pushed.toLocaleString("en-US")} phone{s.pushed === 1 ? "" : "s"} reached</div>}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px] text-ink-secondary">{s.admin?.full_name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
