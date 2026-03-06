#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export ELECTRON_ENABLE_LOGGING=0
export ELECTRON_DISABLE_SECURITY_WARNINGS=true

cd "$APP_DIR"
exec npm start
