#!/bin/sh
# Serve dist/ with the real nginx.conf (so the real CSP headers) on a local port. `npm run dev` is the
# quick loop, but the Vite dev server injects inline <style> tags that the CSP forbids, so this is the
# run that proves a page works in production. Two terminals:
#   npx vitepress build && PORT=41300 scripts/dev-nginx.sh
# Stops with Ctrl-C (or `docker rm -f mu-docs-dev`). Needs Docker.
set -eu
here=$(cd "$(dirname "$0")/.." && pwd)
PORT=${PORT:-41300}
NAME=${NAME:-mu-docs-dev}
[ -f "$here/dist/index.html" ] || { echo "no $here/dist: run \`npm run build\` first" >&2; exit 1; }
conf=${CONF:-$HOME/.cache/mu-docs-dev.conf}
mkdir -p "$(dirname "$conf")"
sed -e "s|listen 80;|listen ${PORT};|" -e '/listen \[::\]:80;/d' "$here/nginx.conf" > "$conf"
chmod 644 "$conf"
exec docker run --rm --name "$NAME" --network host \
  -v "$conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$here/dist:/usr/share/nginx/html:ro" \
  nginx:stable-alpine
