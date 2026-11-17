import { cn } from "@/lib/cn";

interface FormRadioCardProps {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description: string;
  badge?: string;
  icon?: React.ReactNode;
}

export function FormRadioCard({
  id,
  name,
  value,
  checked,
  onChange,
  title,
  description,
  badge,
  icon,
}: FormRadioCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer flex-col gap-3 rounded-[10px] border bg-cream p-5 transition-colors",
        checked ? "border-brand bg-brand-tint" : "border-border-light hover:bg-stone",
      )}
    >
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={(e) => onChange(e.target.value)}
          className="h-4 w-4 shrink-0 cursor-pointer accent-brand"
        />
        {icon}
        <span className="text-[15px] font-bold text-ink">{title}</span>
        {badge && (
          <span className="ml-auto inline-flex items-center rounded-[4px] bg-brand px-2 py-1 text-[9px] font-bold uppercase tracking-[0.02em] text-white">
            {badge}
          </span>
        )}
      </div>
      <p className="pl-7 text-[13px] leading-[1.5] text-ink-secondary">
        {description}
      </p>
    </label>
  );
}