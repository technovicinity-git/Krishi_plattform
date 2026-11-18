import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

/**
 * Deposits are made inside the per-interest onboarding wizard
 * (/onboarding/[reference]), which knows the interest and amount.
 * This old standalone URL had no interest attached, so send investors to
 * their interests list to continue from the right one.
 */
export default async function OnboardingDepositPage() {
  const locale = await getLocale();
  redirect({ href: "/portal/interests", locale });
}
