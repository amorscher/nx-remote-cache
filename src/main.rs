use api::{create_router, AppState};
use tracing_subscriber::EnvFilter;

use std::{env, net::SocketAddr, sync::Arc};

mod api;
mod remote_cache;
mod remote_cache_redis;
mod utils;

use remote_cache_redis::RedisFileCache;

#[tokio::main]
async fn main() {
    // Set up a default subscriber to log to the console.
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .with_target(true)
        .init();

    //print configured log level
    let log_level = std::env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string());
    logt!(info, "Log level: {}", log_level);

    //read env vars
    let params = Parameters::new_from_env();

    let cache = RedisFileCache::new(&params.redis_url).await;

    let state = AppState {
        cache: Arc::new(cache),
        ttl: params.redis_expire,
    };

    let app = create_router(state);
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    logt!(info, "Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

struct Parameters {
    redis_url: String,
    redis_expire: Option<usize>,
}

impl Parameters {
    fn new(redis_url: String, redis_expire: Option<usize>) -> Self {
        Self {
            redis_url,
            redis_expire,
        }
    }
    fn new_from_env() -> Self {
        let redis_url =
            env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
        let redis_expire = env::var("REDIS_EXPIRE")
            .ok()
            .and_then(|v| v.parse::<usize>().ok());
        Self::new(redis_url, redis_expire)
    }
}

// ...existing code...

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_new_parameters() {
        // GIVENN explicit values
        let url = "redis://test:6379".to_string();
        let expire = Some(42);

        // WHENN creating Parameters with new()
        let params = Parameters::new(url.clone(), expire);

        // THENN fields are set correctly
        assert_eq!(params.redis_url, url);
        assert_eq!(params.redis_expire, expire);
    }

    #[test]
    fn test_new_from_env_defaults() {
        // GIVENN no REDIS_URL or REDIS_EXPIRE in env
        env::remove_var("REDIS_URL");
        env::remove_var("REDIS_EXPIRE");

        // WHENN calling new_from_env()
        let params = Parameters::new_from_env();

        // THENN defaults are used
        assert_eq!(params.redis_url, "redis://localhost:6379");
        assert_eq!(params.redis_expire, None);
    }

    #[test]
    fn test_new_from_env_with_env_vars() {
        // GIVENN REDIS_URL and REDIS_EXPIRE set in env
        env::set_var("REDIS_URL", "redis://custom:6379");
        env::set_var("REDIS_EXPIRE", "123");

        // WHENN calling new_from_env()
        let params = Parameters::new_from_env();

        // THENN values are read from env
        assert_eq!(params.redis_url, "redis://custom:6379");
        assert_eq!(params.redis_expire, Some(123));

        env::remove_var("REDIS_URL");
        env::remove_var("REDIS_EXPIRE");
    }

    #[test]
    fn test_new_from_env_with_invalid_expire() {
        // GIVENN REDIS_EXPIRE set to invalid value
        env::set_var("REDIS_EXPIRE", "notanumber");

        // WHENN calling new_from_env()
        let params = Parameters::new_from_env();

        // THENN redis_expire is None
        assert_eq!(params.redis_expire, None);

        env::remove_var("REDIS_EXPIRE");
    }
}
