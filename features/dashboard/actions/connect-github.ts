"use server";
import { signIn } from "@/auth";

export async function connectGithub() {
  await signIn("github");
}
