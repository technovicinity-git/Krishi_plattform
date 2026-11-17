import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

interface FormInputProps {
  label: string;
  name: string;
  type?: "text" | "email" | "tel";
  placeholder?: string;
  value: string;
  onChange?: (value: string) => void;
  required?: boolean;
  optional?: boolean;
  helper?: string;
  autoComplete?: string;
  prefix?: string;
  disabled?: boolean;
  prefilled?: boolean;
  className?: string;
}

export function FormInput({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  optional,
  helper,
  autoComplete,
  prefix,
  disabled,
  prefilled,
  className,
}: FormInputProps) {
  const tc = useTranslations("app.common");
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <label htmlFor={name} className="text-[14px] font-semibold text-ink-nav">
          {label}
          {required && <span className="ml-1 text-terracotta">*</span>}
          {optional && (
            <span className="ml-1 text-[12px] font-normal text-ink-muted">{tc("optional")}</span>
          )}
        </label>
        {prefilled && (
          <span className="inline-flex items-center rounded-[3px] bg-[#E8F0EA] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.02em] text-green-deep">
            Pre-filled
          </span>
        )}
      </div>

      <div
        className={cn(
          "flex h-[48px] items-center gap-3 rounded-[8px] border border-border-light px-4",
          disabled || prefilled ? "bg-stone opacity-80" : "bg-cream",
        )}
      >
        {prefix && (
          <>
            <span className="text-[14px] text-ink">{prefix}</span>
            <span className="h-5 w-px bg-border-light" />
          </>
        )}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled || prefilled}
          readOnly={prefilled}
          className="w-full bg-transparent text-[14px] text-ink placeholder:text-ink-muted focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {helper && (
        <p className="text-[12px] leading-tight text-ink-secondary">{helper}</p>
      )}
    </div>
  );
}