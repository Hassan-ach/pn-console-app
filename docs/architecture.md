# Architecture — pn-console-app

## Overview

`pn-console-app` is a **Tauri v2 desktop application** with a **Vue 3 + TypeScript** frontend. It is a pure UI layer — all business logic, data ingestion, and persistence live in the companion `pn-console-api` backend, accessed via HTTP.

```
┌──────────────────────────────────────────────────┐
│               pn-console-app (Tauri v2)          │
│  ┌────────────────────────────────────────────┐  │
│  │       Vue 3 + TypeScript (Vite)            │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │       Vue Router (hash-based)         │  │  │
│  │  │  src/router/index.ts                 │  │  │
│  │  │  Auth: /login /signup /forgot-pwd    │  │  │
│  │  │  HomeLayout (nested):                │  │  │
│  │  │  /home /insights /insights/:id      │  │  │
│  │  │  /chat /settings /settings-telegram  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │         API Client Layer             │  │  │
│  │  │  client.ts              — fetch wrapper              │  │  │
│  │  │  auth.ts                — auth endpoints             │  │  │
│  │  │  plugin-manager.ts      — plugin CRUD                │  │  │
│  │  │  insights-api.ts        — insights API               │  │  │
│  │  │  chat-api.ts            — SSE chat streaming + test  │  │  │
│  │  │  suggestions-api.ts     — AI action suggestions      │  │  │
│  │  └──────────────────┬────────────────────────────────────┘  │  │
│  │                     │ HTTP :3000             │  │
│  │  ┌──────────────────┴───────────────────┐  │  │
│  │  │           GramJS Bundle               │  │  │
│  │  │  public/telegram-bundle.js (IIFE)     │  │  │
│  │  │  loaded via <script> in main.ts       │  │  │
│  │  │  sets window.TelegramLib global       │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │      Rust Layer (lib.rs)             │  │  │
│  │  │  open_oauth_window command            │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └─────────────────────────┬──────────────────┘  │
│                            │ HTTP :3000            │
└────────────────────────────┼──────────────────────┘
                             │
                             ▼
                  pn-console-api (:3000)
                  (separate package)
```

## Directory Layout

```
pn-console-app/
├── public/
│   └── telegram-bundle.js     # GramJS IIFE bundle (built by esbuild)
├── scripts/
│   └── build-telegram.mjs     # esbuild script to bundle GramJS for browser
├── src/
│   ├── api/                   # HTTP client layer
│   │   ├── client.ts          # Generic fetch client (get/post/patch/del/stream)
│   │   ├── auth.ts            # Auth endpoints (signup, login, logout, forgot/reset password)
│   │   ├── plugin-manager.ts  # Plugin lifecycle + config CRUD + login + activation
│   │   ├── insights-api.ts    # Insights CRUD + priority/deadline + version history
│   │   └── chat-api.ts        # Chat API with SSE streaming + test
│   ├── components/
│   │   ├── PageHeader.vue     # Sticky top header with branding + user greeting
│   │   ├── SideNavBar.vue     # Collapsible sidebar nav (vue-router)
│   │   ├── AlertBanner.vue    # Auto-dismissing alert banner (reusable)
│   │   ├── ConfirmDialog.vue  # Native <dialog> confirmation modal
│   │   ├── ConversationSidebar.vue # Chat history sidebar (date-bucketed)
│   │   ├── home/
│   │   │   └── RecentInsights.vue   # Latest insights list
│   │   ├── integrations/
│   │   │   ├── GenericConfigForm.vue        # Dynamic schema-driven form (new)
│   │   │   ├── PluginIntegrationRow.vue     # Plugin card with status + actions
│   │   │   ├── PluginConfigModal.vue        # Config modal with GenericConfigForm
│   │   │   └── PluginDetailsModal.vue       # Details with active params + workers
│   │   ├── insights/
│   │   │   ├── InsightItem.vue         # Insight list card with status select
│   │   │   └── SourceEnvelopeCard.vue  # Source envelope reference card
│   │   └── settings/
│   │       ├── IntegrationsCard.vue        # Integration link card → /integrations
│   │       └── telegram/
│   │           ├── ApiCredentialsForm.vue    # apiId/apiHash/phone form
│   │           ├── VerificationCodeForm.vue  # 5-digit OTP input
│   │           ├── PasswordForm.vue          # 2FA password input
│   │           ├── ChatBrowserModal.vue      # Live dialog browser modal
│   │           └── TelegramAuthModal.vue     # Auth wizard modal
│   ├── composables/
│   │   ├── useChat.ts           # Chat composable (streaming, retry, scroll)
│   │   ├── useTelegramAuth.ts   # GramJS auth state machine
│   │   └── useTelegramDialogs.ts # Telegram dialog fetcher
│   ├── demo/
│   │   ├── InsightsDemoPage.vue      # Insight extraction demo UI
│   │   └── InsightsRouterOutlet.vue  # Vue Router outlet (deprecated)
│   ├── router/
│   │   └── index.ts            # Single vue-router (hash history) — all routes
│   ├── stubs/                  # Node.js stubs for GramJS browser bundle
│   │   ├── child_process.ts
│   │   ├── constants.ts
│   │   ├── fs.ts
│   │   ├── net.ts
│   │   └── tls.ts
│   ├── utils/
│   │   └── plugin.ts           # Shared plugin utilities (error mapping, timeAgo)
│   ├── views/
│   │   ├── LoginPage.vue       # Login form + OAuth + vue-router navigation
│   │   ├── SignupPage.vue      # Signup form + OAuth
│   │   ├── ForgotPasswordPage.vue  # Email → poll reset token → vue-router push
│   │   ├── ResetPasswordPage.vue   # Token → new password → auto-login
│   │   ├── HomePage.vue        # Auth shell: PageHeader + SideNavBar + <router-view>
│   │   ├── DashboardPage.vue   # Redesigned: priority/deadline insights + counts
│   │   ├── ChatPage.vue        # Multi-conversation chat UI with SSE streaming
│   │   ├── SuggestionsPage.vue # AI action suggestions (context summary + options)
│   │   ├── IntegrationsPage.vue # Unified plugin lifecycle management
│   │   ├── SettingsPage.vue    # Settings with logout + integrations link
│   │   ├── insights/
│   │   │   ├── InsightsPage.vue      # Insight list with pill-style tabs
│   │   │   └── InsightDetailPage.vue # Insight detail + versions + envelopes
│   ├── App.vue                 # Root: <router-view /> + OAuth event listeners
│   ├── main.ts                 # App entry point
│   └── style.css               # Tailwind import
├── azure-pipelines.yml         # Azure Pipelines PR validation
├── eslint.config.mjs           # ESLint flat config
├── .prettierrc                 # Prettier config
├── src-tauri/
│   ├── src/lib.rs              # Tauri commands (OAuth window)
│   ├── Cargo.toml              # Rust dependencies
│   └── capabilities/           # Tauri permission set
├── docs/                       # Project documentation
├── docker-compose.yml          # PostgreSQL 16 for local dev
├── vite.config.ts              # Vite + Tailwind + Vue + node polyfills
├── vitest.config.ts            # Test runner config
├── tsconfig.json               # TypeScript config
├── env.example                 # VITE_API_URL default
├── pnpm-workspace.yaml         # pnpm overrides
└── package.json                # Dependencies & scripts
```

## Key Design Decisions

### No direct DB or Tauri IPC for data
Frontend never uses `invoke()`, Tauri commands, or direct database access. All data flows through `src/api/*` → `http://localhost:3000/api`. This keeps the frontend swappable.

### Consolidated vue-router
**PR 599**: A single vue-router instance (`createWebHashHistory()`) now handles **all** application routes — replacing both the manual hash router in `App.vue` and the in-memory `insightsRouter.ts` (deleted).

Routes defined in `src/router/index.ts`:
- Auth-optional: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Authenticated (nested under `/` → `HomeLayout`): `/home`, `/insights`, `/insights/:id`, `/chat`, `/settings`, `/settings-telegram` (alias for IntegrationsPage), plus `/insights/:id/suggestions` and `/suggestions/:insightId?` (SuggestionsPage)
- Auth guard via `router.beforeEach`: JWT expiry check against `AUTH_WHITELIST`
- `App.vue` simplified to just `<router-view />` + OAuth event listeners
- `HomePage.vue` simplified to layout shell with `<router-view>` (no manual `currentView`)
- SideNavBar uses `useRoute()`/`useRouter()` for active state and navigation
- All auth pages use `router.push()` and `<router-link>` instead of `window.location.hash`

### Multi-conversation chat
**PR 612**: Chat supports multiple named conversations. `ConversationSidebar.vue` lists history grouped by recency; `useChat` manages an active conversation (list/create/switch/delete) around the SSE stream. The `/jobs` feature (page, API module, dashboard cards) was removed in the same PR — the Dashboard is now insights-only.

### Dual OAuth flow (browser + Tauri)
OAuth can run in a standard `window.open()` popup or a Tauri `WebviewWindow`. Token is communicated back via `postMessage` (browser) or Tauri events (`oauth-result`, `oauth-cancelled`).
OAuth can run in a standard `window.open()` popup or a Tauri `WebviewWindow`. Token is communicated back via `postMessage` (browser) or Tauri events (`oauth-result`, `oauth-cancelled`).

### GramJS in the browser via esbuild IIFE
Telegram's MTProto library (GramJS) is bundled as an IIFE with `scripts/build-telegram.mjs`, injected as a `<script>` tag in `main.ts`. Node.js stubs (`src/stubs/`) replace server-side modules (fs, net, tls) for browser compatibility.

### Shared utility layer
Error mapping and time-formatter logic extracted from views into `src/utils/plugin.ts` for reuse across plugin-related components.

### Tailwind CSS v4
Single `@import "tailwindcss"` in `style.css`. No PostCSS config needed.

### ESLint + Prettier
Flat ESLint config (`eslint.config.mjs`) with `typescript-eslint` type-checked rules. Prettier config (single quotes, trailing commas, 4-tab). Run via `pnpm lint` and `pnpm format`.

### CI/CD Pipeline
Azure Pipelines PR validation (`azure-pipelines.yml`) — triggered on PRs to `main`. Installs system deps, Rust, Node 26, pnpm 11.3. Runs type check, lint, and Tauri build.

### Testing
Vitest configured in `vitest.config.ts` (globals enabled, node environment). Tests match `src/**/*.test.ts`. One test file exists: `src/api/chat-api.test.ts` covering SSE streaming, message fetching, error handling, malformed JSON skipping, abort signal handling, and 401 expiry.

## External Dependencies

| Package | Purpose |
|---------|---------|
| `vue` ^3.5 | UI framework |
| `vue-router` ^4.6 | Hash-based routing for all routes |
| `marked` ^18.0 | Markdown rendering in ChatPage |
| `telegram` ^2.26 | GramJS (Telegram MTProto client) |
| `@tauri-apps/api` ^2 | Tauri JS bindings (events, window) |
| `@tauri-apps/plugin-opener` | Open URLs in OS default handler |
| `@tauri-apps/plugin-sql` | SQL plugin (Tauri) |
| `vite` ^6 | Build tool |
| `vite-plugin-node-polyfills` | Node polyfills for browser |
| `esbuild` ^0.28 | GramJS bundle builder |
| `tailwindcss` ^4 | Utility CSS framework |
| `dompurify` ^3.4 | XSS sanitization for markdown rendering in ChatPage |
| `vitest` ^4 | Test runner |
| `vue-tsc` ^2 | Type-check Vue SFCs |
