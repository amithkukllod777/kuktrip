# KukTrip Product Roadmap

## Objective

Turn the imported TREK codebase into **KukTrip by Kuklabs**: an AI-first travel planning and trip-management product for web, PWA and Android.

## Guardrails

- Keep `main` as the imported upstream baseline.
- Make KukTrip changes on `develop/kuktrip` and feature branches.
- Preserve the AGPL-3.0 license, notices and attribution for all code derived from TREK.
- Do not rename internal packages such as `@trek/shared` during the first branding pass; widespread package renaming creates avoidable regression risk.
- Replace user-facing branding first, then migrate internal identifiers only with test coverage.

## Phase 1 — Product baseline and branding

- Rebrand browser title, PWA manifest and install name to KukTrip.
- Replace visible TREK logos, wordmarks and user-facing strings.
- Add KukTrip design tokens and Kuklabs attribution.
- Verify existing web, PWA, map, itinerary, booking, budget, document and collaboration flows.
- Establish CI checks for build, typecheck, lint and tests.

## Phase 2 — AI trip creation

Create a guided AI trip builder that accepts:

- destination or multi-city route
- travel dates and flexibility
- travellers and ages
- total budget and currency
- interests and travel pace
- food, accessibility and transport preferences

The generated proposal must include a day-wise itinerary, travel-time estimates, projected costs, booking placeholders and source/confidence metadata for time-sensitive facts.

## Phase 3 — KukTrip Copilot

Add a trip-scoped copilot that can propose and, after confirmation, execute actions:

- create or revise itinerary items
- move activities because of weather or timing conflicts
- optimise daily routes
- update budgets and packing lists
- organise booking confirmations and documents
- explain every proposed change before applying it

## Phase 4 — Mobile and offline

- Harden responsive layouts for phone use.
- Validate PWA install and offline behaviour.
- Wrap the production web client with Capacitor for Android.
- Add native share, camera/document upload, notifications and deep links.
- Produce debug APK first, then signed AAB for Play Store.

## Phase 5 — Commercial platform

- Kuklabs account and organisation layer
- subscription and per-trip plans
- affiliate integrations for stays, activities, insurance, eSIM and transfers
- privacy, consent and data-retention controls
- observability, backups and production deployment

## Immediate implementation order

1. Complete safe user-facing rebrand.
2. Run full repository validation.
3. Deploy a staging web instance.
4. Build AI Trip Builder vertical slice.
5. Package Android debug build.

## Definition of MVP

A user can create an account, generate or manually build a trip, manage its itinerary on a map, collaborate with travellers, track bookings and budget, install KukTrip as a PWA, and use the copilot to propose itinerary changes.
