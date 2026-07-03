mod telegram;

use telegram::{tg_backfill, tg_insert_envelopes, tg_login, tg_submit_code, AppState};
use tokio::sync::Mutex;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::panic::set_hook(Box::new(|info| {
        eprintln!("[PANIC] {}", info);
    }));

    tauri::Builder::default()
        .setup(|_app| {
            let manifest_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
            let env_path = manifest_dir.join("../.env");
            eprintln!("[setup] Loading .env from: {:?}", env_path);
            if let Err(e) = dotenvy::from_path(&env_path) {
                eprintln!("[setup] dotenvy error: {}", e);
            }
            Ok(())
        })
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            backend: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            tg_login,
            tg_submit_code,
            tg_backfill,
            tg_insert_envelopes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
