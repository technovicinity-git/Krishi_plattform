import { cn } from "@/lib/cn";

interface FormCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function FormCheckbox({
  id,
  checked,
  onChange,
  children,
  className,
}: FormCheckboxProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[4px] border border-border-light accent-brand"
      />
      <label
        htmlFor={id}
        className="cursor-pointer text-[14px] leading-[1.55] text-ink-secondary"
      >
        {children}
      </label>
    </div>
  );
}