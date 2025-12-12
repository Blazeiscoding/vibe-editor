import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./lib/db";
import { env } from "./lib/env";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "mongodb",
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    github: {
      clientId: env.githubId,
      clientSecret: env.githubSecret,
      scope: ["read:user", "user:email", "repo"],
    },
    ...(env.googleId && env.googleSecret
      ? {
          google: {
            clientId: env.googleId,
            clientSecret: env.googleSecret,
          },
        }
      : {}),
  },
  secret: env.authSecret,
  baseURL: env.baseUrl,
});
