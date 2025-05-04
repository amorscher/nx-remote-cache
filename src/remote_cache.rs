use async_trait::async_trait;

#[async_trait]
pub trait RemoteCache: Send + Sync {
    async fn file_exists(&self, key: &str) -> bool;
    async fn get_file(&self, key: &str) -> Option<Vec<u8>>;
    async fn set_file(&self, key: &str, data: &[u8], ttl: Option<usize>) -> Result<(), String>;
}
