#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

require_package_manager

echo "[agent:bootstrap] using $PACKAGE_MANAGER"

if [ -f .env.example ] && [ ! -f .env ]; then
  cp .env.example .env
  echo "[agent:bootstrap] created .env from .env.example"
fi

run_make_or_just bootstrap
run_make_or_just setup

echo "[agent:bootstrap] installing dependencies"
"$PACKAGE_MANAGER" install

if [ -f scripts/ensure-sqlite-db.mjs ]; then
  node scripts/ensure-sqlite-db.mjs
fi

echo "[agent:bootstrap] complete"

