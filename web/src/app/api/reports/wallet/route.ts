import { getCurrentUser } from "@/lib/auth/current-user";
import { getWallet } from "@/lib/wallet";
import { walletStatementPdf, type ReportLocale } from "@/lib/pdf/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?lang=en|bn — PDF statement of the signed-in user's wallet. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["investor", "farmer", "steward"].includes(user.role)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const lang: ReportLocale = new URL(request.url).searchParams.get("lang") === "bn" ? "bn" : "en";

  try {
    const wallet = await getWallet(user.id);
    const pdf = await walletStatementPdf(
      { fullName: user.fullName ?? null, phone: user.phone ?? null, role: user.role },
      wallet,
      lang,
    );
    const day = new Date().toISOString().slice(0, 10);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="krishi-wallet-${day}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[reports/wallet] failed:", err);
    return Response.json({ error: "Could not create the report" }, { status: 500 });
  }
}
