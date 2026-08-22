#!/bin/bash

# Dashboard Lock Mechanism
# Usage: dashboard-lock.sh acquire|release|check <project-slug>
# Lock location: ~/.claude/locks/dev-dashboards/<project-slug>.lock

set -e

LOCK_DIR="$HOME/.claude/locks/dev-dashboards"
LOCK_EXPIRY_SECONDS=$((10 * 60))  # 10 minutes

function die() {
  echo "❌ $@" >&2
  exit 1
}

function acquire_lock() {
  local project_slug="$1"
  local lock_file="$LOCK_DIR/${project_slug}.lock"
  local holder="${HOLDER:-$(whoami)-$(date +%s)}"
  local acquired_at=$(date -u +"%Y-%m-%dT%H:%M:%S%z")

  # Ensure lock directory exists
  mkdir -p "$LOCK_DIR"

  # Check if lock already exists and is still valid
  if [[ -f "$lock_file" ]]; then
    local lock_content=$(cat "$lock_file")
    local lock_holder=$(echo "$lock_content" | jq -r '.holder' 2>/dev/null || echo "unknown")
    local lock_acquired=$(echo "$lock_content" | jq -r '.acquired_at' 2>/dev/null || echo "0")

    # Parse ISO timestamp and check if expired
    if [[ -n "$lock_acquired" && "$lock_acquired" != "0" ]]; then
      # Convert ISO 8601 to Unix timestamp for comparison
      local lock_timestamp=$(date -j -f "%Y-%m-%dT%H:%M:%S%z" "$lock_acquired" +%s 2>/dev/null || echo "0")
      local current_timestamp=$(date +%s)
      local age=$((current_timestamp - lock_timestamp))

      if (( age < LOCK_EXPIRY_SECONDS )); then
        die "${project_slug} 儀表板目前被 ${lock_holder} 鎖住，${lock_acquired} 開始，請稍後再試"
      else
        # Lock is expired, remove it
        rm -f "$lock_file"
      fi
    fi
  fi

  # Create new lock
  local lock_json=$(cat <<EOF
{
  "holder": "$holder",
  "acquired_at": "$acquired_at"
}
EOF
)
  echo "$lock_json" > "$lock_file"
  echo "✅ Lock acquired for $project_slug by $holder"
}

function release_lock() {
  local project_slug="$1"
  local lock_file="$LOCK_DIR/${project_slug}.lock"

  if [[ -f "$lock_file" ]]; then
    rm -f "$lock_file"
    echo "✅ Lock released for $project_slug"
  else
    echo "⚠️  No lock found for $project_slug"
  fi
}

function check_lock() {
  local project_slug="$1"
  local lock_file="$LOCK_DIR/${project_slug}.lock"

  if [[ -f "$lock_file" ]]; then
    local lock_content=$(cat "$lock_file")
    local lock_holder=$(echo "$lock_content" | jq -r '.holder' 2>/dev/null || echo "unknown")
    local lock_acquired=$(echo "$lock_content" | jq -r '.acquired_at' 2>/dev/null || echo "unknown")

    # Check if expired
    if [[ -n "$lock_acquired" && "$lock_acquired" != "unknown" ]]; then
      local lock_timestamp=$(date -j -f "%Y-%m-%dT%H:%M:%S%z" "$lock_acquired" +%s 2>/dev/null || echo "0")
      local current_timestamp=$(date +%s)
      local age=$((current_timestamp - lock_timestamp))

      if (( age >= LOCK_EXPIRY_SECONDS )); then
        echo "🔓 Lock for $project_slug is expired (age: ${age}s, expiry: ${LOCK_EXPIRY_SECONDS}s)"
        return 1
      fi
    fi

    echo "🔒 Lock for $project_slug is held by $lock_holder (acquired: $lock_acquired)"
    return 0
  else
    echo "🔓 No lock for $project_slug"
    return 1
  fi
}

# Main
if [[ $# -lt 2 ]]; then
  die "Usage: $0 acquire|release|check <project-slug>"
fi

COMMAND="$1"
PROJECT_SLUG="$2"

case "$COMMAND" in
  acquire)
    acquire_lock "$PROJECT_SLUG"
    ;;
  release)
    release_lock "$PROJECT_SLUG"
    ;;
  check)
    check_lock "$PROJECT_SLUG"
    ;;
  *)
    die "Unknown command: $COMMAND. Use acquire|release|check"
    ;;
esac
