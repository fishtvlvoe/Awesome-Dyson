#!/bin/bash

# Add Entry to Dashboard History
# Usage: dashboard-add-entry.sh <project-slug> <dashboard-dir> <date> <topic> <summary> [decisions_json]

set -e

LOCK_SCRIPT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/dashboard-lock.sh"

function die() {
  echo "❌ $@" >&2
  exit 1
}

function add_entry() {
  local project_slug="$1"
  local dashboard_dir="$2"
  local date="$3"
  local topic="$4"
  local summary="$5"
  local decisions_json="${6:-[]}"

  # Validate inputs
  [[ -z "$project_slug" ]] && die "project_slug is required"
  [[ -z "$dashboard_dir" ]] && die "dashboard_dir is required"
  [[ -z "$date" ]] && die "date is required"
  [[ -z "$topic" ]] && die "topic is required"
  [[ -z "$summary" ]] && die "summary is required"

  local entries_dir="$dashboard_dir/entries"
  local manifest_file="$entries_dir/manifest.json"

  # Ensure entries directory exists
  mkdir -p "$entries_dir"

  # Ensure manifest.json exists
  if [[ ! -f "$manifest_file" ]]; then
    echo '{"entries": []}' > "$manifest_file"
  fi

  # Try to acquire lock
  if ! bash "$LOCK_SCRIPT" acquire "$project_slug" >/dev/null 2>&1; then
    die "Failed to acquire lock for $project_slug"
  fi

  # Generate entry filename based on date and topic slug
  local topic_slug=$(echo "$topic" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/-$//')
  local entry_file="${date}-${topic_slug}.json"
  local entry_path="$entries_dir/$entry_file"

  # Check if entry already exists (shouldn't, but be safe)
  local counter=1
  while [[ -f "$entry_path" ]]; do
    entry_file="${date}-${topic_slug}-${counter}.json"
    entry_path="$entries_dir/$entry_file"
    ((counter++))
  done

  # Create entry JSON
  local entry_json=$(cat <<EOF
{
  "date": "$date",
  "topic": "$topic",
  "summary": "$summary",
  "decisions": $decisions_json,
  "links": []
}
EOF
)

  # Write entry file
  echo "$entry_json" > "$entry_path"
  echo "✅ Entry created: $entry_file"

  # Update manifest.json
  local manifest_json=$(cat "$manifest_file")
  local new_manifest=$(echo "$manifest_json" | jq ".entries += [{\"date\": \"$date\", \"topic\": \"$topic\", \"file\": \"$entry_file\"}]")
  echo "$new_manifest" > "$manifest_file"
  echo "✅ Manifest updated"

  # Release lock
  bash "$LOCK_SCRIPT" release "$project_slug" >/dev/null 2>&1

  echo "✅ Entry added successfully: $entry_file"
}

# Main
if [[ $# -lt 5 ]]; then
  die "Usage: $0 <project-slug> <dashboard-dir> <date> <topic> <summary> [decisions_json]"
fi

add_entry "$@"
