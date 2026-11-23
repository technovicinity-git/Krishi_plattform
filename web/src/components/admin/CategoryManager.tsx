"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";
import { RowActions, rowActionClass } from "@/components/dashboard/ui";
import { NavIcon } from "@/components/dashboard/NavIcon";

interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  breedCount: number;
}

const ICON_OPTIONS = ["cow", "goat", "buffalo", "sheep", "chicken", "duck"];

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { alert, confirm } = useDialog();

  const [showAdd, setShowAdd] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleToggleActive = async (cat: Category) => {
    const verb = cat.isActive ? "Deactivate" : "Activate";
    const ok = await confirm({
      title: `${verb} ${cat.nameEn}?`,
      message: cat.isActive
        ? "It will no longer appear when creating new plans. Existing plans are unaffected."
        : "It will become available again for plan creation.",
      confirmLabel: verb,
      variant: cat.isActive ? "danger" : "success",
    });
    if (!ok) return;

    setBusyId(cat.id);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        await alert({
          title: "Update failed",
          message: data.error ?? "Please try again.",
          variant: "danger",
        });
      } else {
        router.refresh();
      }
    } catch {
      await alert({ title: "Network error", variant: "danger" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Add button */}
      {!showAdd && (
        <div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex h-[42px] items-center justify-center gap-1.5 rounded-[8px] bg-brand px-5 text-[13px] font-bold text-white hover:bg-brand-hover"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
              <path d="M10 4v12M4 10h12" />
            </svg>
            Add category
          </button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <AddCategoryForm
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            router.refresh();
          }}
        />
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border-light bg-white">
        <table className="w-full">
          <thead className="border-b border-border-light bg-stone">
            <tr>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                Category
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                Slug
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                Breeds
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                Status
              </th>
              <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className="border-b border-border-light last:border-b-0 hover:bg-stone/40"
              >
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-ink">
                      {cat.nameEn}
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      {cat.nameBn}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-[12px] text-ink-secondary">
                  {cat.slug}
                </td>
                <td className="px-5 py-4 text-[13px] text-ink-secondary">
                  {cat.breedCount}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.02em] ${
                      cat.isActive
                        ? "bg-[#E8F0EA] text-green-deep"
                        : "bg-stone text-ink-muted"
                    }`}
                  >
                    {cat.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <RowActions>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(cat)}
                      disabled={busyId === cat.id}
                      className={rowActionClass(cat.isActive ? "danger" : "default")}
                    >
                      <NavIcon name={cat.isActive ? "power" : "check"} className="h-[15px] w-[15px]" />
                      {busyId === cat.id ? "Saving…" : cat.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button type="button" onClick={() => setEditingId(cat.id)} className={rowActionClass()}>
                      <NavIcon name="edit" className="h-[15px] w-[15px]" />
                      Edit
                    </button>
                  </RowActions>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editingId && (
        <EditCategoryModal
          category={categories.find((c) => c.id === editingId)!}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ─── Add form ────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AddCategoryForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { alert } = useDialog();
  const [nameEn, setNameEn] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("cow");
  const [sortOrder, setSortOrder] = useState("100");
  const [submitting, setSubmitting] = useState(false);

  // Auto-update slug when nameEn changes (until user manually edits slug)
  const [slugTouched, setSlugTouched] = useState(false);

  const handleNameEnChange = (v: string) => {
    setNameEn(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn,
          nameBn,
          slug,
          icon,
          sortOrder: parseInt(sortOrder, 10) || 100,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await alert({
          title: "Could not create",
          message: data.error ?? "Please check your input.",
          variant: "danger",
        });
        setSubmitting(false);
        return;
      }
      onCreated();
    } catch {
      await alert({ title: "Network error", variant: "danger" });
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6"
    >
      <h2 className="font-serif text-[18px] text-ink">New Category</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="English Name"
          value={nameEn}
          onChange={handleNameEnChange}
          placeholder="e.g. Duck"
          required
        />
        <Field
          label="Bangla Name"
          value={nameBn}
          onChange={setNameBn}
          placeholder="যেমন হাঁস"
          required
        />
        <Field
          label="Slug"
          value={slug}
          onChange={(v) => {
            setSlug(v);
            setSlugTouched(true);
          }}
          placeholder="duck"
          required
          hint="Lowercase letters, numbers, hyphens only"
        />
        <Field
          label="Sort Order"
          value={sortOrder}
          onChange={setSortOrder}
          placeholder="100"
          type="number"
          hint="Lower appears first"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-semibold text-ink-nav">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setIcon(opt)}
              className={`rounded-[6px] border px-3 py-2 text-[12px] font-semibold transition-colors ${
                icon === opt
                  ? "border-ink bg-ink text-white"
                  : "border-border-light bg-white text-ink-secondary hover:bg-stone"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-brand px-6 text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create Category"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-[42px] items-center justify-center rounded-[8px] border border-border-light bg-white px-6 text-[13px] font-semibold text-ink-nav hover:bg-stone"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Edit modal ──────────────────────────────────────────────────────────

function EditCategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category: Category;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { alert } = useDialog();
  const [nameEn, setNameEn] = useState(category.nameEn);
  const [nameBn, setNameBn] = useState(category.nameBn);
  const [icon, setIcon] = useState(category.icon ?? "cow");
  const [sortOrder, setSortOrder] = useState(String(category.sortOrder));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn,
          nameBn,
          icon,
          sortOrder: parseInt(sortOrder, 10) || 100,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await alert({
          title: "Could not save",
          message: data.error ?? "Please check your input.",
          variant: "danger",
        });
        setSubmitting(false);
        return;
      }
      onSaved();
    } catch {
      await alert({ title: "Network error", variant: "danger" });
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px]"
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-2xl border border-border-light bg-white shadow-2xl"
      >
        <div className="border-b border-border-light px-6 py-4">
          <h2 className="font-serif text-[18px] text-ink">Edit Category</h2>
          <p className="mt-1 text-[12px] text-ink-muted">
            Slug cannot be changed after creation.
          </p>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="English Name" value={nameEn} onChange={setNameEn} required />
            <Field label="Bangla Name" value={nameBn} onChange={setNameBn} required />
            <Field
              label="Sort Order"
              value={sortOrder}
              onChange={setSortOrder}
              type="number"
            />
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-ink-nav">Slug</label>
              <div className="flex h-[42px] items-center rounded-[8px] border border-border-light bg-stone px-3">
                <span className="font-mono text-[12px] text-ink-muted">
                  {category.slug}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-ink-nav">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIcon(opt)}
                  className={`rounded-[6px] border px-3 py-2 text-[12px] font-semibold transition-colors ${
                    icon === opt
                      ? "border-ink bg-ink text-white"
                      : "border-border-light bg-white text-ink-secondary hover:bg-stone"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-border-light bg-stone/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[42px] flex-1 items-center justify-center rounded-[8px] border border-border-light bg-white text-[13px] font-semibold text-ink-nav hover:bg-stone"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-[42px] flex-1 items-center justify-center rounded-[8px] bg-brand text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Small input helper ──────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  hint?: string;
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
        className="h-[42px] w-full rounded-[8px] border border-border-light bg-cream px-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none"
      />
      {hint && <p className="text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}