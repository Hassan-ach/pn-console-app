# Changelog

## 2026-07-31 — Commit `d2a6e11` (latest)

Baseline: `c095e92` → HEAD `d2a6e11`

### Commits (6)

```
d2a6e11 Merge branch 'main' of ssh.dev.azure.com:v3/pipenile/Mosaid/pn-console-app into HA_1007
65bc939 Merged PR 607: fix(insights): switch to v1 extraction, sanitize LLM response, improve prompt
5b79c12 style(chat): format chat-api test and useChat composable
f9c270e merge
655eee7 fic chat error at start up
2f0b4e0 Merged PR 612: Add support for multiple chat conversations with the ability to delete chats.
```

### Changed Files (15) — +654 / −564

| File | Status |
|------|--------|
| `src/api/chat-api.test.ts` | modified (+message-id dedup coverage, formatting) |
| `src/api/chat-api.ts` | modified (+`Conversation` interface, `getConversations`/`createConversation`/`deleteConversation`, `conversationId` params on messages, `metadata` SSE event, `StreamEvent` type) |
| `src/api/client.ts` | modified (empty response bodies resolve to `undefined` instead of failing on `res.json()` — fixes chat error at startup) |
| `src/api/jobs.ts` | **deleted** (Jobs feature removed) |
| `src/api/suggestions-api.ts` | modified (formatting only) |
| `src/components/ConversationSidebar.vue` | **added** (date-bucketed history sidebar) |
| `src/components/SideNavBar.vue` | modified (−Jobs nav item) |
| `src/components/home/JobCard.vue` | **deleted** |
| `src/components/home/RecentJobs.vue` | **deleted** |
| `src/components/home/SummaryCards.vue` | **deleted** |
| `src/composables/useChat.ts` | modified (+conversation state: `conversations`, `activeConversationId`, `loadConversations`, `switchConversation`, `startNewChat`, `deleteConversation`, `stopGenerating`, `toggleSidebar`) |
| `src/router/index.ts` | modified (−`/jobs` route) |
| `src/views/ChatPage.vue` | modified (rewritten: ConversationSidebar, date dividers, quick-action chips, Stop button, scroll-to-bottom button) |
| `src/views/DashboardPage.vue` | modified (−jobs fetch/cards, +success `AlertBanner` from `?msg=` route query) |
| `src/views/JobsPage.vue` | **deleted** |

### Highlights

- **PR 612 — Multiple chat conversations**: New `ConversationSidebar.vue` groups conversations by recency (Today / Yesterday / Previous 7 Days / Last Month / Older) with relative timestamps, message counts, New Chat, and delete via `ConfirmDialog`. `useChat` gained conversation lifecycle (list/create/switch/delete) and `ChatPage.vue` was rewritten with date dividers and a collapsible sidebar.
- **Jobs feature removed**: `jobs.ts`, `JobsPage.vue`, `JobCard.vue`, `RecentJobs.vue`, `SummaryCards.vue`, the `/jobs` route, and the SideNavBar Jobs item were all deleted. Dashboard is now insights-only.
- **Chat startup fix** (`655eee7`): `client.ts` parses response text manually and returns `undefined` for empty bodies, preventing JSON-parse errors on empty responses.
- **PR 607 — Insights extraction**: Backend-side switch to v1 extraction with sanitized LLM responses and improved prompt; frontend touched only for formatting.

---

## 2026-07-30 — Commit `c095e92`

Baseline: `e6430f7` → HEAD `c095e92`

### Commits (4)

```
c095e92 Merge branch 'main' of ssh.dev.azure.com:v3/pipenile/Mosaid/pn-console-app into HA_1007
526acc7 Merged PR 609: feat(suggestions): add AI action suggestions page with context summary and option selection
6d57a2d feat(suggestions): implement item-specific AI suggestions view, floating action footer, option switching, and top notification banner
f701f19 Merged PR 604: fix(chat): SSE abort handling, XSS sanitization, retry dedup, and stream robustness
```

### Changed Files (12)

| File | Status |
|------|--------|
| `package.json` | modified (+`dompurify`, +`@types/dompurify`) |
| `pnpm-lock.yaml` | modified |
| `src/api/chat-api.test.ts` | modified (+abort signal test, malformed JSON skipped test) |
| `src/api/chat-api.ts` | modified (+pagination, retractLastMessages, AbortSignal, malformed JSON skip, finished guard) |
| `src/api/client.ts` | modified (+`signal` param on `requestStream`) |
| `src/api/suggestions-api.ts` | **added** |
| `src/components/AlertBanner.vue` | modified (minor) |
| `src/composables/useChat.ts` | modified (+onUnmounted abort, dedup on load/retry, retractLastMessages, scrollToTop, −streamingContent) |
| `src/router/index.ts` | modified (+suggestion routes) |
| `src/views/ChatPage.vue` | modified (+DOMPurify sanitize, History button) |
| `src/views/DashboardPage.vue` | modified (+"View AI Suggestions" button on Top Priority card, AlertBanner for successMessage) |
| `src/views/SuggestionsPage.vue` | **added** |

### Statistics

- 12 files changed (2 added, 10 modified)
- **+681 insertions** / **-37 deletions** (net +644)
- 4 commits (3 merged PRs)

### Highlights

- **AI Action Suggestions page** (PR 609): New `src/views/SuggestionsPage.vue` — two-column layout with Context Summary (bullets from `metadata.contextSummary`) and Choose an Action (selectable option cards with color-coded action type badges). Bottom sticky footer shows selected option with Confirm button. Insight detail header shows title, source, and deadline. Regenerate button triggers `POST /suggestions/generate/:insightId`. Confirmed choice redirects to `/home` with success message.
- **Suggestions API** (PR 609): New `src/api/suggestions-api.ts` with `InsightSuggestion` interface, `SuggestionActionType` (7 values) and `SuggestionStatus` (4 values) types. Methods: `getUserSuggestions()`, `getInsightSuggestions()`, `generateForInsight()`, `updateStatus()`.
- **Suggestion routes** (PR 609): Two new vue-router routes — `/insights/:id/suggestions` (insight-scoped) and `/suggestions/:insightId?` (optional param, user-wide fallback).
- **Dashboard shortcut** (PR 609): Top Priority card gains "View AI Suggestions" button linking to `/insights/:id/suggestions`.
- **Chat SSE robustness** (PR 604):
  - `chatApi.sendMessageStream()` now accepts optional `AbortSignal` for stream cancellation. `AbortError` is caught silently — `onError` is not called.
  - `chatApi.getMessages()` supports optional `page` and `limit` params for pagination.
  - New `chatApi.retractLastMessages()` (`DELETE /chat/messages/retract-last`) for best-effort cleanup of failed messages.
  - Malformed JSON lines in SSE stream are skipped gracefully instead of calling `onError`.
  - `finished` flag ensures `onDone` is called even if stream closes without a `done` event.
- **Chat composable improvements** (PR 604):
  - `onUnmounted` lifecycle hook aborts any in-flight `AbortController`.
  - Message deduplication by `role:content` key on `loadHistory()` and `retry()`.
  - `retry()` calls `chatApi.retractLastMessages()` (best-effort) then reloads from server before re-sending.
  - New `scrollToTop()` function. `streamingContent` removed (content managed via in-place mutation).
- **XSS sanitization** (PR 604): Assistant markdown responses in `ChatPage.vue` are sanitized via `DOMPurify.sanitize()` before rendering with `v-html`. Added `dompurify@^3.4.12` and `@types/dompurify@^3.2.0` as dependencies.

---

## 2026-07-29 — Commit `e6430f7`

Baseline: `e64a41c` → HEAD `e6430f7`

### Commits (3)

```
e6430f7 Merged PR 599: #993 feat: consolidate router, redesign dashboard with priority/deadline insights
a082342 Merged PR 596: feat(integrations): dynamic config schema rendering, password support, alert banner overhaul
e9ffbfa Merged PR 595: refactor(integrations): unify plugin lifecycle management into a dedicated Integrations page
```

### Changed Files (31)

| File | Status |
|------|--------|
| `src/App.vue` | rewritten (simplified to `<router-view />` + OAuth listeners) |
| `src/api/client.ts` | modified (401 redirect `#login` → `#/login`) |
| `src/api/insights-api.ts` | modified (+`priority`/`deadline` on `InsightSummary`, +`updatePriority()`, +`getPriorityColor()`, +`getPriorityLabel()`, +`formatDeadline()`) |
| `src/api/plugin-manager.ts` | modified (+`'password'` type on `ConfigFieldSchema.type`) |
| `src/components/AlertBanner.vue` | rewritten (auto-dismiss timers, slide-down `Transition`) |
| `src/components/PageHeader.vue` | rewritten (vue-router nav, date display, bell icon) |
| `src/components/SideNavBar.vue` | rewritten (vue-router `useRoute`/`useRouter` instead of hash) |
| `src/components/home/JobCard.vue` | modified (minor styling) |
| `src/components/home/RecentInsights.vue` | modified (minor styling) |
| `src/components/home/RecentJobs.vue` | modified (minor styling) |
| `src/components/insights/InsightItem.vue` | modified |
| `src/components/integrations/GenericConfigForm.vue` | **added** |
| `src/components/integrations/PluginConfigModal.vue` | rewritten (GenericConfigForm, schema + requirements fetch) |
| `src/components/integrations/PluginDetailsModal.vue` | rewritten (active params display, animated worker states) |
| `src/components/settings/IntegrationsCard.vue` | modified (links → `/integrations`) |
| `src/components/settings/telegram/TelegramAuthModal.vue` | modified (AlertBanner usage) |
| `src/demo/InsightsRouterOutlet.vue` | modified |
| `src/main.ts` | modified |
| `src/router/index.ts` | rewritten (consolidated vue-router with all routes + auth guard) |
| `src/router/insightsRouter.ts` | **deleted** |
| `src/views/DashboardPage.vue` | rewritten (priority/deadline, insight/job counts, greeting) |
| `src/views/ForgotPasswordPage.vue` | modified (vue-router, AlertBanner) |
| `src/views/HomePage.vue` | simplified (vue-router layout shell) |
| `src/views/IntegrationsPage.vue` | modified |
| `src/views/JobsPage.vue` | modified |
| `src/views/LoginPage.vue` | modified (vue-router navigation) |
| `src/views/ResetPasswordPage.vue` | modified (vue-router, AlertBanner) |
| `src/views/SettingsPage.vue` | modified |
| `src/views/SignupPage.vue` | modified |
| `src/views/insights/InsightDetailPage.vue` | modified (priority/deadline display, pill tabs) |
| `src/views/insights/InsightsPage.vue` | modified (pill-style tabs) |

### Statistics

- 31 files changed (1 added, 1 deleted, 29 modified)
- **+1,315 insertions** / **-530 deletions** (net +785)
- 3 commits (all merged PRs)

### Highlights

- **Consolidated vue-router** (PR 599): `src/router/index.ts` rewritten to handle ALL routes via a single `vue-router` instance with `createWebHashHistory()`. Auth guard with JWT expiry check added via `router.beforeEach`. In-memory `insightsRouter.ts` deleted. `App.vue` simplified — manual hash routing and `isAuthenticated()` removed; now just `<router-view />` + OAuth listeners. `SideNavBar.vue` and `HomePage.vue` use `useRouter()` instead of hash-based navigation. All auth pages use `router.push()`/`<router-link>` consistently. 401 redirect changed from `#login` to `#/login` in `client.ts`.
- **Dashboard redesigned** (PR 599): Time-based greeting (`"Good morning"`, `"Good afternoon"`, `"Good evening"`), "Today's Focus" section header, **Top Priority Card** — highest-priority pending insight with priority score badge (color-coded red/amber/green), type badge, status badge, and deadline indicator via `formatDeadline()`. Count cards for insight types (Task/Urgency/Info/Decision) and job statuses (Pending/Running/Completed/Failed) — each clickable, navigating to filtered views. 5-second polling fetching 50 insights and all jobs.
- **Insights API expanded** (PR 599): `InsightSummary` gains `priority` (0–10 score) and `deadline` (ISO timestamp). New `updatePriority(id, priority)` method (`PATCH /insights/:id/priority`). New exports: `getPriorityColor()`, `getPriorityLabel()`, `formatDeadline()`.
- **Dynamic config form** (PR 596): New `GenericConfigForm.vue` — reusable v-model form component that renders fields from `ConfigFieldSchema[]`. Supports `text`, `password` (new type), `number`, `boolean`, `select`, and `checkbox-list`/`chats` types. Browse Chats button for Telegram integration.
- **PluginConfigModal rewritten** (PR 596): Now fetches config schema + current config + activation requirements in parallel on open. Uses `GenericConfigForm` with schema filtered to editable fields (matching activation requirements). Shows met/unmet requirement indicators (green check / amber warning). `save` event emits full config object instead of just chats.
- **PluginDetailsModal rewritten** (PR 596): Fetches active config and displays non-chat parameters in a key-value grid. Per-chat worker state display enhanced with animated status indicators (green pulse for LISTENING stream, amber pulse for RUNNING backfill with message count).
- **AlertBanner auto-dismiss** (PR 596): Success messages auto-dismiss after 3s, errors after 5s. Slide-down `Transition` animation. Used in ForgotPasswordPage, ResetPasswordPage, TelegramAuthModal, and PluginConfigModal.
- **PageHeader redesigned** (PR 599): Uses vue-router navigation. Brand button navigates to `/home`. Displays current formatted date. Bell notification icon.
- **Insights tab styling** (PR 599): Changed from border-bottom underline to pill-style buttons inside a `bg-stone-100` rounded container, both for main tabs (Overview/Tasks/Urgent/Info/Decisions) and status sub-tabs.

---

## 2026-07-29 — Commit `e64a41c`

Baseline: `b8e9cfb` → HEAD `e64a41c`

### Commits (4)

```
e64a41c fix(lint): mark nextTick promise as ignored in useChat
2bfce15 Merge branch 'HA_976_refactoration' into HA_976
5c6c382 refactor(integrations): modularize plugins page, extract auth/config modals, and clean up obsolete views
f32be31 Merged PR 593: create chat UI
```

### Changed Files (22)

| File | Status |
|------|--------|
| `package.json` | modified (+`marked` dep) |
| `pnpm-lock.yaml` | modified |
| `src/api/plugin-manager.ts` | modified (types, lint fixes) |
| `src/components/NavBar.vue` | **deleted** |
| `src/components/PluginCard.vue` | **deleted** |
| `src/components/SideNavBar.vue` | rewritten (Chat link, reformatted) |
| `src/components/ingestion/MetricsPanel.vue` | **deleted** |
| `src/components/integrations/PluginConfigModal.vue` | **added** |
| `src/components/integrations/PluginDetailsModal.vue` | **added** |
| `src/components/integrations/PluginIntegrationRow.vue` | **added** |
| `src/components/settings/IntegrationsCard.vue` | modified (links to `#integrations`) |
| `src/components/settings/telegram/ApiCredentialsForm.vue` | modified |
| `src/components/settings/telegram/ChatBrowserModal.vue` | modified |
| `src/components/settings/telegram/ChatConfigForm.vue` | **deleted** |
| `src/components/settings/telegram/StatusCard.vue` | **deleted** |
| `src/components/settings/telegram/TelegramAuthModal.vue` | **added** |
| `src/composables/useChat.ts` | **added** |
| `src/views/ChatPage.vue` | **added** |
| `src/views/HomePage.vue` | modified (routes: Chat+Integrations replace Ingestion+Tg) |
| `src/views/IngestionPage.vue` | **deleted** |
| `src/views/IntegrationsPage.vue` | **added** |
| `src/views/settings/TelegramIntegration.vue` | **deleted** |

### Statistics

- 22 files changed (7 added, 6 deleted, 9 modified)
- **+2,028 insertions** / **-1,184 deletions** (net +844)
- 4 commits (all merged PRs)

### Highlights

- **Chat page with SSE streaming** (PR 593): New `ChatPage.vue` at `#chat` with full-page edge-to-edge layout. Uses `useChat` composable wrapping `chatApi.sendMessageStream()` for real-time SSE streaming. Markdown rendering of assistant responses via `marked@^18.0.7`. Quick action chips ("Summarize my day", "What's blocked?", "Am I free Thursday PM?"), auto-scroll with 100px bottom threshold, floating scroll-to-bottom button, error bar with retry, streaming cursor animation on last assistant message.
- **Unified Integrations page** (commit 5c6c382): Brand new `IntegrationsPage.vue` replaces both `IngestionPage.vue` and `TelegramIntegration.vue`. Single-page plugin lifecycle management: list plugins, connect (opens `TelegramAuthModal`), configure (opens `PluginConfigModal`), activate/deactivate, view details (opens `PluginDetailsModal`). Compatible with old `settings-telegram` hash (redirected via HomePage `currentView`).
- **Modular integration components**: New `src/components/integrations/` directory with `PluginIntegrationRow.vue` (status badge + action buttons), `PluginConfigModal.vue` (chat browser + history limits + disconnect), `PluginDetailsModal.vue` (per-chat worker states: stream Listening/Stopped, backfill Running/Completed/Idle). `TelegramAuthModal.vue` extracted from deleted `TelegramIntegration.vue` into a reusable modal.
- **Deleted files**: `PluginCard.vue`, `NavBar.vue` (replaced by SideNavBar), `IngestionPage.vue`, `TelegramIntegration.vue`, `MetricsPanel.vue`, `ChatConfigForm.vue`, `StatusCard.vue`.
- **SideNavBar reworked**: Added Chat nav link (`#chat`), reformatted to 4-space indent throughout.
- **HomePage routing**: `IngestionPage` + `TelegramIntegration` replaced by `ChatPage` + `IntegrationsPage`. `settings-telegram` hash now maps to `integrations` view.
- **IntegrationsCard simplified**: Changed from Telegram-specific card to generic link pointing to `#integrations`.
- **Dependency**: Added `marked@^18.0.7` for markdown rendering. DevDependencies reorganized (ESLint/Prettier moved within devDeps).
- **Lint fix** (commit e64a41c): `useChat.ts` promise handled in `nextTick` for lint compliance.

---

## 2026-07-28 — Commit `b8e9cfb`

Baseline: `fe9a135` → HEAD `b8e9cfb`

### Commits (6)

```
b8e9cfb Cleanup: remove PluginStatus.vue, remove unused backfill() method and BulkInsertResult, tidy sidebar active state
bd0bc9c Rewrite IngestionPage with unified lifecycle, polling, expandable inline chat config and metrics
ffdd450 Create MetricsPanel component for backfill progress, stream uptime, and batch stats
b97beb1 Extend PluginCard with status badge, chat pills, and action buttons per lifecycle state
1cfeff2 Add activate/deactivate/getActivationStatus/updateChats methods and interfaces to PluginManagerClient
c32f0ee Merged PR 590: Add Chat API client with SSE streaming support
```

### Changed Files (10)

| File | Status |
|------|--------|
| `src/api/chat-api.test.ts` | **added** |
| `src/api/chat-api.ts` | **added** |
| `src/api/client.ts` | modified (+`stream()`) |
| `src/api/plugin-manager.ts` | modified (+activate/deactivate/getActivationStatus/updateChats/getConfigSchema/getActivationRequirements; −backfill/BulkInsertResult; +WorkerState/PluginStatus/ConfigFieldSchema/ActivationRequirementResult) |
| `src/components/PluginCard.vue` | rewritten (callback props, status badge, ChatStatusRows, activation requirements tooltip) |
| `src/components/SideNavBar.vue` | modified (sidebar active state fix) |
| `src/components/ingestion/MetricsPanel.vue` | **added** (then removed locally — never merged) |
| `src/components/ingestion/PluginStatus.vue` | **deleted** |
| `src/views/IngestionPage.vue` | rewritten (lifecycle polling, ChatConfigModal, ConfirmDialog, computed needsPoll) |
| `src/views/settings/TelegramIntegration.vue` | modified (+status prop on PluginCard) |

### Statistics

- 10 files changed (2 added, 1 deleted)
- **+623 insertions** / **-176 deletions** (net +447)
- 6 commits (all merged PRs)

### Highlights

- **Chat API with SSE streaming** (PR 590): New `src/api/chat-api.ts` with `chatApi.getMessages()` (`GET /chat/messages`) and `chatApi.sendMessageStream(message, callbacks)` (`POST /chat/messages`, SSE). `StreamCallbacks` interface for `onToken`/`onDone`/`onError`. `client.ts` gains `api.stream()` method returning raw `Response`. Full test coverage in `chat-api.test.ts` (Vitest, mocked API).
- **Plugin lifecycle activation** (commit 1cfeff2): `PluginManagerClient` adds `activate()`, `deactivate()`, `getActivationStatus()`, `updateChats()` methods. New types: `PluginStatus` (7-state union), `ActivateResult`, `WorkerState` (per-chat backfill/stream), `PluginActivationStatus` (replaces `ChatWorkerState[]` with `{ chatId, worker, cursor }[]`). Removed `backfill()` method and `BulkInsertResult` (activation handles ingestion server-side).
- **PluginCard rewritten** (commit b97beb1): Changed from event-based (`emit`) to callback props (`onConnect`, `onConfigure`, `onActivate`, `onDeactivate`, `onDisconnect`, `onRetry`). Status badge with animated icons (pulse/spinner/warning). Integrates `ChatStatusRows` sub-component for per-chat worker state. Activation requirements tooltip on disabled Activate button.
- **IngestionPage rewritten** (commit bd0bc9c): Unified lifecycle with 5-second polling for ACTIVE/ACTIVATING/DEACTIVATING plugins. Uses `ChatConfigModal` (dynamic form from `getConfigSchema()`) via `<Teleport>` and `ConfirmDialog` for disconnect confirmation. `computed needsPoll` skips polling when no active plugins. Uses `PluginActivationStatus` enrichment with requirements check.
- **Cleanup** (commit b8e9cfb): `PluginStatus.vue` deleted (replaced by inline card status). `backfill()` and `BulkInsertResult` removed from `PluginManagerClient`. Sidebar active state fix for home/dashboard routes.

---

## 2026-07-25 — Commit `fe9a135`

Baseline: `e0ee4af` → HEAD `fe9a135`

### Commits (6)

```
fe9a135 Merged PR 582: feat: Restore auth guard to redirect unauthenticated users to login
748a0c2 Merged PR 579: feat: Home page layout with sidebar, overview cards, and jobs page
9968c5c Merged PR 567: Update azure-pipelines.yml for Azure Pipelines
c647af2 Merged PR 566: #949 ci: add Azure Pipelines PR validation and commit lock files
e1776fa Merged PR 563: #949 feat: add ESLint + Prettier tooling and improve type safety across the codebase
6dd4309 Merged PR 561: #949 feat(telegram): replace manual chat input with browse modal
```

### Changed Files (38)

| File | Status |
|------|--------|
| `.gitignore` | modified |
| `.prettierrc` | **added** |
| `azure-pipelines.yml` | **added** |
| `eslint.config.mjs` | **added** |
| `package.json` | modified |
| `pnpm-lock.yaml` | **added** (committed) |
| `src-tauri/Cargo.lock` | **added** (committed) |
| `src/App.vue` | modified |
| `src/api/auth.ts` | modified (formatting) |
| `src/api/client.ts` | modified (formatting) |
| `src/api/insights-api.ts` | modified (formatting) |
| `src/api/jobs.ts` | **added** |
| `src/api/plugin-manager.ts` | modified (formatting) |
| `src/components/PageHeader.vue` | **added** |
| `src/components/SideNavBar.vue` | **added** |
| `src/components/home/JobCard.vue` | **added** |
| `src/components/home/RecentInsights.vue` | **added** |
| `src/components/home/RecentJobs.vue` | **added** |
| `src/components/home/SummaryCards.vue` | **added** |
| `src/components/settings/telegram/ChatBrowserModal.vue` | **added** |
| `src/components/settings/telegram/ChatConfigForm.vue` | modified |
| `src/composables/useTelegramAuth.ts` | modified |
| `src/composables/useTelegramDialogs.ts` | **added** |
| `src/main.ts` | modified |
| `src/router/index.ts` | modified |
| `src/router/insightsRouter.ts` | modified |
| `src/stubs/constants.ts` | modified (formatting) |
| `src/stubs/fs.ts` | modified (formatting) |
| `src/stubs/net.ts` | modified (formatting) |
| `src/stubs/tls.ts` | modified (formatting) |
| `src/utils/plugin.ts` | modified (formatting) |
| `src/views/DashboardPage.vue` | rewritten |
| `src/views/HomePage.vue` | **added** |
| `src/views/IngestionPage.vue` | modified (formatting) |
| `src/views/JobsPage.vue` | **added** |
| `src/views/SettingsPage.vue` | modified |
| `src/views/settings/TelegramIntegration.vue` | modified |
| `src/vite-env.d.ts` | modified (formatting) |

### Statistics

- 38 files changed (including lock files)
- **+10,991 insertions** / **-471 deletions** (net +10,520)
- 6 commits (all merged PRs)

### Highlights

- **Home page layout** (PR 579): Brand new `HomePage.vue` as authenticated shell with `PageHeader` (sticky top header with `mosaid.` branding, user greeting, notification bell) and `SideNavBar` (collapsible sidebar with nav links — Home, Ingestion, Jobs, Insights, Settings, Profile). `DashboardPage.vue` completely rewritten with live data polling: summary cards (`SummaryCards.vue`: data sources, insights, active jobs), recent jobs (`RecentJobs.vue` + `JobCard.vue` with progress bar), recent insights (`RecentInsights.vue` with type/status badges). All with 3-second polling, loading spinners, empty states.
- **Jobs page** (PR 579): New `JobsPage.vue` at `#jobs` with status tabs (All, Running, Pending, Completed, Failed), 3-second polling. Backed by new `src/api/jobs.ts` with `jobsApi.list(status?)` and `jobsApi.get(id)`, `Job`/`JobStatus` types.
- **Chat browser modal** (PR 561): `ChatBrowserModal.vue` replaces manual chat ID input in `ChatConfigForm.vue`. Opens a modal that fetches Telegram dialogs live via GramJS (`useTelegramDialogs.ts` composable). Supports search filter, multi-select with checkmarks, loading skeleton, error/retry state, deterministic avatar colors. `ChatConfigForm.vue` removed `resolveChat` prop and input field.
- **ESLint + Prettier** (PR 563): New `eslint.config.mjs` (flat config with `typescript-eslint` type-checked rules) and `.prettierrc` (single quotes, trailing commas, 4-tab). Applied across all source files. New `pnpm lint` and `pnpm format` scripts.
- **CI/CD** (PR 566): `azure-pipelines.yml` with full PR validation pipeline — Rust install, Node 26, pnpm 11.3, caching, `pnpm install --frozen-lockfile`, `vue-tsc`, `lint`, `tauri build`. Lock files (`pnpm-lock.yaml`, `Cargo.lock`) committed.
- **Auth guard restored** (PR 582): `App.vue` now checks JWT token expiry on every hash change — unauthenticated users redirected to `#login`. Previously broken after home page layout changes.
- **`useTelegramAuth.ts`**: Type improvements (`any` casts → proper types, `Record<string, unknown>`, etc.). Reliable entity shape handling. 2FA `computeCheck` integration.

---

## 2026-07-24 — Commit `e0ee4af`

Baseline: `9fbac27` → HEAD `e0ee4af`

### Commits (8)

```
e0ee4af Merge branch 'main' of ssh.dev.azure.com:v3/pipenile/Mosaid/pn-console-app into HA_905
c6cb5e1 Merged PR 557: Implements the frontend for the password reset flow
2db0f80 merge main into HA_905
526eb93 Merged PR 556: feat(insights): UI improvements and file reorganization
131e950 Merge branch 'main' of ssh.dev.azure.com:v3/pipenile/Mosaid/pn-console-app into HA_905
cdc9405 Merged PR 551: #928 feat(insights): Add insights actions UI, status badges, and action API
82e2c6f Merged PR 548: #905  feat: replace demo page with ingestion UI, add plugin cards, resolve chat entities
```

### Changed Files (17)

| File | Status |
|------|--------|
| `src/App.vue` | modified |
| `src/api/auth.ts` | modified |
| `src/api/client.ts` | modified |
| `src/api/insights-api.ts` | modified |
| `src/components/InsightItem.vue` | **deleted** |
| `src/components/NavBar.vue` | modified |
| `src/components/insights/InsightItem.vue` | **added** |
| `src/components/insights/SourceEnvelopeCard.vue` | moved |
| `src/main.ts` | modified |
| `src/router/index.ts` | **re-added** |
| `src/router/insightsRouter.ts` | modified |
| `src/views/ForgotPasswordPage.vue` | **added** |
| `src/views/InsightsPage.vue` | **deleted** |
| `src/views/LoginPage.vue` | modified |
| `src/views/ResetPasswordPage.vue` | **added** |
| `src/views/insights/InsightDetailPage.vue` | moved + rewritten |
| `src/views/insights/InsightsPage.vue` | **added** |

### Statistics

- 17 files changed
- **+1,162 insertions** / **-367 deletions** (net +795)
- 8 commits

### Highlights

- **Password reset flow**: New `ForgotPasswordPage.vue` and `ResetPasswordPage.vue` with `authApi.forgotPassword()` (`POST /auth/forgot-password`), `authApi.resetPassword()` (`POST /auth/reset-password`), and `authApi.getPendingReset(email)` (`GET /auth/pending-reset?email=`) polling endpoint.
- **App.vue**: Added `forgot-password` and `reset-password` hash routes with auth guard logic — unauthenticated users can now access these routes without redirecting to login.
- **LoginPage.vue**: Added "Forgot password?" link, per-field inline validation (email, password), SSO sign-in button, cancel button on OAuth loading overlay.
- **NavBar.vue**: Redesigned with `mosaid.` branding, Dashboard/Ingestion/Insights/Settings nav links with accent highlight, Profile button.
- **Insights API (`insights-api.ts`)**: New `InsightActionStatus` type (9 statuses), `VALID_ACTIONS` per-type map, `STATUS_LABELS`/`STATUS_COLORS` display constants, `setAction(id, action)` method (`PATCH /insights/:id?action=`), `list()` gains optional `?status=` and `?limit=` params, `getSourceEnvelopes()` changed to `(insightId, versionId)`.
- **Insights list view** (`src/views/insights/InsightsPage.vue`): Tabbed UI with Overview (shows 5 recent) and per-type tabs with status sub-tabs, loading skeleton, empty state with icon, error with retry, optimistic status updates with rollback.
- **Insight detail view** (`src/views/insights/InsightDetailPage.vue`): Status change via dropdown (per-type valid actions), metadata badges (date, source, broadcast, version), source envelope toggle, expandable version history with lazy loading.
- **InsightItem.vue**: Old `src/components/InsightItem.vue` deleted, new version at `src/components/insights/InsightItem.vue` with inline status change select, type rail coloring, chevron icon, active/selected state.
- **SourceEnvelopeCard.vue**: Moved from `src/components/` to `src/components/insights/` (unchanged interface).
- **client.ts**: Simplified `request()` — removed `ApiResponse` envelope handling, 401 redirects to `#login` instead of `#/login`, adds `Authorization` header from `sessionStorage`.
- **router/index.ts**: Re-added as hash-based vue-router for insights routes (was previously deleted). `insightsRouter.ts` gains redirect `/` → `/insights`.
- **main.ts**: Removed unused import of deleted `router/index.ts`.

---

## 2026-07-22 — Commit `9fbac27`

Baseline: `5bd6a59` → HEAD `9fbac27`

### Commits (10)

```
9fbac27 update error handling
6dd8435 store chat id and chat name
193887e add login endpoint
b5d630d Merge branch 'HA_905_backfille_ui' into HA_905
a4a91ea Merge branch 'main' of ssh.dev.azure.com:v3/pipenile/Mosaid/pn-console-app into HA_905
db576b0 add wizard indicator
865813d clean and restructure the code base
72be5e2 update api contract to match server's one
593c0ce Merged PR 546: #905 feat: Telegram auth error handling, loading consolidation, API response wrapping
```

### Changed Files (9)

| File | Status |
|------|--------|
| `src/api/plugin-manager.ts` | modified |
| `src/components/AlertBanner.vue` | **added** |
| `src/components/ingestion/PluginStatus.vue` | **added** |
| `src/components/settings/telegram/ChatConfigForm.vue` | modified |
| `src/main.ts` | modified |
| `src/router/index.ts` | **deleted** |
| `src/utils/plugin.ts` | **added** |
| `src/views/IngestionPage.vue` | modified |
| `src/views/settings/TelegramIntegration.vue` | modified |

### Statistics

- 9 files changed
- **+186 insertions** / **-124 deletions** (net +62)
- 10 commits

### Highlights

- **`PluginManagerClient.login()`**: New method authenticates to a plugin (`POST /plugins/:name/login`) returning `{ platformUserId, platformUsername }`.
- **`PluginManagerClient.getState()`**: New method fetches plugin state (`GET /plugins/:name`). `PluginInfo` gains `hasSession?: boolean` field.
- **`PluginManagerClient.backfill()`**: Changed from single `(plugin, limit)` to batch `(items: { plugin, limit }[])`.
- **`AlertBanner.vue`** (new): Reusable dismissible alert component replacing inline alert HTML in IngestionPage. Props: `type`, `message`; emits `dismiss`.
- **`PluginStatus.vue`** (new): Reusable backfill status component replacing inline status HTML. Shows loading, result with envelope count and sync time, or error with retry button.
- **`ChatConfigForm.vue`**: Exported `ChatEntry` interface (`{ name, id }`). `chats` prop and `save` event changed from `string[]` to `ChatEntry[]`. Inline `alert()` replaced with reactive error display. Chat items show `name` with `id` in tooltip.
- **`src/utils/plugin.ts`** (new): Shared utilities extracted from views — `userError(raw, fallback)` for error string mapping (adds `PASSWORD_HASH_INVALID` and entity lookup errors), `timeAgo(ts)` for relative timestamps.
- **`src/router/index.ts`** deleted: Hash-based vue-router for insights removed. Only `insightsRouter.ts` (in-memory) remains.
- **`TelegramIntegration.vue`**: Step wizard indicator UI with numbered circles and labels. Uses reactive `hasSession` ref instead of computed `isConnected()` function. Saves session via `client.login()` instead of `client.createConfig()`. Chats stored as `{ name, id }` objects. Added `PASSWORD_HASH_INVALID` to error map. Normalizes legacy string chat arrays on load.
- **`IngestionPage.vue`**: Uses `AlertBanner` and `PluginStatus` components. Inline `userError()` and `timeAgo()` replaced with imports from `src/utils/plugin.ts`. Backfill call updated to array format.
- **`main.ts`**: Removed unused import of deleted `router/index.ts`.

---

## 2026-07-21 — Commit `5bd6a59`

Baseline: `562dc87` → HEAD `5bd6a59`

### Commits (1)

```
5bd6a59 add backfill ui, resolve chat id, improve the ux for ingestion and login wizerd
```

### Changed Files (10)

| File | Status |
|------|--------|
| `src/App.vue` | modified |
| `src/api/plugin-manager.ts` | modified |
| `src/components/NavBar.vue` | modified |
| `src/components/PluginCard.vue` | **added** |
| `src/components/settings/telegram/ChatConfigForm.vue` | modified |
| `src/components/settings/telegram/VerificationCodeForm.vue` | modified |
| `src/composables/useTelegramAuth.ts` | modified |
| `src/demo/DemoPage.vue` | **deleted** |
| `src/views/IngestionPage.vue` | **added** |
| `src/views/settings/TelegramIntegration.vue` | modified |

### Statistics

- 10 files changed
- **+461 insertions** / **-99 deletions** (net +362)
- 1 commit

### Highlights

- **IngestionPage replaces DemoPage**: Full ingestion UI with `PluginCard` components, multi-plugin selection, per-plugin message limits, sequential bulk backfill, per-plugin retry, and user-friendly error messages.
- **PluginCard.vue**: Reusable component showing plugin connection status, phone info, selection state, and limit controls. Used in both IngestionPage and TelegramIntegration.
- **Chat entity resolution**: `ChatConfigForm` now resolves chat usernames/IDs via GramJS `getEntity()` and displays the resolved title. `useTelegramAuth` exposes `resolveChatEntity()`.
- **TelegramIntegration UX improvements**: Back-to-phone navigation on code/password steps, disconnect confirmation dialog, `?connect=true` auto-connect URL param, `connectedSince` timestamp display, code field reset on error.
- **PluginManagerClient caching**: `list()` method now caches results in memory for 10 seconds.
- **PluginInfo shape**: `state: string` replaced with `connected?: boolean` and `hasConfig?: boolean`.

---

## 2026-07-18 — Commit `562dc87`

Baseline: `ff220d5` → HEAD `562dc87`

### Commits (11)

```
562dc87 Merge: resolved conflicts, kept HA_905 branch changes
7647d31 add error handling and save plugin config in localStorage
c4d20d9 Merged PR 540: #905 feat: implement Telegram auth in frontend with GramJS browser bundle
c0faa00 fix merge prob
0051710 update .gitignore
df705e0 add settings integration card
6880f6f Merge branch 'HA_905_tg_auth' into HA_905
7f71972 add ui for telegram integration
c12e7fc add telegram auth composable
36dac5c Merged PR 537: #906 feat: add insights UI with list, detail, version history, and source envelopes
d92be99 add gramjs build bundle
88090e1 Merged PR 535: Add logout functionality with a Settings page, confirmation dialog
```

### Changed Files (37)

| File | Status |
|------|--------|
| `.gitignore` | modified |
| `package.json` | modified |
| `pnpm-workspace.yaml` | modified |
| `scripts/build-telegram.mjs` | **added** |
| `src-tauri/tauri.conf.json` | modified |
| `src/App.vue` | modified |
| `src/api/auth.ts` | modified |
| `src/api/client.ts` | modified |
| `src/api/frontend-plugin-manager.ts` | **deleted** |
| `src/api/insights-api.ts` | **added** |
| `src/api/plugin-manager.ts` | **added** |
| `src/components/ConfirmDialog.vue` | **added** |
| `src/components/InsightItem.vue` | **added** |
| `src/components/NavBar.vue` | modified |
| `src/components/SourceEnvelopeCard.vue` | **added** |
| `src/components/settings/IntegrationsCard.vue` | **added** |
| `src/components/settings/telegram/ApiCredentialsForm.vue` | **added** |
| `src/components/settings/telegram/ChatConfigForm.vue` | **added** |
| `src/components/settings/telegram/PasswordForm.vue` | **added** |
| `src/components/settings/telegram/StatusCard.vue` | **added** |
| `src/components/settings/telegram/VerificationCodeForm.vue` | **added** |
| `src/composables/useTelegramAuth.ts` | **added** |
| `src/demo/DemoPage.vue` | modified |
| `src/demo/InsightsRouterOutlet.vue` | **added** |
| `src/main.ts` | modified |
| `src/router/index.ts` | **added** |
| `src/router/insightsRouter.ts` | **added** |
| `src/stubs/child_process.ts` | **added** |
| `src/stubs/constants.ts` | **added** |
| `src/stubs/fs.ts` | **added** |
| `src/stubs/net.ts` | **added** |
| `src/stubs/tls.ts` | **added** |
| `src/views/InsightDetailPage.vue` | **added** |
| `src/views/InsightsPage.vue` | **added** |
| `src/views/SettingsPage.vue` | **added** |
| `src/views/settings/TelegramIntegration.vue` | **added** |
| `vite.config.ts` | modified |

### Statistics

- 37 files changed
- **+2,167 insertions** / **-355 deletions** (net +1,812)
- 11 commits / merged PRs

### Highlights

- **GramJS browser bundle**: `scripts/build-telegram.mjs` bundles GramJS via esbuild into `public/telegram-bundle.js`. Loaded as a `<script>` tag in `main.ts`. Includes Node.js stubs (`src/stubs/`) for browser compatibility.
- **Plugin Manager rewrite**: `frontend-plugin-manager.ts` deleted, replaced by `plugin-manager.ts` with `ApiResponse<T>` envelope wrapping, config CRUD (`createConfig`, `getConfig`, `updateConfig`), and improved error handling.
- **Insights UI** (`src/views/InsightsPage.vue`, `InsightDetailPage.vue`): Type-filtered insight list with tabs, detail view with version history and source envelope references. Powered by `insights-api.ts` and `vue-router`.
- **Settings page** (`src/views/SettingsPage.vue`): Logout flow with `ConfirmDialog.vue` (native `<dialog>` modal), integrations card.
- **Telegram integration wizard** (`src/views/settings/TelegramIntegration.vue`): Multi-step connect flow with API credentials, OTP code, 2FA password, and chat configuration. Uses `useTelegramAuth.ts` composable.
- **`useTelegramAuth` composable**: Reactive GramJS auth state machine (`idle → sending-code → awaiting-code → awaiting-password → connected`).
- **API client updates**: Added `patch()` method, fixed 401 handling to only redirect when a token existed.
- **Auth API**: Added `logout()` endpoint and `LogoutResponse` interface.
- **Infrastructure**: Added `vite-plugin-node-polyfills`, esbuild, and polyfill devDependencies. Updated vite config for node polyfills.
