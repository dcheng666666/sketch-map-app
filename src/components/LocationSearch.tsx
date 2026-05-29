import { useEffect, useRef, useState } from "react";
import type { Location } from "sketch-map-sdk";
import type { NominatimItem } from "../types";
import { searchPlaces } from "../lib/nominatim";

interface Props {
  onAdd: (location: Location) => void;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function LocationSearch({ onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const q = query;
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      void (async () => {
        try {
          const items = await searchPlaces(q, controller.signal);
          setResults(items);
          setOpen(true);
        } catch (e) {
          if ((e as Error).name !== "AbortError") {
            setError(e instanceof Error ? e.message : "Search failed");
            setResults([]);
          }
        } finally {
          setLoading(false);
        }
      })();
    }, 400);

    return () => {
      window.clearTimeout(handle);
      abortRef.current?.abort();
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSelect = (item: NominatimItem) => {
    const name = item.name || item.display_name.split(",")[0];
    onAdd({
      id: makeId(),
      name,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
    setQuery("");
    setResults([]);
    setOpen(false);
    setError(null);
  };

  return (
    <div className="location-search" ref={wrapperRef}>
      <input
        type="text"
        className="search-input"
        placeholder="搜索地点（如：故宫、外滩、西湖）..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {loading && <span className="search-hint">Searching...</span>}
      {error && <span className="search-error">{error}</span>}
      {open && results.length > 0 && (
        <ul className="search-dropdown">
          {results.map((item) => (
            <li key={item.place_id}>
              <button type="button" onClick={() => handleSelect(item)}>
                <strong>{item.name || item.display_name.split(",")[0]}</strong>
                <span>{item.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
