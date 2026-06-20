# CHANGE

This file records incremental website versions and the user-facing features added or changed in each version.

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
