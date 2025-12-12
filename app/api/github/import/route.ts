import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import {
  TemplateFolder,
  TemplateItem,
} from "@/features/playground/libs/path-to-json";

function parseRepo(input: string): { owner: string; repo: string } | null {
  try {
    let value = (input || "").trim();
    if (value.startsWith("@")) value = value.slice(1).trim();
    if (value.startsWith("<") && value.endsWith(">")) {
      value = value.slice(1, -1);
    }

    if (/^([a-z+]+:\/\/)/i.test(value)) {
      value = value.replace(/^git\+/, "");
      const url = new URL(value);
      const parts = url.pathname.replace(/^\/+/, "").split("/");
      if (parts.length >= 2) {
        const owner = decodeURIComponent(parts[0]);
        const repo = decodeURIComponent(parts[1])
          .replace(/\.git$/, "")
          .replace(/\/$/, "");
        if (owner && repo) return { owner, repo };
      }
      return null;
    }

    const parts = value.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/, "");
      if (owner && repo) return { owner, repo };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchDirectoryTree(
  accessToken: string,
  owner: string,
  repo: string,
  path = ""
): Promise<TemplateFolder> {
  const base =
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
      path
    )}`.replace(/%20/g, "+");
  const res = await fetch(base, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub contents error: ${text}`);
  }
  interface GitHubContentEntry {
    type: "dir" | "file";
    name: string;
    path: string;
    size?: number;
    download_url?: string;
  }
  const entries = (await res.json()) as GitHubContentEntry[];
  const items: TemplateItem[] = [];

  for (const entry of entries) {
    if (entry.type === "dir") {
      const sub = await fetchDirectoryTree(
        accessToken,
        owner,
        repo,
        entry.path
      );
      items.push(sub);
    } else if (entry.type === "file") {
      // Skip large files by size threshold (1MB)
      if (entry.size && entry.size > 1024 * 1024) {
        items.push({
          filename: entry.name.replace(/\.[^.]+$/, ""),
          fileExtension: entry.name.split(".").pop() || "",
          content: `[Skipped large file: ${entry.path}]`,
        });
        continue;
      }
      const fileRes = await fetch(entry.download_url || "", {
        cache: "no-store",
      });
      const content = fileRes.ok
        ? await fileRes.text()
        : `Error downloading file: ${entry.path}`;
      const ext = entry.name.includes(".")
        ? entry.name.substring(entry.name.lastIndexOf(".") + 1)
        : "";
      items.push({
        filename: entry.name.replace(/\.[^.]+$/, ""),
        fileExtension: ext,
        content,
      });
    }
  }

  const folderName = path === "" ? repo : path.split("/").slice(-1)[0];
  return { folderName, items };
}

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

    const account = await db.account.findFirst({
      where: { userId, providerId: "github" },
    });
    const accessToken = account?.accessToken;
    if (!accessToken) {
      return Response.json({ error: "GitHub not linked" }, { status: 400 });
    }

    // Get repo details
    const repoRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
        cache: "no-store",
      }
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
