use std::sync::Arc;

use axum::{
    body::{to_bytes, Body},
    extract::{Path, State},
    http::{header, HeaderMap, Request, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use tower_http::auth::AddAuthorizationLayer;
use tracing::debug;

use crate::logt;
use crate::remote_cache::RemoteCache;

#[derive(Clone)]
pub struct AppState {
    pub cache: Arc<dyn RemoteCache>,
    pub ttl: Option<usize>,
}

pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/v1/cache/{hash}", get(get_cache).put(put_cache))
        .route("stats/run/{taskName}",post(create_run).delete(stop_run) )
        .layer(AddAuthorizationLayer::bearer("your-secret-token"))
        .with_state(state)
}

async fn create_run(Path(task_name): Path<String>, State(_state): State<AppState>) -> Response {
    logt!(debug, "create task run {}", task_name);

    (
        StatusCode::OK,

    )
        .into_response()
}

async fn stop_run(Path(task_name): Path<String>, State(_state): State<AppState>) -> Response {
    logt!(debug, "stop task run {}", task_name);

    (
        StatusCode::OK,

    )
        .into_response()
}


async fn get_cache(Path(hash): Path<String>, State(state): State<AppState>) -> Response {
    logt!(debug, "Getting cache for hash {}", hash);
    let result = state.cache.get_file(&hash).await;
    match result {
        Ok(data) => match data {
            Some(data) => {
                logt!(info, "Cache hit for key {}", hash);
                (
                    StatusCode::OK,
                    [("Content-Type", "application/octet-stream")],
                    data,
                )
                    .into_response()
            }
            None => StatusCode::NOT_FOUND.into_response(),
        },
        Err(e) => {
            logt!(error, "Error getting file from cache: {:#?}", e);
            internal_error_response(e).into_response()
        }
    }
}

/// Helper function to create an internal error response
/// with a custom message and headers.
/// This function is used to create a consistent error response
/// format for internal server errors.
fn internal_error_response(err: impl std::fmt::Debug) -> impl IntoResponse {
    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, "text/plain".parse().unwrap());

    let body = format!("Internal Server Error {:#?}", err);
    (StatusCode::INTERNAL_SERVER_ERROR, headers, Body::from(body))
}

async fn put_cache(
    Path(hash): Path<String>,
    State(state): State<AppState>,
    headers: HeaderMap,
    request: Request<Body>,
) -> Response {
    debug!("Putting {} to cache", hash);
    let content_length = headers
        .get("content-length")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.parse::<u64>().ok());

    if content_length.is_none() {
        return (StatusCode::BAD_REQUEST, "Missing Content-Length header").into_response();
    }

    if state.cache.file_exists(&hash).await {
        logt!(debug, "Conflict: file already exists in cache: {}", hash);
        return StatusCode::CONFLICT.into_response();
    }

    //limit is 200MB for one file
    let body = match to_bytes(request.into_body(), 200_000_000).await {
        Ok(b) => b,
        Err(e) => {
            logt!(error, "Error setting file in cache {:#?}", e);
            return internal_error_response(e).into_response();
        }
    };

    match state.cache.set_file(&hash, &body, state.ttl).await {
        Ok(_) => {
            logt!(info, "File cached successfully {}", hash);
            StatusCode::ACCEPTED.into_response()
        }
        Err(e) => {
            logt!(error, "Error setting file in cache {:#?}", e);
            internal_error_response(e).into_response()
        }
    }
}
