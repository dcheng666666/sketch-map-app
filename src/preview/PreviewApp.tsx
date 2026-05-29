import { useEffect, useMemo, useState } from "react";
import type { Location } from "sketch-map-sdk";
import {
  FRESH_WATERCOLOR_PALETTES,
  WatercolorSketch,
  type WatercolorPalette,
} from "./WatercolorSketch";

interface RouteFixture {
  title: string;
  description: string;
  locations: Location[];
}

type PaletteKey = keyof typeof FRESH_WATERCOLOR_PALETTES;

const PALETTE_ORDER: PaletteKey[] = ["mint", "sky", "coral"];

const PALETTE_BLURBS: Record<PaletteKey, string> = {
  mint: "Sage + coral · breezy, garden-fresh",
  sky: "Sky blue + warm yellow · sunny coastal",
  coral: "Coral + leaf green · warm island",
};

export function PreviewApp() {
  const [fixture, setFixture] = useState<RouteFixture | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<PaletteKey>("mint");

  useEffect(() => {
    let cancelled = false;
    fetch("/fixtures/sample-route.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: RouteFixture) => {
        if (!cancelled) setFixture(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activePalette: WatercolorPalette = FRESH_WATERCOLOR_PALETTES[activeKey];

  const focusTitle = useMemo(() => {
    if (!fixture) return "My Journey";
    return "Beijing → Hangzhou";
  }, [fixture]);

  const focusSubtitle = useMemo(() => {
    if (!fixture) return "";
    return `${fixture.locations.length} stops · spring 2026`;
  }, [fixture]);

  return (
    <div className="preview-shell">
      <header className="preview-header">
        <div>
          <h1 className="preview-title">Watercolor Style Preview</h1>
          <p className="preview-sub">
            Three fresh-toned variants of the watercolor travel-journal style.
            Pick the palette that fits the vibe.
          </p>
        </div>
        <div className="preview-meta">
          <span className="preview-pill">Style · Watercolor Journal</span>
          <span className="preview-pill preview-pill-soft">Vibe · Fresh</span>
        </div>
      </header>

      {error && (
        <div className="preview-error">
          Failed to load fixture: {error}. Make sure
          <code> /fixtures/sample-route.json</code> exists.
        </div>
      )}

      <section className="preview-grid">
        {PALETTE_ORDER.map((key) => {
          const palette = FRESH_WATERCOLOR_PALETTES[key];
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              className={
                "preview-card" + (isActive ? " preview-card-active" : "")
              }
              onClick={() => setActiveKey(key)}
            >
              <div className="preview-card-stage">
                {fixture && (
                  <WatercolorSketch
                    locations={fixture.locations}
                    palette={palette}
                    title={focusTitle}
                    subtitle={focusSubtitle}
                  />
                )}
              </div>
              <div className="preview-card-label">
                <div className="preview-card-name">{palette.name}</div>
                <div className="preview-card-blurb">{PALETTE_BLURBS[key]}</div>
                <div className="preview-swatches">
                  <span
                    className="preview-swatch"
                    style={{ background: palette.paper, borderColor: palette.inkSoft }}
                    title="paper"
                  />
                  <span
                    className="preview-swatch"
                    style={{ background: palette.routeWash, borderColor: palette.routeInk }}
                    title="route"
                  />
                  <span
                    className="preview-swatch"
                    style={{ background: palette.markerFill, borderColor: palette.ink }}
                    title="marker"
                  />
                  <span
                    className="preview-swatch"
                    style={{ background: palette.ink, borderColor: palette.ink }}
                    title="ink"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <section className="preview-focus">
        <div className="preview-focus-header">
          <h2>Focus · {activePalette.name}</h2>
          <p>{PALETTE_BLURBS[activeKey]}</p>
        </div>
        <div className="preview-focus-stage">
          {fixture && (
            <WatercolorSketch
              locations={fixture.locations}
              palette={activePalette}
              title={focusTitle}
              subtitle={focusSubtitle}
            />
          )}
        </div>
        <div className="preview-focus-notes">
          <h3>What you're seeing</h3>
          <ul>
            <li>
              <strong>Paper:</strong> warm off-white with a soft turbulence
              grain — feels printed, not digital.
            </li>
            <li>
              <strong>Route:</strong> three-layer treatment — blurred
              watercolor wash, soft secondary wash, then a thin rough-ink
              line and dashed shadow on top.
            </li>
            <li>
              <strong>Markers:</strong> radial watercolor halo + hand-drawn
              solid dot + paper-colored highlight; numbered with{" "}
              <em>Caveat</em>.
            </li>
            <li>
              <strong>Accents:</strong> a casual compass and a corner
              "travel log" stamp tilted off-axis for the journal feel.
            </li>
          </ul>
          <h3>Recommended for</h3>
          <p>
            Slow travel, multi-city journeys, gift maps, social shares —
            anywhere the route should feel personal rather than precise.
          </p>
        </div>
      </section>

      <footer className="preview-footer">
        Loaded fixture: <code>/fixtures/sample-route.json</code>
        {fixture && ` · ${fixture.locations.length} locations`}
      </footer>
    </div>
  );
}
