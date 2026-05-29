import { useEffect, useId, useRef } from "react";
import rough from "roughjs";
import type { Location } from "sketch-map-sdk";
import {
  computeBBox,
  createProjection,
  type Point2D,
  type ProjectionContext,
} from "./projection";

export interface WatercolorPalette {
  /** Display name. */
  name: string;
  /** Paper background color (warm off-white). */
  paper: string;
  /** Subtle grain shade — used in noise filter mix. */
  paperGrain: string;
  /** Primary ink color for lines, glyphs, numbers. */
  ink: string;
  /** Softer ink — secondary strokes. */
  inkSoft: string;
  /** Watercolor wash beneath the route (semi-transparent). */
  routeWash: string;
  /** Ink color for the top route line. */
  routeInk: string;
  /** Watercolor halo around markers. */
  markerWash: string;
  /** Marker dot fill. */
  markerFill: string;
}

export const FRESH_WATERCOLOR_PALETTES: Record<string, WatercolorPalette> = {
  mint: {
    name: "Mint Breeze",
    paper: "#FDFAF0",
    paperGrain: "#E8E0CC",
    ink: "#2C3E50",
    inkSoft: "#5A6C7D",
    routeWash: "#7FC8A9",
    routeInk: "#3D7A5A",
    markerWash: "#F4A6A0",
    markerFill: "#E8675F",
  },
  sky: {
    name: "Sky Voyage",
    paper: "#FBFAF4",
    paperGrain: "#E3DECB",
    ink: "#1F3A5F",
    inkSoft: "#5A7A99",
    routeWash: "#9BC4E2",
    routeInk: "#2E6BA8",
    markerWash: "#F9D87C",
    markerFill: "#E8A93C",
  },
  coral: {
    name: "Coral Dawn",
    paper: "#FDF8F0",
    paperGrain: "#ECDFC9",
    ink: "#3D2E2E",
    inkSoft: "#7A5A5A",
    routeWash: "#F4A6A0",
    routeInk: "#C56158",
    markerWash: "#A8D8B9",
    markerFill: "#5DAA7D",
  },
};

const CANVAS_W = 720;
const CANVAS_H = 540;

interface Props {
  locations: Location[];
  palette: WatercolorPalette;
  title: string;
  subtitle?: string;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function ensureDefs(svg: SVGSVGElement, palette: WatercolorPalette, id: string) {
  const defs = document.createElementNS(SVG_NS, "defs");

  // Paper grain noise filter — soft, low-opacity speckle on top of the paper.
  defs.innerHTML = `
    <filter id="${id}-grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
      <feColorMatrix type="matrix" values="
        0 0 0 0 0
        0 0 0 0 0
        0 0 0 0 0
        0 0 0 0.18 0" />
      <feComposite in2="SourceGraphic" operator="in" />
    </filter>

    <filter id="${id}-wet" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="blur" />
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" result="turb" />
      <feDisplacementMap in="blur" in2="turb" scale="6" />
    </filter>

    <filter id="${id}-edge" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="11" result="turb" />
      <feDisplacementMap in="SourceGraphic" in2="turb" scale="3" />
    </filter>

    <radialGradient id="${id}-marker-wash" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${palette.markerWash}" stop-opacity="0.85" />
      <stop offset="55%" stop-color="${palette.markerWash}" stop-opacity="0.45" />
      <stop offset="100%" stop-color="${palette.markerWash}" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="${id}-route-wash" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${palette.routeWash}" stop-opacity="0.7" />
      <stop offset="100%" stop-color="${palette.routeWash}" stop-opacity="0.15" />
    </radialGradient>
  `;
  svg.appendChild(defs);
}

function paintPaper(
  svg: SVGSVGElement,
  palette: WatercolorPalette,
  filterId: string,
) {
  const bg = document.createElementNS(SVG_NS, "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", String(CANVAS_W));
  bg.setAttribute("height", String(CANVAS_H));
  bg.setAttribute("fill", palette.paper);
  svg.appendChild(bg);

  // Grain layer — same rect with grain filter on top of paper.
  const grain = document.createElementNS(SVG_NS, "rect");
  grain.setAttribute("x", "0");
  grain.setAttribute("y", "0");
  grain.setAttribute("width", String(CANVAS_W));
  grain.setAttribute("height", String(CANVAS_H));
  grain.setAttribute("fill", palette.paperGrain);
  grain.setAttribute("filter", `url(#${filterId}-grain)`);
  grain.setAttribute("opacity", "0.55");
  svg.appendChild(grain);

  // Soft vignette — subtle inner shadow effect using two rects with ink-soft.
  const vignette = document.createElementNS(SVG_NS, "rect");
  vignette.setAttribute("x", "12");
  vignette.setAttribute("y", "12");
  vignette.setAttribute("width", String(CANVAS_W - 24));
  vignette.setAttribute("height", String(CANVAS_H - 24));
  vignette.setAttribute("fill", "none");
  vignette.setAttribute("stroke", palette.inkSoft);
  vignette.setAttribute("stroke-width", "0.8");
  vignette.setAttribute("stroke-dasharray", "4 6");
  vignette.setAttribute("opacity", "0.35");
  svg.appendChild(vignette);
}

function appendHandText(
  svg: SVGSVGElement,
  x: number,
  y: number,
  text: string,
  options: {
    fill: string;
    size?: number;
    anchor?: "start" | "middle" | "end";
    halo?: boolean;
    haloColor?: string;
    weight?: number | string;
    family?: string;
    rotate?: number;
  },
) {
  const el = document.createElementNS(SVG_NS, "text");
  el.setAttribute("x", String(x));
  el.setAttribute("y", String(y));
  el.setAttribute("fill", options.fill);
  el.setAttribute("font-size", String(options.size ?? 16));
  el.setAttribute(
    "font-family",
    options.family ?? "'Caveat', 'Kalam', cursive",
  );
  if (options.weight) el.setAttribute("font-weight", String(options.weight));
  if (options.anchor) el.setAttribute("text-anchor", options.anchor);
  if (options.halo) {
    el.setAttribute("stroke", options.haloColor ?? "rgba(253,250,240,0.95)");
    el.setAttribute("stroke-width", "4");
    el.setAttribute("paint-order", "stroke");
    el.setAttribute("stroke-linejoin", "round");
  }
  if (options.rotate) {
    el.setAttribute("transform", `rotate(${options.rotate} ${x} ${y})`);
  }
  el.textContent = text;
  svg.appendChild(el);
}

function drawRoute(
  svg: SVGSVGElement,
  points: Point2D[],
  palette: WatercolorPalette,
  filterId: string,
) {
  if (points.length < 2) return;
  const rc = rough.svg(svg);
  const curve: [number, number][] = points.map((p) => [p.x, p.y]);

  // Layer 1: thick watercolor wash, blurred and displaced for a wet edge.
  const washGroup = document.createElementNS(SVG_NS, "g");
  washGroup.setAttribute("filter", `url(#${filterId}-wet)`);
  washGroup.setAttribute("opacity", "0.55");
  washGroup.appendChild(
    rc.curve(curve, {
      stroke: palette.routeWash,
      strokeWidth: 16,
      roughness: 1.2,
      bowing: 3,
    }),
  );
  svg.appendChild(washGroup);

  // Layer 2: secondary lighter wash, slightly offset.
  const wash2 = document.createElementNS(SVG_NS, "g");
  wash2.setAttribute("opacity", "0.35");
  wash2.setAttribute("filter", `url(#${filterId}-edge)`);
  wash2.appendChild(
    rc.curve(curve, {
      stroke: palette.routeWash,
      strokeWidth: 9,
      roughness: 1.8,
      bowing: 2,
    }),
  );
  svg.appendChild(wash2);

  // Layer 3: ink line on top — the actual hand-drawn route signal.
  svg.appendChild(
    rc.curve(curve, {
      stroke: palette.routeInk,
      strokeWidth: 1.8,
      roughness: 2.2,
      bowing: 2.5,
    }),
  );

  // Dashed shadow under the ink line — adds the journal feel.
  const dashed = document.createElementNS(SVG_NS, "path");
  const d =
    "M " +
    curve.map(([x, y], i) => `${i === 0 ? "" : "L "}${x} ${y}`).join(" ");
  dashed.setAttribute("d", d);
  dashed.setAttribute("fill", "none");
  dashed.setAttribute("stroke", palette.inkSoft);
  dashed.setAttribute("stroke-width", "0.6");
  dashed.setAttribute("stroke-dasharray", "2 5");
  dashed.setAttribute("opacity", "0.5");
  svg.appendChild(dashed);
}

function drawMarkers(
  svg: SVGSVGElement,
  locations: Location[],
  points: Point2D[],
  palette: WatercolorPalette,
  filterId: string,
) {
  const rc = rough.svg(svg);
  locations.forEach((loc, i) => {
    const p = points[i];

    // Watercolor halo using radial-gradient circle, blurred/displaced.
    const halo = document.createElementNS(SVG_NS, "circle");
    halo.setAttribute("cx", String(p.x));
    halo.setAttribute("cy", String(p.y));
    halo.setAttribute("r", "22");
    halo.setAttribute("fill", `url(#${filterId}-marker-wash)`);
    halo.setAttribute("filter", `url(#${filterId}-edge)`);
    svg.appendChild(halo);

    // Solid dot — hand-drawn outline.
    svg.appendChild(
      rc.circle(p.x, p.y, 14, {
        fill: palette.markerFill,
        fillStyle: "solid",
        stroke: palette.ink,
        strokeWidth: 1.2,
        roughness: 1.6,
      }),
    );

    // Inner highlight dot.
    svg.appendChild(
      rc.circle(p.x - 1.5, p.y - 1.5, 4, {
        fill: palette.paper,
        fillStyle: "solid",
        stroke: "none",
        roughness: 0.6,
      }),
    );

    // Number badge — handwritten, with paper halo.
    appendHandText(svg, p.x + 16, p.y - 14, String(i + 1), {
      fill: palette.routeInk,
      size: 20,
      weight: 700,
      halo: true,
      haloColor: palette.paper,
    });

    // Place name — handwritten beside the marker.
    appendHandText(svg, p.x + 16, p.y + 6, loc.name, {
      fill: palette.ink,
      size: 17,
      weight: 500,
      halo: true,
      haloColor: palette.paper,
      family: "'Caveat', cursive",
    });
  });
}

function drawCornerAccents(
  svg: SVGSVGElement,
  palette: WatercolorPalette,
  filterId: string,
) {
  const rc = rough.svg(svg);

  // Top-right: small compass-ish accent.
  const cx = CANVAS_W - 56;
  const cy = 56;
  const compassHalo = document.createElementNS(SVG_NS, "circle");
  compassHalo.setAttribute("cx", String(cx));
  compassHalo.setAttribute("cy", String(cy));
  compassHalo.setAttribute("r", "26");
  compassHalo.setAttribute("fill", `url(#${filterId}-marker-wash)`);
  compassHalo.setAttribute("filter", `url(#${filterId}-edge)`);
  compassHalo.setAttribute("opacity", "0.6");
  svg.appendChild(compassHalo);

  svg.appendChild(
    rc.circle(cx, cy, 32, {
      stroke: palette.ink,
      strokeWidth: 1.2,
      roughness: 1.8,
    }),
  );
  svg.appendChild(
    rc.line(cx, cy - 14, cx, cy + 14, {
      stroke: palette.inkSoft,
      strokeWidth: 0.8,
      roughness: 1,
    }),
  );
  svg.appendChild(
    rc.line(cx - 14, cy, cx + 14, cy, {
      stroke: palette.inkSoft,
      strokeWidth: 0.8,
      roughness: 1,
    }),
  );
  // North arrow accent.
  svg.appendChild(
    rc.polygon(
      [
        [cx, cy - 18],
        [cx - 4, cy - 6],
        [cx + 4, cy - 6],
      ],
      {
        fill: palette.routeInk,
        fillStyle: "solid",
        stroke: palette.ink,
        strokeWidth: 0.8,
        roughness: 1,
      },
    ),
  );
  appendHandText(svg, cx, cy - 22, "N", {
    fill: palette.ink,
    size: 13,
    anchor: "middle",
    weight: 700,
  });

  // Bottom-left: tiny watercolor splash + tag.
  const splashCx = 60;
  const splashCy = CANVAS_H - 56;
  const splash = document.createElementNS(SVG_NS, "circle");
  splash.setAttribute("cx", String(splashCx));
  splash.setAttribute("cy", String(splashCy));
  splash.setAttribute("r", "32");
  splash.setAttribute("fill", `url(#${filterId}-route-wash)`);
  splash.setAttribute("filter", `url(#${filterId}-wet)`);
  splash.setAttribute("opacity", "0.65");
  svg.appendChild(splash);

  appendHandText(svg, splashCx, splashCy + 5, "travel log", {
    fill: palette.ink,
    size: 15,
    anchor: "middle",
    weight: 600,
    rotate: -8,
    family: "'Shadows Into Light Two', cursive",
  });
}

function drawTitle(
  svg: SVGSVGElement,
  title: string,
  subtitle: string,
  palette: WatercolorPalette,
) {
  // Title — large handwritten, slightly tilted.
  appendHandText(svg, 36, 56, title, {
    fill: palette.ink,
    size: 36,
    weight: 700,
    family: "'Caveat', cursive",
  });

  // Underline accent — short slanted line in route color.
  const underline = document.createElementNS(SVG_NS, "line");
  underline.setAttribute("x1", "38");
  underline.setAttribute("y1", "66");
  underline.setAttribute("x2", "180");
  underline.setAttribute("y2", "69");
  underline.setAttribute("stroke", palette.routeInk);
  underline.setAttribute("stroke-width", "2.4");
  underline.setAttribute("stroke-linecap", "round");
  underline.setAttribute("opacity", "0.7");
  svg.appendChild(underline);

  if (subtitle) {
    appendHandText(svg, 38, 86, subtitle, {
      fill: palette.inkSoft,
      size: 16,
      family: "'Kalam', cursive",
    });
  }
}

export function WatercolorSketch({ locations, palette, title, subtitle }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const reactId = useId();
  const filterId = `wc${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    ensureDefs(svg, palette, filterId);
    paintPaper(svg, palette, filterId);

    if (locations.length === 0) {
      appendHandText(svg, CANVAS_W / 2, CANVAS_H / 2, "Add places…", {
        fill: palette.inkSoft,
        size: 24,
        anchor: "middle",
      });
      return;
    }

    const bbox = computeBBox(locations, 0.25);
    if (!bbox) return;
    const proj: ProjectionContext = createProjection(
      bbox,
      CANVAS_W,
      CANVAS_H,
      110,
    );
    const points: Point2D[] = locations.map((l) => proj.project(l.lat, l.lng));

    drawRoute(svg, points, palette, filterId);
    drawMarkers(svg, locations, points, palette, filterId);
    drawCornerAccents(svg, palette, filterId);
    drawTitle(svg, title, subtitle ?? "", palette);
  }, [locations, palette, title, subtitle, filterId]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      xmlns={SVG_NS}
      className="watercolor-svg"
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
