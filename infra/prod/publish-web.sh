#!/usr/bin/env bash
#
# Builds the admin panel and publishes it as static files.
#
#   sudo ./infra/prod/publish-web.sh
#   sudo ./infra/prod/publish-web.sh --api-url https://dev.api.admin.rationfit.com/api/v1
#
# ⚠️ THE API URL IS BAKED IN AT BUILD TIME.
#
# `next build` with `output: 'export'` inlines every NEXT_PUBLIC_* value into
# the JavaScript. Pointing the panel at a different API is a rebuild, not a
# restart — there is no process to restart. That is also why this script reads
# the URL from .env.prod rather than leaving it to whatever happened to be in
# the shell.
#
# Releases are kept and swapped by symlink, so publishing is atomic — nobody is
# served an index.html that references chunks the deploy has not copied yet —
# and a rollback is one `ln -sfn` away.

set -euo pipefail

API_URL=''
while [ $# -gt 0 ]; do
    case "$1" in
        --api-url)
            API_URL="${2:-}"
            [ -n "$API_URL" ] || {
                echo "--api-url needs a value" >&2
                exit 1
            }
            shift
            ;;
        -h | --help)
            sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            echo "unknown option: $1 (try --help)" >&2
            exit 1
            ;;
    esac
    shift
done

ROOT="$(git rev-parse --show-toplevel)"
ENV_FILE="$ROOT/infra/prod/.env.prod"
TARGET=/var/www/dns-admin
KEEP=3

if [ -z "$API_URL" ] && [ -f "$ENV_FILE" ]; then
    # `|| true`: the key is optional here, and under `set -e` a grep that finds
    # nothing would kill the script mid-assignment with no message.
    API_URL="$(grep -E '^NEXT_PUBLIC_API_URL=' "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
fi

if [ -z "$API_URL" ]; then
    echo "No API URL. Add NEXT_PUBLIC_API_URL to $ENV_FILE or pass --api-url." >&2
    echo "It must include the version prefix, e.g. https://dev.api.admin.rationfit.com/api/v1" >&2
    exit 1
fi

cd "$ROOT"

echo "── 1/4  build (API: $API_URL)"
# Clean, because `out/` is not emptied between builds and a route deleted from
# the source would otherwise stay published forever.
rm -rf apps/web/out apps/web/.next
NEXT_PUBLIC_API_URL="$API_URL" pnpm --filter @dns/web build

[ -f apps/web/out/index.html ] || {
    echo "build produced no out/index.html — did output: 'export' get removed from next.config.ts?" >&2
    exit 1
}

RELEASE="$TARGET/releases/$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"

echo "── 2/4  copy to $RELEASE"
mkdir -p "$RELEASE"
cp -r apps/web/out/. "$RELEASE/"

echo "── 3/4  switch"
# -n so an existing `current` symlink is replaced rather than followed, which
# would nest the new link inside the old target.
ln -sfn "$RELEASE" "$TARGET/current"

# nginx follows the symlink per request, so no reload is needed for the swap —
# only for a change to the vhost itself.
nginx -t
systemctl reload nginx

echo "── 4/4  prune"
# Keeping a few makes a rollback `ln -sfn <release> /var/www/dns-admin/current`
# with no rebuild.
find "$TARGET/releases" -mindepth 1 -maxdepth 1 -type d | sort -r | tail -n "+$((KEEP + 1))" | while read -r old; do
    echo "    removing $(basename "$old")"
    rm -rf "$old"
done

echo
echo "published $(basename "$RELEASE")"
echo "roll back with:  ln -sfn $TARGET/releases/<name> $TARGET/current"
