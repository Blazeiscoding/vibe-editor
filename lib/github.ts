import { db } from "@/lib/db";
import {
  TemplateFolder,
  TemplateItem,
} from "@/features/playground/libs/path-to-json";

export async function getGitHubToken(userId: string): Promise<string | null> {
  const account = await db.account.findFirst({
    where: { userId, providerId: "github" },
  });
  return account?.accessToken || null;
}

interface GitHubFetchOptions extends RequestInit {
  token: string;
}

export async function fetchGitHub(url: string, { token, ...options }: GitHubFetchOptions) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      ...options.headers,
    },
    cache: options.cache || "no-store",
  });
  
  return res;
}

export function parseRepo(input: string): { owner: string; repo: string } | null {
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

export async function fetchDirectoryTree(
  accessToken: string,
  owner: string,
  repo: string,
  path = ""
): Promise<TemplateFolder> {
  const base =
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
      path
    )}`.replace(/%20/g, "+");
    
  const res = await fetchGitHub(base, { token: accessToken });
  
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
