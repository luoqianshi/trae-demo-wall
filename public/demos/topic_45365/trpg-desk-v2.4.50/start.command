#!/bin/bash
# Mac double-click launcher
cd "$(dirname "$0")"
chmod +x start.sh stop.sh start.command 2>/dev/null || true
xattr -rd com.apple.quarantine . 2>/dev/null || true
exec bash start.sh "$@"
