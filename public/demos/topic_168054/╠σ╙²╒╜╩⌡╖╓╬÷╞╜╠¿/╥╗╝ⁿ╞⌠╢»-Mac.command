#!/bin/bash
# Sports Tactics Analysis Platform - Mac Launcher
# Frontend demo mode only (no backend needed)

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=================================================="
echo "   Sports Tactics Analysis Platform"
echo "   Opening frontend demo in browser..."
echo "=================================================="

# Try Python3 server first, fallback to direct file open
if command -v python3 &> /dev/null; then
    cd "$DIR/frontend/dist"
    python3 -m http.server 5173 &
    SERVER_PID=$!
    sleep 1
    open "http://localhost:5173"
    echo ""
    echo "Server running at http://localhost:5173"
    echo "Press Ctrl+C to stop."
    wait $SERVER_PID
else
    echo "Python3 not found, opening index.html directly..."
    open "$DIR/frontend/dist/index.html"
fi
