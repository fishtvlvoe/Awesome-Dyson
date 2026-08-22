## ADDED Requirements

### Requirement: Single fixed dashboard URL per project

Each development project SHALL have exactly one persistent dashboard URL hosted on Cloudflare Pages (`<project-slug>.pages.dev`), not bound to a custom domain that may be unreachable from a different machine or network.

#### Scenario: Opening the dashboard from a different machine

- **WHEN** a person or AI agent on a machine without the project's custom domain configured opens the dashboard URL
- **THEN** the Cloudflare Pages URL SHALL resolve and render the dashboard without requiring any custom DNS setup

### Requirement: Machine-readable state alongside human-readable page

The dashboard SHALL publish its current status as a plain JSON file (`state.json`) reachable at a stable path, separate from the human-facing rendered page, so any AI agent can fetch structured facts via a single HTTP GET without rendering or screenshotting the page.

#### Scenario: An AI agent with no prior context reads project status

- **WHEN** an AI agent fetches `<dashboard-url>/state.json`
- **THEN** the response SHALL be valid JSON containing at minimum: project name, one-line summary, in-progress change items with done/total counts, open questions, and key file paths
- **THEN** the agent SHALL NOT need to parse HTML or take a screenshot to obtain these facts

### Requirement: Append-only history entries

Each work session or discussion that materially changes project understanding or decisions SHALL be recorded as a new, individually-addressable entry file under `entries/`, never by editing a previous entry file.

#### Scenario: Two agents each add a history entry around the same time

- **WHEN** agent A and agent B each create a new entry file for their own session within the same short time window
- **THEN** both entry files SHALL persist without either overwriting the other
- **THEN** `entries/manifest.json` SHALL be updated to list both entries (as two separate updates, each going through the single-writer lock below)

### Requirement: Single-writer lock for dashboard updates

Before writing to any part of a project's dashboard (`state.json`, `entries/manifest.json`, or adding a new entry file), an agent SHALL check a lock file at a fixed, project-scoped path outside the git repository. If a valid (non-expired) lock exists, the agent SHALL NOT write and SHALL inform the user that the dashboard is currently locked by another agent.

#### Scenario: Second agent attempts to write while a lock is held

- **WHEN** agent A holds a valid lock for project X's dashboard
- **AND** agent B attempts to update project X's dashboard before the lock is released or expired
- **THEN** agent B SHALL detect the existing lock and abort the write
- **THEN** agent B SHALL report to the user that the dashboard is locked, including who holds it and since when

#### Scenario: Lock expires after agent crash or interruption

- **WHEN** a lock file's timestamp is older than the configured expiry (default 10 minutes)
- **THEN** a new agent attempting to write SHALL treat the lock as stale, remove it, and acquire a fresh lock
- **THEN** the new agent SHALL proceed with its write

### Requirement: No backend code or database required

The dashboard SHALL be deployable and updatable using only static file uploads (HTML/CSS/JS/JSON) to Cloudflare Pages. No Cloudflare Worker, D1 database, or other backend service SHALL be required for core functionality (viewing status, viewing history, updating status, adding history entries).

#### Scenario: Deploying a brand-new project's dashboard

- **WHEN** a new project is initialized
- **THEN** setting up its dashboard SHALL require only creating a Cloudflare Pages project and uploading the template files plus an initial `state.json`
- **THEN** no server-side code SHALL need to be written or deployed for the dashboard to function
