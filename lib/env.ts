import { z } from "zod/v4";

/**
 * Environment variable validation schema
 * This ensures all required environment variables are set and correctly typed
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Authentication
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url().optional(),
  NEXTAUTH_URL: z.url().optional(),

  // GitHub OAuth
  GITHUB_ID: z.string().min(1, "GITHUB_ID is required for GitHub authentication"),
  GITHUB_SECRET: z.string().min(1, "GITHUB_SECRET is required for GitHub authentication"),

  // Google OAuth (optional)
  GOOGLE_ID: z.string().optional(),
  GOOGLE_SECRET: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Cached validated environment
 */
let validatedEnv: Env | null = null;

/**
 * Get validated environment variables
 * Throws detailed error if validation fails
 */
export function getEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `❌ Invalid environment variables:\n${errors}\n\n` +
        `Please check your .env file and ensure all required variables are set.`
    );
  }

  validatedEnv = result.data;
  return validatedEnv;
}

/**
 * Safe access to individual env vars with fallbacks
 */
export const env = {
  get databaseUrl() {
    return getEnv().DATABASE_URL;
  },

  get authSecret() {
    return getEnv().AUTH_SECRET;
  },

  get baseUrl() {
    const e = getEnv();
    if (e.BETTER_AUTH_URL) {
      return e.BETTER_AUTH_URL;
    }

    if (e.NEXTAUTH_URL) {
      return e.NEXTAUTH_URL;
    }

    if (e.NODE_ENV !== "production") {
      return "http://localhost:3000";
    }

    const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    if (vercelUrl) {
      return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    }

    throw new Error(
      "BETTER_AUTH_URL or NEXTAUTH_URL must be set in production."
    );
  },

  get githubId() {
    return getEnv().GITHUB_ID;
  },

  get githubSecret() {
    return getEnv().GITHUB_SECRET;
  },

  get googleId() {
    return getEnv().GOOGLE_ID;
  },

  get googleSecret() {
    return getEnv().GOOGLE_SECRET;
  },

  get nodeEnv() {
    return getEnv().NODE_ENV;
  },

  get isDev() {
    return getEnv().NODE_ENV === "development";
  },

  get isProd() {
    return getEnv().NODE_ENV === "production";
  },
};
