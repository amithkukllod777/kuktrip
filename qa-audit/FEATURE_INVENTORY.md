# Feature Inventory & Architecture

**Audited @ `main`.** Server-side integrations were traced to file level; the full server route list and some client route details were **partially** covered before a session limit interrupted the inventory pass (see `AUDIT_EXECUTION_PLAN.md`).

## Application

- **Name / purpose:** Kuk Trip (rebrand of "TREK") — self-hosted collaborative **travel planner** (trips, itinerary, maps, budget, packing, reservations, documents, real-time sync).
- **Platforms:** Web (React 19 + Vite) with **PWA + offline**; no native mobile app. Server: Node + Express + **NestJS** modules (`server/src/nest/*`) with legacy `server/src/services/*`. An **MCP** server (`/mcp`) exposes the trip model to LLM clients.
- **Monorepo:** `client/` (React), `server/` (Node/Nest), `shared/` (`@trek/shared`: i18n, types), `plugin-sdk/`.
- **Data store:** **SQLite** (`better-sqlite3`), DB file at `TREK_DB_FILE`; local-disk uploads (`server/uploads`); backups zip DB + uploads to `data/backups/` on a cron.
- **Realtime:** WebSocket sync for collaborative editing.

## Authentication & roles

- **Methods:** password (username/email), **OIDC/SSO** (`/api/auth/oidc/*`, with oidc-only mode), **passkeys/WebAuthn** (`@simplewebauthn`), **TOTP MFA** step-up, **invite tokens**, **demo mode**, must-change-password flow. Session via cookie (secure-cookie handling with an explicit HTTP warning path).
- **Roles:** admin vs user (admin-gated settings, LLM/Ollama management, keys). Fine-grained per-resource authorization on trips/files/collab (see `SECURITY_AUDIT.md`).

## Client surface (pages — `client/src/pages/`)

Dashboard, Atlas (world map/boundaries), Collections, Files, Journey / JourneyDetail / JourneyPublic, TripPlanner, Vacay, Trips/*, Settings, Admin, Login / Register / ForgotPassword / ResetPassword, OAuthAuthorize, JoinTrip, SharedTrip, InAppNotifications, Help, Plugin/PluginPage. Routing is lazy-loaded in `client/src/App.tsx`.

## External integrations (server — file-grounded)

- **Maps/geo (server-proxied, SSRF-guarded):** OSM **Nominatim** + **Overpass** (`OVERPASS_URL`, `OVERPASS_TIMEOUT_MS`) + optional **Google Places** (key per-user/admin in DB, kill-switches in `app_settings`) — `services/mapsService.ts`. **Transit** via Transitous/MOTIS (`TRANSIT_API_URL`) — `services/transitService.ts`. **Airports** in-memory dataset. **Atlas** bundled geoBoundaries GeoJSON (offline).
- **Client map renderers:** Leaflet + react-leaflet-cluster (raster, offline-capable), Mapbox GL, MapLibre GL.
- **Photos/memories:** self-hosted **Immich** & **Synology Photos** (per-user creds, encrypted), local TREK photos, **Unsplash** (`UNSPLASH_ACCESS_KEY` → per-user/admin). Photo caches with TTL sweeps.
- **AI/LLM:** providers `local | openai | anthropic` (`services/llmConfig.ts`); **Ollama** local management; **KItinerary** external binary (`KITINERARY_EXTRACTOR_PATH`) for booking extraction; grammar-enforced extraction router.
- **AirTrail:** flight-log two-way sync (cron poll, snapshot-hash change detection; `Bearer` key, SSRF-guarded).
- **Notifications:** in-app (typed rows) + **email** (nodemailer SMTP: `SMTP_HOST/PORT/USER/PASS/FROM`, `SMTP_SKIP_TLS_VERIFY`) + **webhook** (Discord/Slack/generic, SSRF-guarded) + **ntfy**. **No Web-Push/VAPID.** Scheduler (node-cron): backups, demo reset, trip/todo reminders, version check, cache sweeps, AirTrail sync (all honor `TZ`).
- **Plugins:** sandboxed out-of-process plugin host (child processes, RPC, per-plugin rate limits/daily budgets, audit log, hardened egress policy), many typed extension points; SDK at `plugin-sdk/`. Kill-switch `TREK_PLUGINS_ENABLED`.
- **MCP:** `@modelcontextprotocol/sdk` over Streamable HTTP at `/mcp`, OAuth 2.1, scoped tools/resources, per-user session limits (`MCP_*`).

## Storage / migrations / backup

- SQLite + local disk. Migrations: (verify exact mechanism — partial). Backups: cron zips DB + uploads; **restore not exercised** (see readiness checklist).

## Build / release / deploy

- Client build: `vite build` (+ PWA/Workbox, prebuild generates PNG icons from `public/icons/icon.svg`). Dockerfile + Helm `charts/` + `unraid-template.xml` present. CI in `.github/`.
- Env vars (server): see the integrations list above; **no S3, no VAPID, no payment vars**.

## Critical user journeys (existing in code)

| Journey | Priority | Entry |
|---|---|---|
| Login / OIDC / passkey / MFA / logout | Critical | `pages/LoginPage.tsx`, `pages/login/useLogin.ts`, `store/authStore.ts` |
| Password reset (email or console) | High | `pages/ForgotPasswordPage.tsx`, `pages/ResetPasswordPage.tsx` |
| First-run admin setup / registration / invite join | Critical | `useLogin.ts`, `pages/JoinTripPage.tsx` |
| Trip CRUD + itinerary + map | Critical | `pages/TripPlanner*`, `pages/Journey*`, Trips/* |
| Collaboration (real-time, chat, polls, notes) | High | `components/Collab/*` |
| Budget / cost splitting | High | `components/Budget/*` |
| Packing lists | Medium | `components/Packing/*` |
| Reservations / booking import (LLM/KItinerary/AirTrail) | High | `server/src/nest/booking-import/*`, `integrations/airtrail/*` |
| Files upload/download | High | `server/src/nest/files/*`, `components/Files/*` |
| Offline edit + sync (mutation queue) | High | `client/src/sync/*`, `db/offlineDb.ts` |
| Notifications (in-app/email/webhook/ntfy) | Medium | `server/src/nest/notifications/*` |
| Settings / account / passkeys | Medium | `pages/SettingsPage.tsx`, `components/Settings/*` |
| Account deletion / data export | Verify | (not confirmed — partial inventory) |
| Admin operations | High | `pages/AdminPage.tsx`, `components/Admin/*` |
