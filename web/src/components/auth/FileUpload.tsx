"use client";

import { useTranslations } from "next-intl";
import { PaperclipIcon } from "@/components/icons";
import { useDialog } from "@/components/ui/dialog-provider";

interface FileUploadProps {
  id: string;
  label?: string;
  accept?: string;
  maxSizeMb?: number;
  onFile?: (file: File | null) => void;
  fileName?: string;
}

export function FileUpload({
  id,
  label,
  accept = "image/jpeg,image/png,application/pdf",
  maxSizeMb = 5,
  onFile,
  fileName,
}: FileUploadProps) {
  const t = useTranslations("authShell");
  const { alert } = useDialog();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > maxSizeMb * 1024 * 1024) {
      void alert({
        title: t("fileTooLarge", { max: maxSizeMb }),
        variant: "danger",
      });
      e.target.value = "";
      return;
    }
    onFile?.(file);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={id}
          className="text-[13px] font-semibold text-ink-nav"
        >
          {label}
          <span className="ml-1 text-terracotta">*</span>
        </label>
      )}
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-border-light bg-cream px-6 py-6 text-center transition-colors hover:bg-stone"
      >
        <PaperclipIcon className="h-5 w-5 text-ink-secondary" />
        {fileName ? (
          <span className="text-[13px] font-semibold text-ink">{fileName}</span>
        ) : (
          <span className="text-[13px] text-ink-muted">
            {t("uploadHint", { max: maxSizeMb })}
          </span>
        )}
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </label>
    </div>
  );
}