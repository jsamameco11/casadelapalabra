import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/auth";
import { uploadImage } from "@/lib/wasabi";

export const runtime = "nodejs";

const ALLOWED_FOLDERS = new Set(["studies", "courses", "podcasts", "rebet"]);

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }
  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: "Carpeta destino inválida." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const { url } = await uploadImage({ bytes, mime: file.type, folder });
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo subir la imagen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
