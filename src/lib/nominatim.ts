import type { NominatimItem } from "../types";

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
  limit = 8,
): Promise<NominatimItem[]> {
  if (!query.trim()) return [];

  const headers: Record<string, string> = {
    "Accept-Language": "zh-CN",
  };
  if (typeof window === "undefined") {
    headers["User-Agent"] = "sketch-map-mcp/0.1.0";
  }

  // The app only renders maps inside mainland China, so restrict Nominatim
  // results to CN to avoid surfacing places that the renderer cannot match
  // to a city / province outline.
  const params = new URLSearchParams({
    q: query.trim(),
    format: "jsonv2",
    limit: String(Math.min(20, Math.max(1, limit))),
    addressdetails: "1",
    countrycodes: "cn",
  });

  const res = await fetch(`${ENDPOINT}?${params}`, {
    signal,
    headers,
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Search rate limited. Please wait a moment.");
    }
    throw new Error(`Search failed (${res.status})`);
  }

  return (await res.json()) as NominatimItem[];
}
