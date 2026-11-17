"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { planImageUrl } from "@/lib/admin/plan-helpers";
import { formatBDT } from "@/lib/utils";
import type { OfferingListItem } from "@/lib/public/plans";

interface Props {
  offering: OfferingListItem;
  planName: string;
  currentUser: {
    id: string;
    role: string;
    fullName: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

function roleLabel(role: string): string {
  switch (role) {
    case "steward":
      return "a steward";
    case "farmer":
      return "a farmer";
    case "admin":
      return "an administrator";
    default:
      return role;
  }
}

export function ExpressInterestForm({ offering, planName, currentUser }: Props) {
  const router = useRouter();
  const isLoggedIn = currentUser?.role === "investor";
  const isBlockedRole =
    currentUser && currentUser.role !== "investor" ? currentUser.role : null;

  const [units, setUnits] = useState(1);
  const [fullName, setFullName] = useState(currentUser?.fullName ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [message, setMessage] = useState("");
  const [ackSubmit, setAckSubmit] = useState(false);
  const [ackReturns, setAckReturns] = useState(false);
  const [ackContact, setAckContact] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const remaining = Math.max(1, offering.unitsOffered - offering.unitsFunded);
  const totalIntended = offering.unitPrice * units;
  const imageUrl =
    planImageUrl(offering.imagePath) ?? "/images/plan-detail-hero.png";

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — reload below either way
    }
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLoggedIn) {
      if (!fullName.trim()) return setError("Full name is required.");
      if (!phone.trim()) return setError("Phone number is required.");
    }
    if (units < 1 || units > remaining) {
      return setError(`Please choose between 1 and ${remaining} units.`);
    }
    if (!ackSubmit || !ackReturns || !ackContact) {
      return setError("Please accept all acknowledgements to continue.");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offering_id: offering.offeringId,
          requested_units: units,
          message,
          guest_name: fullName,
          guest_phone: phone,
          guest_email: email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to submit interest");
        setSubmitting(false);
        return;
      }
      router.push(`/interest/${data.reference}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  if (isBlockedRole) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-16">
        <div className="rounded-xl border border-border-light bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF6E5] text-[#C48A2E]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 8v4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>

          <h1 className="mt-4 font-serif text-[26px] leading-tight text-ink">
            Signed in as {roleLabel(isBlockedRole)}
          </h1>

          <p className="mt-3 text-[14px] leading-[1.6] text-ink-secondary">
            Only investor accounts can express interest in a plan. You are
            currently signed in as {roleLabel(isBlockedRole)}
            {currentUser?.fullName ? (
              <>
                {" "}
                (<span className="font-semibold text-ink">{currentUser.fullName}</span>)
              </>
            ) : null}
            .
          </p>

          <p className="mt-2 text-[13px] text-ink-muted">
            If you want to submit this interest as a guest, sign out first and
            try again.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex h-[48px] items-center justify-center rounded-[4px] bg-ink text-[13px] font-bold text-white hover:bg-[#2A2A2A] disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out and continue as guest"}
            </button>
            <Link
              href={`/plans/${offering.offeringSlug}`}
              className="inline-flex h-[48px] items-center justify-center rounded-[4px] border border-border-light text-[13px] font-semibold text-ink-nav hover:bg-stone"
            >
              Back to Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
        {/* Left — plan summary */}
        <aside className="flex flex-col gap-6 self-start rounded-xl border border-border-light bg-white p-6">
          <div className="relative aspect-[410/260] w-full overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={planName}
              fill
              sizes="420px"
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
              {offering.categoryNameEn} · {offering.districtNameEn} ·{" "}
              {offering.durationMonths} months
            </span>
            <h2 className="mt-2 font-serif text-[24px] leading-tight text-ink">
              {planName}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-border-light py-4">
            <div>
              <div className="text-[10px] uppercase text-ink-muted">
                Estimated Return
              </div>
              <div className="mt-1 text-[18px] font-bold text-terracotta">
                {offering.roiMin}–{offering.roiMax}%
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-ink-muted">
                Per Unit Cost
              </div>
              <div className="mt-1 text-[18px] font-bold text-ink">
                {formatBDT(offering.unitPrice)}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold text-ink-secondary">
              Select Intended Units
            </span>
            <div className="flex items-center justify-between rounded-[6px] border border-border-light bg-cream px-4 py-3">
              <button
                type="button"
                onClick={() => setUnits((u) => Math.max(1, u - 1))}
                disabled={units <= 1}
                className="text-[18px] font-bold text-ink-secondary hover:text-ink disabled:opacity-30"
              >
                −
              </button>
              <span className="text-[16px] font-bold text-ink">
                {units} {units === 1 ? "Unit" : "Units"}
              </span>
              <button
                type="button"
                onClick={() => setUnits((u) => Math.min(remaining, u + 1))}
                disabled={units >= remaining}
                className="text-[18px] font-bold text-ink-secondary hover:text-ink disabled:opacity-30"
              >
                +
              </button>
            </div>
            <p className="text-[11px] text-ink-muted">
              {remaining} units available on this plan.
            </p>
          </div>

          <div className="flex items-baseline justify-between gap-3 rounded-lg bg-stone/60 px-4 py-3">
            <span className="text-[13px] font-semibold text-ink-secondary">
              Total Intended Investment
            </span>
            <span className="text-[20px] font-bold text-ink">
              {formatBDT(totalIntended)}
            </span>
          </div>
          <p className="text-[11px] leading-[1.5] text-ink-muted">
            Fund Breakdown: Animal {formatBDT(offering.animalAllocation * units)}{" "}
            + Care {formatBDT(offering.careAllocation * units)}
          </p>
        </aside>

        {/* Right — form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-xl border border-border-light bg-white p-8"
        >
          <div>
            <h1 className="font-serif text-[32px] leading-tight text-ink">
              Express your interest
            </h1>
            <p className="mt-2 text-[14px] text-ink-secondary">
              Tell us how you&apos;d like to participate. We&apos;ll review your
              interest and guide you through the next steps.
            </p>
          </div>

          {!isLoggedIn && (
            <>
              <Field
                label="Full Name"
                required
                value={fullName}
                onChange={setFullName}
              />
              <Field
                label="Phone Number"
                required
                value={phone}
                onChange={setPhone}
                hint="Enter your 10-digit number without the leading 0."
                prefix="+880"
              />
              <Field
                label="Email Address"
                value={email}
                onChange={setEmail}
                hint="Optional — used for important updates"
              />
            </>
          )}

          {isLoggedIn && (
            <div className="rounded-lg bg-stone/60 p-4 text-[13px] text-ink-secondary">
              Submitting as{" "}
              <span className="font-semibold text-ink">
                {currentUser?.fullName ?? "Investor"}
              </span>{" "}
              · {currentUser?.phone ?? ""}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-ink-nav">
              Message
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any questions or preferences?"
              className="w-full resize-none rounded-[8px] border border-border-light bg-cream px-3 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border-light pt-5">
            <Checkbox
              checked={ackSubmit}
              onChange={setAckSubmit}
              label="I understand that submitting interest does not guarantee approval or final unit allocation."
            />
            <Checkbox
              checked={ackReturns}
              onChange={setAckReturns}
              label="I understand that estimated livestock returns are not guaranteed."
            />
            <Checkbox
              checked={ackContact}
              onChange={setAckContact}
              label="I agree to be contacted by Krishi regarding this investment opportunity."
            />
          </div>

          <div className="flex items-center gap-3 text-[12px] text-ink-muted">
            <Link
              href="/risk-disclosure"
              className="text-terracotta hover:underline"
            >
              Risk Disclosure
            </Link>
            <span>·</span>
            <Link
              href="/terms-of-investment"
              className="text-terracotta hover:underline"
            >
              Terms of Investment
            </Link>
          </div>

          {error && (
            <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-[52px] items-center justify-center rounded-[4px] bg-terracotta text-[14px] font-bold text-white transition-colors hover:bg-[#B85A3F] disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Interest →"}
          </button>

          <Link
            href={`/plans/${offering.offeringSlug}`}
            className="inline-flex h-[48px] items-center justify-center rounded-[4px] border border-border-light text-[13px] font-semibold text-ink-nav hover:bg-stone"
          >
            Back to Opportunity
          </Link>

          <p className="text-center text-[11px] text-ink-muted">
            Your information is used to review your interest and coordinate the
            next steps.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  hint,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
  prefix?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-semibold text-ink-nav">
        {label}
        {required && <span className="ml-1 text-terracotta">*</span>}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-[13px] font-medium text-ink-secondary">
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-[44px] w-full rounded-[8px] border border-border-light bg-cream pr-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none ${
            prefix ? "pl-14" : "pl-3"
          }`}
        />
      </div>
      {hint && <p className="text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-light accent-terracotta"
      />
      <span className="text-[13px] leading-[1.55] text-ink-secondary">
        {label}
      </span>
    </label>
  );
}