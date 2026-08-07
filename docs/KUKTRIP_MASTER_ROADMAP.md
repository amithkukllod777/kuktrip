# KukTrip — Master Roadmap (single source of truth)

Consolidates every KukTrip planning input (KukBook's `docs/products/KukTrip/` stubs, this repo's
`qa-audit/`, and the extraction work) into one authoritative roadmap.

**Product lifecycle:** Discover → Plan → Book → Organize → Connect → Experience → Remember.

**Baseline reality (measured, not estimated):** KukTrip is a TREK-derived (AGPL-3.0) app, live at
`trip.kuklabs.com` on the shared AWS box, image built in CI → GHCR (no on-box builds). It is bound
to the Kuklabs platform by [`docs/architecture/KUKLABS_PLATFORM_INTEGRATION.md`](architecture/KUKLABS_PLATFORM_INTEGRATION.md).

Legend: ✅ done · 🟡 in progress · ☐ planned.

| # | Stream | Status | Notes |
|---|---|---|---|
| 0 | **Baseline preservation / AGPL compliance** | 🟡 | Preserve TREK AGPL-3.0 notices; keep upstream attribution; NOTICE/LICENSE intact |
| 1 | **Kuklabs identity / platform migration** | 🟡 | Silent `.kuklabs.com` SSO bridge ✅; Kuklabs-only login ✅; shared DB/Firebase/storage unification ☐ |
| 2 | **KukTrip branding / design system** | 🟡 | App renamed TREK→Kuk Trip (title/PWA) ✅; real logo/adaptive icon ☐; Inter + Kuklabs tokens ☐ |
| 3 | **Core trip workspace** | 🟡 | Trips/members/roles (TREK base) ✅; Kuklabs-account-scoped ownership ☐ |
| 4 | **Itinerary** | 🟡 | Day-by-day timeline, drag/reorder, transport (TREK base) ✅ |
| 5 | **Reservations** | 🟡 | Flights/hotels/bookings attached to days + files (TREK base) ✅ |
| 6 | **Budgets / expenses** | 🟡 | Per-day budget + expense splitting (TREK base) ✅ |
| 7 | **Packing / documents** | 🟡 | Packing lists, trip files (TREK base) ✅ |
| 8 | **Maps / routes / offline maps** | 🟡 | Map POIs, routing, offline (TREK base) ✅; provider unification ☐ |
| 9 | **Destination discovery** | ☐ | Curated destinations, guides |
| 10 | **AI Trip Builder** | ☐ | Generate itinerary from a prompt — via shared platform AI |
| 11 | **KukTrip Copilot** | ☐ | In-trip assistant on the shared AI shell |
| 12 | **Explore / nearby activities** | ☐ | POI/activity discovery around each stop |
| 13 | **Traveler matching** | ☐ | Opt-in matching; privacy + moderation gated |
| 14 | **Social activities / create / join** | ☐ | Public/joinable activities |
| 15 | **Group chat / collaboration** | 🟡 | Trip notes/polls/collab (TREK base) ✅; sync with KukChat Business Messenger ☐ |
| 16 | **Safety / moderation** | ☐ | Required before any social/matching feature ships |
| 17 | **Bookings integrations** | ☐ | Affiliate/booking providers (contracted, not core) |
| 18 | **Live-trip notifications** | 🟡 | Trip reminders (TREK base) ✅; via shared notification service + templates here |
| 19 | **Journal / photos / Travel Atlas** | 🟡 | Photos, journal, atlas (TREK base) ✅ |
| 20 | **Android** | 🟡 | Native Kotlin/Compose scaffold ✅ (`com.kuklabs.trip`); shared Firebase; full screens ☐ |
| 21 | **iOS** | ☐ | Same Kuklabs Account + Firebase |
| 22 | **Subscriptions / Trip Pass** | ☐ | Plugs into **platform billing** — no separate billing |
| 23 | **Affiliate monetization** | ☐ | Booking/affiliate revenue |
| 24 | **QA / security / performance** | 🟡 | Full audit set in [`qa-audit/`](../qa-audit/); SSO test coverage ✅ |
| 25 | **Play Store / App Store release** | ☐ | Store listings, `com.kuklabs.trip`; see `docs/product/KukTrip/14_AppStore_PlayStore.md` |

## Immediate gates (from the extraction)
1. **Identity first (stream 1):** finish SSO rollout (CI image + env + GHCR pull) — in progress.
2. **Data unification:** move KukTrip persistence onto the shared Kuklabs MySQL per platform policy
   (currently the TREK build uses SQLite; migration is additive + data-safe, never destructive).
3. **Branding (stream 2):** swap the placeholder logo for the real Kuk Trip mark.

## Provenance
- KukBook `docs/products/KukTrip/*` (imported, preserved) → `docs/product/KukTrip/`.
- Extraction audit → [`docs/migration/KUKTRIP_EXTRACTION_AUDIT.md`](migration/KUKTRIP_EXTRACTION_AUDIT.md).
- Source-of-truth map → [`docs/migration/KUKTRIP_SOURCE_OF_TRUTH_MAP.md`](migration/KUKTRIP_SOURCE_OF_TRUTH_MAP.md).
- Platform contract → [`docs/architecture/KUKLABS_PLATFORM_INTEGRATION.md`](architecture/KUKLABS_PLATFORM_INTEGRATION.md).
