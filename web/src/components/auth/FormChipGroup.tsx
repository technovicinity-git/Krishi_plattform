import { cn } from "@/lib/cn";

interface ChipOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormChipGroupProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FormChipGroup({
  options,
  value,
  onChange,
  className,
}: FormChipGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => !opt.disabled && onChange(opt.value)}
            disabled={opt.disabled}
            className={cn(
              "inline-flex items-center rounded-[10px] border px-4 py-2 text-[13px] font-semibold transition-colors",
              selected
                ? "border-transparent bg-ink text-white"
                : "border-border-light bg-white text-ink-secondary hover:bg-stone",
              opt.disabled && "cursor-not-allowed opacity-40",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}