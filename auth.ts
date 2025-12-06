import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "mongodb",
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      scope: ["read:user", "user:email", "repo"],
    },
    google: {
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    },
  },
  secret: process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
});
