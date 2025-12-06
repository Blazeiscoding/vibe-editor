"use client";

export async function connectGithub() {
  // This should be handled client-side using better-auth's signIn.social
  // For server actions, redirect to the OAuth URL
  if (typeof window !== "undefined") {
    window.location.href = "/api/auth/sign-in/social?provider=github";
  }
}
