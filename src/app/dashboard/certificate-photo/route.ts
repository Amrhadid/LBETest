import { NextResponse } from "next/server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { CERTIFICATE_PHOTOS_BUCKET } from "@/lib/certificates/finalize";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Candidate uploads (or replaces) their certificate photo. Stored in the private
 * certificate-photos bucket under {userId}/, then marked 'pending' for admin
 * approval. Done via the service role because the status column is app-set only.
 * An already-approved photo is locked (the DB trigger also enforces this).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const svc = createServiceRoleClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("certificate_photo_status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.certificate_photo_status === "approved") {
    return NextResponse.json(
      { error: "Your certificate photo is approved and locked. Contact an administrator to change it." },
      { status: 409 },
    );
  }

  const form = await req.formData();
  const file = form.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WEBP image." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 6 MB)." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const path = `${user.id}/certificate-photo.${ext}`;

  const { error: upErr } = await svc.storage
    .from(CERTIFICATE_PHOTOS_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (upErr) {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const { error } = await svc
    .from("profiles")
    .update({ certificate_photo_path: path, certificate_photo_status: "pending" })
    .eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: "Could not save the photo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "pending" });
}
