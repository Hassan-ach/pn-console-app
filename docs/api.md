# API Reference — pn-console-app

Frontend API modules that communicate with `pn-console-api` over HTTP (`http://localhost:3000/api`).

---

## `src/api/client.ts` — HTTP Client

Generic fetch-based HTTP client with auto-auth from `sessionStorage`.

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `api` | object | Singleton with `.get<T>()`, `.post<T>()`, `.patch<T>()`, `.del<T>()`, `.stream()` methods. Attaches `Authorization: Bearer <token>` from `sessionStorage("access_token")`. On 401 with an existing token, clears token and redirects to `#/login`. `.stream()` accepts an optional `AbortSignal` as the third parameter, passed directly to `fetch()`. Empty response bodies resolve to `undefined` (body text is parsed manually instead of calling `res.json()`). |

---

## `src/api/auth.ts` — Auth API

Typed API for signup, login, and logout.

### Interfaces

| Interface | Fields |
|-----------|--------|
| `SignupPayload` | `firstName`, `lastName`, `email`, `password` |
| `SignupResponse` | `access_token`, `is_new_user`, `user: { id, firstName, lastName, email, providerType }` |
| `LoginPayload` | `email`, `password` |
| `LoginResponse` | `access_token`, `is_new_user`, `user: { id, firstName, lastName, email, providerType }` |
| `LogoutResponse` | `message` |
| `ForgotPasswordPayload` | `email` |
| `ForgotPasswordResponse` | `message` |
| `ResetPasswordPayload` | `token`, `password` |
| `ResetPasswordResponse` | `access_token`, `message` |
| `PendingResetResponse` | `token: string | null` |

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `authApi` | object | `signup(data)` → `POST /auth/signup`<br>`login(data)` → `POST /auth/login`<br>`logout()` → `POST /auth/logout`<br>`forgotPassword(data)` → `POST /auth/forgot-password`<br>`resetPassword(data)` → `POST /auth/reset-password`<br>`getPendingReset(email)` → `GET /auth/pending-reset?email=` |

---

## `src/api/teams-api.ts` — Teams, Roles & Profile API

Typed API integration for teams management, RBAC roles, team memberships, and profile metadata.

### Interfaces

| Interface | Fields |
|-----------|--------|
| `ProfileMetaData` | `id`, `firstName`, `lastName`, `email`, `role: 'USER' | 'ADMIN'`, `teams: Array<{ id, name, roles }>` |
| `Team` | `id`, `name`, `description`, `organizationId`, `createdAt`, `updatedAt`, `_count: { members }` |
| `TeamDetail` | Extends `Team` with `members: TeamMember[]` |
| `Role` | `id`, `name`, `description`, `teamId`, `createdAt`, `updatedAt` |
| `TeamMember` | `id`, `userId`, `teamId`, `user: { id, firstName, lastName, email }`, `roles: Array<{ id, roleId, role }>` |
| `CreateTeamPayload` / `UpdateTeamPayload` | `name`, `description` |
| `CreateRolePayload` / `UpdateRolePayload` | `name`, `teamId`, `description` |
| `AddMemberPayload` / `UpdateMemberPayload` / `JoinMemberPayload` | `userId`, `roleIds` |

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `profileApi` | object | `getMetaData()` → `GET /profile/meta-data` |
| `teamsApi` | object | `list()` → `GET /teams`<br>`get(id)` → `GET /teams/:id`<br>`create(payload)` → `POST /teams`<br>`update(id, payload)` → `PATCH /teams/:id`<br>`remove(id)` → `DELETE /teams/:id` |
| `rolesApi` | object | `list()` → `GET /roles`<br>`get(id)` → `GET /roles/:id`<br>`create(payload)` → `POST /roles`<br>`update(id, payload)` → `PATCH /roles/:id`<br>`remove(id)` → `DELETE /roles/:id` |
| `teamMembersApi` | object | `add(teamId, payload)` → `POST /teams/:teamId/members`<br>`joinOwn(teamId, payload)` → `POST /teams/:teamId/members/me`<br>`update(teamId, userId, payload)` → `PATCH /teams/:teamId/members/:userId`<br>`updateOwn(teamId, payload)` → `PATCH /teams/:teamId/members/me`<br>`leave(teamId)` → `DELETE /teams/:teamId/members/me`<br>`remove(teamId, userId)` → `DELETE /teams/:teamId/members/:userId` |

---

## `src/api/chat-api.ts` — Chat API with SSE Streaming

Typed API for multi-conversation chat (list/create/delete) and SSE (Server-Sent Events) streaming.

### Interfaces & Types

| Export | Kind | Fields |
|--------|------|--------|
| `ChatMessage` | interface | `id: string`, `role: 'USER' | 'ASSISTANT'`, `content: string`, `createdAt: string` |
| `Conversation` | interface | `id`, `title`, `createdAt`, `updatedAt`, `messageCount`, `lastMessage: string \| null`, `lastMessageAt: string \| null` |
| `StreamEvent` | type | Discriminated union: `{ type: 'metadata'; conversationId }` \| `{ type: 'token'; content }` \| `{ type: 'done' }` \| `{ type: 'error'; message }` |
| `StreamCallbacks` | interface | `onMetadata?`, `onToken: (token) => void`, `onDone: () => void`, `onError: (error: Error) => void` |

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `ChatMessage` | interface | Single chat message |
| `Conversation` | interface | Chat conversation summary (title, message count, last message) |
| `StreamEvent` | type | SSE event payloads parsed from `data:` lines |
| `StreamCallbacks` | interface | SSE stream event callbacks |
| `chatApi` | object | `getConversations(page?, limit?)` → `GET /chat/conversations` (returns `Conversation[]`)<br>`createConversation()` → `POST /chat/conversations` (returns `Conversation`)<br>`deleteConversation(id)` → `DELETE /chat/conversations/:id`<br>`getMessages(conversationId?, page?, limit?)` → `GET /chat/messages` (optional `?conversationId=`, `?page=`, `?limit=` params, returns `ChatMessage[]`)<br>`retractLastMessages(conversationId?)` → `DELETE /chat/messages/retract-last`<br>`sendMessageStream(message, conversationId, callbacks, signal?)` → `POST /chat/messages` (SSE; parses `data: { type: metadata|token|done|error, ... }` lines; malformed JSON lines are skipped; ensures `onDone` fires even if the stream closes without a `done` event; accepts optional `AbortSignal` to cancel in-flight streams) |

### Test Coverage (`chat-api.test.ts`)

All `chatApi` methods are tested with Vitest (mocked `api` object). Covers:
- `getMessages()`: returns typed message list
- `sendMessageStream()`: token callbacks, done callback, network error, 401 session expiry, malformed JSON (skipped gracefully), server-side error type, abort signal (no error on `AbortError`)

---

## `src/composables/useChat.ts` — Chat Composable

Reactive chat state management with SSE streaming, history loading, retry, and auto-scroll.

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `useChat` | function | Returns reactive chat state and methods (see below) |

### Return values

| Symbol | Kind | Description |
|--------|------|-------------|
| `messages` | `Ref<ChatMessage[]>` | All messages in the active conversation (deduplicated by `id` on load/retry) |
| `conversations` | `Ref<Conversation[]>` | All chat conversations (fetched via `getConversations(1, 100)`) |
| `activeConversationId` | `Ref<string \| null>` | Currently selected conversation id |
| `activeConversation` | `ComputedRef<Conversation \| null>` | The conversation matching `activeConversationId` |
| `isLoading` | `Ref<boolean>` | True while loading history |
| `isStreaming` | `Ref<boolean>` | True while a stream response is in progress |
| `error` | `Ref<string \| null>` | Last error message |
| `input` | `Ref<string>` | Current input text |
| `isAtBottom` | `Ref<boolean>` | Whether scroll is near the bottom (for auto-scroll) |
| `sidebarOpen` | `Ref<boolean>` | Whether the conversation sidebar is expanded |
| `loadConversations` | function | Fetches conversation list; auto-selects the first or starts a new chat if empty |
| `loadHistory` | function | Fetches message history via `chatApi.getMessages(conversationId)` with dedup |
| `sendMessage` | function | Sends a message via SSE streaming with `AbortController`; appends user + assistant messages; switches to a new `conversationId` if the server emits `metadata` |
| `stopGenerating` | function | Aborts the in-flight stream and clears input |
| `retry` | function | Removes temp messages, calls `chatApi.retractLastMessages()`, reloads from server with dedup, re-sends last user message |
| `switchConversation` | function | Sets `activeConversationId` and loads its history (no-op while streaming) |
| `startNewChat` | function | Reuses an existing empty conversation or creates one via `chatApi.createConversation()` |
| `deleteConversation` | function | Deletes via `chatApi.deleteConversation()` and switches to the next non-empty conversation |
| `toggleSidebar` | function | Toggles `sidebarOpen` |
| `scrollToTop` | function | Scrolls the chat container to the top |
| `scrollToBottom` | function | Scrolls the chat container to the bottom |
| `handleScroll` | function | Updates `isAtBottom` based on scroll position (100px threshold) |

### Internal behavior

- `onUnmounted` lifecycle hook aborts any in-flight `AbortController` to prevent memory leaks
- `retry()` calls `chatApi.retractLastMessages()` (best-effort) to clean failed messages from DB, then reloads from server with dedup before re-sending

---

## `src/views/ChatPage.vue` — Chat Page

Full-page chat UI with SSE streaming, markdown rendering, quick action chips, and auto-scroll.

### Behavior

- Uses `useChat` composable for state management
- **ConversationSidebar** on the left: collapsible history list with date-bucketed grouping, New Chat button, per-conversation delete (ConfirmDialog)
- **Date dividers** between message groups (Today / Yesterday / weekday labels)
- Renders assistant messages with `marked` (GFM, breaks) sanitized via **DOMPurify** (`dompurify` package)
- Quick action chips: "Summarize my day", "What's blocked?", "Am I free Thursday PM?" (disabled while streaming)
- Empty state with lightning icon prompt
- Scroll-to-bottom floating button visible when scrolled up
- **Stop button** replaces the Ask button while streaming (aborts the stream)
- Error bar with retry below the message area
- Rendered outside parent `<main>` padding (`-m-8`) for edge-to-edge layout
- Fixed height: `calc(100vh - 72px)`

---

## `src/components/ConversationSidebar.vue` — Conversation History Sidebar

Collapsible chat-history sidebar used by `ChatPage`.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `conversations` | `Conversation[]` | All conversations to list |
| `activeId` | `string \| null` | Currently active conversation id |
| `open` | `boolean` | Sidebar expanded state |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `select` | `id: string` | User clicked a conversation |
| `newChat` | none | User clicked New Chat |
| `toggle` | none | User clicked the collapse button |
| `delete` | `id: string` | User confirmed deletion via `ConfirmDialog` |

### Behavior

- Groups conversations by `updatedAt` into date buckets: **Today**, **Yesterday**, **Previous 7 Days**, **Last Month**, **Older** (empty buckets hidden)
- Shows title (truncated to 50 chars), relative timestamp (`Just now`/`Xm ago`/`Xh ago`/`Yesterday`/`Xd ago`/short date), and message count
- Delete button revealed on row hover; deletion confirmed through `ConfirmDialog`
- Width animates `0px` ↔ `260px` based on `open`

---

## `src/api/suggestions-api.ts` — Suggestions API

Typed API for AI-generated action suggestions on insights (PR 609).

### Types

| Export | Kind | Values |
|--------|------|--------|
| `SuggestionActionType` | type | `'RECOMMENDATION' \| 'RISK_MITIGATION' \| 'NEXT_STEP' \| 'REASSIGN' \| 'ESCALATE' \| 'DELEGATE' \| 'DISMISS'` |
| `SuggestionStatus` | type | `'PENDING' \| 'ACCEPTED' \| 'DISMISSED' \| 'COMPLETED'` |

### Interfaces

| Export | Fields |
|--------|--------|
| `InsightSuggestion` | `id`, `insightId`, `organizationId`, `title`, `description`, `actionType: SuggestionActionType`, `reasoning: string \| null`, `status: SuggestionStatus`, `metadata: Record<string, any>`, `createdAt`, `updatedAt`, `insight?: { id, versions: { content, type, priority? }[] }` |

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `suggestionsApi` | object | `getUserSuggestions(status?)` → `GET /suggestions` (optional `?status=` filter)<br>`getInsightSuggestions(insightId)` → `GET /suggestions/insight/:insightId`<br>`generateForInsight(insightId)` → `POST /suggestions/generate/:insightId`<br>`updateStatus(id, status)` → `PATCH /suggestions/:id/status` |

## `src/api/plugin-manager.ts` — Plugin Manager Client

Client class for managing backend plugins (Telegram, etc.). Replaces the previous `frontend-plugin-manager.ts`.

### Interfaces

### Interfaces & Types

| Export | Kind | Fields / Values |
|--------|------|----------------|
| `PluginInfo` | interface | `name: string`, `connected?: boolean`, `hasConfig?: boolean`, `hasSession?: boolean` |
| `PluginStatus` | type | `'NOT_CONNECTED' \| 'CONNECTED' \| 'CONFIGURED' \| 'ACTIVATING' \| 'ACTIVE' \| 'DEACTIVATING' \| 'ERROR'` |
| `ActivateResult` | interface | `status: string`, `activatedChats: string[]`, `alreadyActiveChats: string[]` |
| `WorkerState` | interface | `backfill: 'IDLE' \| 'RUNNING' \| 'COMPLETED'`, `stream: 'IDLE' \| 'LISTENING' \| 'STOPPED'`, `startedAt: string`, `backfillProgress?: { inserted: number; ids: string[] }` |
| `PluginActivationStatus` | interface | `status: string`, `activatedAt?: string`, `errorMessage?: string`, `platformUsername?: string`, `platformUserId?: string`, `chats: { chatId: string; worker: WorkerState \| null; cursor: number \| null }[]` |
| `PluginConfig` | interface | `name: string`, `status: PluginStatus`, `chats: { name: string; id: string }[]`, `hasSession: boolean`, `errorMessage?: string` |
| `ConfigFieldSchema` | interface | `key: string`, `label: string`, `type: 'text' \| 'number' \| 'select' \| 'checkbox-list' \| 'boolean' \| 'password'`, `required?: boolean`, `options?: { label: string; value: string }[]`, `placeholder?: string`, `description?: string` |
| `ActivationRequirementResult` | interface | `field: string`, `message: string`, `met: boolean` |

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `PluginInfo` | interface | Plugin metadata |
| `PluginStatus` | type | Plugin lifecycle status union |
| `ActivateResult` | interface | Result of `activate()` call |
| `WorkerState` | interface | Per-chat worker backfill/stream state |
| `PluginActivationStatus` | interface | Full activation status with per-chat workers |
| `PluginConfig` | interface | Plugin config shape |
| `ConfigFieldSchema` | interface | Config form field definition (for dynamic forms) |
| `ActivationRequirementResult` | interface | Pre-activation requirement check result |
| `PluginManagerClient` | class | Full lifecycle for backend plugins. See methods below. |

### `PluginManagerClient` Methods

All methods wrap API responses in `ApiResponse<T>` envelope and call `ensureSuccess()` before returning.

| Method | Returns | Endpoint |
|--------|---------|----------|
| `list()` | `Promise<PluginInfo[]>` | `GET /plugins` (in-memory cache, 10s TTL) |
| `getState(name)` | `Promise<PluginInfo>` | `GET /plugins/:name` |
| `logout(name)` | `Promise<string>` | `POST /plugins/:name/logout` |
| `login(name, config)` | `Promise<{ platformUserId, platformUsername }>` | `POST /plugins/:name/login` |
| `createConfig(name, config)` | `Promise<string>` | `POST /plugins/:name/config` |
| `getConfig(name)` | `Promise<Record<string, unknown>>` | `GET /plugins/:name/config` |
| `updateConfig(name, config)` | `Promise<string>` | `PATCH /plugins/:name/config` |
| `getEnvelopeCount(sourcePlugin?)` | `Promise<{ count: number }>` | `GET /demo/envelopes/count` |
| `activate(name)` | `Promise<ActivateResult>` | `POST /plugins/:name/activate` |
| `deactivate(name)` | `Promise<void>` | `POST /plugins/:name/deactivate` |
| `getActivationStatus(name)` | `Promise<PluginActivationStatus>` | `GET /plugins/:name/status` |
| `updateChats(name, chats)` | `Promise<void>` | `PATCH /plugins/:name/chats` |
| `getConfigSchema(name)` | `Promise<ConfigFieldSchema[]>` | `GET /plugins/:name/config-schema` |
| `getActivationRequirements(name)` | `Promise<ActivationRequirementResult[]>` | `GET /plugins/:name/activation-requirements` |

---

## `src/api/insights-api.ts` — Insights API

Typed API for fetching LLM-extracted insights with version history, priority/deadline scores, and source envelopes.

### Types & Interfaces

| Export | Kind | Description |
|--------|------|-------------|
| `InsightType` | type | `'TASK' \| 'URGENCY' \| 'INFO' \| 'DECISION'` |
| `InsightActionStatus` | type | `'PENDING' \| 'NOTED' \| 'DONE' \| 'BLOCKED' \| 'IN_REVIEW' \| 'DECIDED' \| 'DELEGATED' \| 'DELAYED' \| 'HIDDEN'` |
| `INSIGHT_TYPES` | const | Array of all `InsightType` values |
| `VALID_ACTIONS` | const | Per-type valid status transitions: `Record<InsightType, InsightActionStatus[]>` |
| `STATUS_LABELS` | const | Human-readable labels for each status: `Record<InsightActionStatus, string>` |
| `STATUS_COLORS` | const | Tailwind badge color classes for each status: `Record<InsightActionStatus, string>` |
| `InsightSummary` | interface | `id`, `version`, `type`, `content`, `status: InsightActionStatus`, `priority: number \| null`, `deadline: string \| null` |
| `InsightDetail` | interface | Extends `InsightSummary` with `organizationId`, `envolopsRef`, `broadcasted`, `latestVersionId?`, `createdAt`, `sourcePlugin` |
| `SourceEnvelope` | interface | `envolopId`, `sourcePlugin`, `occurredAt`, `content` |

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `insightsApi` | object | `list(type?, status?, limit?)` → `GET /insights` (optional `?type=`, `?status=`, `?limit=` filters)<br>`get(id)` → `GET /insights/:id`<br>`setAction(id, action)` → `PATCH /insights/:id?action=`<br>`updatePriority(id, priority)` → `PATCH /insights/:id/priority?priority=`<br>`listVersions(id)` → `GET /insights/:id/versions`<br>`getVersion(id, versionId)` → `GET /insights/:id/versions/:versionId`<br>`getSourceEnvelopes(insightId, versionId)` → `GET /insights/:insightId/versions/:versionId/envelope-refs` |
| `getPriorityColor(score)` | function | Returns Tailwind badge color class (`null`→`''`, ≥7→`bg-red-500 text-white`, ≥4→`bg-amber-500 text-white`, else→`bg-emerald-500 text-white`) |
| `getPriorityLabel(score)` | function | Returns label string (`'No priority'`, `'High'`, `'Medium'`, `'Low'`) |
| `formatDeadline(deadline)` | function | Converts ISO deadline to relative string (`'Overdue'`, `'Due today'`, `'Due tomorrow'`, `'Due in X days'`, or `'Mon DD'`) |

---

## `src/composables/useTelegramAuth.ts` — Telegram Auth Composable

GramJS-based Telegram authentication via `TelegramLib` global (loaded from `public/telegram-bundle.js`).

### Interfaces

| Export | Fields |
|--------|--------|
| `AuthState` | `step: 'idle' \| 'sending-code' \| 'awaiting-code' \| 'awaiting-password' \| 'connected' \| 'error'`, `phone: string`, `sessionString?: string`, `error?: string` |
| `UseTelegramAuthReturn` | `state: Ref<AuthState>`, `sendCode()`, `submitCode()`, `submitPassword()`, `reset()`, `resolveChatEntity()` |

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `useTelegramAuth` | function | Returns reactive auth state and methods for Telegram phone login flow |

### Additional Return Values

| Method | Returns | Description |
|--------|---------|-------------|
| `resolveChatEntity(identifier)` | `Promise<{ title: string; id: string } \| null>` | Resolves a chat username/ID to its entity via GramJS `getEntity()`. Creates a temporary client if no active client exists. |

---

## `src/utils/plugin.ts` — Plugin Utilities

Shared utility functions for plugin-related UI.

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `userError(raw, fallback)` | function | Maps raw Telegram API error strings to user-friendly messages. Covers: `SESSION_PASSWORD_NEEDED`, `PHONE_NUMBER_INVALID`, `PHONE_CODE_INVALID`, `PHONE_CODE_EXPIRED`, `AUTH_KEY_DUPLICATED`, `FLOOD_WAIT`, `CHAT_ID_INVALID`, `USERNAME_NOT_OCCUPIED`, `PASSWORD_HASH_INVALID`, entity lookup failures. |
| `timeAgo(ts)` | function | Returns relative time string from a timestamp: `just now`, `Xm ago`, `Xh ago`, `Xd ago`. |

---

## `src/components/AlertBanner.vue` — Alert Banner

Reusable dismissible alert banner for success/error messages.

### Props

| Prop | Type | Default |
|------|------|---------|
| `type` | `'success' \| 'error'` | required |
| `message` | `string` | required |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `dismiss` | none | User clicked the dismiss button or auto-dismiss timer expired |

### Behavior

- **Auto-dismiss**: Success messages auto-dismiss after 3 seconds, error messages after 5 seconds
- **Slide-down animation**: `Transition` with `slide-down-enter-active`/`slide-down-leave-active` CSS classes
- Positioned as `fixed` top-center banner (z-50)

---

## `src/components/ingestion/ChatStatusRows.vue` — Chat Status Rows

Per-chat worker state display with backfill progress bars, stream status dots, and collapse for >5 chats.

### Props

| Prop | Type | Default |
|------|------|---------|
| `chats` | `{ chatId: string; worker: WorkerState \| null }[]` | `[]` |

### Behavior

- Collapses to summary line when > 5 chats visible (`Show all` / `Show less`)
- Backfill progress bar (animated) for RUNNING, checkmark for COMPLETED
- Stream status: green dot for LISTENING, gray for STOPPED/IDLE
- Summary header shows `X chats · Y streaming, Z backfilling`

## `src/components/ingestion/ChatConfigModal.vue` — Config Form Modal

Dynamic config form modal rendered via `<Teleport to="body">`. Fetches field schema from `getConfigSchema()` on mount.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `pluginName` | `string` | Plugin to configure |
| `currentConfig` | `Record<string, unknown>` | Pre-fill values |
| `onSave` | `(config: Record<string, unknown>) => Promise<void>` | Save handler |
| `onCancel` | `() => void` | Cancel handler |

### Behavior

- Renders form fields dynamically from `ConfigFieldSchema[]`: text, number, select, checkbox-list, boolean
- Loading skeleton while schema is fetched
- Field-level error display for chat validation
- Backdrop blur overlay

---

## `src/composables/useTelegramDialogs.ts` — Telegram Dialogs Fetcher

Generic function to fetch Telegram chat dialogs via GramJS `client.getDialogs()`.

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `DialogEntry` | interface | `id: string`, `name: string`, `type: 'user' | 'group' | 'supergroup' | 'channel'` |
| `fetchTelegramDialogs()` | function | Reads Telegram credentials from `localStorage('telegram_config')`, connects GramJS client, fetches all dialogs via `client.getDialogs({})`, and returns `DialogEntry[]`. Destroys client on completion. Throws on missing/incomplete config or connection failure. |

---

## `src/router/index.ts` — Main Application Router (vue-router, hash-based)

Consolidated single vue-router instance that handles **all** application routes. Replaces both the old manual hash router in `App.vue` and the in-memory `insightsRouter.ts` (which was deleted).

### Routes

| Path | Name | Component | Notes |
|------|------|-----------|-------|
| `/login` | `login` | `LoginPage` | Auth-optional |
| `/signup` | `signup` | `SignupPage` | Auth-optional |
| `/forgot-password` | `forgot-password` | `ForgotPasswordPage` | Auth-optional |
| `/reset-password` | `reset-password` | `ResetPasswordPage` | Auth-optional |
| `/` | — | `HomeLayout` (parent) | Children: |
| `/home` | `home` | `DashboardPage` | |
| `/insights` | `insights` | `InsightsPage` | |
| `/insights/:id` | `insight-detail` | `InsightDetailPage` | `props: true` |
| `/chat` | `chat` | `ChatPage` | |
| `/insights/:id/suggestions` | `insight-suggestions` | `SuggestionsPage` | `props: true` — passes `id` as prop |
| `/suggestions/:insightId?` | `suggestions` | `SuggestionsPage` | `props: true` — passes `insightId` as prop (optional param) |
| `/settings` | `settings` | `SettingsPage` | |
| `/settings-telegram` | `settings-telegram` | `IntegrationsPage` | Redirect alias |

### Auth Guard

`router.beforeEach` checks JWT expiry on every navigation:
- `AUTH_WHITELIST` (`/login`, `/signup`, `/forgot-password`, `/reset-password`) — always allowed
- All other paths — redirects to `/login` if token is missing or expired
- JWT payload `exp` field decoded from base64 and compared against `Date.now()`

### Export

| Export | Kind | Description |
|--------|------|-------------|
| `router` (default) | router | Vue Router instance with `createWebHashHistory()`. Handles all app routing, auth guard, and nested layout.

---

## `src/components/integrations/GenericConfigForm.vue` — Generic Config Form

Reusable dynamic form component that renders fields from a `ConfigFieldSchema[]` array. Used by `PluginConfigModal` for plugin configuration editing.

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `ChatItem` | interface | `{ id: string; name: string; historyLimit: number \| null }` |

### Props

| Prop | Type | Default |
|------|------|---------|
| `schema` | `ConfigFieldSchema[]` | required |
| `modelValue` | `Record<string, any>` | required |
| `disabled` | `boolean` | `false` |
| `pluginName` | `string` | `''` |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `Record<string, any>` | Emitted on field change |
| `browse-chats` | none | User clicked "Browse chats" button (only shown when `field.key === 'chats'` and `pluginName === 'telegram'`) |

### Behavior

- Renders form fields based on `type`: `text`, `password`, `number`, `boolean` (checkbox), `select` (dropdown), `checkbox-list`/`chats` (array with remove buttons)
- Password type renders `<input type="password">` (added in PR 596)
- Chats type shows per-item history limit input and Remove button
- Internal `formData` synced via `watch` on `modelValue`
- Browse Chats button shown only for Telegram chat fields

## `src/components/ConfirmDialog.vue` — Confirmation Dialog

Native `<dialog>` element-based confirmation modal.

### Props

| Prop | Type | Default |
|------|------|---------|
| `open` | `boolean` | required |
| `title` | `string` | `'Are you sure?'` |
| `message` | `string` | `''` |
| `confirmLabel` | `string` | `'Confirm'` |
| `cancelLabel` | `string` | `'Cancel'` |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `confirm` | none | User confirmed the action |
| `cancel` | none | User cancelled / closed dialog |

---

## `src/components/integrations/PluginIntegrationRow.vue` — Plugin Integration Row

Card row for a single plugin in the Integrations page. Exports `PluginRowItem` interface.

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `PluginRowItem` | interface | `{ name: string; status: PluginStatus; loading: boolean; activation?: PluginActivationStatus \| null }` |

### Props

| Prop | Type | Default |
|------|------|---------|
| `plugin` | `PluginRowItem` | required |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | `name: string` | User clicked Connect button |
| `toggle` | `name: string` | User clicked Activate/Deactivate button |
| `configure` | `name: string` | User clicked Configure gear |
| `details` | `name: string` | User clicked Details info icon |

### Behavior

- Status badge with colored dot and label per `PluginStatus` value
- Plugin icon mapping (telegram has dedicated icon, others use generic)
- Action buttons adapt to status: Connect (NOT_CONNECTED), Activate/Deactivate (others), spinner (ACTIVATING/DEACTIVATING)
- Details and Configure icon buttons visible when not NOT_CONNECTED

---

## `src/components/integrations/PluginConfigModal.vue` — Plugin Config Modal

Dynamic configuration modal for plugin settings. Rewritten to use `GenericConfigForm` and fetch config schema + activation requirements from the API.

### Exports

| Export | Kind | Description |
|--------|------|-------------|
| `ChatItem` | interface | `{ id: string; name: string; historyLimit: number \| null }` |

### Props

| Prop | Type | Default |
|------|------|---------|
| `open` | `boolean` | required |
| `pluginName` | `string` | required |
| `chats` | `ChatItem[]` | optional |
| `saving` | `boolean` | required |
| `error` | `string` | required |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `close` | none | Close the modal |
| `save` | `Record<string, any>` | Save full config object (not just chats) |
| `disconnect` | none | Disconnect the plugin |
| `clear-error` | none | Clear the error message |

### Behavior

- On open: fetches `getConfigSchema()`, `getConfig()`, and `getActivationRequirements()` in parallel
- Renders form via `GenericConfigForm` with filtered schema (only fields matching activation requirements for editable fields)
- Fallback schema with `chats` field if API returns empty
- Requirement status indicators (green check / amber warning) for each activation requirement
- Loading skeleton while schema is fetched
- Chat browser modal (`ChatBrowserModal`) for Telegram chat selection
- Disconnect with `ConfirmDialog` confirmation
- `save` emits full config data (`Record<string, any>`) instead of just chat list
- Uses `AlertBanner` for error display
- Teleported to `<body>`

## `src/components/integrations/PluginDetailsModal.vue

---

## `src/components/integrations/PluginDetailsModal.vue` — Plugin Details Modal

Modal showing plugin activation details including active configuration parameters and per-chat worker states.

### Props

| Prop | Type | Default |
|------|------|---------|
| `open` | `boolean` | required |
| `pluginName` | `string` | required |
| `status` | `PluginStatus` | required |
| `activation` | `PluginActivationStatus \| null` | required |
| `configChats` | `ChatItem[]` | required |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `close` | none | Close the modal |

### Behavior

- On open: fetches `getConfig()` to display active non-chat parameters (key-value grid)
- Header shows `platformUsername` if available
- Summary overview card showing status and monitored channels count
- **Active Parameters** section: grid of non-chat config values with `formatScalarValue()` rendering
- Per-chat detail rows showing streaming status (Listening with animated green dot, or Stopped), backfill status (Running with amber pulse + msg count, Completed, or Idle)
- History limit display per chat (`N msgs` or `Unlimited`)
- Fallback to config-only display if no activation data
- Empty state when no chats configured
- Teleported to `<body>`

---

## `src/components/settings/telegram/TelegramAuthModal.vue` — Telegram Auth Wizard Modal

Multi-step wizard modal for Telegram authentication (extracted from the deleted `TelegramIntegration.vue`).

### Props

| Prop | Type | Default |
|------|------|---------|
| `open` | `boolean` | required |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `close` | none | Close the modal |
| `success` | `username: string` | Auth completed successfully |

### Behavior

- 3-step wizard with step indicator: Credentials → Code → Password
- Uses `useTelegramAuth` composable internally
- Step 1: `ApiCredentialsForm` — phone, apiId, apiHash
- Step 2: `VerificationCodeForm` — 5-digit OTP with resend
- Step 3: `PasswordForm` — 2FA password (only if needed)
- Back-to-phone navigation on steps 2/3
- On success: calls `client.login('telegram', ...)`, stores config in `localStorage('telegram_config')`, emits `success`
- Error mapping via `userError()` utility
- Resets state on open

---

## `src/components/PageHeader.vue` — Page Header

Sticky top header (`72px` height) with branding (`mosaid.`), user greeting (with today's date), and notification bell icon.

### Props

None. Fetches user profile from `GET /profile/meta-data` on mount. Displays current date formatted as `"Monday, July 29, 2026"`.

### Nav click

- Brand button navigates to `/home` via `router.push('/home')`

## `src/components/SideNavBar.vue` — Side Navigation Bar

Collapsible sidebar with vue-router navigation (Home, Insights, Chat, Settings) and Profile button. Persists collapse state in `localStorage('sidebar-collapsed')`.

### Behavior

- Uses `vue-router` (`useRoute`/`useRouter`) instead of manual hash routing
- Collapse/expand toggle with animated width transition (`68px` ↔ `240px`)
- Active page determined by `route.path` matching (`isActive(path)` helper)
- Active page accent highlighting (`#FF8C4B`)
- All nav items are `<button>` elements calling `router.push(path)`
- Tooltip on hover when collapsed

---

## `src/components/home/RecentInsights.vue` — Recent Insights List

Displays the 5 most recent insights with type badge and status badge.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `insights` | `InsightSummary[]` | Array of insights to display |

### Behavior

- Shows type badge (Task/Urgent/Info/Decision) with color coding
- Shows status badge with `STATUS_LABELS`/`STATUS_COLORS` from `insights-api.ts`
- Empty state with icon and message
- "View all" link to `#insights`

---

## `src/components/settings/telegram/ChatBrowserModal.vue` — Chat Browser Modal

Modal dialog that fetches Telegram dialogs via GramJS and lets the user browse/search and select chats to monitor.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Whether the modal is visible |
| `existing` | `ChatEntry[]` | Already-selected chats (pre-checked on open) |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `close` | none | User closed the modal |
| `select` | `ChatEntry[]` | User confirmed chat selection |

### Behavior

- Fetches dialogs via `fetchTelegramDialogs()` on open
- Search filter with real-time filtering
- Avatar colors deterministically generated from name
- Loading skeleton (6 placeholder items)
- Error state with retry button
- Multi-select with checkmarks
- Footer shows `X selected` counter

---

## `src-tauri/src/lib.rs` — Tauri Commands (Rust)

### Commands

| Command | Returns | Description |
|---------|---------|-------------|
| `open_oauth_window(url: String)` | `void` | Opens a Tauri `WebviewWindow` for OAuth. Intercepts navigation to extract `access_token` from URL. Emits `oauth-result` / `oauth-cancelled` events. |
