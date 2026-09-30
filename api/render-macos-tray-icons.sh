#!/usr/bin/env bash
# Requires ImageMagick. Render alpha-only template icons at 1x and Retina sizes.
set -euo pipefail
cd "$(dirname "$0")/.."
render_dir=$(mktemp -d)
trap 'rm -rf "$render_dir"' EXIT

for label in 1 2 3 4 5 6 7 8 9 9+; do
  badge_width=48
  point_size=56
  if [[ "$label" == '9+' ]]; then
    badge_width=72
    point_size=46
  fi
  left=$((128 - badge_width))

  # Keep the logo, with a transparent gap around a solid badge whose digits
  # are cut out. macOS supplies the foreground color in light and dark mode.
  magick api/icons/iconTemplate@2x.png -resize 104x104 \
    -gravity southwest -background none -extent 128x128 \
    -alpha extract -fill black \
    -draw "rectangle $((left - 8)),0 127,72" \
    -fill white -draw "roundrectangle $left,0 127,63 8,8" \
    "$render_dir/mask.png"
  magick -size "${badge_width}x64" xc:none \
    -font DejaVu-Sans-Bold -pointsize "$point_size" \
    -fill black -gravity center -annotate +0+0 "$label" \
    "$render_dir/text.png"
  magick "$render_dir/mask.png" "$render_dir/text.png" \
    -geometry "+${left}+0" -compose over -composite \
    "$render_dir/mask.png"
  magick -size 128x128 xc:black "$render_dir/mask.png" \
    -alpha off -compose CopyOpacity -composite \
    -filter Lanczos -resize 16x16 \
    "api/icons/live-${label}Template.png"
  magick -size 128x128 xc:black "$render_dir/mask.png" \
    -alpha off -compose CopyOpacity -composite \
    -filter Lanczos -resize 32x32 \
    "api/icons/live-${label}Template@2x.png"
done
