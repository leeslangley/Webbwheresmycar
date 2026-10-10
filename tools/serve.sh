#!/bin/sh
# Serve the repo root on localhost for browser testing.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

echo "Serving http://127.0.0.1:${PORT:-8000}/"
exec python3 -m http.server "${PORT:-8000}" --bind 127.0.0.1
