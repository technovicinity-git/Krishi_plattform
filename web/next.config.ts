import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;
const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  // pdfkit reads its own font metric files from disk at runtime, so load it
  // with Node's require instead of bundling it.
  serverExternalPackages: ["pdfkit"],
  // The PDF report routes read these font files from disk.
  outputFileTracingIncludes: {
    "/api/reports/**": ["./src/fonts/pdf/**/*"],
  },
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/**",
            },
          ]
        : []),
    ],
  },
};

export default withNextIntl(nextConfig);