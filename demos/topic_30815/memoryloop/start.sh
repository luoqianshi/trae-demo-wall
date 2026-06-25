#!/usr/bin/env bash
# Memory Loop - Unix/macOS startup script
# Launches the local server and opens the dashboard

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "  Starting Memory Loop..."
echo ""

# Start server in background
node "$SCRIPT_DIR/server/server.js" &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Open browser
if command -v open >/dev/null 2>&1; then
  open http://localhost:3721
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost:3721
fi

echo "  Dashboard opened at http://localhost:3721"
echo "  Press Ctrl+C to stop."
echo ""

# Wait for server process
wait $SERVER_PID
