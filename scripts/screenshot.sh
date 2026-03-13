#!/usr/bin/env bash
# Generate CLI screenshots for the README.
# Requires: freeze (https://github.com/charmbracelet/freeze)
# Usage: npm run screenshot

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/wireframes"

npm run build --silent

FREEZE_OPTS=(
  --language ansi
  --theme dracula
  --background "#000000"
  --window
  --padding 24
  --margin 0
  --font.size 13
  --width 900
)

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

echo "Generating cli-messy-output.png..."
FORCE_COLOR=1 node "$REPO_ROOT/dist/index.js" audit "$REPO_ROOT/examples/messy-tokens.json" >"$TMP" 2>&1 || true
freeze "${FREEZE_OPTS[@]}" --output "$OUT_DIR/cli-messy-output.png" < "$TMP"

echo "Generating cli-healthy-output.png..."
FORCE_COLOR=1 node "$REPO_ROOT/dist/index.js" audit "$REPO_ROOT/examples/healthy-tokens.json" >"$TMP" 2>&1 || true
freeze "${FREEZE_OPTS[@]}" --output "$OUT_DIR/cli-healthy-output.png" < "$TMP"

echo "Done. Screenshots written to wireframes/"
