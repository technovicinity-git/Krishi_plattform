import { afterEach, describe, expect, it, vi } from "vitest";

/*
 * Production safety switches: the session key and the one-time-code testing
 * shortcuts. Each test loads the module fresh with its own environment.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.restoreAllMocks();
});

async function loadFlags(env: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v as string);
  vi.resetModules();
  return import("@/lib/auth/dev-flags");
}

describe("one-time code shortcuts", () => {
  it("uses 123456 in development by default", async () => {
    const f = await loadFlags({ NODE_ENV: "development", FIXED_OTP: "", DEV_SHOW_OTP: "" });
    expect(f.fixedOtp()).toBe("123456");
    expect(f.showOtpOnScreen()).toBe(false);
  });

  it("ignores FIXED_OTP and DEV_SHOW_OTP on a live production site", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const f = await loadFlags({ NODE_ENV: "production", FIXED_OTP: "111111", DEV_SHOW_OTP: "true", KRISHI_STAGING: "" });
    expect(f.fixedOtp()).toBeNull();
    expect(f.showOtpOnScreen()).toBe(false);
  });

  it("allows them on a production build marked as staging", async () => {
    const f = await loadFlags({ NODE_ENV: "production", FIXED_OTP: "111111", DEV_SHOW_OTP: "true", KRISHI_STAGING: "true" });
    expect(f.fixedOtp()).toBe("111111");
    expect(f.showOtpOnScreen()).toBe(true);
  });

  it("generates random 6-digit codes on a live site", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FIXED_OTP", "");
    vi.stubEnv("KRISHI_STAGING", "");
    vi.resetModules();
    const { generateOtp } = await import("@/lib/auth/otp");
    const codes = new Set(Array.from({ length: 20 }, () => generateOtp()));
    for (const c of codes) expect(c).toMatch(/^\d{6}$/);
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("session key", () => {
  it("refuses to sign without a strong secret, even in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("KRISHI_SESSION_SECRET", "");
    vi.resetModules();
    const { signSession } = await import("@/lib/auth/jwt");
    await expect(signSession({ sub: "u1", role: "admin" })).rejects.toThrow(/KRISHI_SESSION_SECRET/);
  });

  it("signs and verifies with a strong secret, and rejects tampering", async () => {
    vi.stubEnv("KRISHI_SESSION_SECRET", "x".repeat(48));
    vi.resetModules();
    const { signSession, verifySession } = await import("@/lib/auth/jwt");
    const token = await signSession({ sub: "u1", role: "investor" });
    expect(await verifySession(token)).toEqual({ sub: "u1", role: "investor" });

    const [h, p, sig] = token.split(".");
    const forged = JSON.parse(Buffer.from(p, "base64url").toString());
    forged.role = "admin";
    const tampered = `${h}.${Buffer.from(JSON.stringify(forged)).toString("base64url")}.${sig}`;
    expect(await verifySession(tampered)).toBeNull();
  });
});
