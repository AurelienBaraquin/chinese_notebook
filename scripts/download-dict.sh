#!/bin/bash
set -e

# Create target directory if it doesn't exist
mkdir -p src-tauri/src

echo "=== Downloading CC-CEDICT dictionary ==="
curl -L "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.zip" -o cedict.zip

echo "=== Unzipping dictionary ==="
unzip -o cedict.zip cedict_ts.u8

echo "=== Compressing to Gzip for Rust backend ==="
gzip -c cedict_ts.u8 > src-tauri/src/cedict_ts.u8.gz

echo "=== Cleaning up ==="
rm -f cedict.zip cedict_ts.u8

echo "=== Dictionary setup complete! ==="
