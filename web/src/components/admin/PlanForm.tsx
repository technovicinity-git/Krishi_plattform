"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";
import { compressImage } from "@/lib/images/compress";
import { otherAllocation } from "@/lib/plans/allocation";

interface Category {
  id: string;
  name_en: string;
  name_bn: string;
  is_active: boolean;
}

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

export interface PlanFormInitial {
  id?: string;
  slug: string;
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  category_id: string;
  division_id: string;
  district_id: string;
  duration_months: number;
  unit_price: number;
  animal_allocation: number;
  care_allocation: number;
  estimated_roi_min: number;
  estimated_roi_max: number;
  steward_monthly_pay: number;
  risk_information: string;
  image_path: string | null;
  status: "draft" | "open" | "coming_soon" | "fully_funded" | "closed";
}

interface PlanFormProps {
  mode: "create" | "edit";
  categories: Category[];
  divisions: Division[];
  districts: District[];
  initial?: PlanFormInitial;
  imagePublicUrl?: string | null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function PlanForm({
  mode,
  categories,
  divisions,
  districts,
  initial,
  imagePublicUrl,
}: PlanFormProps) {
  const router = useRouter();
  const { confirm } = useDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nameEn, setNameEn] = useState(initial?.name_en ?? "");
  const [nameBn, setNameBn] = useState(initial?.name_bn ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [descriptionEn, setDescriptionEn] = useState(initial?.description_en ?? "");
  const [descriptionBn, setDescriptionBn] = useState(initial?.description_bn ?? "");

  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [divisionId, setDivisionId] = useState(initial?.division_id ?? "");
  const [districtId, setDistrictId] = useState(initial?.district_id ?? "");

  const [durationMonths, setDurationMonths] = useState(
    initial ? String(initial.duration_months) : "6",
  );
  const [unitPrice, setUnitPrice] = useState(
    initial ? String(initial.unit_price) : "100000",
  );
  const [animalAllocation, setAnimalAllocation] = useState(
    initial ? String(initial.animal_allocation) : "50000",
  );
  const [careAllocation, setCareAllocation] = useState(
    initial ? String(initial.care_allocation) : "50000",
  );
  // Animal + Care must equal the unit price, so typing one fills the other.
  // When the unit price changes, the allocation typed last is kept and the
  // other one is recalculated.
  const [lastAllocation, setLastAllocation] = useState<"animal" | "care">("animal");
  const changeUnitPrice = (v: string) => {
    setUnitPrice(v);
    if (lastAllocation === "animal") {
      const care = otherAllocation(v, animalAllocation);
      if (care !== null) setCareAllocation(care);
    } else {
      const animal = otherAllocation(v, careAllocation);
      if (animal !== null) setAnimalAllocation(animal);
    }
  };
  const changeAnimal = (v: string) => {
    setAnimalAllocation(v);
    setLastAllocation("animal");
    const care = otherAllocation(unitPrice, v);
    if (care !== null) setCareAllocation(care);
  };
  const changeCare = (v: string) => {
    setCareAllocation(v);
    setLastAllocation("care");
    const animal = otherAllocation(unitPrice, v);
    if (animal !== null) setAnimalAllocation(animal);
  };
  const allocationSum = Number(animalAllocation || 0) + Number(careAllocation || 0);
  const allocationOff = Math.abs(allocationSum - Number(unitPrice || 0)) > 0.01;
  const [roiMin, setRoiMin] = useState(initial ? String(initial.estimated_roi_min) : "15");
  const [roiMax, setRoiMax] = useState(initial ? String(initial.estimated_roi_max) : "20");
  const [stewardPay, setStewardPay] = useState(initial ? String(initial.steward_monthly_pay) : "0");
  const [riskInfo, setRiskInfo] = useState(initial?.risk_information ?? "");
  const [status, setStatus] = useState<PlanFormInitial["status"]>(
    initial?.status ?? "draft",
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    imagePublicUrl ?? null,
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill the slug from the English name until the admin edits the slug.
  const handleNameEnChange = (value: string) => {
    setNameEn(value);
    if (!slugTouched && mode === "create") setSlug(slugify(value));
  };

  const filteredDistricts = useMemo(
    () => districts.filter((d) => d.division_id === divisionId),
    [districts, divisionId],
  );

  // Clear the district when it doesn't belong to the newly chosen division.
  const handleDivisionChange = (value: string) => {
    setDivisionId(value);
    const stillValid = districts.some(
      (d) => d.id === districtId && d.division_id === value,
    );
    if (!stillValid) setDistrictId("");
  };

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImagePreview(imagePublicUrl ?? null);
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const up = Number(unitPrice);
    const aa = Number(animalAllocation);
    const ca = Number(careAllocation);
    if (Math.abs(aa + ca - up) > 0.01) {
      setError("Animal + Care allocation must equal Unit price exactly.");
      return;
    }
    if (!categoryId) return setError("Please choose a category.");
    if (!divisionId) return setError("Please choose a division.");
    if (!districtId) return setError("Please choose a district.");

    setSubmitting(true);

    try {
      let finalFile: File | null = null;
      if (imageFile) {
        finalFile = await compressImage(imageFile, 1600, 1);
      }

      const fd = new FormData();
      fd.append("slug", slug);
      fd.append("name_en", nameEn);
      fd.append("name_bn", nameBn);
      fd.append("description_en", descriptionEn);
      fd.append("description_bn", descriptionBn);
      fd.append("category_id", categoryId);
      fd.append("division_id", divisionId);
      fd.append("district_id", districtId);
      fd.append("duration_months", durationMonths);
      fd.append("unit_price", unitPrice);
      fd.append("animal_allocation", animalAllocation);
      fd.append("care_allocation", careAllocation);
      fd.append("estimated_roi_min", roiMin);
      fd.append("estimated_roi_max", roiMax);
      fd.append("steward_monthly_pay", stewardPay || "0");
      fd.append("risk_information", riskInfo);
      fd.append("status", status);
      if (finalFile) {
        fd.append("image", finalFile);
      } else if (mode === "edit" && initial?.image_path) {
        fd.append("existing_image_path", initial.image_path);
      }

      const url =
        mode === "create"
          ? "/api/admin/plans"
          : `/api/admin/plans/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, { method, body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Failed to save plan");
        setSubmitting(false);
        return;
      }

      router.push("/krishi-console/plans");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    const ok = await confirm({
      title: "Discard changes?",
      message: "Any unsaved edits will be lost.",
      confirmLabel: "Discard",
      variant: "danger",
    });
    if (ok) {
      router.push("/krishi-console/plans");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Section title="Basic Info">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Field
            label="English Name"
            value={nameEn}
            onChange={handleNameEnChange}
            placeholder="e.g. Cow Fattening Plan"
            required
          />
          <Field
            label="Bangla Name"
            value={nameBn}
            onChange={setNameBn}
            placeholder="যেমন গরু মোটাতাজাকরণ পরিকল্পনা"
            required
          />
          <Field
            label="Slug"
            value={slug}
            onChange={(v) => {
              setSlug(v);
              setSlugTouched(true);
            }}
            placeholder="cow-fattening"
            required
            hint="Lowercase letters, numbers, hyphens. Cannot be changed later without breaking links."
            disabled={mode === "edit"}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as PlanFormInitial["status"])}
            required
            options={[
              { value: "draft", label: "Draft (not visible publicly)" },
              { value: "open", label: "Open (accepting investors)" },
              { value: "coming_soon", label: "Coming Soon" },
              { value: "fully_funded", label: "Fully Funded" },
              { value: "closed", label: "Closed" },
            ]}
          />
        </div>

        <TextArea
          label="English Description"
          value={descriptionEn}
          onChange={setDescriptionEn}
          rows={3}
          placeholder="A short summary shown on the public plan page."
        />
        <TextArea
          label="Bangla Description"
          value={descriptionBn}
          onChange={setDescriptionBn}
          rows={3}
          placeholder="পাবলিক প্ল্যান পেজে দেখানো একটি সংক্ষিপ্ত সারাংশ।"
        />

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-ink-nav">
            Cover Image{" "}
            {mode === "create" && <span className="text-brand">*</span>}
          </label>
          <div className="flex items-start gap-4">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Preview"
                className="h-[120px] w-[180px] rounded-[8px] border border-border-light object-cover"
              />
            ) : (
              <div className="flex h-[120px] w-[180px] items-center justify-center rounded-[8px] border border-dashed border-border-light bg-stone text-[12px] text-ink-muted">
                No image
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-[38px] items-center justify-center rounded-[8px] border border-border-light bg-white px-4 text-[12px] font-semibold text-ink-nav hover:bg-stone"
              >
                {imagePreview ? "Replace Image" : "Choose Image"}
              </button>
              <span className="text-[11px] text-ink-muted">
                JPG, PNG, or WebP up to 5 MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Category & Location">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SelectField
            label="Category"
            value={categoryId}
            onChange={setCategoryId}
            required
            placeholder="Choose a category"
            options={categories
              .filter((c) => c.is_active)
              .map((c) => ({ value: c.id, label: c.name_en }))}
          />
          <SelectField
            label="Division"
            value={divisionId}
            onChange={handleDivisionChange}
            required
            placeholder="Choose a division"
            options={divisions.map((d) => ({ value: d.id, label: d.name_en }))}
          />
          <SelectField
            label="District"
            value={districtId}
            onChange={setDistrictId}
            required
            placeholder={divisionId ? "Choose a district" : "Choose a division first"}
            options={filteredDistricts.map((d) => ({
              value: d.id,
              label: d.name_en,
            }))}
            disabled={!divisionId}
          />
        </div>
      </Section>

      <Section title="Financials">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field
            label="Unit Price (৳)"
            value={unitPrice}
            onChange={changeUnitPrice}
            type="number"
            required
            hint="Total amount per unit"
          />
          <Field
            label="Animal Allocation (৳)"
            value={animalAllocation}
            onChange={changeAnimal}
            type="number"
            required
            hint="Type this or Care; the other fills in"
          />
          <Field
            label="Care Allocation (৳)"
            value={careAllocation}
            onChange={changeCare}
            type="number"
            required
            hint={
              allocationOff
                ? `Animal + Care = ৳${allocationSum.toLocaleString("en-IN")}, not ৳${Number(unitPrice || 0).toLocaleString("en-IN")}`
                : "Animal + Care = Unit Price"
            }
          />
          <Field
            label="Duration (months)"
            value={durationMonths}
            onChange={setDurationMonths}
            type="number"
            required
          />
          <Field
            label="Estimated ROI Min (%)"
            value={roiMin}
            onChange={setRoiMin}
            type="number"
            required
          />
          <Field
            label="Estimated ROI Max (%)"
            value={roiMax}
            onChange={setRoiMax}
            type="number"
            required
          />
          <Field
            label="Steward monthly pay (৳)"
            value={stewardPay}
            onChange={setStewardPay}
            type="number"
            required
            hint="Per batch, every month from farmer assigned to settlement. Taken from the steward's 5% share; if it's more, Krishi covers the difference."
          />
        </div>

        {mode === "edit" && (
          <p className="text-[12px] text-ink-muted">
            Total Units is now managed per steward offering. After saving this
            plan, use the &quot;Steward Offerings&quot; section on the plan detail page.
          </p>
        )}
        {mode === "create" && (
          <p className="text-[12px] text-ink-muted">
            After creating this plan, add steward offerings so it becomes visible
            to investors.
          </p>
        )}
      </Section>

      <Section title="Risk Information">
        <TextArea
          label="Risk Notes"
          value={riskInfo}
          onChange={setRiskInfo}
          rows={3}
          placeholder="E.g. Livestock investment carries biological risk. Returns are estimates, not guaranteed."
        />
      </Section>

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border-light pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={handleClose}
          disabled={submitting}
          className="inline-flex h-[46px] items-center justify-center rounded-[8px] border border-border-light bg-white px-6 text-[13px] font-semibold text-ink-nav hover:bg-stone disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[46px] items-center justify-center rounded-[8px] bg-brand px-8 text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {submitting
            ? "Saving..."
            : mode === "create"
              ? "Create Plan"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ─── UI helpers ──────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-semibold text-ink-nav">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="h-[42px] w-full rounded-[8px] border border-border-light bg-cream px-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none disabled:cursor-not-allowed disabled:bg-stone"
      />
      {hint && <p className="text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-semibold text-ink-nav">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="h-[42px] w-full rounded-[8px] border border-border-light bg-cream px-3 text-[13px] text-ink focus:border-sage focus:outline-none disabled:cursor-not-allowed disabled:bg-stone disabled:text-ink-muted"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-semibold text-ink-nav">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-[8px] border border-border-light bg-cream px-3 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none"
      />
    </div>
  );
}