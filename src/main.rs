use api::{create_router, AppState};

use std::{env, net::SocketAddr, sync::Arc};

mod api;
mod remote_cache;
mod remote_cache_redis;

use remote_cache_redis::RedisFileCache;

#[tokio::main]
async fn main() {
    let cache = RedisFileCache::new("redis://localhost:6379").await;
    let ttl = env::var("REDIS_EXPIRE")
        .ok()
        .and_then(|v| v.parse::<usize>().ok());

    let state = AppState {
        cache: Arc::new(cache),
        ttl,
    };

    let app = create_router(state);
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();
    axum::serve(listener, app).await.unwrap();
}
