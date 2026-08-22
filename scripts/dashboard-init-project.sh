#!/bin/bash

# Initialize dashboard for a new project
# Usage: dashboard-init-project.sh <project-slug> [cloudflare-account-id]

set -e

REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
TEMPLATE_DIR="$REPO_ROOT/public"
DEPLOY_SCRIPT="$REPO_ROOT/scripts/dashboard-deploy.sh"
LOCK_SCRIPT="$REPO_ROOT/scripts/dashboard-lock.sh"

function die() {
  echo "❌ $@" >&2
  exit 1
}

function init_dashboard() {
  local project_slug="$1"

  [[ -z "$project_slug" ]] && die "project_slug is required"

  echo "📊 Initializing dashboard for $project_slug..."

  # Create local dashboard directory
  local dashboard_dir="$HOME/.local/share/dev-dashboards/$project_slug"
  mkdir -p "$dashboard_dir"

  # Copy template files
  echo "📋 Setting up template files..."
  cp -r "$TEMPLATE_DIR"/* "$dashboard_dir/"

  # Create initial state.json
  echo "📝 Creating initial state..."
  local state_json=$(cat <<EOF
{
  "project": "$project_slug",
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%S%z")",
  "updated_by": "system-init",
  "one_liner": "Project dashboard for $project_slug",
  "changes_in_progress": [],
  "open_questions": [],
  "key_files": [
    "README.md",
    "CLAUDE.md"
  ],
  "connected_systems": []
}
EOF
)
  echo "$state_json" > "$dashboard_dir/state.json"

  # Verify wrangler is available
  if ! command -v wrangler &> /dev/null; then
    die "wrangler CLI not found. Install with: npm install -g wrangler"
  fi

  # Check wrangler authentication
  if ! wrangler whoami >/dev/null 2>&1; then
    echo "⚠️  Not authenticated with Cloudflare. Running 'wrangler login'..."
    wrangler login
  fi

  # Create Cloudflare Pages project
  echo "🌩️  Creating Cloudflare Pages project..."
  if ! wrangler pages project create "${project_slug}-dashboard" --production-branch main 2>&1 | grep -q "Successfully created"; then
    echo "⚠️  Pages project may already exist, proceeding with deployment..."
  fi

  # Deploy initial version
  echo "🚀 Deploying initial dashboard version..."
  if ! bash "$DEPLOY_SCRIPT" "$project_slug" "$dashboard_dir"; then
    die "Deployment failed"
  fi

  # Output summary
  local dashboard_url="https://${project_slug}-dashboard.pages.dev"
  echo ""
  echo "✅ Dashboard initialized successfully!"
  echo "📍 Dashboard URL: $dashboard_url"
  echo "📁 Local directory: $dashboard_dir"
  echo ""
  echo "Next steps:"
  echo "1. Update state.json with project details"
  echo "2. Use 'dashboard-add-entry.sh' to record work sessions"
  echo "3. Deploy updates with 'dashboard-deploy.sh'"
}

# Main
init_dashboard "$@"
