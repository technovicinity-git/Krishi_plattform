import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "../globals.css";
import { DialogProvider } from "@/components/ui/dialog-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Krishi Console",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body>
        <DialogProvider>{children}</DialogProvider>
        </body>
    </html>
  );
}