# Features

---

## Authentication (`src/views/LoginPage.vue`, `src/views/SignupPage.vue`, `src/views/ForgotPasswordPage.vue`, `src/views/ResetPasswordPage.vue`, `src/api/auth.ts`)

- **Email/password login** with per-field inline validation
  - First name (3–20 chars), last name (3–20 chars), email (regex), password (≥8 chars)
  - Validates on input blur (`@input`) and on form submit
- **OAuth sign-in** via Google, Microsoft, or company SSO
  - Opens popup window (browser) or Tauri `WebviewWindow` (desktop)
  - Token extracted from URL hash, stored in `sessionStorage("access_token")`
  - Cancel button overlays the loading state
- **Signup flow** with success state and auto-redirect to dashboard after 1.5s
- **Logout** via Settings page with confirmation dialog — calls `POST /auth/logout` then clears client-side token
- **Session persistence** via JWT in `sessionStorage` with expiry check
- **Password reset** flow:
  - `ForgotPasswordPage.vue`: Enter email → calls `POST /auth/forgot-password` → polls `GET /auth/pending-reset?email=` every 2s for a reset token → auto-navigates to `#reset-password?token=...`
  - `ResetPasswordPage.vue`: Reads token from URL hash → new password (≥8 chars) + confirm → calls `POST /auth/reset-password` → stores returned `access_token` → auto-redirects to dashboard after 2s
  - Handles invalid/missing token state

---

## Navigation & Routing (`src/router/index.ts`, `src/App.vue`, `src/components/SideNavBar.vue`, `src/views/HomePage.vue`)

- **Consolidated vue-router** (PR 599): A single `vue-router` instance with `createWebHashHistory()` handles **all** routes. Replaces both the manual hash router in `App.vue` and the in-memory `insightsRouter.ts` (deleted).
  - Routes: `/login`, `/signup`, `/forgot-password`, `/reset-password` (auth-optional), `/home` (Dashboard), `/insights`, `/insights/:id`, `/chat`, `/settings`, `/settings-telegram` (→ IntegrationsPage)
  - Nested layout: `/` → `HomeLayout` (PageHeader + SideNavBar + `<router-view>`) with child routes
  - Auth guard in `router.beforeEach`: JWT expiry check on every navigation, whitelist for auth-optional pages
  - 401 redirect in `client.ts` changed from `#login` to `#/login` for vue-router hash consistency
- **SideNavBar**: Collapsible sidebar with vue-router navigation — Home, Insights, Chat, Settings
  - Uses `useRoute()`/`useRouter()` for active state and navigation
  - Collapse state persisted in `localStorage('sidebar-collapsed')`
  - Active page highlighted with accent color (`#FF8C4B`)
  - Tooltip on hover when collapsed
  - Profile button at the bottom
- **HomePage**: Auth shell with `PageHeader` + `SideNavBar` + `<router-view>` content area
  - Simplified — no more manual `currentView` computed, relies entirely on vue-router children
- **App.vue**: Simplified to just `<router-view />` + OAuth token handling (extraction from hash and Tauri/browser event listeners). No more manual `onHashChange`, no `isAuthenticated()` — all routing logic moved to `router/index.ts`.

---

## Suggestions Page (`src/views/SuggestionsPage.vue`, `src/api/suggestions-api.ts`)

**New** (PR 609): AI action suggestions page for insights, with context summary and option selection.

- **Two-column layout**: Left column shows a **Context Summary** (bullets from suggestion metadata or fallback descriptions), right column shows **Choose an Action** with selectable option cards.
- **Option cards** display: option label ("Option A/B/C/D" or custom from `metadata.optionLabel`), action type badge (color-coded: Indigo for Reassign, Rose for Escalate, Amber for Delegate, Emerald for Recommendation, Purple for Risk Mitigation, Blue for Next Step, Stone for Dismiss), title (from `metadata.optionTitle` or `title`), optional risk indicator (`metadata.risk`), and confirmed status checkmark.
- **Top header**: Insight title (or first suggestion title fallback), source plugin team label, decision deadline via `formatDeadline()`, "Regenerate" button (calls `POST /suggestions/generate/:insightId`) with spinner state.
- **Bottom sticky footer**: Shows selected option label, "Confirm choice" button (calls `PATCH /suggestions/:id/status` with `ACCEPTED`, then redirects to `/home` with success message).
- **Two entry modes**:
  - `/insights/:id/suggestions` — passes `insightId`, fetches insight detail + suggestions for that insight
  - `/suggestions/:insightId?` — optional param, fetches user-wide suggestions if no insightId
- **Dashboard shortcut**: Top Priority card on Dashboard has a "View AI Suggestions" button linking to `/insights/:id/suggestions`.
- **Loading state**: Spinner with "Generating Context Summary & Action Options..." and "Analyzing Knowledge Graph & message dependencies" text.
- **Empty state**: "No Action Suggestions Available" with lightning icon.
- **Error handling**: `AlertBanner` for errors and success messages.
- **Action type mapping**: `actionTypeBadges` constant provides label, background, and text color per `SuggestionActionType`.
- **Context summary fallback**: If no `metadata.contextSummary` is present, falls back to `title: description` pairs from the suggestions list.

## Chat UI (`src/views/ChatPage.vue`, `src/composables/useChat.ts`, `src/components/ConversationSidebar.vue`)

- **Full-page chat interface** with edge-to-edge layout (`calc(100vh - 72px)`)
- **Multiple conversations** (PR 612): history sidebar with per-conversation state — list, create, switch, delete
  - `ConversationSidebar.vue` groups conversations by `updatedAt` into date buckets (Today / Yesterday / Previous 7 Days / Last Month / Older) with relative timestamps and message counts
  - New Chat reuses an existing empty conversation or creates one via `POST /chat/conversations`
  - Deletion confirmed via `ConfirmDialog`; auto-switches to the next non-empty conversation
  - Sidebar collapses to a `0px` width; toggle in the header
- **SSE streaming** via `chatApi.sendMessageStream()` with `useChat` composable
  - `metadata` SSE event can redirect the stream to a new `conversationId` (first message in a fresh conversation)
- **Markdown rendering** of assistant responses using `marked` (GFM, breaks) — sanitized via **DOMPurify** (`dompurify` added as dependency)
- **Quick action chips**: "Summarize my day", "What's blocked?", "Am I free Thursday PM?" — disabled during streaming
- **History loading**: Fetches message history on mount via `chatApi.getMessages(conversationId)` with **deduplication** by message `id`
- **Date dividers** between message groups (Today / Yesterday / weekday labels)
- **Auto-scroll**: Scrolls to bottom on new messages when user is near bottom (100px threshold)
- **Floating scroll-to-bottom button**: Appears when scrolled up, disappears at bottom
- **Error bar with retry**: Shows below messages, retry removes temp messages, calls `retractLastMessages()` (best-effort DB cleanup), reloads from server with dedup, then re-sends
- **Stop button**: Replaces the Ask button while streaming, aborts the in-flight stream via `AbortController`
- **Empty state**: Prompt "Ask me anything about your insights and messages."
- **Loading state**: Spinner while fetching history
- **Streaming state**: Animated cursor pulse on the last assistant message
- **Input bar**: Styled input with lightning icon, Enter-to-send, Ask button, disabled during streaming

## Integrations Page (`src/views/IntegrationsPage.vue`)

- **Replaces** the old `TelegramIntegration.vue` and `IngestionPage.vue` — unified plugin management
- **Plugin list**: Reads from `GET /plugins`, enriches each with `getActivationStatus()`
- **PluginIntegrationRow**: Card per plugin with status badge (colored dot), icon, action buttons
- **Activate/Deactivate**: Toggle button per row, deactivate confirmed via `ConfirmDialog`
- **Connect flow**: For Telegram, opens `TelegramAuthModal` — the extracted auth wizard
- **Configuration**: `PluginConfigModal` with chat browser, history limits, disconnect via `ConfirmDialog`
- **Details modal**: `PluginDetailsModal` showing per-chat worker states (backfill progress, stream status)
- **Alert banners**: Success/error feedback above the plugin list
- **Loading state**: Skeleton cards while fetching
- **Empty state**: "No integrations available." when plugin list is empty

## Telegram Auth Modal (`src/components/settings/telegram/TelegramAuthModal.vue`)

- Extracted from the deleted `TelegramIntegration.vue` into a reusable modal
- 3-step wizard: credentials → verification code → 2FA password
- Step indicator with numbered circles and labels, green for completed
- Uses `useTelegramAuth` composable internally
- Error mapping via `userError()` utility
- On success: persists session via `client.login()` and `localStorage`, emits `success` with username

## Plugin Integration Components (`src/components/integrations/`)

- **PluginIntegrationRow.vue**: Card row with status badge, plugin icon, action buttons (Connect/Activate/Deactivate), Details/Configure icons
- **GenericConfigForm.vue** (new): Reusable dynamic form that renders fields from `ConfigFieldSchema[]` — supports `text`, `password`, `number`, `boolean`, `select`, `checkbox-list`/`chats` types. Used by `PluginConfigModal`.
- **PluginConfigModal.vue** (rewritten): Now fetches config schema + current config + activation requirements on open. Uses `GenericConfigForm` with schema filtered to only editable fields (matching activation requirements). Shows requirement met/unmet status indicators.
- **PluginDetailsModal.vue** (rewritten): Now fetches active config and displays non-chat parameters in a key-value grid. Shows per-chat worker state with animated status dots (green pulse for Listening, amber pulse for Running backfill) and backfill message counts.

---

## Plugin Manager (`src/api/plugin-manager.ts`)

- **Plugin lifecycle management**: list plugins (`GET /plugins`), get plugin state (`GET /plugins/:name`), login/logout plugin
- **Configuration CRUD**: create, get, update plugin config via `POST/PATCH /plugins/:name/config`
- **Login**: authenticate to a plugin (`POST /plugins/:name/login`), returns `{ platformUserId, platformUsername }`
- **Plugin activation**: activate (`POST /plugins/:name/activate`), deactivate (`POST /plugins/:name/deactivate`), get activation status (`GET /plugins/:name/status`)
- **Chat management**: update monitored chats (`PATCH /plugins/:name/chats`)
- **Dynamic config forms**: fetch config field schema (`GET /plugins/:name/config-schema`), check activation requirements (`GET /plugins/:name/activation-requirements`)
- **Backfill**: removed (handled server-side after activation)
- **New types**: `PluginStatus` (lifecycle state union), `WorkerState` (per-chat backfill/stream state), `PluginActivationStatus` (full status with per-chat workers), `ConfigFieldSchema`, `ActivationRequirementResult`
- All responses wrapped in `ApiResponse<T>` envelope with success/error handling
- `list()` has 10-second in-memory cache

---

## Plugin Utilities (`src/utils/plugin.ts`)

- **`userError(raw, fallback)`**: Maps raw API/Telegram error strings to user-friendly messages. Covers auth errors (`SESSION_PASSWORD_NEEDED`, `PHONE_CODE_INVALID`, `PASSWORD_HASH_INVALID`, etc.), flood waits, and chat resolution errors.
- **`timeAgo(ts)`**: Returns relative time string (`"just now"`, `"5m ago"`, `"2h ago"`, `"3d ago"`).

---

## Insights UI (`src/views/insights/InsightsPage.vue`, `src/views/insights/InsightDetailPage.vue`, `src/components/insights/`, `src/router/`)

- **Insights list** (`#insights`): type-filtered tabbed view (Overview, Tasks, Urgent, Info, Decisions)
  - Fetches from `GET /insights` with optional `?type=`, `?status=`, `?limit=` filters
  - Sub-tabs for status filtering per type (based on `VALID_ACTIONS` per `InsightType`)
  - Insight cards with type badge, content preview (140 char truncation), inline status change select
  - Loading skeleton, error with retry, and empty states
  - Optimistic status update with rollback on API failure
- **Insight detail** (`#insights/:id`): full detail with type badge, content, metadata
  - Status change via dropdown with per-type valid actions (`VALID_ACTIONS`)
  - Metadata badges: date, source plugin, broadcast status, version number
  - Source envelope references: toggle to show/hide, loaded from `GET /insights/:id/versions/:versionId/envelope-refs`
  - Expandable source envelope cards showing plugin source, timestamp, content
  - Version history panel with expandable version details and lazy loading
- **Components**: `InsightItem.vue` (card with status select), `SourceEnvelopeCard.vue` (envelope reference card) — moved to `src/components/insights/`
- **Vue Router integration**: dedicated in-memory vue-router (`insightsRouter.ts`) with redirect `/` → `/insights`

---

## Insight Extraction Demo (`src/demo/InsightsDemoPage.vue`)

- **`#insightsDemo`** page for testing the `InsightExtractorService`:
  - Editable sample messages (direct/email types)
  - "Generate Insights" — sends messages to `POST /demo/insights/generate`
  - "Persist Insights" — saves generated insights via `POST /demo/insights/persist`
  - "Load All Insights" — fetches all persisted insights from `GET /demo/insights`
  - Displays insights with type badges, owners, and broadcast status

---

## Settings (`src/views/SettingsPage.vue`)

- **Account section**: Logout with confirmation dialog (`ConfirmDialog.vue`)
- **Integrations card** (`src/components/settings/IntegrationsCard.vue`): links to `#integrations` (the unified IntegrationsPage)

---

## Telegram Auth Composable (`src/composables/useTelegramAuth.ts`)

- Reactive auth state machine: `idle → sending-code → awaiting-code → awaiting-password → connected`
- Uses `TelegramLib` global (GramJS IIFE bundle loaded from `public/telegram-bundle.js`)
- Handles `SESSION_PASSWORD_NEEDED` error for 2FA detection
- `reset()` method cleans up client and state
- `resolveChatEntity(identifier)` resolves usernames/IDs to `{ title, id }`

---

## GramJS Browser Bundle (`scripts/build-telegram.mjs`)

- Bundles `telegram`, `telegram/sessions`, `telegram/Password` into IIFE at `public/telegram-bundle.js`
- Injects `Buffer` and `process` globals before GramJS loads
- Uses esbuild with Node.js polyfills (via `vite-plugin-node-polyfills` and stubs)
- Node.js stubs in `src/stubs/`: `fs`, `net`, `tls`, `child_process`, `constants`
- Auto-built on `pnpm dev` and `pnpm build`

---

## Dashboard (`src/views/DashboardPage.vue`)

- **Redesigned** (PR 599): Full live dashboard with time-based greeting, priority insight, and workspace overview
- **Greeting**: Time-aware greeting (`"Good morning"`/`"Good afternoon"`/`"Good evening"`) with user name extracted from JWT email prefix
- **Today's Focus**: Section header with prompt "What is the most important thing to move today?"
- **Top Priority Card**: Highest-priority pending insight, displayed with:
  - Priority score badge (color-coded via `getPriorityColor()`: red ≥7, amber ≥4, green <4)
  - Insight type badge
  - Status badge with `STATUS_LABELS`
  - Deadline indicator via `formatDeadline()` (overdue, due today/tomorrow, due in X days)
  - "View AI Suggestions" button → navigates to `/insights/:id/suggestions` (or `/suggestions` fallback)
  - Click on card body navigates to insight detail page
  - Empty state when no pending insights exist
- **Insight Type Counts**: Clickable cards showing per-type counts (Task, Urgency, Info, Decision) with colored icons and borders — clicking navigates to `/insights?type=X`
- **Success message banner**: Reads `?msg=` from the route query on mount and shows an `AlertBanner` (used by SuggestionsPage after confirming a choice); dismiss clears the query via `router.replace`
- **Polling**: 5-second interval fetching up to 50 insights (jobs polling removed with the Jobs feature)
- **Loading state**: Spinner while data loads

> **Jobs feature removed** (PR 612): `src/api/jobs.ts`, `src/views/JobsPage.vue`, and `src/components/home/JobCard.vue` / `RecentJobs.vue` / `SummaryCards.vue` were deleted. The `/jobs` route, the SideNavBar Jobs item, and job status count cards on the Dashboard were removed.

---

**Note:** `IngestionPage.vue` was deleted in this release. Its functionality was absorbed into the new unified **IntegrationsPage** (see above).

---

## Chat API (`src/api/chat-api.ts`)

- **Typed chat messages**: `ChatMessage` interface with `id`, `role` (USER/ASSISTANT), `content`, `createdAt`
- **Conversations** (PR 612): `Conversation` interface (`id`, `title`, `messageCount`, `lastMessage`, timestamps)
  - `getConversations(page?, limit?)` → `GET /chat/conversations`
  - `createConversation()` → `POST /chat/conversations`
  - `deleteConversation(id)` → `DELETE /chat/conversations/:id`
- **Get messages**: `chatApi.getMessages(conversationId?, page?, limit?)` → `GET /chat/messages` with optional `?conversationId=`, `?page=`, `?limit=` params
- **Retract last messages**: `chatApi.retractLastMessages(conversationId?)` → `DELETE /chat/messages/retract-last` — best-effort cleanup of failed messages from the DB
- **SSE streaming**: `chatApi.sendMessageStream(message, conversationId, callbacks, signal?)` → `POST /chat/messages` with `StreamCallbacks` (onMetadata, onToken, onDone, onError). Accepts optional `AbortSignal` for cancellation.
- **SSE parser**: reads `data: { type, content, message, conversationId }` lines, handles `metadata`/`token`/`done`/`error` types; **skips malformed JSON lines gracefully** (no error callback for parse failures); ensures `onDone` is called even if stream closes without a `done` event
- **Abort safety**: `AbortError` is caught silently — `onError` is **not** called for aborted streams
- **Empty-body safety**: `client.ts` parses response text manually, returning `undefined` for empty bodies (fixes chat errors when the server returns no JSON)
- **Fully tested**: `chat-api.test.ts` covers token delivery, done signal, network error, 401 session expiry, malformed JSON skipped, server-side error, abort signal handling

---

## Suggestions API (`src/api/suggestions-api.ts`)

**New** (PR 609): Typed API for AI-generated action suggestions on insights.

- **Types**: `SuggestionActionType` (7 values: RECOMMENDATION, RISK_MITIGATION, NEXT_STEP, REASSIGN, ESCALATE, DELEGATE, DISMISS), `SuggestionStatus` (4 values: PENDING, ACCEPTED, DISMISSED, COMPLETED)
- **Interface**: `InsightSuggestion` with full detail including optional nested `insight` with version array
- **Methods**:
  - `getUserSuggestions(status?)` → `GET /suggestions` — all suggestions for the current user, optional status filter
  - `getInsightSuggestions(insightId)` → `GET /suggestions/insight/:insightId` — suggestions scoped to a specific insight
  - `generateForInsight(insightId)` → `POST /suggestions/generate/:insightId` — trigger AI generation
  - `updateStatus(id, status)` → `PATCH /suggestions/:id/status` — confirm/dismiss/completed a suggestion

---

## Alert Banner (`src/components/AlertBanner.vue`)

- Reusable dismissible alert component
- Props: `type: 'success' | 'error'`, `message: string`
- Emits `dismiss` on close button click
- Styled with green/red backgrounds and border

---

## Tauri Integration (`src-tauri/src/lib.rs`)

- **`open_oauth_window`** Tauri command: opens a centered 600×700 WebviewWindow for OAuth
- Intercepts navigation to capture `access_token` from redirect URL
- Emits `oauth-result` event to the main window on success
- Emits `oauth-cancelled` event when the window is closed without completing
- Permissions: core window management, event emit/listen, webview creation

---

## Auth Guard (`src/App.vue`)

- Restored auth guard logic — `App.vue` now checks JWT token expiry on every hash change
- Unauthenticated users redirected to `#login` for all pages except `login`, `signup`, `forgot-password`, `reset-password`
- JWT expiry checked by decoding the token's payload (base64) and comparing `exp * 1000` against `Date.now()`
- Previously guarded only certain pages; now guards all pages uniformly
