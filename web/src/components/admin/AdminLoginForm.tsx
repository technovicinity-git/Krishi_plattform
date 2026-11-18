"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        setSubmitting(false);
        return;
      }

      router.push("/krishi-console");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-[13px] font-semibold text-ink-nav">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-[44px] w-full rounded-[8px] border border-border-light bg-cream px-4 text-[14px] text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none"
          placeholder="admin@krishi.com.bd"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-[13px] font-semibold text-ink-nav">
          Password
        </label>
        <div className="flex h-[44px] w-full items-center rounded-[8px] border border-border-light bg-cream px-4">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full bg-transparent text-[14px] text-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="ml-2 text-[12px] font-semibold text-ink-nav hover:text-ink"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-[48px] w-full items-center justify-center rounded-[8px] bg-brand text-[14px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {submitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}