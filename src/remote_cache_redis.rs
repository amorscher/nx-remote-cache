use crate::remote_cache::RemoteCache;
use anyhow::{Context, Result};
use async_trait::async_trait;
use redis::{aio::MultiplexedConnection, AsyncCommands, Client};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct RedisFileCache {
    con: Arc<Mutex<MultiplexedConnection>>,
}

impl RedisFileCache {
    pub async fn new(redis_url: &str) -> Self {
        let client = Client::open(redis_url).unwrap();
        let con = client.get_multiplexed_async_connection().await.unwrap();

        Self {
            con: Arc::new(Mutex::new(con)),
        }
    }
}

#[async_trait]
impl RemoteCache for RedisFileCache {
    async fn file_exists(&self, key: &str) -> bool {
        let mut con = self.con.lock().await;
        con.exists(key).await.unwrap_or(false)
    }

    async fn get_file(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let mut con = self.con.lock().await;
        let data: Option<Vec<u8>> = con
            .get(key)
            .await
            .with_context(|| "Error getting file from Redis.".to_string())?;

        if let Some(ref d) = data {
            println!("Got file from Redis: {} bytes", d.len());
        }

        Ok(data)
    }

    async fn set_file(&self, key: &str, data: &[u8], ttl: Option<usize>) -> Result<()> {
        let mut con = self.con.lock().await;
        con.set::<_, _, ()>(key, data).await?;
        if let Some(ttl_secs) = ttl {
            con.expire::<_, ()>(key, ttl_secs as i64).await?;
        }
        Ok(())
    }
}
