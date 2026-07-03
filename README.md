# Tauri + Vue + TypeScript

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs. Check out the script setup documentation to learn more.

## Recommended IDE Setup

* VS Code + Vue - Official (Volar) + Tauri + rust-analyzer

## Installation Requirements

Before running the application, make sure you have:

* A running Ollama instance.
* The model you want to use already downloaded (for example, `llama3.2`).

Create a `.env` file in the project root (or update your existing one) and configure the following environment variables:

```env
VITE_OLLAMA_MODEL=<model name>
VITE_OLLAMA_BASE_URL=<base URL of the Ollama service>
```

Example:

```env
VITE_OLLAMA_MODEL=llama3.2
VITE_OLLAMA_BASE_URL=http://localhost:11434
```

- [VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Telegram Setup
0. Get `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` from [my.telegram.org/apps](https://my.telegram.org/apps) (log in with your phone number, create an app). Copy `.env.example` to `.env` and fill in your credentials.
1. Run Docker container with `docker compose up -d`.
2. Run the app with `pnpm tauri dev`.
3. On first run, enter the Telegram code when prompted.
