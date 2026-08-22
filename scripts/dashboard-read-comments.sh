#!/bin/bash

# Read comments for a project's dashboard without opening a browser.
# Usage: dashboard-read-comments.sh <project-slug>

set -e

WORKER_URL="https://dashboard-comments.fishandy1213.workers.dev"

function die() {
  echo "❌ $@" >&2
  exit 1
}

project_slug="$1"
[[ -z "$project_slug" ]] && die "Usage: $0 <project-slug>"

if command -v jq &> /dev/null; then
  curl -s "${WORKER_URL}/comments?project=${project_slug}" | jq .
else
  curl -s "${WORKER_URL}/comments?project=${project_slug}"
fi
