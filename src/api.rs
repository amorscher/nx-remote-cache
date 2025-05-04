use std::sync::Arc;

use axum::{
    body::{to_bytes, Body}, extract::{ Path, State}, http::{HeaderMap, Request, StatusCode}, response::{IntoResponse, Response}, routing::get, Router
};
use tower_http::auth::AddAuthorizationLayer;

use crate::remote_cache::RemoteCache;




#[derive(Clone)]
pub struct AppState {
    pub cache: Arc<dyn RemoteCache>,
    pub ttl: Option<usize>,
}

pub fn create_router(state:AppState) -> Router {
    Router::new()
    .route("/v1/cache/{hash}", get(get_cache).put(put_cache))
    .layer(AddAuthorizationLayer::bearer("your-secret-token"))
    .with_state(state)
}

async fn get_cache(Path(hash): Path<String>, State(state): State<AppState>) -> Response {
    println!("Getting cache for hash: {}", hash);
    match state.cache.get_file(&hash).await {
        Some(data) => (
            StatusCode::OK,
            [("Content-Type", "application/octet-stream")],
            data,
        )
            .into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn put_cache(
    Path(hash): Path<String>,
    State(state): State<AppState>,
    headers: HeaderMap,
    request: Request<Body>,
) -> Response {
    println!("Putting cache for hash: {}", hash);
    let content_length = headers
        .get("content-length")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.parse::<u64>().ok());

    if content_length.is_none() {
        return (StatusCode::BAD_REQUEST, "Missing Content-Length header").into_response();
    }

    if state.cache.file_exists(&hash).await {
        return StatusCode::CONFLICT.into_response();
    }

    let body = match to_bytes(request.into_body(),60000000000000000).await {
        Ok(b) => b,
        Err(e) =>{ 
            println!("Error setting file in cache: {}", e);
            return StatusCode::INTERNAL_SERVER_ERROR.into_response()},
    
    };

    match state.cache.set_file(&hash, &body, state.ttl).await {
        Ok(_) => StatusCode::ACCEPTED.into_response(),
        Err(e) =>{ 
            println!("Error setting file in cache: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR.into_response()},
    }
}