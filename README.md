# Tauri + Vue + TypeScript

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs. Check out the script setup documentation to learn more.

## Recommended IDE Setup

* VS Code + Vue - Official (Volar) + Tauri + rust-analyzer
- [VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Telegram Setup

0. Get `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` from [my.telegram.org/apps](https://my.telegram.org/apps) (log in with your phone number, create an app). Copy `.env.example` to `.env` and fill in your credentials.
1. Run Docker container with `docker compose up -d`.
2. Run the app with `pnpm tauri dev`.
3. On first run, enter the Telegram code when prompted.

## LLM Setup

Insight extraction is powered by a configurable LLM, chosen via three env vars in your `.env` file:

```
VITE_LLM_PROVIDER=ollama
VITE_LLM_MODEL=qwen3:8b
VITE_LLM_API_KEY=http://localhost:11434
```

**`VITE_LLM_PROVIDER`** — one of `ollama`, `openai`, `anthropic`, `google`, `grok`.

**`VITE_LLM_MODEL`** — the model name for the selected provider (e.g. `qwen3:8b`, `gpt-4o`, `claude-sonnet-5`).

**`VITE_LLM_API_KEY`** — the API key for the selected provider. For `ollama`, there's no API key, so this field is repurposed as the base URL of your local Ollama server instead (e.g. `http://localhost:11434`).
