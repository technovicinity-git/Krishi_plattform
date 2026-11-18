"use client";

import { useEffect, useId, useMemo } from "react";
import { FieldLabel } from "@/components/dashboard/Modal";

/** Image picker with a thumbnail preview. */
export function PhotoField({
  label,
  file,
  onChange,
  required,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
}) {
  const id = useId();
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="mt-1.5 flex items-center gap-3">
        {file && preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={preview} alt="" className="h-14 w-14 rounded-lg border border-border-light object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border-light bg-cream text-ink-muted">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
              <rect x="3" y="5" width="14" height="11" rx="1.5" />
              <circle cx="10" cy="10.5" r="2.75" />
              <path d="M7.5 5l1-1.5h3l1 1.5" />
            </svg>
          </span>
        )}
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          required={required}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="block w-full text-[13px] text-ink-secondary file:mr-3 file:rounded-[6px] file:border-0 file:bg-brand-tint file:px-3 file:py-2 file:text-[12px] file:font-semibold file:text-green-deep hover:file:bg-[#E0EEE2]"
        />
      </div>
    </div>
  );
}
