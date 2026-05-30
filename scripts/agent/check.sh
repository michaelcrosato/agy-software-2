#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

echo "[agent:check] lint"
run_package_script lint

echo "[agent:check] typecheck"
run_package_script typecheck

echo "[agent:check] test"
run_package_script test

echo "[agent:check] format"
run_package_script format

echo "[agent:check] complete"

