use futures::StreamExt;
use http_body_util::{BodyExt, StreamBody};
use hyper::body::Frame;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Request, Response, StatusCode};
use hyper_util::rt::TokioIo;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

const PROXY_PORT: u16 = 13000;

fn api_base() -> String {
    std::env::var("API_BASE").unwrap_or_else(|_| env!("API_BASE").to_string())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TvChannel {
    pub id: i64,
    pub name: String,
    #[serde(rename = "channelType")]
    pub channel_type: String,
    #[serde(rename = "serviceId")]
    pub service_id: Option<i64>,
    #[serde(rename = "networkId")]
    pub network_id: Option<i64>,
    #[serde(rename = "hasLogoData")]
    pub has_logo_data: Option<bool>,
    #[serde(rename = "remoteControlKeyId")]
    pub remote_control_key_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Program {
    pub id: i64,
    #[serde(default)]
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "startAt")]
    pub start_at: i64,
    #[serde(rename = "endAt")]
    pub end_at: i64,
    #[serde(rename = "channelId")]
    pub channel_id: Option<i64>,
    #[serde(rename = "isFree")]
    pub is_free: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScheduleItem {
    pub channel: TvChannel,
    #[serde(default)]
    pub programs: Vec<Program>,
}

// Tauri command: fetch schedules via IPC
#[tauri::command]
async fn fetch_schedules() -> Result<Vec<ScheduleItem>, String> {
    let client = Client::new();
    let url = format!("{}/api/schedules/broadcasting?isHalfWidth=true", api_base());

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch schedules: {}", e))?;

    let schedules: Vec<ScheduleItem> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse schedules: {}", e))?;

    Ok(schedules)
}

// Tauri command: get stream URL (points to local HTTP proxy)
#[tauri::command]
fn get_stream_url(channel_id: i64) -> String {
    format!("http://localhost:{}/stream/{}", PROXY_PORT, channel_id)
}

// HTTP Server types
type BoxBody = http_body_util::combinators::BoxBody<bytes::Bytes, Infallible>;

fn empty_body() -> BoxBody {
    http_body_util::Empty::<bytes::Bytes>::new()
        .map_err(|never| match never {})
        .boxed()
}

fn full_body<T: Into<bytes::Bytes>>(chunk: T) -> BoxBody {
    http_body_util::Full::new(chunk.into())
        .map_err(|never| match never {})
        .boxed()
}

async fn handle_request(
    req: Request<hyper::body::Incoming>,
    client: Arc<Client>,
) -> Result<Response<BoxBody>, Infallible> {
    let path = req.uri().path();

    // CORS preflight
    if req.method() == hyper::Method::OPTIONS {
        let response = Response::builder()
            .status(StatusCode::NO_CONTENT)
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Methods", "GET, OPTIONS")
            .header("Access-Control-Allow-Headers", "*")
            .body(empty_body())
            .unwrap();
        return Ok(response);
    }

    // Stream proxy: /stream/{channel_id}
    if path.starts_with("/stream/") {
        let channel_id = path.trim_start_matches("/stream/");
        let stream_url = format!("{}/api/streams/live/{}/m2ts?mode=0", api_base(), channel_id);

        println!("Proxying stream for channel: {}", channel_id);

        match client.get(&stream_url).send().await {
            Ok(resp) => {
                let status = resp.status();
                let content_type = resp
                    .headers()
                    .get("content-type")
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("video/mp2t")
                    .to_string();

                let stream = resp.bytes_stream().map(|result| {
                    result
                        .map(|bytes| Frame::data(bytes))
                        .map_err(|_| -> Infallible { unreachable!() })
                });

                let body = StreamBody::new(stream);
                let boxed_body: BoxBody = BodyExt::boxed(body);

                let response = Response::builder()
                    .status(status.as_u16())
                    .header("Content-Type", content_type)
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Cache-Control", "no-cache")
                    .body(boxed_body)
                    .unwrap();

                Ok(response)
            }
            Err(e) => {
                eprintln!("Stream proxy error: {}", e);
                let response = Response::builder()
                    .status(StatusCode::BAD_GATEWAY)
                    .header("Access-Control-Allow-Origin", "*")
                    .body(full_body(format!("Failed to connect to stream: {}", e)))
                    .unwrap();
                Ok(response)
            }
        }
    } else {
        // 404
        let response = Response::builder()
            .status(StatusCode::NOT_FOUND)
            .header("Access-Control-Allow-Origin", "*")
            .body(full_body("Not Found"))
            .unwrap();
        Ok(response)
    }
}

async fn run_proxy_server() {
    let addr = SocketAddr::from(([127, 0, 0, 1], PROXY_PORT));
    let listener = TcpListener::bind(addr).await.unwrap();
    let client = Arc::new(Client::new());

    println!("Stream proxy server running on http://{}", addr);

    loop {
        let (stream, _) = listener.accept().await.unwrap();
        let io = TokioIo::new(stream);
        let client = Arc::clone(&client);

        tokio::spawn(async move {
            let service = service_fn(move |req| {
                let client = Arc::clone(&client);
                async move { handle_request(req, client).await }
            });

            if let Err(err) = http1::Builder::new().serve_connection(io, service).await {
                eprintln!("Connection error: {:?}", err);
            }
        });
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Start HTTP proxy server in background for streaming
    std::thread::spawn(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(run_proxy_server());
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![fetch_schedules, get_stream_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
