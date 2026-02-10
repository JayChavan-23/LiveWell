import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.string().default('3000').transform((v) => Number(v)),
  CORS_ORIGIN: z.string().optional(),           // comma-separated
  REDIS_URL: z.string().url().optional(),

  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
});

const raw = {
  PORT: process.env.PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  REDIS_URL: process.env.REDIS_URL,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
};

const parsed = EnvSchema.safeParse(raw);
if (!parsed.success) {
  console.error('[config] Invalid environment:', parsed.error.flatten().fieldErrors);
  // In dev we don’t crash; switch to throw if you want strict behavior:
  // throw new Error('Invalid environment');
}
const env = parsed.success ? parsed.data : raw;

export const config = {
  port: env.PORT ?? 3000,
  corsOrigins:
    (env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : ['*']).map((s) => s.trim()).filter(Boolean),
  redisUrl: env.REDIS_URL,
  firebase: {
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    // support both raw multi-line and \n-escaped strings
    privateKey: env.FIREBASE_PRIVATE_KEY ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  },
};
