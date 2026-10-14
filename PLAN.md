# TU Slide Vault: Development Sprint Plan & Roadmap

> **Repository:** [`tu-cockpit-community/tu-slide-vault`](https://github.com/tu-cockpit-community/tu-slide-vault)  
> **Plugin ID:** `tuwien.community.slide-vault`  
> **Target Platform:** TU Cockpit Sandboxed Plugin (`PluginFrame.tsx`) & Standalone Web App  
> **Tech Stack:** React 19, TypeScript, Lucide Icons, Vite, CSS Custom Properties (`--tu-*`)

---

## 1. Architectural Vision & Core Features

1. **Adaptive Cockpit Theme Syncing:** Seamlessly inherits CSS variables (`--tu-bg-canvas`, `--tu-bg-surface`, `--tu-bg-elevated`, `--tu-border`, `--tu-accent`, `--tu-text-primary`, `--tu-text-secondary`) with automatic dark/light fallback when executed standalone.
2. **Course Materials Organizer:** Intuitive sidebar grouping lecture slide decks by active TU Wien course (e.g. *Algorithmen und Datenstrukturen*, *Analysis 1*, *Einführung in das Programmieren*, *Lineare Algebra*, *Datenbanksysteme*).
3. **Instant Full-Text & Topic Search:** Blazing fast search bar with fuzzy filtering across course codes, lecture titles, slide topics, and extracted slide notes.
4. **Dark-Mode PDF Reader:** High-contrast reading mode with canvas tile inversion, page navigation, zoom scaling, and presentation view.
5. **Offline Slide Indexer & Cache:** High-speed client-side local caching ensuring slides are available during study sessions even without campus Wi-Fi.

---

## 2. Milestones Roadmap

### Milestone 1: App Shell, Course Navigation & Adaptive `--tu-*` Theming `[STATUS: COMPLETED ✅]`
- Build responsive app shell with top header, course filter sidebar, and main slide explorer canvas.
- Connect CSS custom properties so switching themes in TU Cockpit immediately themes the plugin iframe without reload.

### Milestone 2: Slide Deck Grid & Offline Caching Engine `[STATUS: COMPLETED ✅]`
- Grid display of lecture slide decks with lecture numbers, titles, page counts, file size, and cache status badges.
- Local persistence engine managing cached slides and bookmarks via `localStorage`.
- Support for toggling offline download cache on any slide deck.

### Milestone 3: Instant Full-Text Slide Search & Topic Filtering `[STATUS: COMPLETED ✅]`
- Real-time search bar with immediate keystroke filtering across slide titles, course tags, keywords, and lecture summaries.
- Quick topic chip filters (e.g. "Complexity", "Sorting", "Trees", "Graphs", "Integrals", "Matrices", "SQL").

### Milestone 4: Dark-Mode Slide Viewer with Inversion, Zoom & Page Navigation `[STATUS: COMPLETED ✅]`
- Modal slide reader with page-by-page navigation (`Prev`, `Next`, keyboard arrow keys).
- Invert Dark Mode toggle for easy reading of bright white presentation slides in dark study environments.
- Zoom slider and fit-to-width controls.
