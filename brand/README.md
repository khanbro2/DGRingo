# DIGIRINGO brand assets

The client's official logo source files. **These are the master copies** — every
app icon and store graphic is generated from them, so update these first and
re-render the icons if the brand ever changes.

| File | What it is |
|---|---|
| `digiringo-app-icon.svg` | App icon — purple (`#7C5CFF`) rounded square with the white **DGR** mark. Vector master for all launcher / PWA / Play icons. |
| `digiringo-app-icon-1024.png` | Same icon rasterised at 1024×1024. |
| `digiringo-mark-dgr.svg` | The **DGR** monogram alone (dark), no background. |
| `digiringo-wordmark-white.svg` | Full **DiGiRiNGO** wordmark, white — for dark backgrounds. |
| `digiringo-wordmark-dark.svg` | Full **DiGiRiNGO** wordmark, dark — for light backgrounds. |

**Brand colour:** `#7C5CFF` (purple). Mark/wordmark: `#FFFFFF` on brand, `#0E0F17` on light.

## Where these are used (all generated from the files above)

- **Android launcher** — `android/app/src/main/res/mipmap-*/ic_launcher*.png`
  (legacy + round, all densities) and `ic_launcher_foreground.png` (adaptive
  foreground). Adaptive background = solid `#7C5CFF` in
  `drawable/ic_launcher_gradient.xml`.
- **PWA** — `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`,
  `apple-touch-icon.png`. Manifest `theme_color` = `#7C5CFF`.
- **Play Store** — `playstore/icon-512.png` (512 icon) and
  `playstore/feature-graphic-1024x500.png`.

To re-render after a brand change, use the generator in
`scratchpad/logos/gen-icon.html` (rounded / square / round / fg modes) via
Playwright — there is no `sharp`/`canvas` in this project, so icons are made by
rendering HTML/SVG and screenshotting at each target size.
