#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "启动失败：需要 Node.js 18 或更高版本。"
  exit 1
fi

node scripts/launcher.js "$@"
