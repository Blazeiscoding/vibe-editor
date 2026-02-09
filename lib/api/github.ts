export interface GitHubFetchOptions extends RequestInit {
  token: string;
}

/**
 * Base function to fetch data from GitHub API.
 */
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

export interface CreateRepoOptions {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

export interface CreateRepoResult {
  id: number;
  full_name: string;
  html_url: string;
  default_branch: string;
}

/**
 * Create a new GitHub repository for the authenticated user.
 */
export async function createGitHubRepository(
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

/**
 * Get current commit SHA for a branch
 */
export async function getBranchSha(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<string | null> {
  try {
    const res = await fetchGitHub(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      { token }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.object.sha;
  } catch {
    return null;
  }
}

/**
 * Get tree SHA for a commit
 */
export async function getTreeSha(
  token: string,
  owner: string,
  repo: string,
  commitSha: string
): Promise<string | null> {
  try {
    const res = await fetchGitHub(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`,
      { token }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.tree.sha;
  } catch {
    return null;
  }
}

/**
 * Create a blob in the repo
 */
export async function createGitHubBlob(
  token: string,
  owner: string,
  repo: string,
  content: string
): Promise<string> {
  const res = await fetchGitHub(
    `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
    {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: Buffer.from(content).toString("base64"),
        encoding: "base64",
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create blob");
  }

  const data = await res.json();
  return data.sha;
}

/**
 * Create a tree
 */
export async function createGitHubTree(
  token: string,
  owner: string,
  repo: string,
  baseTreeSha: string | null,
  treeItems: Array<{ path: string; mode: string; type: string; sha: string }>
): Promise<string> {
  const body: { tree: typeof treeItems; base_tree?: string } = { tree: treeItems };
  if (baseTreeSha) body.base_tree = baseTreeSha;

  const res = await fetchGitHub(
    `https://api.github.com/repos/${owner}/${repo}/git/trees`,
    {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create tree");
  }

  const data = await res.json();
  return data.sha;
}

/**
 * Create a commit
 */
export async function createGitHubCommit(
  token: string,
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parentSha: string | null
): Promise<{ sha: string }> {
  const body: { message: string; tree: string; parents?: string[] } = {
    message,
    tree: treeSha,
  };
  if (parentSha) {
    body.parents = [parentSha];
  }

  const res = await fetchGitHub(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create commit");
  }

  const data = await res.json();
  return data;
}

/**
 * Update branch reference
 */
export async function updateGitHubRef(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  commitSha: string,
  force = false
): Promise<void> {
  const res = await fetchGitHub(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      token,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha: commitSha, force }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to update branch");
  }
}

/**
 * Create branch reference
 */
export async function createGitHubRef(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  commitSha: string
): Promise<void> {
  const res = await fetchGitHub(
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: commitSha,
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create branch");
  }
}
