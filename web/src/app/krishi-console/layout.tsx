import type { Metadata } from "next";
import { dmSerif, inter } from "@/fonts";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { DialogProvider } from "@/components/ui/dialog-provider";
import messages from "@/messages/en.json";

export const metadata: Metadata = {
  title: "Krishi Console",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The console is English-only and lives outside [locale], but shared
  // components (dialogs, user menu, form fields) use next-intl.
  setRequestLocale("en");

  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body>
        <NextIntlClientProvider locale="en" messages={messages}>
          <DialogProvider>{children}</DialogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}