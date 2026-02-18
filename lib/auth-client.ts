"use client";

import { createAuthClient } from "better-auth/react";

const envBaseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_NEXTAUTH_URL;

const runtimeBaseURL =
  envBaseURL || (typeof window !== "undefined" ? window.location.origin : undefined);

export const authClient = createAuthClient({
  ...(runtimeBaseURL ? { baseURL: runtimeBaseURL } : {}),
});

