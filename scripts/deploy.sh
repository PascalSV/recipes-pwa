#!/bin/sh
# Deploys the worker with:
# - COMMIT_SHA: the current git commit, shown on every page's version badge and in
#   Settings — the one reliable way to confirm what's actually live.
# - SW_VERSION: a value unique to THIS deploy (not just this commit — an uncommitted
#   working tree can be deployed more than once with different content but the same
#   git SHA). The service worker uses it as its cache name, so a value that only
#   changes per-commit would fail to invalidate the cache across such deploys. This
#   must change on every single deploy, or the service worker's cacheFirst strategy
#   keeps serving whatever it already has, forever — no-store headers alone do NOT
#   fix this, since they only affect the browser's native HTTP cache, not the
#   service worker's own Cache Storage.
set -e

sha=$(git rev-parse --short HEAD)
if [ -n "$(git status --porcelain)" ]; then
  sha="${sha}-dirty"
fi

exec npx wrangler deploy --var "COMMIT_SHA:${sha}" --var "SW_VERSION:$(date +%s)" "$@"
