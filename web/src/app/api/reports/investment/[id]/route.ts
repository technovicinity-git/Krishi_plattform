import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { investmentRoleFor } from "@/lib/investments/access";
import { getInvestmentDetail } from "@/lib/investments/detail";
import { investmentStatementPdf, type ReportLocale } from "@/lib/pdf/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET ?lang=en|bn — PDF statement of one investment. Open to its investor,
 * steward and farmer, and to admins.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lang: ReportLocale = new URL(request.url).searchParams.get("lang") === "bn" ? "bn" : "en";

  const admin = await getCurrentAdmin();
  if (!admin) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await investmentRoleFor(user, id))) {
      return Response.json({ error: "Investment not found" }, { status: 404 });
    }
  }

  const inv = await getInvestmentDetail(id);
  if (!inv) return Response.json({ error: "Investment not found" }, { status: 404 });

  try {
    const pdf = await investmentStatementPdf(inv, lang);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${inv.reference}-statement.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[reports/investment] failed:", err);
    return Response.json({ error: "Could not create the report" }, { status: 500 });
  }
}
