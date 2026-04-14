# Project Guidelines

## Project Context
- This workspace is a Vue 3 + n8n IT asset request system.
- UI and business terms are primarily Thai. Keep Thai labels/messages consistent with existing screens.
- End-to-end flow: Vue form submits to n8n webhook -> n8n updates Google Sheets -> admin approves from UI.

## Architecture
- Frontend stack: Vue 3 (Composition API), Vue Router, Bootstrap 5.
- Main pages are in `src/views/`:
  - `Register.vue`: request form and admin prefill mode.
  - `AdminApprove.vue`: approval dashboard and decision posting.
  - `AboutView.vue`: request dashboard and table view.
- Routing is centralized in `src/router/index.js`.
- Store exists but is mostly unused (`src/store/index.js` is empty); prefer local component state unless asked to introduce shared state.

## Build And Run
- Install: `npm install`
- Frontend dev: `npm run serve`
- Frontend build: `npm run build`
- n8n stack: `docker compose up -d` and `docker compose down`
- There is no test script in `package.json`; if adding tests, add scripts explicitly.

## Conventions
- Use environment variables for webhook URLs first, then fallback to localhost defaults.
  - `VUE_APP_N8N_WEBHOOK_URL`
  - `VUE_APP_N8N_READ_WEBHOOK_URL`
  - `VUE_APP_N8N_APPROVE_WEBHOOK_URL`
  - `VUE_APP_N8N_USE_TEST_WEBHOOK`
- Keep payload compatibility with existing n8n/Google Sheets mapping; Thai keys are used in form submission payloads.
- Existing date/time display uses `toLocaleString('th-TH', { hour12: false })`; preserve this unless requested.
- Follow existing Composition API style (`ref`, `reactive`, `computed`, lifecycle hooks) and keep components self-contained.

## Critical Gotchas
- Frontend runs on port 8080 and n8n on 5678; cross-origin calls can fail without proper CORS setup in n8n flow/endpoint.
- `N8N_ENCRYPTION_KEY` in `docker-compose.yml` must remain stable for existing credentials/workflows in `n8n_data`.
- Admin prefill mode is query-driven (`/register?mode=admin...`); do not assume query values are trusted input.
- Approval/read flows support varying response shapes (`array`, `data`, `items`); preserve normalization behavior when refactoring.

## Key References
- Setup and workflow overview: `README.md`
- Exported n8n workflows: `Json/admin.json`, `Json/asset-approval-final.json`
