#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

if [ -d .git ]; then
  echo "[agent:status] git branch"
  git status --short --branch
else
  echo "[agent:skip] no git checkout metadata"
fi

echo "[agent:status] package manager"
echo "$PACKAGE_MANAGER"

if [ -f package-lock.json ]; then
  echo "[agent:status] npm lockfile"
elif [ -f pnpm-lock.yaml ]; then
  echo "[agent:status] pnpm lockfile"
elif [ -f yarn.lock ]; then
  echo "[agent:status] yarn lockfile"
else
  echo "[agent:warn] no lockfile detected"
fi

if [ -f .env ]; then
  echo "[agent:status] .env present"
else
  echo "[agent:warn] .env missing"
fi

if [ -f .env.example ]; then
  echo "[agent:status] .env.example present"
fi

