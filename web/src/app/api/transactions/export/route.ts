import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getLedger, ledgerCsv, parseLedgerFilters, type LedgerScope } from "@/lib/transactions";

export const runtime = "nodejs";

/**
 * CSV of the signed-in person's transactions (admins get the whole platform).
 * Same filters as the Transactions page: ?type=&from=&to=&q=
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope: LedgerScope =
    user.role === "admin" ? { kind: "platform" } : { kind: "user", userId: user.id, role: user.role };
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const { entries } = await getLedger(scope, parseLedgerFilters(params));

  const day = new Date().toISOString().slice(0, 10);
  // BOM so Excel opens the UTF-8 file (Bangla names) correctly.
  return new NextResponse("\uFEFF" + ledgerCsv(entries, scope.kind === "platform"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="krishi-transactions-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
