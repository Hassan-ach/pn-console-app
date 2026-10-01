# pn-console-app

Tauri v2 desktop application for Pipenile Console — a **Vue 3 + TypeScript** frontend that connects to the `pn-console-api` backend (NestJS + Prisma + PostgreSQL) over HTTP.

This package is a **pure UI layer**. There is no direct database access and no Tauri IPC for data — everything flows through `src/api/PluginManagerClient` → `http://localhost:3000/api`.

> Companion backend: `pn-console-api` (separate package, port `:3000`). This app only works with it running.

## Features

- **Auth**: email/password login, signup, OAuth (Google/Microsoft/SSO), password reset with token polling — dual-mode (browser popup + Tauri `WebviewWindow`)
- **Dashboard** (`/home`): recent insights, success banners
- **Insights** (`/insights`, `/insights/:id`): insight cards, status transitions, priority/deadline, version history; AI action suggestions (`/insights/:id/suggestions`)
- **Multi-conversation chat** (`/chat`): SSE streaming with date-bucketed history sidebar, delete, stop/retry, markdown rendering (sanitized via DOMPurify)
- **Integrations** (`/settings-telegram`): plugin lifecycle — auth wizard (Telegram via GramJS), schema-driven config forms, activation, details
- **Settings** (`/settings`): profile, logout, integration links

Full feature details: [`docs/features.md`](docs/features.md)

## Tech Stack

| Layer | Tech |
|---|---|
| Shell | Tauri v2 (Rust, `src-tauri/`) |
| Frontend | Vue 3 `<script setup>` SFCs, TypeScript |
| Build | Vite 6, Tailwind CSS v4 |
| Routing | vue-router 4 (hash history — all routes in `src/router/index.ts`) |
| HTTP | Custom fetch client (`src/api/client.ts`) with SSE streaming support |
| Chat rendering | `marked` + `dompurify` + `highlight.js` |
| Telegram | GramJS (`telegram` npm package), bundled for browser by esbuild |
| Tests | Vitest (see `src/api/chat-api.test.ts`) |

## Prerequisites

- Node.js 20+ and pnpm
- Rust toolchain + Tauri v2 system dependencies (Linux: `libgtk-3-dev libwebkit2gtk-4.1-dev librsvg2-dev patchelf`)
- The `pn-console-api` backend running on `http://localhost:3000` (its Postgres is provided by the `docker-compose.yml` in this repo: `docker compose up -d`)

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env   # then fill in your values (see below)

# 3. Run the backend (see pn-console-api) and start the app
pnpm dev               # browser-only: vite dev server on :1420
# or
pnpm tauri dev         # desktop window
```

### Environment Variables (`.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:3000/api` |
| `TELEGRAM_API_ID` | Telegram app API ID from [my.telegram.org/apps](https://my.telegram.org/apps) |
| `TELEGRAM_API_HASH` | Telegram app API hash |
| `TELEGRAM_CHATS` | Comma-separated chat IDs to monitor |
| `TELEGRAM_PHONE` | Phone number used for the Telegram session |

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Builds the GramJS bundle, then starts the Vite dev server (port 1420) |
| `pnpm build` | `build-telegram` → `vue-tsc --noEmit` → `vite build`. **This is the only static check for the app** (no type-check-only test) |
| `pnpm preview` | Preview the production build |
| `pnpm tauri dev` / `pnpm tauri build` | Run / build the desktop app |
| `pnpm build-telegram` | esbuild-bundle GramJS into `public/telegram-bundle.js` (IIFE, loaded as a sync `<script>` in `main.ts`, exposes `window.TelegramLib`) |
| `pnpm lint` | ESLint (autofix) |
| `pnpm format` | Prettier on `src/**/*.ts` |
| `pnpm vitest run` | Run unit tests (`src/api/chat-api.test.ts`) |

## Project Structure

```
├── public/telegram-bundle.js   # GramJS IIFE bundle (generated — don't edit)
├── scripts/build-telegram.mjs  # esbuild script for the GramJS bundle
├── src/
│   ├── api/                    # HTTP layer: client, auth, plugin-manager, insights-api, chat-api, suggestions-api, teams-api
│   ├── components/             # PageHeader, SideNavBar, AlertBanner, ConfirmDialog, ConversationSidebar,
│   │                           #   home/, integrations/, insights/, settings/telegram/
│   ├── composables/            # useChat, useTelegramAuth, useTelegramDialogs, useExternalLinks
│   ├── demo/                   # legacy insights demo pages
│   ├── router/index.ts         # single vue-router, hash-based, all routes
│   ├── stubs/                  # Node.js module stubs for the GramJS browser bundle
│   ├── utils/                  # helpers (e.g. plugin.ts)
│   └── views/                  # pages: login/signup/forgot/reset, home, dashboard, insights, chat, settings, integrations
├── src-tauri/                  # Rust shell, capabilities, tauri.conf.json
└── docs/                       # architecture, features, API reference, development guide, scenario
```

## Route Map

Hash-based (`createWebHashHistory`). Auth-optional: `/forgot-password`, `/reset-password`.

| Route | Page |
|---|---|
| `/login`, `/signup` | Auth (redirect authenticated users away) |
| `/home` | Dashboard |
| `/insights`, `/insights/:id` | Insights list / detail |
| `/insights/:id/suggestions`, `/suggestions/:insightId?` | AI action suggestions |
| `/chat` | Multi-conversation chat |
| `/settings` | Profile & logout |
| `/settings-telegram` | Integrations page |

## Gotchas

- **GramJS bundle must be built before dev/build** — `pnpm dev`/`pnpm build` do this automatically via `scripts/build-telegram.mjs`. It's loaded as a sync `<script>` in `main.ts`; editing it requires a rebuild.
- **Auth token** lives in `sessionStorage("access_token")`; checked on every API call in `client.ts`.
- **`organizationId`** is hardcoded (`'demo-org'` in insights demo) until auth/tenancy lands.
- **No lint on the app** — `pnpm build` is the type gate.
- **Plugin list cache**: `PluginManagerClient.list()` caches for 10s — may be stale right after install/uninstall.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — architecture, directory layout, design decisions
- [`docs/features.md`](docs/features.md) — feature descriptions by module
- [`docs/api.md`](docs/api.md) — exported symbols, interfaces, methods
- [`docs/development.md`](docs/development.md) — developer handbook & build scripts guide
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — changelog from initial commit to HEAD
- [`docs/scenario.md`](docs/scenario.md) — usage scenarios
- [`AGENTS.md`](AGENTS.md) — agent notes (last documented commit, gotchas)

## CI

`azure-pipelines.yml` — on PRs to `main`: installs Tauri system deps + Rust, `pnpm install --frozen-lockfile`, `vue-tsc --noEmit`, `pnpm lint`, `pnpm tauri build`.
