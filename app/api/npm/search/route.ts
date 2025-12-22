import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

interface NpmPackage {
  name: string;
  version: string;
  description: string;
  downloads: number;
  publisher?: string;
}

interface NpmSearchResult {
  objects: Array<{
    package: {
      name: string;
      version: string;
      description?: string;
      publisher?: { username: string };
    };
    score: {
      final: number;
    };
    downloads?: { weekly: number };
  }>;
}

/**
 * GET /api/npm/search - Search npm packages
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = rateLimit(request, rateLimitPresets.relaxed);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!query || query.length < 1) {
      return Response.json({ packages: [] });
    }

    // Search npm registry
    const npmUrl = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(
      query
    )}&size=${limit}`;

    const res = await fetch(npmUrl, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      throw new Error("Failed to search npm");
    }

    const data: NpmSearchResult = await res.json();

    // Get download counts for each package
    const packages: NpmPackage[] = await Promise.all(
      data.objects.map(async (obj) => {
        let downloads = 0;
        try {
          const downloadsRes = await fetch(
            `https://api.npmjs.org/downloads/point/last-week/${obj.package.name}`,
            { next: { revalidate: 3600 } } // Cache for 1 hour
          );
          if (downloadsRes.ok) {
            const downloadData = await downloadsRes.json();
            downloads = downloadData.downloads || 0;
          }
        } catch {
          // Ignore download count errors
        }

        return {
          name: obj.package.name,
          version: obj.package.version,
          description: obj.package.description || "",
          downloads,
          publisher: obj.package.publisher?.username,
        };
      })
    );

    return Response.json({ packages });
  } catch (error) {
    console.error("NPM search failed:", error);
    return Response.json(
      { error: "Failed to search packages" },
      { status: 500 }
    );
  }
}
