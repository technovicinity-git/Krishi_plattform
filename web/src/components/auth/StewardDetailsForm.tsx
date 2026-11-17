"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useDialog } from "@/components/ui/dialog-provider";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { FormTextarea } from "./FormTextarea";

interface Division {
  id: string;
  name_en: string;
  name_bn: string;
}

interface District {
  id: string;
  division_id: string;
  name_en: string;
  name_bn: string;
}

const LIVESTOCK_OPTIONS = [
  "cattle",
  "goats",
  "sheep",
  "dumba",
  "garoleSheep",
  "other",
] as const;

export function StewardDetailsForm({
  divisions,
  districts,
}: {
  divisions: Division[];
  districts: District[];
}) {
  const t = useTranslations("stewardRegister.step2");
  const router = useRouter();
  const { alert } = useDialog();

  const [stewardType, setStewardType] = useState<"individual" | "organization">("individual");
  const [fullName, setFullName] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [upazila, setUpazila] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredDistricts = useMemo(
    () => districts.filter((d) => d.division_id === divisionId),
    [districts, divisionId],
  );

  useEffect(() => {
    if (!divisionId) return;
    const stillValid = filteredDistricts.some((d) => d.id === districtId);
    if (!stillValid) setDistrictId("");
  }, [divisionId, districtId, filteredDistricts]);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!divisionId) return setError("Please choose a division.");
    if (!districtId) return setError("Please choose a district.");
    if (categories.length === 0) return setError("Select at least one livestock category.");
    if (experience.trim().length < 10) return setError("Please describe your experience (at least 10 characters).");

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/steward-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim() || undefined,
          stewardType,
          divisionId,
          districtId,
          upazila: upazila.trim(),
          categories,
          experience: experience.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Failed to submit");
        setSubmitting(false);
        return;
      }

      router.push("/steward/submitted");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Stepper (step 2 current) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
              {t("stepperStep1")}
            </span>
            <span className="text-[11px] text-ink-muted">{t("stepperCompleted")}</span>
          </div>
          <div className="h-0.5 w-full rounded bg-stone" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.02em] text-terracotta">
              {t("stepperStep2")}
            </span>
            <span className="text-[11px] text-ink-muted">{t("stepperCurrent")}</span>
          </div>
          <div className="h-0.5 w-full rounded bg-terracotta" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-[36px] leading-[1.1] text-ink lg:text-[42px]">
          {t("heading")}
        </h1>
        <p className="text-[15px] leading-[1.6] text-ink-secondary">
          {t("subheading")}
        </p>
      </div>

      {/* Steward type */}
      <div className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold text-ink-nav">
          {t("typeLabel")}
          <span className="ml-1 text-terracotta">*</span>
        </span>
        <div className="grid grid-cols-2 gap-0 rounded-[8px] border border-border-light bg-stone p-1">
          {(["individual", "organization"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setStewardType(opt)}
              className={`rounded-[6px] py-3 text-[14px] font-semibold transition-colors ${
                stewardType === opt
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              {opt === "individual" ? t("typeIndividual") : t("typeOrganization")}
            </button>
          ))}
        </div>
      </div>

      <FormInput
        label={t("fullNameLabel")}
        name="fullName"
        placeholder={t("fullNamePlaceholder")}
        value={fullName}
        onChange={setFullName}
        helper={t("fullNameHelper")}
      />

      <FormSelect
        label={t("divisionLabel")}
        name="division"
        value={divisionId}
        onChange={setDivisionId}
        placeholder={t("divisionPlaceholder")}
        required
        options={divisions.map((d) => ({ value: d.id, label: d.name_en }))}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          label={t("districtLabel")}
          name="district"
          value={districtId}
          onChange={setDistrictId}
          placeholder={t("districtPlaceholder")}
          required
          disabled={!divisionId}
          options={filteredDistricts.map((d) => ({ value: d.id, label: d.name_en }))}
        />
        <FormInput
          label={t("upazilaLabel")}
          name="upazila"
          placeholder={t("upazilaPlaceholder")}
          value={upazila}
          onChange={setUpazila}
          optional
        />
      </div>

      <p className="-mt-2 text-[12px] leading-tight text-ink-secondary">
        {t("locationHelper")}
      </p>

      {/* Categories */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-semibold text-ink-nav">
            {t("categoriesLabel")}
            <span className="ml-1 text-terracotta">*</span>
          </span>
          <span className="text-[12px] text-ink-secondary">
            {t("categoriesHelper")}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {LIVESTOCK_OPTIONS.map((cat) => {
            const selected = categories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`inline-flex items-center gap-2 rounded-[8px] border px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  selected
                    ? "border-terracotta bg-[#FAF0ED] text-terracotta"
                    : "border-border-light bg-white text-ink-secondary hover:bg-stone"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-[3px] border ${
                    selected ? "border-terracotta bg-terracotta" : "border-border-light"
                  }`}
                  aria-hidden="true"
                >
                  {selected && (
                    <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" className="h-2.5 w-2.5">
                      <path d="M1.5 5l2 2 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {t(`categories.${cat}`)}
              </button>
            );
          })}
        </div>
      </div>

      <FormTextarea
        label={t("experienceLabel")}
        name="experience"
        placeholder={t("experiencePlaceholder")}
        value={experience}
        onChange={setExperience}
        rows={5}
        required
      />

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <p className="text-[13px] leading-[1.6] text-ink-secondary">
        {t("infoNote")}
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-terracotta text-[15px] font-bold text-white transition-colors hover:bg-[#B3634A] disabled:opacity-60"
      >
        {submitting ? t("submitting") : t("submit")}
        {!submitting && <span aria-hidden="true">→</span>}
      </button>

      <div>
        <Link
          href="/steward/register"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-nav hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          {t("back")}
        </Link>
      </div>
    </form>
  );
}