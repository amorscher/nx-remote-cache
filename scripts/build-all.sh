#!/usr/bin/env bash

set -euo pipefail

# Define targets and output locations
declare -A TARGETS=(
  ["linux"]="x86_64-unknown-linux-gnu"
 # ["mac"]="x86_64-apple-darwin"
 # ["win"]="x86_64-pc-windows-gnu"
)

BIN_NAME="nx-cache-server"
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
NPM_BIN_DIR="$PROJECT_ROOT/npm/bin"

# Ensure output dirs exist
mkdir -p "$NPM_BIN_DIR/linux" "$NPM_BIN_DIR/mac" "$NPM_BIN_DIR/win"

echo "🔧 Building binaries..."

for platform in "${!TARGETS[@]}"; do
  target="${TARGETS[$platform]}"
  echo "➡️  Building for $platform ($target)"

  cargo build --release --target "$target"

  case $platform in
    linux | mac)
      cp "target/$target/release/$BIN_NAME" "$NPM_BIN_DIR/$platform/$BIN_NAME"
      chmod +x "$NPM_BIN_DIR/$platform/$BIN_NAME"
      ;;
    win)
      cp "target/$target/release/$BIN_NAME.exe" "$NPM_BIN_DIR/win/$BIN_NAME.exe"
      ;;
  esac

  echo "✅ $platform binary ready at: npm/bin/$platform"
done

echo "🎉 All builds complete!"
