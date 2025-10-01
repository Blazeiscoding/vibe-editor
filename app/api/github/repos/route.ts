import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await db.account.findFirst({
      where: { userId, provider: "github" },
    });

    const accessToken = account?.accessToken || account?.access_token;
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

    const data = await res.json();
    const repos = (data as any[]).map((r) => ({
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
    return Response.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
