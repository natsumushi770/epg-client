# App Icon Design — EPG Client

Date: 2026-03-27

## Overview

Replace the default Tauri boilerplate icon with a custom icon that reflects the EPG Client's purpose: a TV broadcast streaming viewer.

## Design Decision

**Style:** Broadcast antenna with signal waves and glowing "EPG" text
**Rationale:** Directly communicates the app's TV/broadcast nature. The glow effect gives it a modern desktop-app feel without being generic.

## Visual Specification

### Colors
- Background: Radial gradient — `#0a2a10` (center) → `#020604` (edge)
- Icon strokes: `#4ade80` (green-400) with SVG feGaussianBlur glow filter
- Antenna tip: `#86efac` (green-300, slightly lighter)
- EPG text: `#4ade80` with same glow filter

### Shape
- Rounded square background: `rx="22"` on a 110×110 viewBox (≈20% corner radius)
- Outer signal arc: subtle, 28% opacity
- Main signal arc: full opacity, 3.5px stroke
- Antenna legs: V-shape from center tip down to base bar
- Base crossbar: horizontal line at bottom of antenna
- Center tip: small filled circle with radial glow halo

### Text
- "EPG" in bold/black-weight Arial, font-size 18, letter-spacing 4, centered at bottom
- Same green glow filter applied

### SVG Source (110×110 viewBox)
```svg
<svg width="512" height="512" viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" style="stop-color:#0a2a10"/>
      <stop offset="100%" style="stop-color:#020604"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softglow">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect x="5" y="5" width="100" height="100" rx="22" fill="url(#bg)"/>
  <!-- Outer arc (faint) -->
  <path d="M18,52 Q55,8 92,52" fill="none" stroke="#4ade80" stroke-width="2"
        stroke-linecap="round" opacity="0.28" filter="url(#glow)"/>
  <!-- Main arc -->
  <path d="M28,44 Q55,17 82,44" fill="none" stroke="#4ade80" stroke-width="3.5"
        stroke-linecap="round" filter="url(#glow)"/>
  <!-- Antenna legs -->
  <line x1="55" y1="44" x2="44" y2="63" stroke="#4ade80" stroke-width="3"
        stroke-linecap="round" filter="url(#glow)"/>
  <line x1="55" y1="44" x2="66" y2="63" stroke="#4ade80" stroke-width="3"
        stroke-linecap="round" filter="url(#glow)"/>
  <!-- Base bar -->
  <line x1="40" y1="58" x2="70" y2="58" stroke="#4ade80" stroke-width="3"
        stroke-linecap="round" filter="url(#glow)"/>
  <!-- Tip glow halo -->
  <circle cx="55" cy="42" r="9" fill="#4ade80" opacity="0.12" filter="url(#softglow)"/>
  <circle cx="55" cy="42" r="3.5" fill="#86efac"/>
  <!-- EPG label -->
  <text x="55" y="87" text-anchor="middle"
        font-family="'Arial Black', 'Arial', sans-serif"
        font-size="18" font-weight="900" letter-spacing="4"
        fill="#4ade80" filter="url(#glow)">EPG</text>
</svg>
```

## Output Files Required

Tauri requires the following icon files in `src-tauri/icons/`:

| File | Size | Format |
|------|------|--------|
| `icon.png` | 512×512 | PNG (master) |
| `128x128.png` | 128×128 | PNG |
| `128x128@2x.png` | 256×256 | PNG |
| `32x32.png` | 32×32 | PNG |
| `Square30x30Logo.png` | 30×30 | PNG |
| `Square44x44Logo.png` | 44×44 | PNG |
| `Square71x71Logo.png` | 71×71 | PNG |
| `Square89x89Logo.png` | 89×89 | PNG |
| `Square107x107Logo.png` | 107×107 | PNG |
| `Square142x142Logo.png` | 142×142 | PNG |
| `Square150x150Logo.png` | 150×150 | PNG |
| `Square284x284Logo.png` | 284×284 | PNG |
| `Square310x310Logo.png` | 310×310 | PNG |
| `StoreLogo.png` | 50×50 | PNG |
| `icon.ico` | multi-size | ICO (16,32,48,64,128,256) |
| `icon.icns` | multi-size | ICNS (macOS) |

## Implementation Approach

1. Write the SVG source to a temp file (e.g. `scripts/generate-icon.mjs`)
2. Use `sharp` (via bun) to rasterize the SVG to a 512×512 PNG master
3. Run `bun tauri icon src-tauri/icons/icon.png` — Tauri CLI auto-generates all required sizes including `.ico` and `.icns`
4. The script is a one-time utility; no new runtime dependency is added to the app

## Out of Scope

- Animation or dynamic icons
- Dark/light mode variants
- Tray icon (uses same files)
