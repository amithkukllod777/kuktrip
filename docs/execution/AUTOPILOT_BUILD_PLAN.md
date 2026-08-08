# KukTrip Full-Product Autopilot Execution Plan

Status: active execution plan

## Product outcome
KukTrip ships as one cross-platform travel product across:
- Web/PWA at `trip.kuklabs.com`
- Android (`com.kuklabs.trip`)
- iOS (native app, same backend/account/data contracts)

Product lifecycle:
Discover → Plan → Book → Organize → Connect → Experience → Remember

## Non-negotiable Kuklabs platform rules
- One Kuklabs Account / central AuthKit contract
- Shared Kuklabs identity and user ID
- Shared Kuklabs MySQL infrastructure
- One Google Cloud project
- One Firebase project
- Shared notification/billing/platform services
- No new independent auth, users database, Firebase project, or product identity silo

## Delivery strategy
Do not create one giant unreviewable change. Build a parallel PR train; each PR must be independently mergeable and keep the existing product usable.

### PR-A — Public web entry + product shell
- `/` public product homepage
- authenticated app remains protected
- direct-login-at-root removed
- responsive desktop/mobile web
- KukTrip branding and conversion CTAs

### PR-B — Kuklabs platform compliance
- replace SQLite production persistence with shared Kuklabs MySQL-compatible data layer
- authoritative Kuklabs user identity
- production-disable standalone TREK auth paths
- migration/rollback verification
- no KukBook regression

### PR-C — Brand/design system
- official KukTrip logo + adaptive icons + PWA assets
- shared Kuklabs typography/tokens/navigation/profile rules
- accessibility and dark mode

### PR-D — Core product parity contracts
- stabilize common APIs for web/Android/iOS
- trips, itinerary, reservations, maps, budget/costs, packing, files, polls, collaboration, journal
- shared Zod/OpenAPI-style contracts where useful

### PR-E — AI foundation
- provider-neutral travel AI service
- Gemini supported as a provider where it improves travel grounding/quality
- no provider lock-in
- structured tool/action schema
- user approval for mutations
- observability, cost controls, safety

### PR-F — AI Trip Builder + Copilot
- natural-language trip generation
- budget/preferences/traveler-aware itinerary
- live replanning
- route and free-time suggestions
- booking/document context

### PR-G — Explore / destination discovery
- nearby POIs and destination discovery
- map/list views
- categories, filters, saved items
- trip-aware recommendations

### PR-H — Social travel layer
- create/join activities
- opt-in traveler discovery/matching
- participants and group interaction
- add activity to itinerary
- privacy-by-default location model

### PR-I — Safety/moderation
- block/report
- host approval
- public/private/invite-only activities
- age controls and minor safety
- spam/rate limits
- moderation/audit state

### PR-J — Booking integrations
- flights/stays/activities/transfers/restaurants provider abstraction
- reservation email/document import
- affiliate-ready tracking
- booking changes feed itinerary

### PR-K — Live-trip services
- reminders
- changes/delays hooks
- weather/context alerts
- FCM/APNs/web push through shared Kuklabs services

### PR-L — Android full app
- Kotlin + Jetpack Compose
- applicationId `com.kuklabs.trip`
- UDF/ViewModel architecture
- lifecycle-aware state
- modern navigation
- Room/DataStore only for local/offline needs, never as independent cloud source of truth
- AuthKit REST/browser OAuth contract
- Home / Trips / Explore / Profile + itinerary/maps/booking/costs/files/AI

### PR-M — iOS full app
- Swift + SwiftUI
- modern async/await
- NavigationStack
- shared backend contracts
- same Kuklabs Account
- offline cache/sync parity
- Home / Trips / Explore / Profile + itinerary/maps/booking/costs/files/AI

### PR-N — Monetization
- platform entitlements
- Free / paid tier / Trip Pass decisions
- affiliate revenue hooks
- no standalone billing silo

### PR-O — Production hardening + stores
- authz/IDOR
- rate limits/CSRF/cookies
- backup + restore
- migration rollback
- load/performance
- Android/iOS real-device testing
- Play Store/App Store metadata, privacy declarations, screenshots, staged rollout

## AI provider decision
Gemini may be used, but only behind a provider abstraction. Provider selection is based on quality, grounding, multimodal/travel utility, latency and cost. The product must remain capable of routing to another supported model without rewriting product logic.

## Merge rule
Every PR must state:
- what changed
- migration impact
- rollback path
- Kuklabs platform dependencies
- web/Android/iOS impact
- test evidence
- remaining risks

No destructive data migration without a verified backup and rollback path.
