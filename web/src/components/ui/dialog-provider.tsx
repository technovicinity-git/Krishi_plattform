"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "danger" | "success" | "info";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}

interface AlertOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  variant?: Variant;
}

interface DialogState {
  kind: "confirm" | "alert";
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant: Variant;
  resolve: (value: boolean) => void;
}

interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used within <DialogProvider>");
  }
  return ctx;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const tc = useTranslations("app.common");
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> =>
      new Promise((resolve) => {
        setDialog({
          kind: "confirm",
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel ?? tc("confirm"),
          cancelLabel: options.cancelLabel ?? tc("cancel"),
          variant: options.variant ?? "default",
          resolve,
        });
      }),
    [tc],
  );

  const alert = useCallback(
    (options: AlertOptions): Promise<void> =>
      new Promise((resolve) => {
        setDialog({
          kind: "alert",
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel ?? tc("ok"),
          variant: options.variant ?? "default",
          resolve: () => resolve(),
        });
      }),
    [tc],
  );

  const handleClose = useCallback(
    (value: boolean) => {
      setDialog((current) => {
        current?.resolve(value);
        return null;
      });
    },
    [],
  );

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog && (
        <Dialog
          kind={dialog.kind}
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          variant={dialog.variant}
          onClose={handleClose}
        />
      )}
    </DialogContext.Provider>
  );
}

// ─── Internal dialog ──────────────────────────────────────────────────────

function Dialog({
  kind,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  onClose,
}: {
  kind: "confirm" | "alert";
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant: Variant;
  onClose: (value: boolean) => void;
}) {
  const tc = useTranslations("app.common");
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus the safe action by default on danger dialogs
  useEffect(() => {
    const target = variant === "danger" ? cancelBtnRef : confirmBtnRef;
    target.current?.focus();
  }, [variant]);

  // Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const accent = {
    default: { ring: "bg-stone text-ink", btn: "bg-ink hover:bg-[#2A2A2A]" },
    danger: { ring: "bg-[#FAF0ED] text-terracotta", btn: "bg-terracotta hover:bg-[#B3634A]" },
    success: { ring: "bg-[#E8F0EA] text-green-deep", btn: "bg-green-deep hover:bg-[#24492F]" },
    info: { ring: "bg-stone text-ink", btn: "bg-ink hover:bg-[#2A2A2A]" },
  }[variant];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="krishi-dialog-title"
      aria-describedby={message ? "krishi-dialog-message" : undefined}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={tc("closeDialog")}
        onClick={() => onClose(false)}
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px]"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl border border-border-light bg-white shadow-2xl">
        <div className="flex flex-col items-center gap-4 px-7 pb-6 pt-8 text-center">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full",
              accent.ring,
            )}
          >
            {variant === "danger" && <DialogAlertIcon />}
            {variant === "success" && <DialogCheckIcon />}
            {(variant === "default" || variant === "info") && <DialogInfoIcon />}
          </div>

          <h2
            id="krishi-dialog-title"
            className="font-serif text-[20px] leading-tight text-ink"
          >
            {title}
          </h2>

          {message && (
            <p
              id="krishi-dialog-message"
              className="text-[14px] leading-[1.6] text-ink-secondary"
            >
              {message}
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t border-border-light bg-stone/60 px-7 py-5">
          {kind === "confirm" && (
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={() => onClose(false)}
              className="inline-flex h-[44px] flex-1 items-center justify-center rounded-[8px] border border-border-light bg-white text-[13px] font-semibold text-ink-nav transition-colors hover:bg-stone"
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => onClose(true)}
            className={cn(
              "inline-flex h-[44px] flex-1 items-center justify-center rounded-[8px] text-[13px] font-bold text-white transition-colors",
              accent.btn,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline icons (kept private to this file) ─────────────────────────────

function DialogCheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

function DialogAlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M12 3L2 21h20L12 3z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" />
    </svg>
  );
}

function DialogInfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </svg>
  );
}