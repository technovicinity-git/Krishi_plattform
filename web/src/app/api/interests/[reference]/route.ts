import { NextResponse } from "next/server";
import { getInterestByReference } from "@/lib/public/interests";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;
  const interest = await getInterestByReference(reference);
  if (!interest) {
    return NextResponse.json({ error: "Interest not found" }, { status: 404 });
  }
  return NextResponse.json(interest);
}