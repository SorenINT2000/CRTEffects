# CRTEffects — Vintage CRT Studio (WebGL)

A Vite + React + TypeScript application that renders images through a real-time WebGL2 CRT post-processing shader with configurable scanlines, curvature, noise, vignette, RGB jitter, and rolling bar effects. Includes CSS-driven image transition animations (slide, flash, CRT switch, glitch).

## High-Level Architecture

- **Framework:** Vite + React 19 + TypeScript. Shader sources imported as raw strings via `?raw`.
- **Rendering:** Two `CRTRenderer` WebGL2 instances (A/B) drive a double-buffered canvas swap for seamless transitions. The renderers are imperatively managed via React refs; the animation loop runs in a `useEffect`.
- **State:** `CRTConfig` lives as React state in `App.tsx`, synced to the imperative renderers via a secondary `useEffect`. The SVG bezel path is a `useMemo` derived from config.
- **Transitions:** CSS keyframe animations applied to container `div` refs. Transition state is managed in a mutable ref (not React state) to avoid unnecessary re-renders.
- **Bezel / Clip Path:** An SVG clip-path and overlay simulate a curved CRT bezel; the path is recomputed via `computeBezelPath()` whenever the curvature parameter changes.

**ADR:** Chose to keep the WebGL renderer as a plain TypeScript class (not a React component) because it is entirely imperative GPU work. React manages the DOM, controls, and config; refs bridge the two worlds.

## File Manifest

| File | Purpose |
|---|---|
| `index.html` | Vite entry HTML (`<div id="root">` + module script) |
| `vite.config.ts` | Vite config with React plugin |
| `tsconfig.json` | TypeScript project config |
| `src/main.tsx` | React entry point (`createRoot`) |
| `src/App.tsx` | Root component: config state, renderer lifecycle, animation loop, transition logic |
| `src/App.css` | All styling including CSS variables and transition keyframes |
| `src/components/ViewerFrame.tsx` | CRT viewer: SVG clip-path/bezel, canvas containers |
| `src/components/ControlsPanel.tsx` | Settings sliders/checkboxes and transition buttons (data-driven) |
| `src/lib/CRTRenderer.ts` | Typed WebGL2 renderer class (shaders, textures, render loop) |
| `src/lib/bezelPath.ts` | Pure function: computes SVG path matching shader curvature |
| `src/lib/types.ts` | Shared types (`CRTConfig`, `Vec2`, `TransitionType`) and defaults |
| `src/shaders/vertex.glsl` | Pass-through vertex shader (screen-space quad) |
| `src/shaders/fragment.glsl` | CRT post-processing fragment shader |
| `src/vite-env.d.ts` | Vite client types + `.glsl?raw` module declaration |

## Running

```bash
# Development server with HMR
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Current State & Known Issues

### Working
- Vite + React + TypeScript project scaffold with clean `tsc` and `vite build`
- WebGL2 CRT post-processing with 6 configurable effect parameters
- Double-buffered A/B canvas transition system
- Four CSS transition types: slide, flash, CRT switch, glitch
- SVG bezel overlay with mathematically accurate curvature matching the shader
- Procedurally generated noise, scanline, and vignette textures
- Data-driven controls panel (settings defined declaratively)

### Known Issues / Next Steps
- Images are hardcoded to picsum.photos URLs; no local image upload yet
- No persistence of slider settings (resets on reload)
- No responsive breakpoint handling below ~400px viewport width
