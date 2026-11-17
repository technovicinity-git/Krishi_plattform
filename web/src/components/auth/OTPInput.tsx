"use client";

import { useRef } from "react";

interface OTPInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  length?: number;
  autoFocus?: boolean;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  autoFocus,
}: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    // Handle paste of multiple digits into one field
    if (char.length > 1) {
      const digits = char.replace(/\D/g, "").slice(0, length).split("");
      const next = [...value];
      digits.forEach((d, i) => {
        if (index + i < length) next[index + i] = d;
      });
      onChange(next);
      const focusIndex = Math.min(index + digits.length, length - 1);
      refs.current[focusIndex]?.focus();
      return;
    }

    // Single digit
    const digit = char.replace(/\D/g, "");
    const next = [...value];
    next[index] = digit;
    onChange(next);

    // Advance focus on single-digit entry
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text");
            handleChange(i, pasted);
          }}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          className="h-[52px] w-[52px] rounded-[8px] border border-border-light bg-cream text-center text-[20px] font-bold text-ink focus:border-sage focus:outline-none"
        />
      ))}
    </div>
  );
}