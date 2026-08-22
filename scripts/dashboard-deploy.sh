#!/bin/bash

# Deploy dashboard to Cloudflare Pages
# Usage: dashboard-deploy.sh <project-slug> <local-dashboard-dir>

set -e

LOCK_SCRIPT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/dashboard-lock.sh"

function die() {
  echo "❌ $@" >&2
  exit 1
}

function deploy_dashboard() {
  local project_slug="$1"
  local dashboard_dir="$2"

  # Validate inputs
  [[ -z "$project_slug" ]] && die "project_slug is required"
  [[ -z "$dashboard_dir" ]] && die "dashboard_dir is required"
  [[ ! -d "$dashboard_dir" ]] && die "dashboard_dir does not exist: $dashboard_dir"

  echo "📦 Deploying dashboard for $project_slug..."

  # Check if wrangler is available
  if ! command -v wrangler &> /dev/null; then
    die "wrangler CLI not found. Install with: npm install -g wrangler"
  fi

  # Acquire lock
  if ! bash "$LOCK_SCRIPT" acquire "$project_slug" >/dev/null 2>&1; then
    die "Failed to acquire lock for $project_slug. Dashboard may be in use."
  fi

  echo "🔒 Lock acquired, starting deployment..."

  # Deploy using wrangler
  if ! wrangler pages deploy "$dashboard_dir" --project-name="${project_slug}-dashboard" 2>&1; then
    bash "$LOCK_SCRIPT" release "$project_slug" 2>/dev/null || true
    die "Deployment failed"
  fi

  echo "✅ Deployment completed"

  # Release lock
  bash "$LOCK_SCRIPT" release "$project_slug" >/dev/null 2>&1 || true

  # Print dashboard URL
  local dashboard_url="https://${project_slug}-dashboard.pages.dev"
  echo ""
  echo "🎉 Dashboard deployed successfully!"
  echo "📍 URL: $dashboard_url"
  echo ""

  # Verify URL is accessible
  echo "🔍 Verifying accessibility..."
  if command -v curl &> /dev/null; then
    if curl -s -o /dev/null -w "%{http_code}" "$dashboard_url" | grep -q "200"; then
      echo "✅ Dashboard is accessible"
    else
      echo "⚠️  Dashboard may not be accessible yet (DNS propagation delay)"
    fi
  fi
}

# Main
if [[ $# -lt 2 ]]; then
  die "Usage: $0 <project-slug> <local-dashboard-dir>"
fi

deploy_dashboard "$@"
