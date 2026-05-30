#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

require_package_manager

echo "[agent:doctor] package manager: $PACKAGE_MANAGER"
node -v
npm -v
git -v | head -n 1

if [ -f package.json ]; then
  echo "[agent:doctor] package.json present"
else
  echo "[agent:error] package.json missing"
  exit 1
fi

if [ -f .env.example ]; then
  echo "[agent:doctor] .env.example present"
else
  echo "[agent:warn] .env.example missing"
fi

if [ -f .env ]; then
  echo "[agent:doctor] .env present"
else
  echo "[agent:warn] .env missing, run bootstrap if needed"
fi

if [ -d .git ]; then
  git status --short --branch
else
  echo "[agent:skip] no git metadata found"
fi

echo "[agent:doctor] complete"

