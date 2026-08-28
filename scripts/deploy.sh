#!/bin/sh
# Deploys the worker with the current git commit baked in as COMMIT_SHA, shown on
# every page's version badge (bottom-left) and in Settings — the one reliable way
# to confirm what's actually live, independent of any client-side caching.
set -e

sha=$(git rev-parse --short HEAD)
if [ -n "$(git status --porcelain)" ]; then
  sha="${sha}-dirty"
fi

exec npx wrangler deploy --var "COMMIT_SHA:${sha}" "$@"
