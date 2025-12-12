import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimit(request, rateLimitPresets.default);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    const session = await auth.api.getSession({
      headers: (await headers()) as unknown as Headers,
    });
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await db.account.findFirst({
      where: { userId, providerId: "github" },
    });

    const accessToken = account?.accessToken;
    if (!accessToken) {
      return Response.json({ error: "GitHub not linked" }, { status: 400 });
    }

    const res = await fetch("https://api.github.com/user/repos?per_page=100", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: text }, { status: res.status });
    }

    const data = (await res.json()) as Array<{
      id: number;
      name: string;
      full_name: string;
      private: boolean;
      description: string | null;
      owner?: { login?: string };
      default_branch?: string;
    }>;
    const repos = data.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      description: r.description,
      owner: r.owner?.login,
      default_branch: r.default_branch,
    }));

    return Response.json({ repos });
  } catch {
    return Response.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
