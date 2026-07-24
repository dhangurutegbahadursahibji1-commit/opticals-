import { z } from 'zod';

// Fails fast on boot if required environment variables are missing —
// see PRIORITY: "Environment Validation" in the spec.
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_KEY: z.string().optional(),
  // Optional at boot: Media Asset Management (real R2 uploads) is still being
  // finished, and requiring these to be set just to start the API meant local
  // dev / early deploys couldn't run at all without Cloudflare credentials
  // first. StorageService checks `isConfigured` and gives a clear error only
  // when an upload is actually attempted without these set.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY: z.string().optional(),
  R2_SECRET_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
});

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${message}`);
  }
  return parsed.data;
}
