import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

interface FormTextareaProps {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  optional?: boolean;
  helper?: string;
  className?: string;
}

export function FormTextarea({
  label,
  name,
  placeholder,
  value,
  onChange,
  rows = 6,
  required,
  optional,
  helper,
  className,
}: FormTextareaProps) {
  const tc = useTranslations("app.common");
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-[14px] font-semibold text-ink-nav">
        {label}
        {required && <span className="ml-1 text-terracotta">*</span>}
        {optional && (
          <span className="ml-1 text-[12px] font-normal text-ink-muted">{tc("optional")}</span>
        )}
      </label>

      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-[8px] border border-border-light bg-cream px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none"
      />

      {helper && (
        <p className="text-[12px] leading-tight text-ink-secondary">{helper}</p>
      )}
    </div>
  );
}