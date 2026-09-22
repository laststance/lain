# Lain

[![CI](https://github.com/laststance/lain/actions/workflows/ci.yml/badge.svg)](https://github.com/laststance/lain/actions/workflows/ci.yml)

**Lain** is a macOS-native [Raindrop.io](https://raindrop.io) desktop client for power users who manage 1,000+ bookmarks. It focuses on fast, keyboard-driven search and organization that goes beyond the Raindrop.io web app.

> Status: **Pre-Alpha** — under active development, not yet released.

## Features

|     | Feature                   | What it does                                                                     |
| --- | ------------------------- | -------------------------------------------------------------------------------- |
| F1  | Scoped search             | Search inside the current collection, one click to go global                     |
| F2  | Field-specific search     | Restrict a query to URL, title, or description; matches are highlighted          |
| F3  | Multiple view modes       | Grid, List, Table, Directory (⌘1–⌘4), remembered across restarts                 |
| F4  | Auto icons                | Favicons resolved automatically, with Google Favicon and letter-avatar fallbacks |
| F5  | Fuzzy collection search   | Type `rct` to jump to "React Resources"                                          |
| F6  | Drag & drop organization  | Move and reorder collections between groups                                      |
| F7  | Readability               | Color-coded collections, breadcrumbs, item counts, content-type icons            |
| F8  | Custom keyboard shortcuts | Every action is rebindable from Settings (⌘⇧K)                                   |

The full product and technical specification lives in [SPEC.md](SPEC.md).

## Tech stack

Electron 40 · React 19 (React Compiler) · Vite 7 · Redux Toolkit + RTK Query · Tailwind CSS v4 + shadcn/ui · React Hook Form + Zod · Vitest + happy-dom + MSW · Playwright (Electron)

## Getting started

Requirements: macOS, Node.js 22, [pnpm](https://pnpm.io).

1. Create a Raindrop.io integration at <https://app.raindrop.io/settings/integrations> and copy its client ID and secret.
2. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

3. Install and run:

   ```bash
   pnpm install
   pnpm dev
   ```

`pnpm dev` starts Vite and launches the Electron app against the dev server.

## Scripts

| Command                  | Purpose                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `pnpm dev`               | Vite dev server + Electron                                       |
| `pnpm build`             | Type-check and build renderer + main/preload bundles             |
| `pnpm lint`              | ESLint (flat config)                                             |
| `pnpm typecheck`         | `tsc -b --noEmit`                                                |
| `pnpm test`              | Unit tests (Vitest)                                              |
| `pnpm test:coverage`     | Unit tests with the V8 coverage gate                             |
| `pnpm test:e2e`          | Playwright Electron E2E (headless; `LAIN_E2E_HEADED=1` to watch) |
| `pnpm knip`              | Dead code / unused dependency detection                          |
| `pnpm coverage:e2e-spec` | SPEC.md requirement coverage report for the E2E suite            |

## Continuous integration

Every push to `main` and every pull request runs `knip`, `lint`, `typecheck`, `test` (with coverage thresholds), `build`, `e2e`, and `e2e-coverage` on macOS runners. See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Security model

- OAuth tokens are stored with Electron `safeStorage` (macOS Keychain), never in `localStorage`.
- The renderer runs with `contextIsolation` and `sandbox` enabled and no Node integration; privileged calls go through a sender-validated IPC bridge.

---

Built by [Laststance.io](https://laststance.io).
