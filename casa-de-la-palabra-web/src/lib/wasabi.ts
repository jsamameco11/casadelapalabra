import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const REGION = process.env.WASABI_REGION || "us-central-1";
const ENDPOINT = (process.env.WASABI_ENDPOINT || "https://s3.us-central-1.wasabisys.com").replace(/\/$/, "");
const BUCKET = process.env.WASABI_BUCKET || "";

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

// The Wasabi account this bucket lives in blocks public object reads
// account-wide ("Public use of objects is not allowed by this account"),
// so images can't be served straight from Wasabi. This app fetches them
// server-side with the private credentials and streams the bytes back —
// the same workaround Folio's folio-control already uses for its own media.
export function sanitizeMediaKey(rawSegments: string[]) {
  const raw = rawSegments.map(decodeURIComponent).join("/");
  if (!raw || raw.includes("..") || raw.includes("//")) return "";
  if (!/^[a-z0-9][a-z0-9/_.-]*$/i.test(raw)) return "";
  return raw;
}

export async function getMedia(key: string) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const res = await client().send(command);
  const body = await res.Body?.transformToByteArray();
  return {
    bytes: body ? Buffer.from(body) : Buffer.alloc(0),
    contentType: res.ContentType || "application/octet-stream",
  };
}
