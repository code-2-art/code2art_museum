# Gauss Archive visual specification

## Concept references

- `desktop-concept.png`: 1440 × 900 primary desktop view
- `mobile-concept.png`: 390 × 844 touch-first view

## Visual system

- Background: `#080807`
- Primary text: `#f0eadf`
- Muted text and borders: warm paper at 54–70% opacity
- Archive accent: `#f05a3c`
- Community accent: `#8ecf88`
- Architecture accent: `#d3b56f`
- UI type: modern sans-serif with explicit 12–16px chrome sizing
- Container model: full-bleed WebGL canvas with sparse DOM overlays; no cards
- Controls: square or circular 48px minimum touch target, 1px translucent border

## Visible-copy lock

Desktop: `code2art museum`, `GAUSS ARCHIVE`, `自动导览`, `帮助`, `WASD 移动 · 鼠标观察`, `点击画面进入漫游`, `入口庭院 / Archive Atrium`, `高质量 · 60 FPS`.

Mobile: the same wordmark and zone label, plus `拖动画面观察 · 左侧摇杆移动` and `移动质量`.

## Interaction inventory

- Pointer-lock mouse look and WASD/arrow-key movement
- Touch drag-to-look and virtual joystick movement
- Auto-tour toggle through the four archive zones
- Help dialog, quality label, loading state, WebGL2 fallback
- Persistent bottom-right version switch between `高性能版 / 实时漫游` and `概念高质量版 / 百万级扫描`
- Collision against the gallery bounds and central archive sculpture

## Scene data

The exhibition hall is generated locally from deterministic parameters. Every visible architectural plane, archive ribbon, constellation node, and route line is emitted as an anisotropic Gaussian via Spark `PackedSplats`; no third-party scan is required.

The concept-quality mode reconstructs the same spatial language as one million deterministic scan returns on desktop (520,000 on touch/low-memory devices). It intentionally preserves scan gaps, depth noise, bright returns, and sparse floating samples. Switching modes replaces and disposes the previous GPU dataset; the selected mode persists locally.
