import { rm, mkdir } from 'fs/promises';
import { join } from 'path';

// Wipe the R2 bucket data inside the test state dir so each run starts with
// an empty bucket. The parent dir itself must exist before wrangler starts or
// it falls back to using the real Cloudflare R2 (a wrangler 4.x quirk).
// CLOUDFLARE_API_TOKEN/ACCOUNT_ID are cleared in the webServer command so that
// wrangler --local uses miniflare's in-process R2 rather than the live bucket.
export default async function globalSetup() {
  const testStatePath = join(process.cwd(), '.wrangler', 'test-state');
  const r2BucketPath = join(testStatePath, 'v3', 'r2', 'pascals-recipes');
  await rm(r2BucketPath, { recursive: true, force: true });
  await mkdir(r2BucketPath, { recursive: true });
}
