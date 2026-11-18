"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

interface FormPasswordInputProps {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helper?: string;
  autoComplete?: string;
  className?: string;
}

export function FormPasswordInput({
  label,
  name,
  placeholder,
  value,
  onChange,
  required,
  helper,
  autoComplete,
  className,
}: FormPasswordInputProps) {
  const t = useTranslations("authShell");
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-[14px] font-semibold text-ink-nav">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>

      <div className="flex h-[48px] items-center gap-3 rounded-[8px] border border-border-light bg-cream px-4">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-[14px] text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-[13px] font-semibold text-ink-nav hover:text-ink"
          aria-label={visible ? t("hidePassword") : t("showPassword")}
        >
          {visible ? t("hide") : t("show")}
        </button>
      </div>

      {helper && (
        <p className="text-[12px] leading-tight text-ink-secondary">{helper}</p>
      )}
    </div>
  );
}