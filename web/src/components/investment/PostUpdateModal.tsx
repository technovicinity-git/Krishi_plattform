"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { compressImage } from "@/lib/images/compress";
import { cn } from "@/lib/cn";
import {
  FieldLabel,
  FormError,
  Modal,
  ModalActions,
  fieldClass,
} from "@/components/dashboard/Modal";
import { PhotoField } from "./PhotoField";

const TYPES = ["health_check", "photo_update", "note"] as const;
type UpdateType = (typeof TYPES)[number];

/** Farmer posts a health check, photo or note to the investment timeline. */
export function PostUpdateModal({
  investmentId,
  onClose,
}: {
  investmentId: string;
  onClose: () => void;
}) {
  const t = useTranslations("app.updateForm");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const ids = { title: useId(), body: useId() };
  const [type, setType] = useState<UpdateType>("health_check");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoRequired = type === "photo_update";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photoRequired && !photo) {
      setError(t("photoRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("investment_id", investmentId);
      fd.set("update_type", type);
      fd.set("title", title);
      fd.set("body", body);
      if (photo) fd.set("photo", await compressImage(photo, 1600, 1));

      const res = await fetch("/api/farmer/updates", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("failed"));
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
      setLoading(false);
    }
  };

  return (
    <Modal title={t("title")} subtitle={t("subtitle")} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <FieldLabel>{t("type")}</FieldLabel>
          <div className="mt-1.5 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("type")}>
            {TYPES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={type === value}
                onClick={() => setType(value)}
                className={cn(
                  "h-[40px] rounded-[8px] border text-[12.5px] font-semibold transition-colors",
                  type === value
                    ? "border-brand bg-brand-tint text-green-deep"
                    : "border-border-light bg-white text-ink-secondary hover:bg-stone/60",
                )}
              >
                {t(`types.${value}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel htmlFor={ids.title}>{t("heading")}</FieldLabel>
          <input
            id={ids.title}
            required
            minLength={2}
            maxLength={120}
            value={title}
            placeholder={t("headingPlaceholder")}
            onChange={(e) => setTitle(e.target.value)}
            className={`${fieldClass} h-[44px]`}
          />
        </div>
        <div>
          <FieldLabel htmlFor={ids.body}>{t("body")}</FieldLabel>
          <textarea
            id={ids.body}
            rows={3}
            maxLength={2000}
            value={body}
            placeholder={t("bodyPlaceholder")}
            onChange={(e) => setBody(e.target.value)}
            className={`${fieldClass} py-2.5`}
          />
        </div>
        <PhotoField
          label={photoRequired ? t("photo") : t("photoOptional")}
          file={photo}
          onChange={setPhoto}
          required={photoRequired}
        />
        <FormError>{error}</FormError>
        <ModalActions
          onCancel={onClose}
          cancelLabel={tc("cancel")}
          submitLabel={loading ? t("submitting") : t("submit")}
          disabled={loading || title.trim().length < 2}
        />
      </form>
    </Modal>
  );
}
