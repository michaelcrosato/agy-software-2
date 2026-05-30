#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

detect_package_manager() {
  if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
    echo "pnpm"
    return 0
  fi

  if [ -f yarn.lock ] && command -v yarn >/dev/null 2>&1; then
    echo "yarn"
    return 0
  fi

  echo "npm"
}

PACKAGE_MANAGER="$(detect_package_manager)"

require_package_manager() {
  if ! command -v "$PACKAGE_MANAGER" >/dev/null 2>&1; then
    echo "[agent:error] Missing package manager: $PACKAGE_MANAGER"
    return 1
  fi
}

run_package_script() {
  local script_name="$1"

  if node -e "const s=(require('./package.json').scripts||{}); process.exit(Object.prototype.hasOwnProperty.call(s, '$script_name') ? 0 : 1);"; then
    echo "[agent:run] $PACKAGE_MANAGER run $script_name"
    "$PACKAGE_MANAGER" run "$script_name"
    return 0
  fi

  echo "[agent:skip] no script '$script_name' found"
  return 0
}

run_make_or_just() {
  local target="$1"

  if [ -f Makefile ] && command -v make >/dev/null 2>&1 && grep -Eq "^${target}:" Makefile; then
    echo "[agent:run] make $target"
    make "$target"
    return 0
  fi

  if [ -f Justfile ] && command -v just >/dev/null 2>&1 && grep -Eq "^${target}:" Justfile; then
    echo "[agent:run] just $target"
    just "$target"
    return 0
  fi

  echo "[agent:skip] no '$target' target found in Makefile/Justfile"
}
