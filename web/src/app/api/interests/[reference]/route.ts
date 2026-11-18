import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInterestByReference } from "@/lib/public/interests";

export const runtime = "nodejs";

/**
 * The signed-in investor's own interest. References are sequential, so this
 * never answers for someone else's (or a guest's) interest.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reference } = await params;
  const interest = await getInterestByReference(reference);
  if (!interest || interest.investorId !== user.id) {
    return NextResponse.json({ error: "Interest not found" }, { status: 404 });
  }
  return NextResponse.json(interest);
}
