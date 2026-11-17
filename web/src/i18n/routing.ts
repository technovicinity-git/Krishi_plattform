import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["bn", "en"],
  defaultLocale: "bn",
  localePrefix: "as-needed",
  localeDetection: false, // Bangla is the fixed default — no browser-based redirect
});

export type Locale = (typeof routing.locales)[number];