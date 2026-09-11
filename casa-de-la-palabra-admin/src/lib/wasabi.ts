import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const REGION = process.env.WASABI_REGION || "us-central-1";
const ENDPOINT = (process.env.WASABI_ENDPOINT || "https://s3.us-central-1.wasabisys.com").replace(/\/$/, "");
const BUCKET = process.env.WASABI_BUCKET || "";
// This Wasabi account blocks public object reads ("Public use of objects is
// not allowed by this account"), so uploaded images are never linked to
// Wasabi directly. casa-de-la-palabra-web's /m/... route fetches them
// server-side with the same credentials and streams the bytes back.
const MEDIA_PUBLIC_BASE_URL = (process.env.MEDIA_PUBLIC_BASE_URL || "").replace(/\/$/, "");

const IMAGE_TYPES: Record<string, { ext: string }> = {
  "image/jpeg": { ext: "jpg" },
  "image/png": { ext: "png" },
  "image/webp": { ext: "webp" },
  "image/gif": { ext: "gif" },
};

const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

let cachedClient: S3Client | null = null;

function client() {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY || "",
        secretAccessKey: process.env.WASABI_SECRET_KEY || "",
      },
    });
  }
  return cachedClient;
}

export function wasabiConfigured() {
  return Boolean(process.env.WASABI_ACCESS_KEY && process.env.WASABI_SECRET_KEY && BUCKET && MEDIA_PUBLIC_BASE_URL);
}

export function publicMediaUrl(key: string) {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${MEDIA_PUBLIC_BASE_URL}/${encoded}`;
}

function sanitizeFolder(folder: string) {
  const raw = String(folder || "uploads").replace(/[^a-z0-9/_-]/gi, "");
  return raw.replace(/^\/+|\/+$/g, "") || "uploads";
}

export async function uploadImage({
  bytes,
  mime,
  folder,
}: {
  bytes: Buffer;
  mime: string;
  folder: string;
}): Promise<{ url: string; key: string }> {
  if (!wasabiConfigured()) {
    throw new Error("Wasabi no está configurado (faltan variables de entorno).");
  }
  const spec = IMAGE_TYPES[mime];
  if (!spec) {
    throw new Error("Usa una imagen JPG, PNG, WebP o GIF.");
  }
  if (bytes.length > IMAGE_MAX_BYTES) {
    throw new Error(`La imagen supera el límite de ${IMAGE_MAX_BYTES / (1024 * 1024)} MB.`);
  }

  const key = `${sanitizeFolder(folder)}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${spec.ext}`;

  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: bytes,
      ContentType: mime,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { url: publicMediaUrl(key), key };
}
