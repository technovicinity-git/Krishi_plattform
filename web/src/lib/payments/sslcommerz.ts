/**
 * Minimal SSLCommerz client (API v4). Server-only.
 *
 * Env:
 *   SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD  — from the merchant panel
 *   SSLCOMMERZ_SANDBOX                               — "false" for live; anything else = sandbox
 *   APP_URL (optional)                               — public base URL for callbacks,
 *                                                      e.g. https://krishi.com.bd
 *
 * Never trust what the browser posts back: always confirm with validate().
 */

const SANDBOX_HOST = "https://sandbox.sslcommerz.com";
const LIVE_HOST = "https://securepay.sslcommerz.com";

interface Config {
  storeId: string;
  storePassword: string;
  host: string;
  sandbox: boolean;
}

function config(): Config | null {
  const storeId = process.env.SSLCOMMERZ_STORE_ID?.trim();
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD?.trim();
  if (!storeId || !storePassword) return null;
  const sandbox = process.env.SSLCOMMERZ_SANDBOX !== "false";
  return { storeId, storePassword, sandbox, host: sandbox ? SANDBOX_HOST : LIVE_HOST };
}

/** True when store credentials are configured. */
export function isSslcommerzEnabled(): boolean {
  return config() !== null;
}

export function isSslcommerzSandbox(): boolean {
  return config()?.sandbox ?? true;
}

export interface InitInput {
  tranId: string;
  amount: number;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
  customer: { name: string; email: string; phone: string; address: string; city: string };
  productName: string;
  productCategory: string;
}

export type InitResult =
  | { ok: true; gatewayUrl: string; sessionKey: string }
  | { ok: false; error: string };

/** Opens a payment session; send the customer to `gatewayUrl`. */
export async function initSession(input: InitInput): Promise<InitResult> {
  const cfg = config();
  if (!cfg) return { ok: false, error: "Online payment is not configured" };

  const body = new URLSearchParams({
    store_id: cfg.storeId,
    store_passwd: cfg.storePassword,
    total_amount: input.amount.toFixed(2),
    currency: "BDT",
    tran_id: input.tranId,
    success_url: input.successUrl,
    fail_url: input.failUrl,
    cancel_url: input.cancelUrl,
    ipn_url: input.ipnUrl,
    cus_name: input.customer.name,
    cus_email: input.customer.email,
    cus_phone: input.customer.phone,
    cus_add1: input.customer.address,
    cus_city: input.customer.city,
    cus_country: "Bangladesh",
    shipping_method: "NO",
    num_of_item: "1",
    product_name: input.productName,
    product_category: input.productCategory,
    product_profile: "general",
  });

  try {
    const res = await fetch(`${cfg.host}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await res.json().catch(() => null)) as {
      status?: string;
      GatewayPageURL?: string;
      sessionkey?: string;
      failedreason?: string;
    } | null;
    if (data?.status === "SUCCESS" && data.GatewayPageURL && data.sessionkey) {
      return { ok: true, gatewayUrl: data.GatewayPageURL, sessionKey: data.sessionkey };
    }
    return { ok: false, error: data?.failedreason || `SSLCommerz returned ${res.status}` };
  } catch (err) {
    console.error("[sslcommerz] init failed:", err);
    return { ok: false, error: "Could not reach the payment gateway" };
  }
}

export interface Validation {
  status: string; // VALID | VALIDATED | INVALID_TRANSACTION | ...
  tran_id?: string;
  val_id?: string;
  amount?: string;
  currency?: string;
  currency_amount?: string;
  currency_type?: string;
  bank_tran_id?: string;
  card_type?: string;
  card_brand?: string;
  risk_level?: string; // "0" safe, "1" risky
  risk_title?: string;
  [key: string]: unknown;
}

/** Asks SSLCommerz whether a payment (by val_id) really succeeded. */
export async function validate(valId: string): Promise<Validation | null> {
  const cfg = config();
  if (!cfg) return null;
  const url = new URL(`${cfg.host}/validator/api/validationserverAPI.php`);
  url.searchParams.set("val_id", valId);
  url.searchParams.set("store_id", cfg.storeId);
  url.searchParams.set("store_passwd", cfg.storePassword);
  url.searchParams.set("v", "1");
  url.searchParams.set("format", "json");
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    return (await res.json().catch(() => null)) as Validation | null;
  } catch (err) {
    console.error("[sslcommerz] validation failed:", err);
    return null;
  }
}
