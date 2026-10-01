# Frontend Development & Build Guide

This handbook details the setup, build architecture, GramJS bundling process, testing strategies, and Tauri desktop application workflows for **`pn-console-app`**.

---

## 🛠 Prerequisites & Environment Setup

### 1. System Requirements
- **Node.js**: `≥ 20.x`
- **Package Manager**: `pnpm` (v9+)
- **Rust Toolchain**: `rustc` and `cargo` (latest stable) for Tauri desktop builds.
- **Linux System Libraries** (Debian/Ubuntu):
  ```bash
  sudo apt-get update
  sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev librsvg2-dev patchelf
  ```

### 2. Local Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | `http://localhost:3000/api` | Backend base URL |
| `TELEGRAM_API_ID` | Optional | — | Telegram API ID (my.telegram.org) |
| `TELEGRAM_API_HASH` | Optional | — | Telegram API hash |
| `TELEGRAM_CHATS` | Optional | — | Comma-separated chat IDs to monitor |
| `TELEGRAM_PHONE` | Optional | — | Phone number for Telegram session |

---

## 📦 GramJS Browser Bundling Workflow

`pn-console-app` connects directly to Telegram using GramJS (`telegram` npm package) running inside the client browser runtime.

### Why IIFE Bundling?
GramJS relies on Node.js core modules (`net`, `tls`, `crypto`, `fs`). To run safely inside WebKit/Blink without heavy runtime bundler polyfill bloat, GramJS is pre-compiled into an IIFE (Immediately Invoked Function Expression) bundle using `esbuild`.

```
scripts/build-telegram.mjs  ──► esbuild ──► public/telegram-bundle.js
                                                    │
                                           Synchronous <script>
                                                    │
                                                    ▼
                                           window.TelegramLib
```

### Build Script (`scripts/build-telegram.mjs`)
- Replaces Node.js modules with browser stubs located in `src/stubs/`.
- Compiles `telegram` into a single standalone bundle: `public/telegram-bundle.js`.
- Automatically executed before `pnpm dev` and `pnpm build`.
- Command to run manually:
  ```bash
  pnpm build-telegram
  ```

---

## 🚀 Development & Build Workflows

### 1. Web Browser Mode (Vite Dev Server)
Runs the Vue 3 app in standard browser mode on port `1420`:
```bash
pnpm dev
```
Open `http://localhost:1420` in your browser. Note: Features requiring Tauri-specific native windows (e.g., OAuth browser relay popups) fall back to web standard popups or browser redirects.

### 2. Desktop Mode (Tauri Window)
Launches the native desktop app window using Tauri v2 connected to Vite HMR:
```bash
pnpm tauri dev
```

### 3. Static Type Verification & Build
The application uses `vue-tsc` as its static type checker:
```bash
pnpm build
```
This runs:
1. `pnpm build-telegram`
2. `vue-tsc --noEmit` (TypeScript type check across Vue SFCs)
3. `vite build` (Production asset compilation into `dist/`)

### 4. Production Desktop Binary Compilation
Builds the release binary for Linux/macOS/Windows:
```bash
pnpm tauri build
```
The output desktop executable will be located at `src-tauri/target/release/bundle/`.

---

## 🧪 Testing Guidelines

Unit tests are written using **Vitest**:
```bash
# Run tests once
pnpm vitest run

# Run tests in watch mode
pnpm vitest
```

- Test files are located alongside source code or API modules (e.g. `src/api/chat-api.test.ts`).
- Note: `pn-console-app` uses Vitest (`*.test.ts`), whereas `pn-console-api` uses Jest (`*.spec.ts`).

---

## 🔍 Code Style & Quality Checklist

1. **Prettier Format**:
   ```bash
   pnpm format
   ```
2. **ESLint Validation**:
   ```bash
   pnpm lint
   ```
3. **Full Quality Pipeline** (matching CI):
   ```bash
   pnpm build && pnpm vitest run
   ```
