import { db } from "@/lib/db";
import {
  TemplateFolder,
  TemplateItem,
} from "@/features/playground/libs/path-to-json";
import {
  fetchGitHub,
  createGitHubRepository,
  createGitHubBlob,
  createGitHubTree,
  createGitHubCommit,
  updateGitHubRef,
  createGitHubRef,
  getBranchSha,
  getTreeSha,
} from "@/lib/api/github";

export async function getGitHubToken(userId: string): Promise<string | null> {
  const account = await db.account.findFirst({
    where: { userId, providerId: "github" },
  });
  return account?.accessToken || null;
}

export { fetchGitHub }; // Re-export for compatibility if needed

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

export { createGitHubRepository as createRepository };

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
  const baseSha = await getBranchSha(token, owner, repo, branch);
  let baseTreeSha: string | null = null;

  if (baseSha) {
    baseTreeSha = await getTreeSha(token, owner, repo, baseSha);
  }

  // Step 2: Create blobs for each file
  const treeItems: Array<{
    path: string;
    mode: string;
    type: string;
    sha: string;
  }> = [];

  for (const file of files) {
    const blobSha = await createGitHubBlob(token, owner, repo, file.content);
    treeItems.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blobSha,
    });
  }

  // Step 3: Create a tree
  const treeSha = await createGitHubTree(token, owner, repo, baseTreeSha, treeItems);

  // Step 4: Create a commit
  const commitData = await createGitHubCommit(
    token,
    owner,
    repo,
    commitMessage,
    treeSha,
    baseSha
  );

  // Step 5: Update or create the branch reference
  if (baseSha) {
    // Update existing branch
    await updateGitHubRef(token, owner, repo, branch, commitData.sha);
  } else {
    // Create new branch
    await createGitHubRef(token, owner, repo, branch, commitData.sha);
  }

  return {
    sha: commitData.sha,
    url: `https://github.com/${owner}/${repo}/commit/${commitData.sha}`,
  };
}

