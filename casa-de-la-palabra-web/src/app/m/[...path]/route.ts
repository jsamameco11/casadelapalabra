import { NextResponse } from "next/server";
import { getMedia, sanitizeMediaKey } from "@/lib/wasabi";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = sanitizeMediaKey(path);
  if (!key) return new NextResponse("Not found", { status: 404 });

  try {
    const { bytes, contentType } = await getMedia(key);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
