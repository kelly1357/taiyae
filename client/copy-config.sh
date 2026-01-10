#!/bin/bash
# Copy staticwebapp.config.json to the build output directory before deployment

set -e

SRC_DIR="$(dirname "$0")"
CONFIG_FILE="$SRC_DIR/staticwebapp.config.json"
DIST_DIR="$SRC_DIR/dist"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "staticwebapp.config.json not found in $SRC_DIR"
  exit 1
fi

cp "$CONFIG_FILE" "$DIST_DIR/staticwebapp.config.json"
echo "Copied staticwebapp.config.json to $DIST_DIR/"
