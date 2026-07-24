import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// 'prescriptions' and 'payment-proofs' are dedicated folders for sensitive
// customer uploads. They used to be dumped into 'gallery' as a "catch-all"
// (see the old comment in upload.controller.ts) — mixing private prescription
// photos and payment screenshots in with public marketing gallery images in
// the same bucket prefix. Kept separate now.
export type R2Folder =
  | 'products' | 'brands' | 'categories' | 'blogs' | 'offers' | 'gallery' | 'testimonials' | 'settings'
  | 'prescriptions' | 'payment-proofs';

/**
 * Cloudflare R2 is S3-compatible, so we talk to it with the standard AWS S3 SDK
 * pointed at the R2 account endpoint. Only URLs are ever persisted to Postgres —
 * see spec: "Images must NEVER be stored in the database."
 *
 * R2 credentials are optional at the config level (see config/validation.ts) —
 * Media Asset Management is still being finished, so a store shouldn't be
 * unable to boot its API just because R2 isn't configured yet. `isConfigured`
 * lets callers check before attempting an upload, and `upload`/`getPresignedUploadUrl`
 * throw a clear, actionable error rather than a raw AWS SDK failure if it isn't.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  public readonly isConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('r2.accountId');
    const accessKey = this.config.get<string>('r2.accessKey');
    const secretKey = this.config.get<string>('r2.secretKey');
    this.bucket = this.config.get<string>('r2.bucket') ?? '';
    this.publicUrl = (this.config.get<string>('r2.publicUrl') ?? '').replace(/\/$/, '');
    this.isConfigured = Boolean(accountId && accessKey && secretKey && this.bucket && this.publicUrl);

    if (!this.isConfigured) {
      this.logger.warn(
        'Cloudflare R2 is not configured (missing R2_* env vars). File uploads will fail until it is set up. The API will still boot.'
      );
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey ?? '',
        secretAccessKey: secretKey ?? '',
      },
    });
  }

  private assertConfigured() {
    if (!this.isConfigured) {
      throw new Error(
        'File storage is not configured yet. Set R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET and R2_PUBLIC_URL, then restart the API.'
      );
    }
  }

  private buildKey(folder: R2Folder, fileName: string): string {
    const ext = fileName.split('.').pop();
    return `${folder}/${randomUUID()}.${ext}`;
  }

  async upload(folder: R2Folder, fileName: string, body: Buffer, contentType: string): Promise<string> {
    this.assertConfigured();
    const key = this.buildKey(folder, fileName);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
    this.logger.log(`Uploaded ${key}`);
    return `${this.publicUrl}/${key}`;
  }

  /** Presigned PUT URL so the admin dashboard can upload directly, browser -> R2. */
  async getPresignedUploadUrl(folder: R2Folder, fileName: string, contentType: string, expiresInSeconds = 300) {
    this.assertConfigured();
    const key = this.buildKey(folder, fileName);
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    return { uploadUrl, publicUrl: `${this.publicUrl}/${key}`, key };
  }

  private keyFromUrl(url: string): string {
    return url.replace(`${this.publicUrl}/`, '');
  }

  async delete(url: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.keyFromUrl(url) }));
      this.logger.log(`Deleted ${url}`);
    } catch (err) {
      this.logger.error(`Failed to delete ${url}: ${(err as Error).message}`);
      throw err;
    }
  }

  async deleteMany(urls: string[]): Promise<void> {
    if (urls.length === 0) return;
    try {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: urls.map((url) => ({ Key: this.keyFromUrl(url) })) },
        })
      );
      this.logger.log(`Bulk-deleted ${urls.length} objects`);
    } catch (err) {
      this.logger.error(`Bulk delete failed: ${(err as Error).message}`);
      throw err;
    }
  }

  /** Used by the health check to confirm R2 connectivity/credentials are valid. */
  async healthCheck(): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1 }));
      return true;
    } catch {
      return false;
    }
  }
}
