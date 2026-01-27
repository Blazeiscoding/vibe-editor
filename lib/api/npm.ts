export interface NpmPackage {
  name: string;
  version: string;
  description: string;
  downloads: number;
  publisher?: string;
}

export async function searchNpmPackages(query: string, limit = 15): Promise<NpmPackage[]> {
  if (!query) return [];
  
  const res = await fetch(`/api/npm/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  
  if (!res.ok) {
    throw new Error("Search failed");
  }
  
  const data = await res.json();
  return data.packages;
}
