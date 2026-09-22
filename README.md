# Lain

[![CI](https://github.com/laststance/lain/actions/workflows/ci.yml/badge.svg)](https://github.com/laststance/lain/actions/workflows/ci.yml)

**Lain** is a macOS-native [Raindrop.io](https://raindrop.io) desktop client for power users who manage 1,000+ bookmarks. It focuses on fast, keyboard-driven search and organization that goes beyond the Raindrop.io web app.

> Status: **Alpha** — [v0.1.0](https://github.com/laststance/lain/releases/tag/v0.1.0) is available for macOS 12+ (Developer ID signed, not yet notarized); under active development.

Landing page: [lain-web.vercel.app](https://lain-web.vercel.app) ([source](https://github.com/laststance/lain-web)).

## Features

|     | Feature                   | What it does                                                                     |
| --- | ------------------------- | -------------------------------------------------------------------------------- |
| F1  | Scoped search             | Search inside the current collection, one click to go global                     |
| F2  | Field-specific search     | Restrict a query to URL, title, or description; matches are highlighted          |
| F3  | Multiple view modes       | Grid, List, Table, Directory (⌘1–⌘4), remembered across restarts                 |
| F4  | Auto icons                | Favicons resolved automatically, with Google Favicon and letter-avatar fallbacks |
| F5  | Fuzzy collection search   | Type `rct` to jump to "React Resources"                                          |
| F6  | Drag & drop organization  | Move and reorder collections between groups; drag bookmarks into collections     |
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
| `pnpm electron:build`    | Package the macOS app (`.dmg` + `.zip`) into `release/`          |

## Continuous integration

Every push to `main` and every pull request runs `knip`, `lint`, `typecheck`, `test` (with coverage thresholds), `build`, `e2e`, and `e2e-coverage` on macOS runners. See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Release

`pnpm electron:build` packages the app with [electron-builder](https://www.electron.build) using [electron-builder.yml](electron-builder.yml): a `.dmg` and a `.zip` per architecture land in `release/`, together with `latest-mac.yml`, the feed that packaged builds poll through electron-updater (checked at startup and every 4 hours, installed on quit).

Pushing a `v*` tag runs [.github/workflows/release.yml](.github/workflows/release.yml), which builds arm64 + x64 and uploads everything to a **draft** GitHub Release for a final check before publishing.

| Secret / env var                                           | Purpose                                                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `VITE_RAINDROP_CLIENT_ID`, `RAINDROP_CLIENT_SECRET`        | Raindrop.io OAuth app, inlined into the main-process bundle at build time (required)               |
| `CSC_LINK`, `CSC_KEY_PASSWORD`                             | Developer ID Application certificate (`.p12`, base64) for code signing — unsigned build without it |
| `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` | Notarization; skipped when absent (an App Store Connect API key via `APPLE_API_KEY*` also works)   |

Unsigned builds run locally but Gatekeeper blocks them on other Macs until the app is signed and notarized.

## Security model

- OAuth tokens are stored with Electron `safeStorage` (macOS Keychain), never in `localStorage`.
- The renderer runs with `contextIsolation` and `sandbox` enabled and no Node integration; privileged calls go through a sender-validated IPC bridge.

---

Built by [Laststance.io](https://laststance.io).
