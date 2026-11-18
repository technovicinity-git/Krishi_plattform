"use client";

import { useEffect, useId } from "react";
import { cn } from "@/lib/cn";

/** Shared input styling for dashboard forms. */
export const fieldClass =
  "mt-1.5 w-full rounded-[8px] border border-border-light bg-cream px-3 text-[14px] text-ink placeholder:text-ink-muted focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-[12.5px] font-semibold text-ink-nav">
      {children}
    </label>
  );
}

/** Centered dialog on desktop, bottom sheet on phones. Closes on Escape. */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1C1A17]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-[480px] sm:rounded-2xl",
          className,
        )}
      >
        <div className="border-b border-border-light px-6 pt-6 pb-4">
          <div className="mb-3 h-1 w-10 rounded-full bg-brand" aria-hidden="true" />
          <h2 id={titleId} className="font-serif text-[22px] leading-tight text-ink">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-secondary">{subtitle}</p>
          )}
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/** Cancel + submit row used at the bottom of modal forms. */
export function ModalActions({
  onCancel,
  cancelLabel,
  submitLabel,
  disabled,
}: {
  onCancel: () => void;
  cancelLabel: string;
  submitLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <button
        type="button"
        onClick={onCancel}
        className="h-[44px] flex-1 rounded-[8px] border border-border-light bg-white text-[13px] font-semibold text-ink-secondary hover:bg-stone"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="h-[44px] flex-1 rounded-[8px] bg-brand text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-3 py-2 text-[12.5px] text-danger">
      {children}
    </p>
  );
}
