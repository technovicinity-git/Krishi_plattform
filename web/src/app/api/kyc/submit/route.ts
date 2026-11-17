import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionFromCookie } from "@/lib/auth/session";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "kyc-documents";

function isValidFile(f: unknown): f is File {
  return f instanceof File && f.size > 0;
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 },
      );
    }

    const form = await request.formData();

    const docType = String(form.get("docType") ?? "").trim();
    const nidNumber = String(form.get("nidNumber") ?? "").trim();
    const presentAddress = String(form.get("presentAddress") ?? "").trim();
    const permanentAddress = String(form.get("permanentAddress") ?? "").trim();
    const nidFront = form.get("nidFront");
    const nidBack = form.get("nidBack");
    const profilePhoto = form.get("profilePhoto"); // optional

    // Validation
    if (docType !== "nid") {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }
    if (!/^\d{10,17}$/.test(nidNumber)) {
      return NextResponse.json({ error: "Invalid NID number" }, { status: 400 });
    }
    if (presentAddress.length < 5 || permanentAddress.length < 5) {
      return NextResponse.json({ error: "Address is too short" }, { status: 400 });
    }
    if (!isValidFile(nidFront)) {
        return NextResponse.json({ error: "NID front side is required" }, { status: 400 });
        }
        if (!isValidFile(nidBack)) {
        return NextResponse.json({ error: "NID back side is required" }, { status: 400 });
        }
        // profilePhoto is optional — only validate if present
        if (profilePhoto && isValidFile(profilePhoto) && !ALLOWED_TYPES.includes(profilePhoto.type)) {
        return NextResponse.json({ error: "Profile photo: only JPG, PNG or PDF allowed" }, { status: 400 });
        }

    const files: { file: File; kind: "nid-front" | "nid-back" | "profile" }[] = [
        { file: nidFront, kind: "nid-front" },
        { file: nidBack, kind: "nid-back" },
        ];
        if (isValidFile(profilePhoto)) {
        files.push({ file: profilePhoto, kind: "profile" });
    }

    for (const { file, kind } of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `${kind}: Only JPG, PNG or PDF allowed` },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `${kind}: File exceeds 5 MB` },
          { status: 400 },
        );
      }
    }

    const admin = createAdminClient();
    const userId = session.sub;
    const timestamp = Date.now();

    // Upload each file
    const uploads: Record<string, string> = {};
    for (const { file, kind } of files) {
      const ext = file.type === "application/pdf" ? "pdf" : "jpg";
      const path = `${userId}/${kind}-${timestamp}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(path, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error(`[kyc/submit] upload failed for ${kind}:`, uploadError);
        return NextResponse.json(
          { error: "Failed to upload document" },
          { status: 500 },
        );
      }

      uploads[kind] = path;
    }

    // Upsert KYC profile row
    const { error: kycError } = await admin
      .from("kyc_profiles")
      .upsert(
        {
          user_id: userId,
          status: "pending",
          full_name: null,
          nid_number: nidNumber,
          present_address: presentAddress,
          permanent_address: permanentAddress,
          nid_front_path: uploads["nid-front"],
          nid_back_path: uploads["nid-back"],
          profile_photo_path: uploads["profile"],
          submitted_at: new Date().toISOString(),
          submitted_by: userId,
        },
        { onConflict: "user_id" },
      );

    if (kycError) {
      console.error("[kyc/submit] kyc_profiles upsert failed:", kycError);
      return NextResponse.json(
        { error: "Failed to save KYC submission" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[kyc/submit] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}