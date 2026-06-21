# x3o brand assets

Terminal-green identity (accent `#00ffb2`, teal `#5eead4`, on near-black `#010409`).

| File | Purpose |
| --- | --- |
| `favicon.svg` | Browser tab / `icons.icon` in `app/layout.tsx`. Dark rounded tile, green `x3o`. |
| `x3o-logo.svg` | Horizontal wordmark (`x3o ▮ .ai`) for headers and marketing. Transparent background. |
| `icon-192x192.png` | PWA / apple-touch icon (maskable). |
| `icon-512x512.png` | PWA install / splash icon (maskable). |
| `og-image.png` | 1200×630 Open Graph / Twitter card. Wired in `app/layout.tsx` `openGraph.images`. |

## Regenerating the PNGs

The raster assets are generated from the SVG identity with Pillow (DejaVu Sans Mono Bold).
Re-run the generator if the mark changes — keep maskable content inside the inner 80% safe zone,
dark background full-bleed, and the wordmark on `#00ffb2`.

> Note: `logo.png` / `logo-transparent.png` are the KeLatic (beauty tenant) logos — not x3o — and are intentionally left unchanged.
