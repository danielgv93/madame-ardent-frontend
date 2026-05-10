#!/usr/bin/env bash

set -euo pipefail

DIR="${1:-.}"
QUALITY="${2:-85}"

if ! command -v convert >/dev/null 2>&1; then
  echo "Error: necesitas ImageMagick 6 instalado, con el comando 'convert'."
  echo "Ubuntu/Debian: sudo apt install imagemagick"
  exit 1
fi

shopt -s nullglob nocaseglob

for file in "$DIR"/*.avif; do
  output="${file%.*}.webp"

  echo "Convirtiendo: $file -> $output"
  convert "$file" -quality "$QUALITY" "$output"
done

echo "Listo."
