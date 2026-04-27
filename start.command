#!/usr/bin/env bash
# Beacon · CNIT 566 Final Project
# Author: Udaya Tejas
#
# Double-clickable launcher for macOS / Linux.
# - Verifies Node.js is installed
# - Installs dependencies on first run
# - Runs DB migrations + seeds the demo Purdue account
# - Builds the production bundle
# - Starts the server and opens http://localhost:3000

set -e

# Move to the directory this script lives in (so double-clicking from
# Finder or running from anywhere both work).
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$SCRIPT_DIR"

PORT="${PORT:-3000}"

print_step() {
  echo ""
  echo "── $1 ──────────────────────────"
}

check_node() {
  if ! command -v node >/dev/null 2>&1; then
    cat <<'MSG'
Node.js is not installed.

Install it from https://nodejs.org (version 20 or newer), then double-click
this file again. On macOS, you can also run:

    brew install node

MSG
    read -n 1 -s -r -p "Press any key to close…"
    exit 1
  fi
  NODE_MAJOR=$(node -v | sed -E 's/v([0-9]+)\..*/\1/')
  if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "Beacon needs Node.js 20+. Found $(node -v)."
    read -n 1 -s -r -p "Press any key to close…"
    exit 1
  fi
}

ensure_install() {
  if [ ! -d "node_modules" ]; then
    print_step "Installing dependencies (~1–2 min, first run only)"
    npm install
  fi
}

ensure_db() {
  if [ ! -f "data/beacon.sqlite" ]; then
    print_step "Setting up the local database + demo data"
    npm run db:migrate
    npm run db:seed
  fi
}

ensure_build() {
  if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
    print_step "Building Beacon (~30 sec, first run only)"
    npm run build
  fi
}

open_browser() {
  # Delay so the server has a moment to start.
  ( sleep 3 && (
      if command -v open >/dev/null 2>&1; then
        open "http://localhost:${PORT}"
      elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:${PORT}"
      fi
    )
  ) &
}

main() {
  print_step "Beacon — CNIT 566 Final Project"
  echo "Author: Udaya Tejas"
  check_node
  ensure_install
  ensure_db
  ensure_build

  cat <<MSG

──────────────────────────────────────────
Beacon is starting on http://localhost:${PORT}

Sign in:
    demo@purdue.edu / purdue123

The browser will open in a moment.
Press Ctrl-C in this window to stop the app.
──────────────────────────────────────────
MSG

  open_browser
  PORT="$PORT" npm run start
}

main
