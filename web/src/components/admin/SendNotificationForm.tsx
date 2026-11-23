"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";
import { buttonClass } from "@/components/dashboard/ui";
import { cn } from "@/lib/cn";

type Audience = "all" | "investor" | "steward" | "farmer" | "user";

interface Person {
  id: string;
  name: string | null;
  phone: string | null;
  role: string;
  /** Has the app with notifications on (can receive a push). */
  hasApp: boolean;
}

type Channels = "both" | "inapp" | "push";

const CHANNELS: { key: Channels; label: string; hint: string }[] = [
  { key: "both", label: "App + push", hint: "In their notifications, and a push to their phones" },
  { key: "inapp", label: "In-app only", hint: "In their notifications on the website and app; no push" },
  { key: "push", label: "Push only", hint: "A push to their phones; not kept in their notifications" },
];

const AUDIENCES: { key: Audience; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "investor", label: "Investors" },
  { key: "steward", label: "Stewards" },
  { key: "farmer", label: "Farmers" },
  { key: "user", label: "One person" },
];

const input =
  "w-full rounded-[8px] border border-border-light bg-white px-3 py-2.5 text-[13.5px] text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";
const label = "text-[12px] font-semibold text-ink-secondary";

type Group = Exclude<Audience, "user">;

/** Write a notification and send it to a group or one person: in-app, push, or both. */
export function SendNotificationForm({
  counts,
  withApp,
  pushReady,
}: {
  counts: Record<Group, number>;
  /** People in each group with the app and notifications on. */
  withApp: Record<Group, number>;
  /** The server can send pushes (Firebase key set). */
  pushReady: boolean;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [audience, setAudience] = useState<Audience>("all");
  const [channels, setChannels] = useState<Channels>(pushReady ? "both" : "inapp");
  const [person, setPerson] = useState<Person | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [titleEn, setTitleEn] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyBn, setBodyBn] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find a person by name or phone as the admin types.
  useEffect(() => {
    if (audience !== "user" || person || search.trim().length < 2) return;
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/notifications/recipients?q=${encodeURIComponent(search.trim())}`, { signal: ctl.signal });
        const data = await res.json();
        setResults(data.items ?? []);
      } catch {
        // Aborted or offline: keep the last results.
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [audience, person, search]);

  // Results only while searching; stale ones are hidden, not cleared.
  const shown = audience === "user" && !person && search.trim().length >= 2 ? results : [];

  const people = audience === "user" ? (person ? 1 : 0) : counts[audience];
  const phones = audience === "user" ? (person?.hasApp ? 1 : 0) : withApp[audience];
  // Push only reaches people with the app.
  const recipients = channels === "push" ? phones : people;
  const how =
    channels === "both" ? "in their notifications and as a push to their phones" : channels === "inapp" ? "in their notifications (no push)" : "as a push to their phones";
  const who =
    audience === "user"
      ? person?.name ?? person?.phone ?? "this person"
      : audience === "all"
        ? "every investor, steward and farmer"
        : `all ${AUDIENCES.find((a) => a.key === audience)!.label.toLowerCase()}`;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (audience === "user" && !person) return setError("Choose the person to send to.");
    const ok = await dialog.confirm({
      title: `Send to ${recipients.toLocaleString("en-US")} ${recipients === 1 ? "person" : "people"}?`,
      message: `“${titleEn.trim()}” goes to ${who}, ${how}. It can't be taken back.`,
      confirmLabel: "Send",
    });
    if (!ok) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, channels, userId: person?.id, titleEn, titleBn, bodyEn, bodyBn }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not send. Try again.");
        return;
      }
      const parts: string[] = [];
      if (channels !== "push") parts.push(`In-app: ${data.recipients.toLocaleString("en-US")} ${data.recipients === 1 ? "person" : "people"}.`);
      if (channels !== "inapp") {
        parts.push(
          data.pushConfigured
            ? `Push: reached ${data.pushed.toLocaleString("en-US")} phone${data.pushed === 1 ? "" : "s"}${data.pushFailed ? `, ${data.pushFailed} failed` : ""}.`
            : "Push: not sent (push is not set up on the server).",
        );
      }
      await dialog.alert({ title: "Sent", message: parts.join(" ") });
      setTitleEn("");
      setTitleBn("");
      setBodyEn("");
      setBodyBn("");
      setPerson(null);
      setSearch("");
      router.refresh();
    } catch {
      setError("Could not send. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className={label}>Send to</span>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAudience(a.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                audience === a.key ? "border-brand bg-brand text-white" : "border-border-light bg-white text-ink-nav hover:bg-stone",
              )}
            >
              {a.label}
              {a.key !== "user" && (
                <span className={cn("ml-1.5 text-[11px]", audience === a.key ? "text-white/80" : "text-ink-muted")}>
                  {counts[a.key].toLocaleString("en-US")}
                </span>
              )}
            </button>
          ))}
        </div>

        {audience === "user" && (
          <div className="relative mt-1 max-w-[420px]">
            {person ? (
              <div className="flex items-center justify-between gap-3 rounded-[8px] border border-brand/40 bg-brand-tint px-3 py-2.5">
                <div className="min-w-0 text-[13px]">
                  <div className="truncate font-semibold text-ink">{person.name ?? "—"}</div>
                  <div className="text-[12px] text-ink-muted">
                    {person.phone ?? "No phone"} · <span className="capitalize">{person.role}</span> ·{" "}
                    {person.hasApp ? "has the app" : "no app: push won't reach them"}
                  </div>
                </div>
                <button type="button" onClick={() => setPerson(null)} className="text-[12px] font-semibold text-brand hover:underline">
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or phone"
                  className={input}
                  autoFocus
                />
                {shown.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-[8px] border border-border-light bg-white shadow-lg">
                    {shown.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => setPerson(r)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] hover:bg-stone"
                        >
                          <span className="truncate font-semibold text-ink">{r.name ?? "—"}</span>
                          <span className="shrink-0 text-[12px] text-ink-muted">
                            {r.phone} · <span className="capitalize">{r.role}</span>
                            {r.hasApp && " · app"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {search.trim().length >= 2 && shown.length === 0 && (
                  <p className="mt-1 text-[12px] text-ink-muted">No active investor, steward or farmer matches.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className={label}>Deliver as</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {CHANNELS.map((c) => {
            const disabled = c.key !== "inapp" && !pushReady;
            return (
              <button
                key={c.key}
                type="button"
                disabled={disabled}
                onClick={() => setChannels(c.key)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-[10px] border px-3.5 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  channels === c.key ? "border-brand bg-brand-tint ring-1 ring-brand/30" : "border-border-light bg-white hover:bg-stone",
                )}
              >
                <span className="text-[13px] font-bold text-ink">{c.label}</span>
                <span className="text-[11.5px] leading-snug text-ink-muted">{c.hint}</span>
              </button>
            );
          })}
        </div>
        {pushReady ? (
          channels !== "inapp" && (
            <p className="text-[12px] text-ink-muted">
              {audience === "user"
                ? person
                  ? person.hasApp
                    ? "This person has the app, so the push will reach their phone."
                    : "This person hasn't signed in to the app with notifications on, so a push won't reach them."
                  : "Choose a person to see whether they have the app."
                : `${phones.toLocaleString("en-US")} of ${people.toLocaleString("en-US")} have the app with notifications on; only they get the push.`}
            </p>
          )
        ) : (
          <p className="rounded-[8px] bg-[#FBF5E6] px-3 py-2 text-[12px] text-[#9A6B12]">
            Push notifications are not set up on this server yet: add the Firebase key as FIREBASE_SERVICE_ACCOUNT (on one
            line). Until then you can send in-app notifications only.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-ink-muted">English (required)</legend>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Title</span>
            <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} maxLength={80} required className={input} placeholder="e.g. Eid holiday: payouts resume on Sunday" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Message</span>
            <textarea value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} maxLength={500} required rows={4} className={input} />
            <span className="self-end text-[11px] text-ink-muted">{bodyEn.length}/500</span>
          </label>
        </fieldset>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-ink-muted">
            বাংলা (optional: Bangla readers see English if empty)
          </legend>
          <label className="flex flex-col gap-1.5">
            <span className={label}>শিরোনাম</span>
            <input value={titleBn} onChange={(e) => setTitleBn(e.target.value)} maxLength={80} lang="bn" className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>বার্তা</span>
            <textarea value={bodyBn} onChange={(e) => setBodyBn(e.target.value)} maxLength={500} rows={4} lang="bn" className={input} />
            <span className="self-end text-[11px] text-ink-muted">{bodyBn.length}/500</span>
          </label>
        </fieldset>
      </div>

      {(titleEn || bodyEn) && (
        <div className="flex flex-col gap-1.5">
          <span className={label}>Preview on a phone</span>
          <div className="flex max-w-[420px] gap-3 rounded-2xl bg-[#F1F1EF] p-3.5 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">K</span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold text-ink">{titleEn || "Title"}</div>
              <div className="line-clamp-3 text-[12.5px] leading-snug text-ink-secondary">{bodyEn}</div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="rounded-[8px] bg-[#FBEDEA] px-3 py-2 text-[13px] text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={sending || recipients === 0} className={buttonClass("primary")}>
          {sending ? "Sending…" : `Send to ${recipients.toLocaleString("en-US")} ${recipients === 1 ? "person" : "people"}`}
        </button>
        <span className="text-[12px] text-ink-muted">Only active accounts receive it. Admins are not included.</span>
      </div>
    </form>
  );
}
