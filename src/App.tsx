import { useCallback, useEffect, useState } from "react";
import type { Location } from "sketch-map-sdk";
import { renderRoute } from "sketch-map-sdk";
import { LocationSearch } from "./components/LocationSearch";
import { LocationList } from "./components/LocationList";
import { MapPreview } from "./components/MapPreview";
import { HandDrawnMap } from "./components/HandDrawnMap";
import { Toolbar } from "./components/Toolbar";
import "./App.css";

function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [title, setTitle] = useState("My Hand-Drawn Map");
  const [geoRenderError, setGeoRenderError] = useState<string | null>(null);

  // Dev helper: when URL contains `#sample`, load the bundled fixture route so
  // the map can be visually verified without a Nominatim round-trip.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#sample") return;
    fetch("/fixtures/sample-route.json")
      .then((r) => r.json())
      .then((data: { title?: string; locations: Location[] }) => {
        if (data.locations) {
          setLocations(data.locations);
          if (data.title) setTitle(data.title);
        }
      })
      .catch(() => {
        // silent — fixture is optional
      });
  }, []);

  const handleAdd = useCallback((loc: Location) => {
    setLocations((prev) => [...prev, loc]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleReorder = useCallback((next: Location[]) => {
    setLocations(next);
  }, []);

  const handleExportPng = async () => {
    const result = await renderRoute(
      { locations, title },
      { kind: "png", scale: 2 },
    );
    if (result.status === "error") {
      setGeoRenderError(result.message);
      return;
    }
    const url = URL.createObjectURL(result.png);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hand-drawn-map.png";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sketch Map</h1>
        <p className="subtitle">
          Search places, reorder your route, and generate a hand-drawn map of
          the cities you visit.
        </p>
        <LocationSearch onAdd={handleAdd} />
      </header>

      <Toolbar
        title={title}
        onTitleChange={setTitle}
        onExportPng={handleExportPng}
        disabled={locations.length === 0}
      />

      <main className="app-main">
        <aside className="sidebar">
          <section className="panel">
            <h2>Places ({locations.length})</h2>
            <LocationList
              locations={locations}
              onReorder={handleReorder}
              onRemove={handleRemove}
            />
          </section>
          <section className="panel">
            <h2>Map preview</h2>
            <MapPreview locations={locations} />
          </section>
        </aside>

        <section className="canvas-panel">
          <h2>Hand-drawn map</h2>
          {geoRenderError && (
            <p className="geo-error">{geoRenderError}</p>
          )}
          <HandDrawnMap
            locations={locations}
            title={title}
            onGeoError={setGeoRenderError}
          />
        </section>
      </main>

      <footer className="app-footer">
        Place search uses{" "}
        <a
          href="https://operations.osmfoundation.org/policies/nominatim/"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap Nominatim
        </a>
        . City boundaries from{" "}
        <a
          href="https://datav.aliyun.com/portal/school/atlas/area_selector"
          target="_blank"
          rel="noreferrer"
        >
          DataV.GeoAtlas
        </a>
        .
      </footer>
    </div>
  );
}

export default App;
