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

  # Prefer the purpose-specific Pages credential from the shared machine
  # credential store. A project .env may contain a DNS-only token under the
  # legacy CLOUDFLARE_API_TOKEN name; letting Wrangler auto-load that token
  # makes Pages deployments fail with an authentication error.
  local auth_file="${CLOUDFLARE_AUTH_FILE:-$HOME/.cloudflared/api-tokens.json}"
  local pages_token=""
  if [[ -f "$auth_file" ]]; then
    if ! command -v jq &> /dev/null; then
      bash "$LOCK_SCRIPT" release "$project_slug" 2>/dev/null || true
      die "jq is required to read the centralized Cloudflare credential file: $auth_file"
    fi
    if ! pages_token="$(jq -r '.cloudflare.tokens.pages_deploy // empty' "$auth_file")"; then
      bash "$LOCK_SCRIPT" release "$project_slug" 2>/dev/null || true
      die "Invalid centralized Cloudflare credential file: $auth_file"
    fi
    if [[ -z "$pages_token" ]]; then
      bash "$LOCK_SCRIPT" release "$project_slug" 2>/dev/null || true
      die "Missing .cloudflare.tokens.pages_deploy in centralized credential file: $auth_file"
    fi
  fi
  if [[ -n "$pages_token" ]]; then
    echo "🔑 Using centralized Cloudflare Pages credential"
  fi

  # Deploy using wrangler.
  # NOTE: --branch=main is required regardless of the local git branch name.
  # Cloudflare Pages only treats the deployment as "Production" when the
  # branch passed matches the project's configured production branch
  # (default "main"). This repo's local branch is "master"; without this
  # flag, every deploy silently lands as a Preview deployment (its own
  # per-deploy subdomain) and the main `<slug>-dashboard.pages.dev` URL
  # keeps serving Cloudflare's soft-404 template forever — which itself
  # returns HTTP 200, so a plain status-code check won't catch it.
  if [[ -n "$pages_token" ]]; then
    if ! CLOUDFLARE_API_TOKEN="$pages_token" wrangler pages deploy "$dashboard_dir" --project-name="${project_slug}-dashboard" --branch=main 2>&1; then
      bash "$LOCK_SCRIPT" release "$project_slug" 2>/dev/null || true
      die "Deployment failed"
    fi
  elif ! wrangler pages deploy "$dashboard_dir" --project-name="${project_slug}-dashboard" --branch=main 2>&1; then
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

  # Verify URL is accessible AND actually serving the dashboard (Cloudflare's
  # own soft-404 template also returns HTTP 200, so status code alone proves
  # nothing — check for a structural marker instead). id="app" is the mount
  # point every dashboard template has regardless of project name, language,
  # or content, so this check stays valid even after the template's title/
  # copy changes — unlike checking for a specific title string.
  echo "🔍 Verifying accessibility..."
  if command -v curl &> /dev/null; then
    if curl -s "$dashboard_url" | grep -q 'id="app"'; then
      echo "✅ Dashboard is accessible and serving real content"
    else
      die "Dashboard URL returned 200 but did not contain the dashboard's id=\"app\" mount point — likely deployed to Preview, not Production. Check --branch=main was used."
    fi
  fi
}

# Main
if [[ $# -lt 2 ]]; then
  die "Usage: $0 <project-slug> <local-dashboard-dir>"
fi

deploy_dashboard "$@"
