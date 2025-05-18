/// Macro to log with target "nx-cache-server"
#[macro_export]
macro_rules! logt {
    ($lvl:ident, $($arg:tt)*) => {
        tracing::$lvl!(target: "nx-cache-server", $($arg)*);
    };
}
