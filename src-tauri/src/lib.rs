#[tauri::command]
fn open_oauth_window(app: tauri::AppHandle, url: String) {
    use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

    let app_clone = app.clone();
    let oauth_url = WebviewUrl::External(url.parse().expect("invalid URL"));

    let window = WebviewWindowBuilder::new(&app, "oauth", oauth_url)
        .title("Sign in")
        .inner_size(600.0, 700.0)
        .resizable(false)
        .on_navigation(move |nav_url| {
            let url_str = nav_url.as_str();
            if let Some(pos) = url_str.find("access_token=") {
                let start = pos + 13;
                let token: String = url_str[start..]
                    .split('&')
                    .next()
                    .unwrap_or("")
                    .to_string();
                
                let is_new = url_str.contains("google_success=1")
                    || url_str.contains("microsoft_success=1")
                    || url_str.contains("sso_success=1");

                if !token.is_empty() {
                    #[derive(Clone, serde::Serialize)]
                    struct OauthPayload {
                        token: String,
                        is_new: bool,
                    }
                    let _ = app_clone.emit("oauth-result", OauthPayload { token, is_new });
                    if let Some(window) = app_clone.get_webview_window("oauth") {
                        let _ = window.close();
                    }
                    return false;
                }
            }
            true
        })
        .build()
        .expect("failed to build oauth window");

    let app_clone2 = app.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
            let _ = app_clone2.emit("oauth-cancelled", ());
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![open_oauth_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
