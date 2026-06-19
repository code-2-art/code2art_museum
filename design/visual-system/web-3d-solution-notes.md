# Web 3D Solution Notes

## Decision

Use a lightweight Three.js/WebGL scene for the first 3D museum layer.

## Why

- The current project is a static MVP under `docs/`, so the first 3D layer should not require a build system.
- WebGPU is the next-generation direction, but still has uneven browser support and secure-context requirements for broad public access.
- PlayCanvas is strong for WebGPU, Gaussian splats, and game-scale projects, but is heavier than needed for the first gallery layer.
- Three.js gives enough primitives, materials, WebGL rendering, WebGPU path exploration, and interaction patterns for a procedural open-world gallery while keeping the page portable.

## Current Implementation

- Route: `docs/space/index.html`
- Scene logic: `docs/assets/space.js`
- Style: `docs/assets/space.css`
- Local Three.js vendor files: `docs/vendor/three.module.js` and `docs/vendor/three.core.js`
- Structure mirrors the current site: home, exhibits, exhibit detail, profiles, contributors.

## Later Upgrade Path

- Review and pin the exact Three.js release before production hardening; the current vendor files were copied from the jsDelivr `three` package endpoint during MVP implementation.
- Add glTF assets for real exhibition architecture.
- Add collision and pathfinding if the space grows beyond the current hub.
- Evaluate PlayCanvas or Babylon.js if the project needs authoring tools, multiplayer, physics, or Gaussian splat scenes.
