use std::{
    process::{Command, Stdio},
    sync::Arc,
};

use axum::Router;
use nx_remote_cache::{
    api::{create_router, AppState},
    remote_cache_redis::RedisFileCache,
};
use once_cell::sync::OnceCell;

pub async fn create_test_app() -> Router {
    create_test_app_with_url("redis://localhost:6379").await
}

pub async fn create_test_app_with_url(url: &str) -> Router {
    // Set up Redis client
    let cache = RedisFileCache::new(url).await;
    let state = AppState {
        cache: Arc::new(cache),
        ttl: None,
    };

    // Build the Axum app
    create_router(state)
}

static INIT: OnceCell<()> = OnceCell::new();

pub fn setup() {
    INIT.get_or_init(|| {
        // Check if we're in CI
        let is_ci = std::env::var("CI").is_ok();

        if is_ci {
            println!("🧪 Running in CI – assuming Redis is already available.");
            //flush the Redis database using reduis-cli
            // This assumes you have redis-cli installed and available in your PATH
            // You can also use a Docker command to flush the Redis database if needed
            // Flush Redis DB
            println!("🧹 Flushing Redis database...");
            let flush_status = Command::new("redis-cli")
                .arg("FLUSHALL")
                .stdout(Stdio::inherit())
                .stderr(Stdio::inherit())
                .status()
                .expect("Failed to run redis-cli FLUSHALL");

            assert!(flush_status.success(), "FLUSHALL failed");
        } else {
            println!("🔧 Not in CI – starting Redis locally...");
            let status = Command::new("sh")
                .arg("scripts/start-local-redis.sh")
                .status()
                .expect("Failed to execute Redis startup script");

            assert!(status.success(), "Redis startup script failed");
        }
    });
}
