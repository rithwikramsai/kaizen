import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_TEST_URL: z.string().optional(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  FILE_STORAGE_ADAPTER: z.enum(['local', 's3', 'azure_blob', 'minio']).default('local'),
  FILE_STORAGE_LOCAL_PATH: z.string().default('./uploads'),

  EMAIL_ADAPTER: z.enum(['mock', 'mailhog', 'smtp']).default('mock'),
  MAILHOG_HOST: z.string().default('localhost'),
  MAILHOG_PORT: z.coerce.number().default(1025),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
