import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import {
  fetchDirectoryTree,
  fetchGitHub,
  getGitHubToken,
  parseRepo,
} from "@/lib/github";

export async function POST(request: NextRequest) {
  // Apply rate limiting (strict for heavy operations like import)
  const rateLimitResult = rateLimit(request, rateLimitPresets.strict);
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

    const body = await request.json().catch(() => ({}));
    const input: string | undefined = body.full_name || body.repoUrl;
    if (!input) {
      return Response.json(
        { error: "Missing repository identifier" },
        { status: 400 }
      );
    }

    const parsed = parseRepo(input);
    if (!parsed) {
      return Response.json(
        { error: "Invalid repository. Use 'owner/name' or GitHub URL" },
        { status: 400 }
      );
    }

    const accessToken = await getGitHubToken(userId);
    if (!accessToken) {
      return Response.json({ error: "GitHub not linked" }, { status: 400 });
    }

    // Get repo details
    const repoRes = await fetchGitHub(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { token: accessToken }
    );
    
    if (!repoRes.ok) {
      const t = await repoRes.text();
      return Response.json({ error: t }, { status: repoRes.status });
    }
    const repoData = (await repoRes.json()) as {
      name: string;
      description?: string | null;
    };

    // Build template structure from contents API
    const templateJson = await fetchDirectoryTree(
      accessToken,
      parsed.owner,
      parsed.repo
    );

    // Create playground
    const playground = await db.playground.create({
      data: {
        title: repoData.name,
        description:
          repoData.description ||
          `Imported from ${parsed.owner}/${parsed.repo}`,
        template: "REACT",
        userId,
        templateFiles: {
          create: {
            content: JSON.stringify(templateJson),
          },
        },
      },
    });

    return Response.json({ success: true, playgroundId: playground.id });
  } catch {
    return Response.json({ error: "Import failed" }, { status: 500 });
  }
}
