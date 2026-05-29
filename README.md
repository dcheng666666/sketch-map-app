# sketch-map-app

Vite + React SPA for building hand-drawn China travel-route maps. Uses [`sketch-map-sdk`](https://www.npmjs.com/package/sketch-map-sdk) (pinned in `package.json`).

## Prerequisites

- Node 20+
- pnpm 10.23.0 (see `packageManager` in `package.json`)

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm build
```

Open the dev server URL; add `#sample` to load the bundled sample route.

## Nominatim

The app calls the public Nominatim API from the browser. Use for personal / low-volume use only. See the [usage policy](https://operations.osmfoundation.org/policies/nominatim/).
