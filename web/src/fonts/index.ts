import localFont from "next/font/local";

/*
 * Self-hosted fonts (Latin subset, downloaded from Google Fonts) so builds
 * don't need network access to fonts.googleapis.com.
 */

export const inter = localFont({
  src: "./inter-latin-variable.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const dmSerif = localFont({
  src: "./dm-serif-display-latin-400.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-dm-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});
