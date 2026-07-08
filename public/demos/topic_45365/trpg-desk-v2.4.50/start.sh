#!/bin/bash
# TRPG Desk v2.4.50 - Mac/Linux launcher
cd "$(dirname "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

PORT=3000
while [ "$#" -gt 0 ]; do
  case "$1" in
    --port) PORT="$2"; shift 2;;
    --port=*) PORT="${1#*=}"; shift;;
    -h|--help)
      echo "Usage: ./start.sh [--port N]"
      exit 0;;
    *) shift;;
  esac
done

echo -e "${CYAN}${BOLD}"
echo "  ============================================"
echo "    TRPG Desk v2.4.50"
echo "  ============================================"
echo -e "${NC}"

if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}ERROR: Node.js not found${NC}"
  echo ""
  echo "TRPG Desk requires Node.js to run."
  echo ""
  echo -e "${YELLOW}Option 1: Download from website (easiest)${NC}"
  echo "  1. Open https://nodejs.org/ in your browser"
  echo "  2. Download the LTS version (.pkg installer)"
  echo "  3. Double-click to install, click Next all the way"
  echo "  4. Close this terminal, double-click start.command again"
  echo ""
  echo -e "${YELLOW}Option 2: Install with Homebrew${NC}"
  echo "  brew install node"
  echo ""
  echo "After installing Node.js, run this script again."
  exit 1
fi
NODE_VER=$(node -v)
echo -e "${GREEN}[OK] node${NC} ${NODE_VER}"

if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}ERROR: npm not found${NC}"
  exit 1
fi
NPM_VER=$(npm -v)
echo -e "${GREEN}[OK] npm${NC}  ${NPM_VER}"

if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}-> Installing dependencies (first run)...${NC}"
  if ! npm install --omit=dev; then
    echo -e "${RED}ERROR: npm install failed${NC}"
    echo "Check your network or run: npm install"
    exit 1
  fi
  echo -e "${GREEN}[OK] Dependencies installed${NC}"
fi
[ -d "node_modules" ] && echo -e "${GREEN}[OK] Dependencies ready${NC}"

if command -v lsof >/dev/null 2>&1; then
  if lsof -i :$PORT >/dev/null 2>&1; then
    echo -e "${YELLOW}WARN: Port $PORT is in use, freeing it...${NC}"
    lsof -ti :$PORT | xargs kill -9 2>/dev/null
    sleep 1
  fi
fi

echo $$ > .trpg-desk.pid

URL="http://localhost:$PORT"
(
  sleep 2.5
  if [ "$(uname)" = "Darwin" ]; then
    open "$URL" 2>/dev/null || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" 2>/dev/null || true
  fi
) &

export PORT
echo -e "${BLUE}${BOLD}Starting server... Browser will open $URL${NC}"
echo -e "${BLUE}If browser doesn't open, visit: $URL${NC}"
echo -e "${BLUE}(Press Ctrl+C to stop)${NC}"
echo "------------------------------------------"
exec node server.js
