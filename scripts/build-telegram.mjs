import * as esbuild from "esbuild";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Inject globals before GramJS loads
const globalsCode = `
import { Buffer } from "buffer";
import process from "process";
globalThis.Buffer = Buffer;
globalThis.process = process;
`;

mkdirSync(resolve(root, "public"), { recursive: true });

await esbuild.build({
    stdin: {
        contents: `
${globalsCode}
export { TelegramClient } from "telegram";
export { StringSession } from "telegram/sessions";
export { Api } from "telegram";
export { computeCheck } from "telegram/Password";
`,
        resolveDir: root,
        loader: "ts",
    },
    bundle: true,
    format: "iife",
    globalName: "TelegramLib",
    outfile: resolve(root, "public/telegram-bundle.js"),
    platform: "browser",
    target: "es2020",
    define: {
        global: "globalThis",
        "process.env.NODE_DEBUG": "undefined",
    },
    alias: {
        crypto: "crypto-browserify",
        stream: "stream-browserify",
        events: "events",
        path: "path-browserify",
        os: "os-browserify/browser",
        util: "util",
        process: resolve(root, "node_modules/process/browser.js"),
        buffer: "buffer/",
        fs: resolve(root, "src/stubs/fs.ts"),
        net: resolve(root, "src/stubs/net.ts"),
        tls: resolve(root, "src/stubs/tls.ts"),
        child_process: resolve(root, "src/stubs/child_process.ts"),
        constants: resolve(root, "src/stubs/constants.ts"),
    },
    external: [],
});

console.log("telegram-bundle.js built");
