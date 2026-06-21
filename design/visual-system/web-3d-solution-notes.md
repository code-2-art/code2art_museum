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
- Structure now follows the three AI-native concept halls: Museum Agent atrium, Human on the Loop construction hall, and community star-map hall.
- The implementation remains static-site friendly: concept images are copied to `public/assets/space-concepts/`, loaded as browser textures, and surrounded by procedural Three.js architecture, route nodes, floor paths, and HUD controls.
- No GLB/glTF assets are shipped yet. The current asset pipeline uses optimized JPG concept boards as replaceable wall textures while leaving room for later GLB architecture.

## AI-Native 3D Museum Concepts

The current procedural 3D layer is only the first navigable placeholder. The next design target should treat the 3D museum as a set of connected AI-native exhibition spaces, not as one generic virtual gallery.

### AI-Native Archive Atrium

![AI-Native Archive Atrium](<AI-Native Archive Atrium.jpg>)

Role: main entrance, Museum Agent guide desk, and spatial index for the whole archive.

- Visitors arrive in a central atrium where works, projects, prompts, skills, members, history, and construction/process areas are visible as navigable zones.
- Museum Agent appears as a spatial guide, route generator, and evidence map instead of a separate chatbot panel.
- This should become the default mental model for `/space/`: the 3D museum is the same information architecture, translated into space.

### AI Construction Site Museum

![AI Construction Site Museum](<AI Construction Site Museum.jpg>)

Role: Human on the Loop / museum-building-process exhibition hall.

- The museum's own construction process becomes exhibit material: prompts, skills, code, commits, validation, curatorial decisions, and contributor records.
- AI agents are represented as organizing, annotating, and connecting archival materials, while humans remain responsible for judgment, direction, and curation.
- This space should connect closely to `CHANGE.md`, design decisions, build logs, contribution records, and future Prompt / Skill archives.

### Community Star-Map Museum

![Community Star-Map Museum](<Community Star-Map Museum.jpg>)

Role: community relationship map and long-term spatial navigation model.

- Works, projects, members, prompts, skills, history nodes, research themes, and future questions are presented as a navigable constellation.
- Museum Agent can generate 5-minute, 15-minute, or research routes across the community graph.
- This direction should guide future relationship visualization, personalized tours, and archive-to-space navigation.

## Later Upgrade Path

- Review and pin the exact Three.js release before production hardening; the current vendor files were copied from the jsDelivr `three` package endpoint during MVP implementation.
- Replace procedural room shells with GLB/glTF architecture derived from the three concept halls.
- Use glTF Transform before shipping larger model assets; keep pivots, scale, material reuse, texture budgets, and collision proxies explicit.
- Add collision and pathfinding if the space grows beyond the current hub.
- Evaluate PlayCanvas or Babylon.js if the project needs authoring tools, multiplayer, physics, or Gaussian splat scenes.
