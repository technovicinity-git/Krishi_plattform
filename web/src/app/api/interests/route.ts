import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { submitInterest } from "@/lib/public/interests";

export const runtime = "nodejs";

const schema = z.object({
  offering_id: z.string().uuid(),
  requested_units: z.coerce.number().int().min(1).max(1000),
  message: z.string().max(2000).optional().or(z.literal("")),
  guest_name: z.string().max(120).optional(),
  guest_phone: z.string().max(30).optional(),
  guest_email: z.string().email().max(200).optional().or(z.literal("")),
});

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();
    const investorId = user && user.role === "investor" ? user.id : null;

    const result = await submitInterest({
      offeringId: parsed.data.offering_id,
      requestedUnits: parsed.data.requested_units,
      message: parsed.data.message || undefined,
      guestName: parsed.data.guest_name,
      guestPhone: parsed.data.guest_phone,
      guestEmail: parsed.data.guest_email || undefined,
      investorId,
      ipAddress: getClientIp(request),
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      reference: result.reference,
      status: result.status,
    });
  } catch (err) {
    console.error("[interests POST] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}