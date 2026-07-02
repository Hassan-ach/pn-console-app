import { describe, it } from "vitest";
import * as readline from "readline";
import { GramJsTelegramClient } from "../../../src/plugins/telegram/client/gramjs";
import { TelegramPlugin } from "../../../src/plugins/telegram";
import { TelegramCredentials } from "../../../src/plugins/telegram/credentials";
import { PluginManager } from "../../../src/plugins/manager";

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const phone = process.env.TELEGRAM_PHONE;
const password = process.env.TELEGRAM_PASSWORD;
const chats = process.env.TELEGRAM_CHATS?.split(",");

function promptForCode(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stderr,
    });
    return new Promise((resolve) => {
        rl.question("Enter code from Telegram: ", (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

describe("Telegram plugin", () => {
    it("backfills 20 messages and prints them", async () => {
        if (!apiId || !apiHash || !phone || !chats?.length) {
            console.log(
                "Set TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_PHONE, TELEGRAM_CHATS",
            );
            return;
        }

        const client = new GramJsTelegramClient(apiId, apiHash);
        const plugin = new TelegramPlugin(client);
        plugin.setCodeProvider(promptForCode);

        const manager = new PluginManager();
        manager.register(plugin);
        await manager.initPlugin("telegram", { chats });
        await manager.loginPlugin(
            "telegram",
            new TelegramCredentials(phone, password),
        );

        let count = 0;
        for await (const chunk of manager.ingestBackfill(
            "telegram",
            new Date(0),
            new Date(),
            20,
        )) {
            for (const item of chunk) {
                console.log(
                    `[${item.envelope.source_id}] ${item.envelope.author_ref ?? "?"}: ${item.payload.content}`,
                );
                count++;
            }
        }

        console.log(`Done. ${count} messages.`);
        await manager.logoutPlugin("telegram");
    });
});
