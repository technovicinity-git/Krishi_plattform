import { ChevronDownIcon } from "@/components/icons";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  helper?: string;
  disabled?: boolean;
  className?: string;
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  optional,
  helper,
  disabled,
  className,
}: FormSelectProps) {
  const tc = useTranslations("app.common");
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-[14px] font-semibold text-ink-nav">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
        {optional && (
          <span className="ml-1 text-[12px] font-normal text-ink-muted">{tc("optional")}</span>
        )}
      </label>

      <div
        className={cn(
          "relative flex h-[48px] items-center rounded-[8px] border border-border-light bg-cream",
          disabled && "opacity-60",
        )}
      >
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full appearance-none bg-transparent py-3 pl-4 pr-10 text-[14px] focus:outline-none",
            value ? "text-ink" : "text-ink-muted",
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 h-4 w-4 text-ink-tertiary" />
      </div>

      {helper && (
        <p className="text-[12px] leading-tight text-ink-secondary">{helper}</p>
      )}
    </div>
  );
}