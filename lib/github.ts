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

// ============================================
// GitHub Export Functions
// ============================================

interface CreateRepoOptions {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

interface CreateRepoResult {
  id: number;
  full_name: string;
  html_url: string;
  default_branch: string;
}

/**
 * Create a new GitHub repository
 */
export async function createRepository(
  token: string,
  options: CreateRepoOptions
): Promise<CreateRepoResult> {
  const res = await fetchGitHub("https://api.github.com/user/repos", {
    token,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: options.name,
      description: options.description || "",
      private: options.isPrivate || false,
      auto_init: false,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create repository");
  }

  return res.json();
}

interface FileToCommit {
  path: string;
  content: string;
}

/**
 * Flatten template folder structure to flat file list
 */
export function flattenTemplateToFiles(
  template: TemplateFolder,
  basePath = ""
): FileToCommit[] {
  const files: FileToCommit[] = [];

  for (const item of template.items) {
    if ("folderName" in item) {
      // It's a folder - recurse
      const folderPath = basePath
        ? `${basePath}/${item.folderName}`
        : item.folderName;
      files.push(...flattenTemplateToFiles(item, folderPath));
    } else {
      // It's a file
      const fileName = item.fileExtension
        ? `${item.filename}.${item.fileExtension}`
        : item.filename;
      const filePath = basePath ? `${basePath}/${fileName}` : fileName;
      files.push({
        path: filePath,
        content: item.content,
      });
    }
  }

  return files;
}

/**
 * Push files to a repository using the Git Trees API
 * This creates a single commit with all files
 */
export async function pushFilesToRepo(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  files: FileToCommit[],
  commitMessage: string
): Promise<{ sha: string; url: string }> {
  // Step 1: Get the current commit SHA for the branch (if exists)
  let baseSha: string | null = null;
  let baseTreeSha: string | null = null;

  try {
    const refRes = await fetchGitHub(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      { token }
    );
    if (refRes.ok) {
      const refData = await refRes.json();
      baseSha = refData.object.sha;

      // Get the tree SHA
      const commitRes = await fetchGitHub(
        `https://api.github.com/repos/${owner}/${repo}/git/commits/${baseSha}`,
        { token }
      );
      if (commitRes.ok) {
        const commitData = await commitRes.json();
        baseTreeSha = commitData.tree.sha;
      }
    }
  } catch {
    // Branch doesn't exist yet, that's fine
  }

  // Step 2: Create blobs for each file
  const treeItems: Array<{
    path: string;
    mode: string;
    type: string;
    sha: string;
  }> = [];

  for (const file of files) {
    const blobRes = await fetchGitHub(
      `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
      {
        token,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: Buffer.from(file.content).toString("base64"),
          encoding: "base64",
        }),
      }
    );

    if (!blobRes.ok) {
      throw new Error(`Failed to create blob for ${file.path}`);
    }

    const blobData = await blobRes.json();
    treeItems.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blobData.sha,
    });
  }

  // Step 3: Create a tree
  const treeRes = await fetchGitHub(
    `https://api.github.com/repos/${owner}/${repo}/git/trees`,
    {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    }
  );

  if (!treeRes.ok) {
    throw new Error("Failed to create tree");
  }

  const treeData = await treeRes.json();

  // Step 4: Create a commit
  const commitBody: {
    message: string;
    tree: string;
    parents?: string[];
  } = {
    message: commitMessage,
    tree: treeData.sha,
  };

  if (baseSha) {
    commitBody.parents = [baseSha];
  }

  const commitRes = await fetchGitHub(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commitBody),
    }
  );

  if (!commitRes.ok) {
    throw new Error("Failed to create commit");
  }

  const commitData = await commitRes.json();

  // Step 5: Update or create the branch reference
  const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`;

  if (baseSha) {
    // Update existing branch
    const updateRes = await fetchGitHub(refUrl, {
      token,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha: commitData.sha }),
    });

    if (!updateRes.ok) {
      throw new Error("Failed to update branch");
    }
  } else {
    // Create new branch
    const createRes = await fetchGitHub(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      {
        token,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: commitData.sha,
        }),
      }
    );

    if (!createRes.ok) {
      throw new Error("Failed to create branch");
    }
  }

  return {
    sha: commitData.sha,
    url: `https://github.com/${owner}/${repo}/commit/${commitData.sha}`,
  };
}

