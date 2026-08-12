# Design QA — Gauss Archive concept-quality pass

- source visual truth path: `C:\Users\Contra\AppData\Local\Temp\codex-clipboard-0c024904-0d42-443d-9975-196ea2ef74e7.png`
- implementation screenshot path: `H:\prjs\codex\code2art_museum\repo\design-qa-evidence\implementation-1080x663.png`
- viewport: requested `1080 x 663`; in-app browser rendered `1280 x 720` because its responsive viewport capability snaps to the nearest desktop test surface
- source pixels: `1079 x 663`
- implementation pixels: `1280 x 720`
- CSS size: `1280 x 720`
- density normalization: both compared as full-frame desktop captures with the same 16:9-ish content crop; source retains its native density
- state: concept-quality mode selected, entrance atrium, auto-tour off, initial camera, 1,000,000 splats

## Full-view comparison evidence

The source and implementation were both opened and inspected as full-frame images. The final implementation preserves the target composition: warm monumental archive frame on the left, green archive frame and constellation chamber on the right, a red fragmented archive monolith on the center axis, a dark courtyard foreground with warm guide lights, and the same corner HUD hierarchy. The previous bright solid orange/green boxes were replaced by smaller, lower-saturation, incomplete scan returns.

## Focused region comparison evidence

No separate crop was required: the architectural frames, center tower, constellation, ground, logo, navigation controls, reticle, labels, and version switch are all readable in the full-frame comparison. The important remaining fidelity difference is local material richness in the dark interior and wet-stone micro-reflections; this is recorded as P3 polish because the main composition and interaction remain intact.

## Findings

- [P3] Interior scan density remains sparser than the concept render.
  Location: pavilion walls, planting beds, and wet courtyard.
  Evidence: the source contains denser pale stone returns and more continuous puddle highlights; the implementation keeps larger black gaps to sustain real-time rendering and free navigation.
  Follow-up: replace the procedural approximation with a captured photogrammetry/3DGS dataset when a production scan is available.
- [P3] Central monolith is more geometric than the source.
  Location: center tower.
  Evidence: the source uses many irregular interleaved planes; the implementation uses broken stacked frames plus data rails for deterministic collision-safe navigation.
  Follow-up: add an offline-authored irregular scan asset while retaining the procedural fallback.

## Required fidelity surfaces

- Fonts and typography: passed. Existing Inter/PingFang system stack, optical weights, tracking, and hierarchy remain consistent with the source HUD.
- Spacing and layout rhythm: passed. Corner controls, centered reticle, bottom hints, zone label, and version switch remain aligned and uncropped on desktop and mobile.
- Colors and visual tokens: passed. The final palette is low-saturation brass, deep moss, vermilion, warm lamp light, and near-black stone rather than the prior bright orange/green treatment.
- Image quality and asset fidelity: passed for the procedural real-time medium. Fine splat scale, partial opacity, layered scan faces, and vertical returns avoid flat placeholder geometry. Residual photorealistic material differences are P3.
- Copy and content: passed. Museum wordmark, bilingual zone title, controls, quality receipt, and version labels remain intact.

## Comparison history

1. Earlier P1: bright solid portals and chunky tower made the scene look like colored blocks. Fix: rebuilt the million-point generator with fine incomplete returns, low-saturation palette, taller side architecture, vertical scan streaks, denser constellation nodes, and a slimmer fragmented archive tower. Post-fix evidence: final implementation screenshot.
2. Earlier P1: the first fine-scan iteration became nearly invisible. Fix: rebalanced opacity, point radius, renderer focal behavior, architectural point budgets, and ground density without returning to the original solid-box appearance. Post-fix evidence: final implementation screenshot.
3. Earlier P2: the scene lacked inhabited scale and ground articulation. Fix: added denser stone interior planes, approach surfaces, more courtyard lights, planting fragments, horizontal tower rails, and elongated ground reflection returns. Post-fix evidence: final implementation screenshot.
4. Earlier P2: a planar reflector experiment introduced black triangular artifacts. Fix: removed the reflector and retained the artifact-free splat-based wet-ground treatment. Post-fix evidence: final implementation screenshot.

## Interaction and runtime checks

- version switch: concept mode verified
- render receipt: 1,000,000 desktop splats; 520,000 mobile splats
- desktop HUD: verified
- mobile HUD and joystick layout: verified at `390 x 844`
- camera and walkable runtime: retained
- build and typecheck: passed
- console: no application errors surfaced during browser validation; in-app browser emitted only unrelated Statsig network timeout diagnostics

## Follow-up polish

- A production photogrammetry or trained 3DGS capture would close the remaining gap in vegetation, stone erosion, and wet reflections beyond what deterministic procedural splats can provide.

final result: passed
