import { describe, it, expect, afterEach, vi } from "vitest";
import {
    getDatabase,
    closeDatabase,
} from "../../../src/services/database/DataBaseClient";

const mockCreateDb = vi.hoisted(() =>
    vi.fn(() => ({
        close: vi.fn().mockResolvedValue(undefined),
    })),
);

vi.mock("@tauri-apps/plugin-sql", () => ({
    default: {
        load: vi.fn().mockImplementation(() => Promise.resolve(mockCreateDb())),
    },
}));

describe("DataBaseClient", () => {
    afterEach(async () => {
        await closeDatabase();
    });

    it("returns the same instance on multiple calls", async () => {
        const db1 = await getDatabase();
        const db2 = await getDatabase();
        expect(db1).toBe(db2);
    });

    it("creates a new instance after close", async () => {
        const db1 = await getDatabase();
        await closeDatabase();
        const db2 = await getDatabase();
        expect(db1).not.toBe(db2);
    });
});
