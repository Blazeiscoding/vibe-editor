import { auth } from "@/auth";
import { fetchGitHub, getGitHubToken } from "@/lib/github";
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
    // Authenticate user
    const session = await auth.api.getSession({
      headers: (await headers()) as unknown as Headers,
    });
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check GitHub connection
    const accessToken = await getGitHubToken(userId);
    if (!accessToken) {
      return Response.json({ error: "GitHub not linked" }, { status: 400 });
    }

    // Fetch repositories from GitHub
    const res = await fetchGitHub(
      "https://api.github.com/user/repos?per_page=100",
      { token: accessToken }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("GitHub API error:", text);
      return Response.json(
        { error: "Failed to fetch repositories from GitHub" },
        { status: res.status }
      );
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

    // Transform response
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
  } catch (error) {
    console.error("Failed to fetch repositories:", error);
    return Response.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
