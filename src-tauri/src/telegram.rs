use std::collections::HashMap;
use std::sync::Arc;

use grammers_client::client::LoginToken;
use grammers_client::sender::SenderPool;
use grammers_client::{Client, SignInError};
use grammers_session::storages::SqliteSession;
use grammers_session::types::PeerRef;
use serde::Deserialize;
use serde::Serialize;
use serde_json::Value;
use sqlx::types::Json;
use sqlx::PgPool;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;

#[derive(Serialize, Clone)]
pub struct TgMessage {
    pub id: i32,
    pub chat_id: String,
    pub text: String,
    pub date: String,
    pub reply_to: Option<i32>,
    pub author: Option<String>,
    pub has_attachment: bool,
    pub reactions: Value,
    pub pinned: bool,
    pub edited_date: Option<String>,
    pub entities: Option<Value>,
    pub raw: Value,
}

fn convert_message(msg: grammers_client::message::Message, chat_id: String) -> TgMessage {
    let author = msg.sender().and_then(|s| s.name().map(|n| n.to_string()));
    let has_attachment = msg.media().is_some();
    let pinned = msg.pinned();
    let edited_date = msg.edit_date().map(|d| d.to_rfc3339());
    let (reactions, entities) = match &msg.raw {
        grammers_client::tl::enums::Message::Message(m) => {
            let r = m
                .reactions
                .as_ref()
                .and_then(|r| serde_json::to_value(r).ok())
                .unwrap_or(serde_json::Map::new().into());
            let e = m
                .entities
                .as_ref()
                .and_then(|e| serde_json::to_value(e).ok());
            (r, e)
        }
        _ => (serde_json::Map::new().into(), None),
    };
    let raw = serde_json::to_value(&msg.raw).unwrap_or_default();
    TgMessage {
        id: msg.id(),
        chat_id,
        text: msg.text().to_string(),
        date: msg.date().to_rfc3339(),
        reply_to: msg.reply_to_message_id(),
        author,
        has_attachment,
        reactions,
        pinned,
        edited_date,
        entities,
        raw,
    }
}

pub struct TgBackend {
    pub client: Option<Client>,
    pub phone: String,
    pub password: Option<String>,
    pub api_id: i32,
    pub api_hash: String,
    pub pending_token: Option<LoginToken>,
    peer_ref_cache: HashMap<String, PeerRef>,
}

impl TgBackend {
    pub fn new(api_id: i32, api_hash: String, phone: String, password: Option<String>) -> Self {
        eprintln!("[tg] TgBackend::new");
        Self {
            client: None,
            phone,
            password,
            api_id,
            api_hash,
            pending_token: None,
            peer_ref_cache: HashMap::new(),
        }
    }

    pub async fn login(&mut self, app: &AppHandle) -> Result<String, String> {
        eprintln!("[tg] login: opening SqliteSession...");
        let session_dir = std::env::temp_dir().join("pn-telegram.session.db");
        let session = Arc::new(
            SqliteSession::open(&session_dir)
                .await
                .map_err(|e| format!("session error: {}", e))?,
        );
        eprintln!("[tg] login: creating SenderPool...");
        let pool = SenderPool::new(Arc::clone(&session), self.api_id);
        eprintln!("[tg] login: creating Client...");
        let client = Client::new(pool.handle);
        eprintln!("[tg] login: spawning runner...");
        tokio::spawn(pool.runner.run());
        eprintln!("[tg] login: checking auth...");

        match client.is_authorized().await {
            Ok(true) => {
                eprintln!("[tg] login: already authorized");
                self.client = Some(client);
                return Ok("ok".to_string());
            }
            Ok(false) => {
                eprintln!("[tg] login: not authorized, requesting code...");
            }
            Err(e) => {
                eprintln!("[tg] login: is_authorized error: {}", e);
                return Err(e.to_string());
            }
        }

        eprintln!(
            "[tg] login: request_login_code phone={} api_hash={}",
            self.phone,
            &self.api_hash[..4]
        );
        let token = client
            .request_login_code(&self.phone, &self.api_hash)
            .await
            .map_err(|e| format!("request code error: {}", e))?;
        eprintln!("[tg] login: code requested, emitting event...");
        self.pending_token = Some(token);
        self.client = Some(client);
        let _ = app.emit("tg-code-needed", ());
        eprintln!("[tg] login: returning need_code");
        Ok("need_code".to_string())
    }

    pub async fn submit_code(&mut self, code: &str) -> Result<(), String> {
        eprintln!("[tg] submit_code...");
        let client = self.client.as_ref().ok_or("not connected")?;
        let token = self
            .pending_token
            .take()
            .ok_or("no pending login request")?;
        match client.sign_in(&token, code).await {
            Ok(_) => {
                eprintln!("[tg] sign_in ok");
                Ok(())
            }
            Err(SignInError::PasswordRequired(password_token)) => {
                eprintln!("[tg] 2FA required");
                let password = self.password.as_ref().ok_or("2FA password required")?;
                client
                    .check_password(password_token, password)
                    .await
                    .map_err(|e| format!("password error: {}", e))?;
                eprintln!("[tg] 2FA ok");
                Ok(())
            }
            Err(e) => {
                eprintln!("[tg] sign_in error: {}", e);
                Err(format!("sign in error: {}", e))
            }
        }
    }

    pub async fn backfill(&mut self, chat_id: &str, limit: i32) -> Result<Vec<TgMessage>, String> {
        let client = self.client.as_ref().ok_or("not connected")?;
        let mut all_messages = Vec::new();

        if let Some(peer_ref) = self.peer_ref_cache.get(chat_id) {
            let mut iter = client.iter_messages(*peer_ref).limit(limit as usize);
            loop {
                match iter.next().await {
                    Ok(Some(msg)) => all_messages.push(convert_message(msg, chat_id.to_string())),
                    Ok(None) => break,
                    Err(e) => return Err(e.to_string()),
                }
            }
            return Ok(all_messages);
        }

        let mut dialogs = client.iter_dialogs();
        loop {
            match dialogs.next().await {
                Ok(Some(dialog)) => {
                    let peer_id = dialog.peer().id();
                    let id_str = peer_id.to_string();
                    if id_str == chat_id {
                        let peer_ref = dialog.peer_ref();
                        self.peer_ref_cache.insert(chat_id.to_string(), peer_ref);
                        let mut iter = client.iter_messages(peer_ref).limit(limit as usize);
                        loop {
                            match iter.next().await {
                                Ok(Some(msg)) => {
                                    all_messages.push(convert_message(msg, chat_id.to_string()))
                                }
                                Ok(None) => break,
                                Err(e) => return Err(e.to_string()),
                            }
                        }
                        return Ok(all_messages);
                    }
                }
                Ok(None) => break,
                Err(e) => return Err(e.to_string()),
            }
        }
        Ok(all_messages)
    }
}

pub struct AppState {
    pub backend: Mutex<Option<TgBackend>>,
}

#[derive(Deserialize)]
pub struct LoginConfig {
    pub api_id: i32,
    pub api_hash: String,
    pub phone: String,
    pub password: Option<String>,
}

#[tauri::command]
pub async fn tg_login(
    state: State<'_, AppState>,
    app: AppHandle,
    config: Option<LoginConfig>,
) -> Result<String, String> {
    eprintln!(
        "[tg_cmd] tg_login called, config.is_some={}",
        config.is_some()
    );
    let mut guard = state.backend.lock().await;
    if let Some(ref b) = *guard {
        if b.client.is_some() {
            eprintln!("[tg_cmd] already connected");
            return Ok("ok".to_string());
        }
    }
    let mut b = if let Some(c) = config {
        eprintln!("[tg_cmd] using provided config");
        TgBackend::new(c.api_id, c.api_hash, c.phone, c.password)
    } else {
        eprintln!("[tg_cmd] using env fallback");
        let api_id = std::env::var("TELEGRAM_API_ID")
            .map_err(|_| "TELEGRAM_API_ID not set".to_string())?
            .parse::<i32>()
            .map_err(|_| "invalid API_ID".to_string())?;
        let api_hash = std::env::var("TELEGRAM_API_HASH")
            .map_err(|_| "TELEGRAM_API_HASH not set".to_string())?;
        let phone =
            std::env::var("TELEGRAM_PHONE").map_err(|_| "TELEGRAM_PHONE not set".to_string())?;
        let password = std::env::var("TELEGRAM_PASSWORD").ok();
        eprintln!("[tg_cmd] env: api_id={}, phone={}", api_id, phone);
        TgBackend::new(api_id, api_hash, phone, password)
    };
    eprintln!("[tg_cmd] calling login...");
    let r = b.login(&app).await?;
    eprintln!("[tg_cmd] login result: {}", r);
    *guard = Some(b);
    Ok(r)
}

#[tauri::command]
pub async fn tg_submit_code(state: State<'_, AppState>, code: String) -> Result<(), String> {
    eprintln!("[tg_cmd] tg_submit_code");
    let mut guard = state.backend.lock().await;
    let b = guard.as_mut().ok_or("not initialized")?;
    b.submit_code(&code).await
}

#[tauri::command]
pub async fn tg_backfill(
    state: State<'_, AppState>,
    chat_id: String,
    limit: i32,
) -> Result<Vec<TgMessage>, String> {
    eprintln!("[tg_cmd] tg_backfill chat_id={} limit={}", chat_id, limit);
    let mut guard = state.backend.lock().await;
    let b = guard.as_mut().ok_or("not initialized")?;
    b.backfill(&chat_id, limit).await
}

#[derive(Deserialize)]
#[allow(dead_code)]
pub struct InsertEnvelope {
    pub envelope: InsertEnvelopeData,
    pub payload: InsertPayloadData,
}

#[derive(Deserialize)]
#[allow(dead_code)]
pub struct InsertEnvelopeData {
    pub source_plugin: String,
    pub source_id: String,
    pub r#type: String,
    pub has_attachment: bool,
    pub author_ref: Option<String>,
    pub occurred_at: String,
}

#[derive(Deserialize)]
#[allow(dead_code)]
pub struct InsertPayloadData {
    pub r#type: String,
    pub content: String,
    pub group_id: Option<String>,
    pub reply_to: Option<String>,
    pub reactions: Value,
    pub pinned: bool,
    pub edited_date: Option<String>,
    pub entities: Option<Value>,
    pub raw_payload: Value,
}

const DB_URL: &str = "postgres://pn_console:pn_console@localhost:5432/np_console_raw_db";

#[tauri::command]
pub async fn tg_insert_envelopes(items: Vec<InsertEnvelope>) -> Result<i32, String> {
    eprintln!("[tg_cmd] tg_insert_envelopes: {} items", items.len());
    let pool = PgPool::connect(DB_URL)
        .await
        .map_err(|e| format!("db connect: {}", e))?;
    let mut inserted = 0;

    for item in &items {
        let exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM envelope WHERE source_plugin = $1 AND source_id = $2)",
        )
        .bind(&item.envelope.source_plugin)
        .bind(&item.envelope.source_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("check: {}", e))?;

        if exists {
            continue;
        }

        let payload_id: (sqlx::types::Uuid,) = sqlx::query_as(
            "INSERT INTO message_payload (type, content, group_id, reply_to, reactions, pinned, edited_date, entities, raw_payload)
             VALUES ($1::message_payload_type, $2, $3, $4, $5, $6, $7::timestamptz, $8, $9)
             RETURNING id"
        )
        .bind(&item.payload.r#type)
        .bind(&item.payload.content)
        .bind(&item.payload.group_id)
        .bind(&item.payload.reply_to)
        .bind(Json(&item.payload.reactions))
        .bind(item.payload.pinned)
        .bind(&item.payload.edited_date)
        .bind(item.payload.entities.as_ref().map(|e| Json(e)))
        .bind(Json(&item.payload.raw_payload))
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("insert payload: {}", e))?;

        sqlx::query(
            "INSERT INTO envelope (source_plugin, source_id, type, payload_ref, has_attachment, author_ref, occurred_at, ingested_at, status, organization_id, permissions)
             VALUES ($1, $2, $3::envelope_type, $4, $5, $6, $7::timestamptz, NOW(), 'pending', NULL, '{}')"
        )
        .bind(&item.envelope.source_plugin)
        .bind(&item.envelope.source_id)
        .bind(&item.envelope.r#type)
        .bind(payload_id.0)
        .bind(item.envelope.has_attachment)
        .bind(&item.envelope.author_ref)
        .bind(&item.envelope.occurred_at)
        .execute(&pool)
        .await
        .map_err(|e| format!("insert envelope: {}", e))?;

        inserted += 1;
    }

    pool.close().await;
    eprintln!("[tg_cmd] tg_insert_envelopes: inserted {}", inserted);
    Ok(inserted)
}
