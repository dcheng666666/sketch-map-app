import { useEffect, useRef, useState } from "react";
import type { Location } from "sketch-map-sdk";
import { renderRoute } from "sketch-map-sdk";

interface Props {
  locations: Location[];
  title: string;
  onSvgReady?: (svg: SVGSVGElement | null) => void;
  onGeoError?: (message: string | null) => void;
}

export function HandDrawnMap({
  locations,
  title,
  onSvgReady,
  onGeoError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgString, setSvgString] = useState<string | null>(null);

  useEffect(() => {
    if (locations.length === 0) {
      queueMicrotask(() => {
        setSvgString(null);
        onGeoError?.(null);
      });
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await renderRoute({ locations, title }, { kind: "svg" });
      if (cancelled) return;

      if (result.status === "error") {
        setSvgString(null);
        onGeoError?.(result.message);
        return;
      }

      setSvgString(result.svg);
      onGeoError?.(result.status === "partial" ? result.message : null);
    })();

    return () => {
      cancelled = true;
    };
  }, [locations, title, onGeoError]);

  useEffect(() => {
    const svgEl = containerRef.current?.querySelector("svg") ?? null;
    onSvgReady?.(svgEl as SVGSVGElement | null);
  }, [svgString, onSvgReady]);

  return (
    <div className="hand-drawn-map">
      <div
        ref={containerRef}
        className="map-svg-container"
        dangerouslySetInnerHTML={{ __html: svgString ?? "" }}
      />
    </div>
  );
}
