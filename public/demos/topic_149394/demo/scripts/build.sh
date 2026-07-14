#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

DIST_DIR="$ROOT_DIR/dist"

ZIP_DIR="$ROOT_DIR/release"

VERSION=$(grep -o '"version": "[^"]*"' "$ROOT_DIR/manifest.json" | sed 's/"version": "\([^"]*\)"/\1/')

ZIP_NAME="VidBuddy-v${VERSION}.zip"


echo "🚀 开始构建 v${VERSION}..."

rm -rf "$DIST_DIR"

mkdir -p "$DIST_DIR"


echo "📦 复制插件文件..."

cp "$ROOT_DIR/manifest.json" "$DIST_DIR/"
cp "$ROOT_DIR/rules.json" "$DIST_DIR/"
cp "$ROOT_DIR/content_style.css" "$DIST_DIR/"

cp -R "$ROOT_DIR/icons" "$DIST_DIR/"
cp -R "$ROOT_DIR/content" "$DIST_DIR/"
cp -R "$ROOT_DIR/shared" "$DIST_DIR/"
cp -R "$ROOT_DIR/dashboard" "$DIST_DIR/"
cp -R "$ROOT_DIR/popup" "$DIST_DIR/"


echo "🛡️ 开始 JS 混淆..."

find "$DIST_DIR" -name "*.js" -exec javascript-obfuscator {} --output {} --compact true --string-array true --string-array-encoding 'base64' \;


echo "🗜️ 开始打包..."

mkdir -p "$ZIP_DIR"

rm -f "$ZIP_DIR/$ZIP_NAME"


cd "$DIST_DIR"

zip -r "$ZIP_DIR/$ZIP_NAME" .

cp "$ZIP_DIR/$ZIP_NAME" "$DIST_DIR/VidBuddy.zip"
cp "$ZIP_DIR/$ZIP_NAME" "$DIST_DIR/VidBuddy-v${VERSION}.zip"


echo "✅ 构建完成!"
echo "📦 输出:"
echo "$ZIP_DIR/$ZIP_NAME"