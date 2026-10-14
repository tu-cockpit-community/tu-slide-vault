# TU Slide Vault (`tuwien.community.slide-vault`)

[![TU Cockpit Verified Community Plugin](https://img.shields.io/badge/TU%20Cockpit-Verified%20Plugin-006699.svg)](https://github.com/tu-cockpit-community/TU-Cockpit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**TU Slide Vault** is a high-performance offline lecture slide cache, full-text search engine, and dark-mode slide viewer built specifically for TU Wien students.

Developed as an autonomous community plugin under the [`tu-cockpit-community`](https://github.com/tu-cockpit-community) organization, it runs seamlessly inside [TU Cockpit](https://github.com/tu-cockpit-community/TU-Cockpit)'s sandboxed runtime or standalone in any modern web browser.

---

## ✨ Features

- 📚 **Course Materials Organizer:** Browse lecture decks across key TU Wien courses (*Algorithmen und Datenstrukturen*, *Analysis 1*, *Einführung in das Programmieren*, *Lineare Algebra*, *Datenbanksysteme*).
- 🔍 **Instant Full-Text Search:** Search slide titles, topics, and slide notes instantaneously as you type.
- 🌙 **Dark-Mode Reading View:** Invert bright white PDF slides into dark mode with a single click for late-night study sessions.
- 💾 **Offline Caching:** Store slide decks locally in browser storage so you can study on the subway or without Wi-Fi.
- 🎨 **Adaptive `--tu-*` Theming:** Automatically synchronizes with TU Cockpit's dark, light, and OLED themes.

---

## 🚀 Development & Build

```bash
# 1. Install dependencies
npm install

# 2. Start local dev server
npm run dev

# 3. Production build
npm run build
```

---

## 🏛️ Integration with TU Cockpit

TU Slide Vault declares a compliant `manifest.json` adhering to the TU Cockpit Plugin Manifest Specification (`v1`). It is automatically discovered by TU Cockpit's `CommunityOrgService` and available for 1-click installation directly from the **Community Store HUB**.
