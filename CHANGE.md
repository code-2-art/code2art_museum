# CHANGE

This file records incremental website versions and the user-facing features added or changed in each version.

## 2026-06-21 - 3D Museum Version 1 Walkable Scene

### Changed

- Replaced `3D 展馆` version 1 at `space/index.html` with the offline `code2art Museum Walkable` scene.
- Updated the `3D 展馆` dropdown version links to open in a new browser window or tab.

## 2026-06-21 - 3D Museum Menu Hover Behavior

### Changed

- Changed the `3D 展馆` navigation menu to open on hover/focus instead of requiring a click.
- Renamed the dropdown subtitles to `版本 1 / 漫游` and `版本 2 / 效果图视差`.

## 2026-06-21 - 3D Museum Version 2 Added

### Added

- Added the offline `code2art Museum 3D` scene as 3D museum `版本 2` at `space/v2/index.html`.
- Added `版本 2 / 离线 3D 场景` to the shared `3D 展馆` navigation dropdown.

## 2026-06-21 - 3D Museum Version Menu

### Added

- Added a `3D 展馆` dropdown in the shared top navigation with `版本 1` pointing to the current `feature/3d` AI-native three-hall museum implementation.

## 2026-06-21 - High-Fidelity Procedural 3D Museum Pass

### Changed

- Reworked the 3D museum from rough placeholder room geometry into a higher-fidelity procedural Three.js scene that follows the three concept images more closely.
- Added reusable 3D asset modules for atrium shells, archive stacks, process tables, construction scaffolds, robot arms, member walls, portal doors, glass rails, star-map floors, stairs, illuminated signage, and concept-image projections.
- Expanded the three rooms into distinct spatial experiences: a Museum Agent archive atrium, a Human-on-the-Loop construction-site gallery, and a community relationship star-map hall.

### Technical Notes

- New shared asset module: `public/assets/space-assets.js`, mirrored by the static build to `docs/assets/space-assets.js`.
- The runtime exposes `window.__spaceMuseumDebug` for quick browser verification of loaded rooms, scene object counts, active room, and animation frame progress.

## 2026-06-21 - Local Static Preview CSS Path Fix

### Fixed

- Fixed Astro-generated pages such as `docs/archive/index.html` loading without CSS when previewed from the `docs/` root at `http://127.0.0.1:4173/`.
- Switched the Astro build to relative base output and added `scripts/normalize-docs-links.mjs` so generated HTML links to `_astro` assets, favicon assets, and internal pages work from both local static preview paths and GitHub Pages-style subpaths.
- Updated shared layout link helpers so navigation and assets use relative `index.html` paths instead of hard-coded `/code2art_museum/` URLs.

## 2026-06-21 - AI-Native Three-Hall 3D Museum

### Added

- Created the `feature/3d` branch for the 3D museum implementation.
- Rebuilt the static Three.js museum layer around three AI-native halls: `导览大厅`, `建设现场展厅`, and `社群星图展厅`.
- Added runtime copies of the three concept images under `public/assets/space-concepts/` so each hall can use its concept board as a texture-backed visual target.
- Added a Museum Agent HUD itinerary with direct room focus buttons, active-room descriptions, and links back into the archive, progress, and members sections.

### Technical Notes

- The first version uses procedural Three.js geometry plus texture-backed concept boards rather than GLB/glTF assets.
- This keeps GitHub Pages deployment simple while preserving a clear upgrade path to optimized GLB architecture and collision/pathfinding later.

## 2026-06-21 - AI-Native 3D Concept Images Added

### Added

- Added three AI-native 3D museum concept images under `design/visual-system/`: `AI-Native Archive Atrium.jpg`, `AI Construction Site Museum.jpg`, and `Community Star-Map Museum.jpg`.
- Inserted the three concept images into `design/visual-system/web-3d-solution-notes.md` as visual targets for the future 3D museum layer.
- Defined the three concepts as connected exhibition spaces: the Museum Agent atrium, the Human on the Loop construction hall, and the community star-map navigation hall.

## 2026-06-21 - 3D Reference Cases Added

### Added

- Added 3D / immersive / metaverse reference cases to `SITE_PLAN.md`: New Art City, VOMA coverage on WIRED, KUNSTMATRIX Artspaces - Naturally Kladow, and Metasteps.
- Clarified how each reference should inform the future 3D museum layer, including virtual exhibition networks, online-native museum architecture, browser-based white-cube galleries, and metaverse-style spatial publishing.

## 2026-06-21 - Site Plan Added to Repository

### Added

- Added `SITE_PLAN.md` at the repository root as the active website plan for information architecture, Museum Agent direction, visual principles, page model, content model, and phased implementation.
- Clarified that `ROADMAP.md` remains the compact public phase roadmap, while `SITE_PLAN.md` carries the detailed site design and product planning context.

### Process Notes

- Keep recording every meaningful project increment in this `CHANGE.md` file so the museum build process remains part of the public archive.

## 2026-06-20 - Astro Homepage Index Design

### Added

- Added an Astro + TypeScript + Tailwind 4 site source under `src/`.
- Added a new homepage design centered on `Museum Agent` as the primary archive guide entry.
- Added a light international archive visual direction with paper-white background, strong typography, restrained accent colors, and catalog-style content rows.
- Added an Agent evidence / route map that explains relationships between works, projects, people, prompts, skills, and history without treating the graph as decoration.
- Added planned navigation pages for `展览`, `档案`, `研究`, `成员`, `建设进程`, and `参与`.
- Preserved legacy compatibility routes for `展品`, `成员 Profile`, `贡献者`, and the first exhibit detail.

### Website Surface

- New source: `src/pages/index.astro`, `src/components/AgentGuide.astro`, `src/components/RouteEvidence.astro`, `src/styles/global.css`.
- Build output: `docs/`.
- Static 3D museum assets remain available under `docs/space/`, `docs/assets/`, and `docs/vendor/`.

### Technical Notes

- Main framework: Astro 5.
- Type system: TypeScript.
- Styling: Tailwind 4 through `@tailwindcss/vite`.
- GitHub Pages base path: `/code2art_museum`.
- Local build requires Node `>=22.12.0`.

## 2026-06-20 - Homepage Build Progress Timeline

### Added

- Added a homepage section named `博物馆建设进程`.
- Presented the current museum build status as a vertical timeline.
- Summarized the current published MVP, website navigation, core modules, 3D roaming museum, and next improvement phase from this `CHANGE.md` record.
- Added a homepage link to the full GitHub-rendered `CHANGE.md`.

### Website Surface

- Affected page: `docs/index.html`.
- Affected styles: `docs/assets/styles.css`.

## 2026-06-20 - Published MVP with 3D Museum

### Version Scope

- Public site: `https://code-2-art.github.io/code2art_museum/`
- Deployment source: GitHub Pages from `main` branch `/docs`
- Site type: static HTML/CSS/JavaScript MVP
- Content status: seed content is present; some entries remain marked for later review and replacement with verified materials.

### Navigation

Primary website navigation:

- `code2art museum` brand link: returns to the homepage.
- `展品`: opens the exhibit list.
- `成员`: opens member profiles.
- `贡献者`: opens the contributor wall.
- `3D 展馆`: opens the browser-based 3D roaming museum. Currently present on the homepage navigation.
- `参与`: opens the GitHub-rendered contribution guide at `CONTRIBUTING.md`.

Homepage action buttons:

- `进入展厅`: opens the exhibit list.
- `进入 3D 展馆`: opens the 3D roaming museum.
- `阅读愿景`: opens the GitHub-rendered vision document at `VISION.md`.

3D museum navigation:

- `首页`
- `展品`
- `详情`
- `成员`
- `贡献者`
- `进入当前展区`: context link that changes with the active 3D zone.

### Website Modules

- Homepage:
  - Museum identity and short introduction.
  - Hero visual signal image.
  - Entry buttons for exhibit hall, 3D museum, and vision document.
  - MVP overview blocks for exhibits, members, and contributions.
  - Phase 1 feature list.
  - First history node list.

- Exhibit list:
  - Displays the first seed exhibit set.
  - Includes cards for five seed exhibits.
  - Links currently point to the first available exhibit detail sample where full detail pages are not yet created.

- Exhibit detail:
  - Provides the first exhibit detail page for `HUDOIT 论坛记忆`.
  - Includes description, process/context, archive notes, and metadata panels.

- Member profiles:
  - Displays the first profile list.
  - Current seed content includes four profiles.

- Contributor wall:
  - Displays current contributor/building roles.
  - Includes code2art community, avantcontra, and future contributors.

- 3D roaming museum:
  - Runs at `docs/space/index.html`.
  - Uses local Three.js vendor files under `docs/vendor/`.
  - Provides a procedural placeholder hall with zones corresponding to current site sections.
  - Supports desktop and mobile browser rendering and basic movement/drag interaction.
  - Links from 3D zones back into the static site pages.

### Content Data

- Seed exhibits: 5 JSON entries under `content/exhibits/`.
- Seed profiles: 4 JSON entries under `content/profiles/`.
- Seed history nodes: 6 JSON entries under `content/history/`.
- Exhibit schema: documented in `EXHIBIT_SCHEMA.md`.

### Deployment And Static Site Support

- `docs/.nojekyll` is present so GitHub Pages serves the static files without Jekyll processing.
- GitHub Pages HTTPS is enabled.
- Public homepage was verified with HTTP 200.

### Known Next Improvements

- Review the deployed 3D roaming museum on real phones and laptops.
- Replace procedural 3D placeholders with real exhibition architecture/assets.
- Replace `needs-review` seed content with verified artworks, profiles, media, and licenses.
- Add dedicated detail pages for more exhibits instead of routing all cards to the sample detail page.
- Decide whether to migrate the static MVP into a framework after the first public version stabilizes.
