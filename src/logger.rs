use std::fs;
use tracing_appender::non_blocking::{NonBlocking, WorkerGuard};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

const LOG_FILE_PATH: &str = "nx-cache-server.log";
const MAX_LOG_SIZE: u64 = 5 * 1024 * 1024; // 5 MB

/// Returns a non-blocking file appender and its guard for the given path.
/// If the log file exceeds MAX_LOG_SIZE, it is overwritten.
fn get_file_appender_for(path: &str) -> (NonBlocking, WorkerGuard) {
    if let Ok(metadata) = fs::metadata(path) {
        if metadata.len() > MAX_LOG_SIZE {
            let _ = fs::remove_file(path);
        }
    }
    let file_appender = tracing_appender::rolling::never(".", path);
    tracing_appender::non_blocking(file_appender)
}

/// Returns a non-blocking file appender and its guard for the default log file.
fn get_file_appender() -> (NonBlocking, WorkerGuard) {
    get_file_appender_for(LOG_FILE_PATH)
}

/// Initializes logging to both stdout and a file, with file size limit.
pub fn init_logger() -> WorkerGuard {
    let (file_writer, guard) = get_file_appender();

    let fmt_layer = fmt::layer().with_writer(std::io::stdout).with_target(true);

    let file_layer = fmt::layer()
        .with_writer(file_writer)
        .with_target(true)
        .with_ansi(false);

    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(fmt_layer)
        .with(file_layer)
        .init();

    guard
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::{Read, Write};
    use tempfile::NamedTempFile;

    #[test]
    fn test_get_file_appender_creates_file() {
        // GIVEN a temp log file path
        let temp_file = NamedTempFile::new().unwrap();
        let log_path = temp_file.path().to_str().unwrap();

        // WHEN get_file_appender_for is called
        let (mut writer, _guard) = get_file_appender_for(log_path);

        // THEN log file is created and writable
        let test = writer.write(b"test log\n").unwrap();
        writer.flush().unwrap();
        assert!(test > 0);
        assert!(std::fs::metadata(log_path).is_ok());
        std::thread::sleep(std::time::Duration::from_millis(50)); // Give background worker time

        //check that the file contains the log entry
        let mut file = File::open(log_path).unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        assert!(contents.contains("test log"));
    }

    #[test]
    fn test_get_file_appender_overwrites_large_file() {
        // GIVEN a temp log file larger than MAX_LOG_SIZE
        let temp_file = NamedTempFile::new().unwrap();
        let log_path = temp_file.path().to_str().unwrap();
        {
            let mut file = File::create(log_path).unwrap();
            file.write_all(&vec![0u8; (MAX_LOG_SIZE + 10) as usize])
                .unwrap();
            file.sync_all().unwrap();
        }

        // WHENN get_file_appender_for is called
        let (_writer, _guard) = get_file_appender_for(log_path);

        // THENN the file is truncated (size <= MAX_LOG_SIZE)
        let meta = std::fs::metadata(log_path).unwrap();
        assert!(meta.len() <= MAX_LOG_SIZE);
    }

    #[test]
    fn test_init_logger_runs() {
        // GIVEN the default logger
        // WHEN init_logger is called
        let _guard = init_logger();

        // THEN log file is created
        assert!(std::fs::metadata(LOG_FILE_PATH).is_ok());

        // No need to remove the file, it's the default log file and not a temp file
    }
}
