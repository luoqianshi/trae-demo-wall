#!/bin/bash
cd "$(dirname "$0")"
echo "Stopping TRPG Desk..."
if [ -f .trpg-desk.pid ]; then
  PID=$(cat .trpg-desk.pid)
  kill -9 $PID 2>/dev/null && echo "Stopped PID $PID"
  rm -f .trpg-desk.pid
else
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti :3000 | xargs kill -9 2>/dev/null && echo "Stopped"
  fi
fi
echo "Done."
