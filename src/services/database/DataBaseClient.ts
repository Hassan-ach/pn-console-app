import Database from "@tauri-apps/plugin-sql";

const DB_URL =
    import.meta.env.VITE_DB_URL ??
    "postgres://pn_console:pn_console@localhost:5432/np_console_raw_db";

let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
    if (!dbInstance) {
        dbInstance = await Database.load(DB_URL);
    }
    return dbInstance;
}

export async function closeDatabase(): Promise<void> {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
    }
}
