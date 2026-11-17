"use client";

import { useState } from "react";
import { useDialog } from "@/components/ui/dialog-provider";
import { FormPasswordInput } from "@/components/auth/FormPasswordInput";

export function ChangePasswordForm() {
  const { alert } = useDialog();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Failed to change password");
        setSubmitting(false);
        return;
      }

      await alert({
        title: "Password changed",
        variant: "success",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormPasswordInput
        label="Current Password"
        name="currentPassword"
        value={currentPassword}
        onChange={setCurrentPassword}
        required
        autoComplete="current-password"
      />
      <FormPasswordInput
        label="New Password"
        name="newPassword"
        value={newPassword}
        onChange={setNewPassword}
        required
        autoComplete="new-password"
        helper="Use at least 8 characters with at least one letter and one number."
      />
      <FormPasswordInput
        label="Confirm New Password"
        name="confirmPassword"
        value={confirmPassword}
        onChange={setConfirmPassword}
        required
        autoComplete="new-password"
      />

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-ink px-6 text-[13px] font-bold text-white hover:bg-[#2A2A2A] disabled:opacity-60"
        >
          {submitting ? "Updating..." : "Change Password"}
        </button>
      </div>
    </form>
  );
}