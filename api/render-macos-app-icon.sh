#!/usr/bin/env bash
# Requires ImageMagick and Node.js. ICNS entries contain PNGs at each size.
set -euo pipefail
cd "$(dirname "$0")/.."
render_dir=$(mktemp -d)
trap 'rm -rf "$render_dir"' EXIT
for size in 16 32 64 128 256 512 1024; do
  magick api/icons/app-icon-macos.png -resize "${size}x${size}" "PNG32:$render_dir/$size.png"
done
node - "$render_dir" <<'JS'
const fs = require('node:fs');
const path = require('node:path');
const entries = [
  ['icp4', 16], ['icp5', 32], ['icp6', 64], ['ic07', 128],
  ['ic08', 256], ['ic09', 512], ['ic10', 1024],
].map(([type, size]) => {
  const png = fs.readFileSync(path.join(process.argv[2], `${size}.png`));
  const header = Buffer.alloc(8);
  header.write(type);
  header.writeUInt32BE(png.length + 8, 4);
  return Buffer.concat([header, png]);
});
const header = Buffer.alloc(8);
header.write('icns');
header.writeUInt32BE(8 + entries.reduce((sum, entry) => sum + entry.length, 0), 4);
fs.writeFileSync('api/icons/klpq.icns', Buffer.concat([header, ...entries]));
JS
