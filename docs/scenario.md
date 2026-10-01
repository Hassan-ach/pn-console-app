# User Experience Scenarios — pn-console-app

All scenarios assume the frontend communicates with `pn-console-api` at `http://localhost:3000/api`. The app runs either in a **browser** or as a **Tauri v2 desktop app**.

---

## 1. Authentication & Onboarding

### 1.1 — Email/Password Signup

**Precondition:** User has no account. Not authenticated.

**Happy path:**
1. User opens app → lands on `#login` (or `#signup` if navigated).
2. User clicks "Sign up" link → navigates to `#signup`.
3. User fills: First Name, Last Name, Company Email, Password.
4. Client-side validation fires on blur and on submit:
   - First name: 3–20 chars required.
   - Last name: 3–20 chars required.
   - Email: regex `\S+@\S+\.\S+`.
   - Password: ≥8 chars.
5. User clicks "Create Account" → `POST /auth/signup`.
6. Server creates user and returns `{ access_token, is_new_user: true, user }`.
7. Token stored in `sessionStorage("access_token")`.
8. Success UI shown: green checkmark + "Account created!" + "Redirecting to dashboard…"
9. After 1.5s auto-redirect → `#home`.

**Validation failure:**
- Each invalid field shows inline red error text below the input.
- Submit is prevented; no API call.
- Errors clear on re-input.

**Server error (e.g., duplicate email):**
- Error banner appears below the form.
- Form stays filled; user can edit and retry.

**OAuth during signup:**
- Google / Microsoft / SSO buttons work identically to login (scenario 1.4).
- If successful, user is auto-logged-in and redirected to `#home`.

---

### 1.2 — Email/Password Login

**Precondition:** User has an account. Not authenticated.

**Happy path:**
1. User opens app → `#login` page rendered.
2. User fills email + password.
3. Client-side validation on blur and submit.
4. User clicks "Log In" → `POST /auth/login`.
5. Server validates credentials → returns `{ access_token, user }`.
6. Token stored → navigate to `#home`.

**Validation failure:**
- Missing/bad email or missing password → inline error text.
- Submit blocked.

**Server error (wrong password, account not found):**
- Red error banner: message from API (e.g., "Invalid credentials").
- Form stays filled.

**Edge — Forgot password?**
- Link navigates to `#forgot-password` → `ForgotPasswordPage.vue`.
- User enters email → `POST /auth/forgot-password`.
- Polls `GET /auth/pending-reset?email=` every 2s until reset complete.
- On success → redirected to `#reset-password` with token in URL.
- `ResetPasswordPage.vue` submits new password → on success → redirect to `#login`.

---

### 1.3 — OAuth Login/Signup (Google, Microsoft, SSO)

**Precondition:** User on `#login` or `#signup`. Not authenticated.

**Happy path (browser):**
1. User clicks "Google" (or "Microsoft" or "Sign in via company SSO").
2. Spinning overlay shows:
   - "Connecting…" with spinner.
   - "Cancel" button to abort.
3. A popup window (600×700) opens to `${BASE}/api/auth/google`.
4. User authenticates in the popup.
5. After success, popup redirects to a URL with `access_token=...` in the hash.
6. Popup sends `postMessage({ type: "oauth-success", token })` to the opener.
7. Main window listener receives the message, stores token in `sessionStorage`.
8. Popup closes itself via `window.close()`.
9. Main window navigates to `#home`.
10. Overlay dismissed.

**Happy path (Tauri desktop):**
1. User clicks OAuth button.
2. App detects Tauri runtime (via `@tauri-apps/api/event` import success).
3. Spinning overlay with Cancel button.
4. Native `WebviewWindow` (600×700) opens.
5. Navigation inside the webview is intercepted:
   - If URL matches `access_token=...`, code extracts it and emits `oauth-result` Tauri event to the main window.
   - Main window listener stores token, navigates to `#home`.
   - Webview auto-closes.
6. If user closes webview window before completing → `onCloseRequested` fires → overlay dismissed, no token.

**OAuth cancelled (browser):**
- User closes popup manually.
- Polling interval detects `popup.closed` → overlay dismissed.
- If no token stored → error banner: "Authentication was cancelled. Please try again."

**OAuth error:**
- `WebviewWindow` creation fails (`tauri://error`) → error banner: "Failed to open authentication window."
- Cancel button resets state.

**Popup blocked (browser):**
- `window.open()` returns `null` → fallback: `window.location.href = url` (full-page redirect away from app).
- After OAuth completes, user is redirected back with `access_token=...` in hash.
- `App.vue` extracts token from `window.location.hash` on mount.

---

### 1.4 — Token Expiry & Session Management

**Precondition:** User is authenticated with a stored JWT.

**Token still valid:**
- Every API call attaches `Authorization: Bearer <token>`.
- Server validates expiry. If OK → response proceeds.

**Token expired (401 response):**
1. API client receives HTTP 401.
2. If a token existed in `sessionStorage`:
   - Clears `sessionStorage("access_token")`.
   - Redirects to `#login`.
   - Throws `"Session expired. Please log in again."`.
3. User sees login page. No further app state preserved.

**Token on page load:**
- `App.vue` checks `sessionStorage("access_token")`.
- Decodes JWT payload (`base64 -> JSON.parse`) to check `exp` field.
- If expired → treat as unauthenticated → redirect to `#login`.
- If valid → redirect to `#home`.

---

### 1.5 — Logout

**Precondition:** User is authenticated. On any auth-required page.

**Happy path (from Settings):**
1. User navigates to `#settings`.
2. Sees "Account" section with "Log Out" button.
3. Clicks "Log Out" → confirmation dialog opens:
   - Title: "Log out of Mosaid?"
   - Message: "You'll be signed out of your account and returned to the login screen. Your data will remain safe and intact."
   - Two buttons: "Cancel" (gray outline) and "Log Out" (red).
4. User clicks "Log Out" → `POST /auth/logout` called (fire-and-forget, API failure ignored).
5. `sessionStorage.removeItem("access_token")`.
6. Navigation to `#login`.

**Cancelled logout:**
- User clicks "Cancel" or clicks outside dialog or presses Escape → dialog closes.
- User remains on Settings page, still authenticated.

---

## 2. Navigation & Routing

### 2.1 — Hash-Based Page Routing

**Precondition:** App loaded.

**Scenarios:**
- `#login` → `LoginPage.vue`
- `#signup` → `SignupPage.vue`
- `#home` or no hash → `DashboardPage.vue` (via `HomePage.vue` shell)
- `#dashboard` → `DashboardPage.vue`
- `#chat` → `ChatPage.vue`
- `#jobs` → `JobsPage.vue`
- `#insights` → `InsightsRouterOutlet.vue` (mounts Vue Router sub-app)
- `#insightsDemo` → `InsightsDemoPage.vue`
- `#settings` → `SettingsPage.vue`
- `#integrations` → `IntegrationsPage.vue`
- `#settings-telegram` → **redirected** to `#integrations` via `HomePage.vue` computed view
- `#forgot-password` → `ForgotPasswordPage.vue`
- `#reset-password` → `ResetPasswordPage.vue`
- Any unknown hash → falls through to `DashboardPage.vue` (authenticated).

**URL with query params (e.g., `#insights?type=TASK`):**
- The `?type=TASK` part is stripped by `resolvePage()` in HomePage.
- The Insights sub-app's Vue Router handles further routing.

**Deep-link with access_token (e.g., `#access_token=xxx`):**
- OAuth callback. Token extracted before page resolution.
- User redirected to `#home`.

---

### 2.2 — SideNavBar

**Precondition:** Authenticated user. `HomePage.vue` shell rendered.

**Visible items:**
- Collapse/expand toggle button (left arrow, collapses sidebar to 68px icons-only).
- Nav links (each with SVG icon + label):
  - **Home** (`#home`) — active state orange
  - **Jobs** (`#jobs`)
  - **Insights** (`#insights`)
  - **Chat** (`#chat`)
  - **Settings** (`#settings`) — also highlights when on `#settings-telegram`
- "Profile" button at bottom (currently a UI stub, no profile page exists).

**Collapse behavior:**
- Width: 60 (240px) → 68px. Labels hidden, tooltips shown on hover.
- State persisted in `localStorage("sidebar-collapsed")`.
- Transition animation on width change.

**Not shown:**
- On login/signup/forgot-password/reset-password pages — no `HomePage` shell, no SideNavBar.

---

### 2.3 — Auth Guard

**Precondition:** Any page load or hash change.

**Unauthenticated user:**
- If current hash is `login`, `signup`, `forgot-password`, or `reset-password` → stays.
- Any other hash → auto-redirect to `#login`.

**Authenticated user:**
- If current hash is `login` or `signup` → auto-redirect to `#home`.
- Any other known page → stays.
- Unknown hash → redirect to `#home`.

---

## 3. Dashboard

### 3.1 — Landing Page

**Precondition:** User just logged in, or clicks "Home" in SideNavBar.

**Happy path:**
1. Page renders with:
   - Title: "Dashboard"
   - Subtitle: "Welcome to PN Console."
2. `RecentJobs.vue` section: shows recent job cards from `GET /jobs?limit=5`.
3. `RecentInsights.vue` section: shows recent insights from `GET /insights?limit=5`.

**Empty state:**
- No jobs → "No recent jobs."
- No insights → "No recent insights."

---

## 4. Plugin Management & Integrations

### 4.1 — View Integrations List

**Precondition:** Authenticated user. Navigates to `#integrations` (or redirected from old `#settings-telegram`).

**Happy path:**
1. Breadcrumb: Settings > Integrations (orange).
2. Title: "Integrations".
3. `PluginManagerClient.list()` → `GET /plugins`.
4. Each plugin rendered as a `PluginIntegrationRow`:
   - Plugin name (capitalized), status badge.
   - Status badges: `NOT_CONNECTED` (gray), `CONNECTED` (blue), `CONFIGURED` (teal), `ACTIVATING` (spinner), `ACTIVE` (green), `DEACTIVATING` (spinner), `ERROR` (red).
   - Action buttons per status:
     - `NOT_CONNECTED` → "Connect" button.
     - `CONNECTED` → "Configure" + "Activate" buttons.
     - `CONFIGURED` → "Activate" button.
     - `ACTIVE` → "Deactivate" + "Details" + "Configure" buttons.
     - `ERROR` → "Configure" button (to retry).

**Loading state:**
- Skeleton placeholders (pulsing) for 2 rows while loading.

**Empty state:**
- No plugins → "No integrations available." centered.

**API error:**
- Error banner: "Failed to load integrations."
- List remains empty.

---

### 4.2 — Connect a Plugin

**Precondition:** Plugin status is `NOT_CONNECTED`. User clicks "Connect".

**For Telegram:**
1. `TelegramAuthModal` opens as a modal (not a separate page).
2. Full OTP wizard within the modal (see section 5).
3. On success → modal closes, success banner: "Logged in to Telegram as @{username}".
4. Plugin list refreshes → status changes to `CONNECTED`.

**For other plugins:**
- Future connect flows would be added per plugin type.

---

### 4.3 — Configure a Plugin

**Precondition:** Plugin is `CONNECTED` or `ACTIVE` or `ERROR`. User clicks "Configure".

**Happy path:**
1. `PluginConfigModal` opens:
   - Title: "Configure {name}".
   - Chat browser: list of available chats (name + ID), with checkboxes to select which to monitor.
   - Each selected chat shows a "History limit" input (number, default null = unlimited).
   - "Save" button.
   - "Disconnect" button (red, at bottom).
2. User selects/deselects chats, adjusts limits, clicks "Save".
3. `client.updateConfig(name, { chats })` → `PATCH /plugins/{name}/config`.
4. Success banner: "Configuration saved". Modal closes.
5. Plugin list refreshes → status changes to `CONFIGURED` (if was `CONNECTED`) or stays `ACTIVE`.

**Configure from ACTIVE state:**
- Same modal, but changes apply immediately.
- Status stays `ACTIVE`.

**Disconnect:**
1. User clicks "Disconnect" → `client.logout(name)` → `POST /plugins/{name}/logout`.
2. Success banner: "Disconnected from {name}".
3. Plugin list refreshes → status goes to `NOT_CONNECTED`.

**Error:**
- Red error in modal: API error message.
- "Save" button re-enables; user can retry.

---

### 4.4 — Activate a Plugin

**Precondition:** Plugin is `CONNECTED` or `CONFIGURED`. User clicks "Activate".

**Happy path:**
1. Button shows spinner. `client.activate(name)` → `POST /plugins/{name}/activate`.
2. Backend starts workers (backfill + stream).
3. Plugin list refreshes → status becomes `ACTIVE`.
4. Success banner: "{name} activated".

**Error:**
- Error banner with API error message.

---

### 4.5 — View Plugin Details

**Precondition:** Plugin is `ACTIVE`. User clicks "Details".

**Happy path:**
1. `PluginDetailsModal` opens:
   - Plugin name, status badge.
   - List of monitored chats. Per chat:
     - Chat name + ID.
     - Stream status: "Listening" (green) or "Stopped" (gray).
     - Backfill status: "Running" (spinner), "Completed" (green), or "Idle" (gray).
     - "Cursor" position (number).
     - "Flushes" count (number, total from all workers).
     - `startedAt` timestamp.

**Loading state:**
- Skeleton placeholders.

**Error state:**
- Modal shows error text.

---

### 4.6 — Deactivate a Plugin

**Precondition:** Plugin is `ACTIVE`. User clicks "Deactivate".

**Happy path:**
1. `ConfirmDialog` opens:
   - Title: "Deactivate {name}?"
   - Message: "Deactivating this plugin will pause monitoring and stop ongoing message ingestion. You can reactivate it at any time."
   - "Cancel" and "Deactivate" buttons.
2. User clicks "Deactivate" → `client.deactivate(name)` → `POST /plugins/{name}/deactivate`.
3. Plugin list refreshes → status becomes `CONNECTED`.
4. Success banner: "{name} deactivated".

**Cancelled:**
- Dialog dismissed, no change.

---

## 5. Telegram Authentication Modal

### 5.1 — Opening the Auth Modal

**Precondition:** Plugin row for Telegram shows `NOT_CONNECTED`. User clicks "Connect".

1. `TelegramAuthModal` opens as an overlay (not a separate page).
2. Wizard state machine starts at `idle`.

---

### 5.2 — View Telegram Status

**Precondition:** Auth modal closed, plugin list loaded.

- `PluginManagerClient.getActivationStatus('telegram')` → `GET /plugins/telegram/status`.
- Status rendered as a badge on the `PluginIntegrationRow`:
  - If status is `ACTIVE` → green "Active" badge with platform username.
  - If `CONNECTED` → blue "Connected" badge.
  - If `NOT_CONNECTED` → gray "Not connected" badge.

---

### 5.3 — Full Connect Wizard (OTP, no 2FA)

**Precondition:** Auth modal open, Telegram not connected.

**Step 1 — API Credentials:**
1. `ApiCredentialsForm` renders inside the modal.
2. Fields pre-filled from `localStorage("telegram_config")` if previously saved.
3. User enters:
   - `apiId` (integer, from my.telegram.org/apps).
   - `apiHash` (hex string, from my.telegram.org/apps).
   - Phone number (must start with `+`, ≥8 chars).
4. Client-side validation:
   - apiId: positive integer.
   - apiHash: not empty.
   - Phone: starts with `+`, length ≥8.
5. User clicks "Send Code".

**Step 1 validation errors:**
- Inline red text below the button.
- Submit blocked.

**Step 1 server/network error:**
- Red error banner: `auth.state.value.error` or `err.message`.
- User stays on credentials step.

**Step 1 — async:**
- Button shows "Sending code…" (disabled).
- `useTelegramAuth.sendCode()` is called:
  - Creates `TelegramClient` with GramJS (browser bundle from `window.TelegramLib`).
  - Connects via WebSocket (useWSS: true).
  - Sends code request to Telegram.
  - Stores `phoneCodeHash`.

**Step 2 — Verification Code:**
1. On success → wizard advances to code step.
2. `VerificationCodeForm` renders:
   - "Code sent to <phone>" displayed.
   - 5-digit input (5 individual single-digit boxes).
   - Auto-focus: typing a digit advances to the next box.
   - Auto-submit: when all 5 digits filled, form submits automatically.
   - "Resend in 120s" countdown (starts on render, resets on resend).
3. User enters 5-digit code.

**Step 2 validation:**
- If code is not exactly 5 digits → "Enter the 5-digit code".
- If user presses Backspace on empty box → focus moves to previous box.

**Step 2 — submit:**
- `useTelegramAuth.submitCode()` → calls `Api.auth.SignIn` via GramJS.
- If code is correct and no 2FA → step becomes `connected`.
- Session string saved to state.
- Wizard advances to Step 4 (chat config).

**Step 2 — wrong code:**
- Error banner: "Invalid code" (or API error message).
- Code boxes remain as-is; user can retype.
- No resend consumed — resend countdown unaffected.

**Step 2 — 2FA detected:**
- GramJS throws `SESSION_PASSWORD_NEEDED`.
- Auth state becomes `awaiting-password`.
- Wizard advances to Step 3.

**Step 3 — Two-Factor Authentication (2FA):**
1. `PasswordForm` renders:
   - "Your Telegram account has 2FA enabled. Enter your password to continue."
   - Password input field.
2. User types password, presses Enter or clicks "Submit Password".
3. `useTelegramAuth.submitPassword()`:
   - Calls `Api.account.GetPassword()` to get password info.
   - Computes password check with `computeCheck(passwordInfo, password)`.
   - Calls `Api.auth.CheckPassword()`.
   - On success → connected.
4. Wrong password → error banner, form stays.

**Step 4 — Login to API (post-connect):**
1. On GramJS auth success, the modal calls `client.login('telegram', { sessionString, phoneNumber, apiId, apiHash })`.
2. `POST /plugins/telegram/login` stores the session server-side.
3. Modal emits `@success` event with the platform username.
4. Plugin list refreshes → `IntegrationsPage` shows success banner.
5. Modal closes.

---

### 5.4 — Resend Code

**Precondition:** On code step, countdown expired (120s elapsed since last send).

**Scenario:**
1. "Resend in 0s" → link becomes clickable.
2. User clicks "Resend code".
3. Wizard resets to credentials step (pre-filled from `localStorage`).
4. Countdown restarts (120s).
5. `onCredentialsSubmit` called again with saved values → `sendCode()` called.
6. New code sent → wizard returns to code step.

**During countdown:**
- Button shows "Resend in Ns".
- Disabled, not clickable.

---

### 5.5 — Auth Modal Cancellation

**Precondition:** Auth modal open, wizard in progress.

1. User clicks "×" close button or clicks outside modal or presses Escape.
2. Wizard state resets, GramJS client destroyed.
3. No token saved. Plugin list unchanged.

---

### 5.6 — Session Persistence Across App Restarts

**Precondition:** Previously connected and activated Telegram.

**Scenario:**
1. User closes and reopens the app.
2. Navigates to `#integrations`.
3. `GET /plugins` returns `{ name: "telegram", connected: true }`.
4. `GET /plugins/telegram/status` returns active status with platform username.
5. Plugin row shows "Active" badge.
6. No GramJS reconnection needed — session string is stored server-side.

---

## 6. Chat (SSE Streaming)

### 6.1 — Chat Page

**Precondition:** Authenticated user. Navigates to `#chat`.

**Happy path:**
1. Full-page edge-to-edge layout (no max-width container; overrides `<main>` padding with `-m-8`), height `calc(100vh - 72px)`.
2. Header bar:
   - "Ask" badge (orange icon + text).
   - "History" button (right side) — stub, no history feature yet.
3. Message list area (scrollable, flex-grow):
   - Previous messages rendered as chat bubbles:
     - User messages: right-aligned, dark background.
     - Assistant messages: left-aligned, rendered as markdown via `marked` (GFM + line breaks).
   - Streaming cursor: last assistant message shows blinking cursor while `isStreaming` is true.
4. Input area at bottom (sticky):
   - Text input: placeholder "Ask a question…"
   - Send button (arrow icon), disabled while streaming.
   - Quick action chips above input:
     - "Summarize my day"
     - "What's blocked?"
     - "Am I free Thursday PM?"
     - Each chip sends the prompt via `sendMessage()`.
5. User types a message, clicks Send (or Enter).
   - `sendMessage()` called → adds user message to local state.
   - `chatApi.sendMessageStream()` opens SSE stream via `api.stream()`.
   - Assistant message added with empty content, then populated token-by-token via `onToken` callback.
   - On stream complete (`onDone`) → `isStreaming` set to false, cursor removed.
   - On error (`onError`) → error bar shown with "Retry" button.

**Auto-scroll:**
- Auto-scrolls to bottom on new messages.
- Stops auto-scroll if user scrolls up beyond 100px from bottom.
- "Scroll to bottom" floating button appears (down arrow in a white circle) when user is scrolled up.

**Error state:**
- Red error bar below header: error message.
- "Retry" button → `retry()` re-sends the last failed message.

**Empty state:**
- No messages → centered placeholder: "Ask anything about your workspace…" with subtle icon.

---

### 6.2 — Chat History

**Precondition:** On `#chat`, page mounted.

- `loadHistory()` called on mount → `GET /chat/history` (or similar endpoint).
- Previous messages loaded into `messages` array.
- If history is empty, empty state rendered.

---

## 7. Insights

### 7.1 — View Insights List (Vue Router Sub-App)

**Precondition:** Authenticated user. Navigates to `#insights`.

**Happy path:**
1. InsightsPage renders via `InsightsRouterOutlet` → Vue Router sub-app.
2. Header: "Insights" / "What's moving today".
3. Type filter tabs: All | Tasks | Urgent | Info | Decisions.
4. `GET /insights` (no type filter → returns all).
5. Each insight rendered as an `InsightItem` card:
   - Color rail on left (emerald/orange/indigo/red per type).
   - Type badge (e.g., "TASK" in green).
   - Content preview (truncated at 140 chars with ellipsis).
   - Right chevron arrow.
6. Clicking an insight → Vue Router navigates to `/insights/:id`.

**Tab switching:**
1. User clicks "Tasks" tab → `activeTab` updates.
2. `GET /insights?type=TASK`.
3. List re-renders with only TASK insights.
4. Empty state for a tab with no insights → "Nothing here yet. New task insights will show up as they come in."

**Loading state:**
- Dashed border card with "Loading insights…" centered.

**Error state:**
- Red error message + "Try again" button → re-fetches.

**Empty state (all tabs):**
- "Nothing here yet. New insights will show up as they come in."

---

### 7.2 — Insight Detail View

**Precondition:** User clicks an insight from the list.

**Happy path:**
1. Route changes to `/insights/:id`.
2. `GET /insights/:id`.
3. Detail page renders:
   - "Back to insights" link (chevron left + text).
   - Type badge (e.g., "URGENT" in orange).
   - Full content text (no truncation).
   - Metadata rows:
     - Created: localized datetime.
     - Source: plugin name or "—".
     - Broadcasted: Yes/No.
     - Version: number.
     - References: N sources (clickable toggle).
4. If `detail.envolopsRef.length > 0`:
   - References are fetched in the background: `GET /insights/:id/versions/:latestVersionId/envelope-refs`.
   - Toggle to expand/collapse source card list.

**References expanded:**
1. User clicks "N sources" button.
2. Loads source envelopes (if not already loaded).
3. Each `SourceEnvelopeCard` shows:
   - Source plugin badge (e.g., "telegram").
   - Timestamp.
   - Message content.
4. Loading state for references: "Loading source messages…"
5. Error state: red message + "Try again".
6. Empty refs: "No refs for this insight."

**Version history:**
1. Below the detail card, user clicks "View version history" (right chevron).
2. Expands panel → `GET /insights/:id/versions`.
3. Lists all versions except the current one (current is filtered out).
4. Each version row:
   - Version badge (e.g., "v1").
   - Type badge.
   - Content preview (truncated).
   - Click to expand full detail.
5. Expand a version:
   - `GET /insights/:id/versions/:versionId`.
   - Shows: full content, Created datetime, Source, Broadcasted, References.
6. Loading/error states on each section.

**Edge — `latestVersionId` is undefined:**
- Console log of `detail.value` occurs (`console.log(detail.value)`).
- Source envelopes are NOT loaded.
- "References" toggle still shown based on `envolopsRef.length`.

**Navigation back:**
- "Back to insights" calls `router.back()`.
- If no history, may navigate to root `/` which redirects to `/insights`.

---

### 7.3 — Insight Detail Error & Retry

**Precondition:** User navigated to `/insights/:id`.

**API error:**
- Red error text + "Try again" button → re-fetches the detail.
- Version history and references sections unaffected (still collapsed).

**Error on version load:**
- Red error text in versions panel + "Try again" button.

**Error on version detail load:**
- Red text inside expanded version row.

**Error on source envelope load:**
- Red text inside references section + "Try again" button.

---

## 8. Settings

### 8.1 — Settings Page

**Precondition:** Authenticated user on `#settings`.

**Sections:**
1. **Account** (white card):
   - Title: "Account".
   - Description: "Sign out of your account on this device."
   - "Log Out" button (red outline).
2. **Manage Integrations** (white card, links to `#integrations`):
   - Title: "Manage integrations".
   - Description: "View and manage all your connected services".
   - Right chevron → navigates to `#integrations`.

### 8.2 — Logout with Confirmation

See scenario 1.5 for full flow.

---

## 9. Insight Extraction Demo

### 9.1 — Generate Insights

**Precondition:** Authenticated user on `#insightsDemo`.

**Happy path:**
1. Page shows editable sample messages (pre-filled with 4 messages).
2. User can:
   - Edit message content in textarea.
   - Change type: "Direct" or "Email".
   - Edit author ID.
   - Remove a message (× button, cannot remove last message).
   - Click "+ Add Message" to add a blank row.
3. User clicks "Generate Insights".
4. `POST /demo/insights/generate { organizationId, messages }`.
5. Generated insights displayed below with:
   - Type badge (blue).
   - Content text.
   - Owners list.
   - Broadcasted status.

**Error:**
- Status text: "Error: <message>".
- Previously generated insights (if any) cleared.

---

### 9.2 — Persist Insights

**Precondition:** Insights have been generated (scenario 9.1 completed).

**Happy path:**
1. User clicks "Persist Insights".
2. `POST /demo/insights/persist { organizationId, insights }`.
3. Status: "Persisted N insight(s)".

**Without generating first:**
- Button still clickable, sends empty or stale `insights` array.

---

### 9.3 — Load All Insights

**Precondition:** Authenticated user on `#insightsDemo`.

**Happy path:**
1. User clicks "Load All Insights".
2. `GET /demo/insights`.
3. All persisted insights listed below with badges.
4. Counter: "All Insights (N)".

**Empty:**
- Button clickable, returns empty array → no insights rendered below button.

---

## 10. GramJS Bundle Loading

### 10.1 — Bundle Load on App Startup

**Precondition:** App bootstraps in `main.ts`.

**Happy path:**
1. `<script src="/telegram-bundle.js">` injected into `<head>`.
2. Script loads → `window.TelegramLib` set to IIFE exports.
3. Vue app mounts.

**Bundle load failure:**
- Script `onerror` fires → `Error("Failed to load telegram-bundle.js")`.
- Promise rejection → unhandled. App may still render but Telegram features will fail with "TelegramLib not loaded."

---

## 11. Tauri Desktop-Specific Scenarios

### 11.1 — OAuth via WebviewWindow

As described in 1.3 (Tauri path). The difference from browser:
- `WebviewWindow` created programmatically (not `window.open`).
- Token extraction done via Tauri event system (`emitTo("main", "oauth-result", ...)`).
- Cancel detected via `onCloseRequested` callback.

### 11.2 — Non-Tauri Fallback

**Precondition:** App loaded in browser, not Tauri.

- `@tauri-apps/api/event` import throws → `catch` block silently handles.
- `@tauri-apps/api/window` import throws → same.
- OAuth falls back to `window.open` + `postMessage`.
- No Tauri event listeners registered.

---

## 12. Error & Edge Case Matrix

| Scenario | Where | User Sees | Recovers? |
|----------|-------|-----------|-----------|
| API unreachable (network down) | Any page | `TypeError: Failed to fetch` → error text "Request failed..." | Retry by re-triggering action |
| API 500 | Any | Error banner with message from server | Retry |
| API 401 (token expired) | Any API call | Redirected to `#login`, token cleared | Re-authenticate |
| GramJS bundle not loaded | Telegram connect | `"TelegramLib not loaded."` error | Hard reload |
| Wrong Telegram code | Auth modal | Red banner: "Invalid code" | Re-enter code |
| Wrong Telegram 2FA password | Auth modal | Red banner: "Invalid password" | Re-enter password |
| Telegram API rate-limit | Code send | Error from GramJS → shown in banner | Wait and retry |
| OAuth popup blocked | Login/Signup | Full-page redirect | Complete OAuth, returned with token |
| OAuth cancelled | Login/Signup | Error banner: "Authentication was cancelled" | Try again |
| WebviewWindow creation fail (Tauri) | Login/Signup | Error banner: "Failed to open authentication window" | Try again |
| Empty insights | `#insights` | "Nothing here yet" message | Wait for ingestion/backfill |
| Plugin activation failure | `#integrations` | Error banner with API message | Retry activation |
| Plugin deactivation failure | `#integrations` | Error banner with API message | Retry deactivation |
| Config save failure | `#integrations` / PluginConfigModal | Red error in modal | Edit and save again |
| Plugin list empty | `#integrations` | "No integrations available." | Set up plugins in API |
| Logout API fails | Settings | Token still cleared, redirect to login | User is logged out client-side anyway |
| Chat SSE stream error | `#chat` | Red error bar with "Retry" button | Click Retry |
| Chat input during stream | `#chat` | Send button disabled, chips disabled | Wait for stream to finish |
