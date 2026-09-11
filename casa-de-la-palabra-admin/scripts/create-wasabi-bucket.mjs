import { S3Client, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

const REGION = process.env.WASABI_REGION;
const ENDPOINT = process.env.WASABI_ENDPOINT;
const BUCKET = process.env.WASABI_BUCKET;

const client = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY,
    secretAccessKey: process.env.WASABI_SECRET_KEY,
  },
});

// Public bucket policies don't help on this account — it blocks public
// object reads account-wide, so no ACL or policy can make GETs work
// directly. Media is served through casa-de-la-palabra-web's /m/... proxy
// instead (see that app's src/lib/wasabi.ts), which reads with these same
// private credentials.
try {
  await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
  console.log(`Bucket "${BUCKET}" ya existe.`);
} catch {
  await client.send(
    new CreateBucketCommand({
      Bucket: BUCKET,
      CreateBucketConfiguration: { LocationConstraint: REGION },
    })
  );
  console.log(`Bucket "${BUCKET}" creado.`);
}
