# PokéAssist PWA

A mobile-first PWA companion for Pokémon games. Home is the Pokédex; Compare and Team Builder are sub-navigation. Designed for ages 9–11 with simple icons, percentages, and visual bars.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Use mobile portrait or desktop; add to home screen for app-like use.

## Features

- **Pokédex (home)** – Search Pokémon; view evolution chain, moves, stats, flavor text
- **Compare** – Select a Pokémon, see super-effective picks ranked by matchup %, select opponent for head-to-head with outcome + stat bars
- **Team** – Add up to 6 Pokémon; persisted in IndexedDB

## Build

```bash
npm run build
```

Output is in `dist/`. Deploy to Cloudflare Pages with SPA fallback (`_redirects` included).

## Planned

- Game filter (Sword/Shield, Legends Arceus, etc.) to filter Pokémon by game
- Team vs Opponent ranking
- Type Coverage Matrix

## Tech

- React 19 + TypeScript
- TanStack Router (file-based)
- TanStack Query
- Tailwind CSS
- PokéAPI with IndexedDB cache
- PWA (offline, add to home screen)
