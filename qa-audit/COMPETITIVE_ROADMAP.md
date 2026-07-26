# Competitive Roadmap

Prioritized P0–P3 + Do-Not-Build. Effort: S/M/L/XL. Evidence dated 2026-07-14 (see `COMPETITOR_SELECTION.md` / `COMPETITIVE_FEATURE_MATRIX.md`).

## P0 — Table-stakes credibility

### 1. Native mobile apps (or a first-class installable PWA)
- **Problem:** Web-only loses on-the-go / store discovery against both leaders. Travel is mobile-first.
- **Evidence:** Wanderlog & TripIt both ship top-rated iOS/Android apps (VERIFIED).
- **User value:** High · **Competitive value:** High (closes the #1 gap) · **Effort:** XL native / M PWA interim.
- **Success metric:** installable PWA (or store apps) with offline itinerary; mobile weekly-active > X%.
- *Note:* the codebase already has a PWA + robust offline layer (Dexie + mutation queue) — the interim PWA path is largely a polish/packaging effort, not greenfield.

### 2. Reservation email parsing + offline itinerary
- **Problem:** Auto-import of flights/hotels is the expected on-ramp; offline is baseline.
- **Evidence:** Wanderlog (forward/Gmail) & TripIt (plans@) VERIFIED; TripIt offline on free tier.
- **User value:** High · **Competitive value:** Table-stakes parity · **Effort:** L (parser) + M (offline).
- *Note:* Kuk Trip already has LLM-based booking extraction + a KItinerary extractor and a strong offline cache — the gap is an **email intake path** and parse-quality parity, not the parser itself.

## P1 — High-value competitive requirements

### 3. Flight tracking + push notifications + calendar sync
- **Problem:** Day-of utility + schedule integration expected of serious planners.
- **Evidence:** TripIt (VERIFIED core strength) & Wanderlog Pro (VERIFIED).
- **User value:** High (transit-heavy trips) · **Effort:** M (flight-data API) + S (ICS feed) + M (web-push — currently absent).

### 4. Lead with self-hosting + data ownership as the core wedge
- **Problem:** No competitor offers data ownership; Wanderlog reviews flag aggressive paywalling (PARTIALLY VERIFIED).
- **Evidence:** Self-host absent among all three (VERIFIED absence).
- **User value:** High (privacy/teams) · **Competitive value:** Differentiation moat · **Effort:** S–M (positioning/docs; capability exists).

### 5. Route optimization (multi-stop per day)
- **Evidence:** Wanderlog ships it (≤15 stops/day, VERIFIED).
- **User value:** Med-High · **Effort:** M.

## P2 — Useful parity

### 6. Templates, trip duplication, import/export (PDF/ICS/KML)
- Reinforces the "no lock-in" story. Rivals have partial versions. **Effort:** S–M.

### 7. Sharing modes (public / friends-only / read-only) + surface localization
- Public trips drive virality; Kuk Trip already has 23 locales — surface a language switcher prominently. **Effort:** S (sharing) / S (i18n surfacing).

## P3 / Do-Not-Build

- **Do-Not-Build:** from-scratch fare-prediction engine, airport-navigation maps, loyalty-point tracking (TripIt-Pro business niche), Polarsteps-style social travel feed. Outside the collaborative-planning core; high maintenance, low value for the target user.

## Kuk Trip's defensible strengths (protect & expand)

1. **Self-hosting & data ownership / privacy** — unique among all three (VERIFIED market gap).
2. **No vendor lock-in / open-source-derived** — export freedom vs paywalled competitor exports.
3. **All-in-one collaboration + expense splitting + documents** in one open product — TripIt can't do group/splitting; Google Maps can't do itinerary/budget; only Wanderlog matches and it's closed/increasingly paywalled.
4. **Deep offline** (IndexedDB + mutation queue + tile prefetch + idempotent replay) — stronger than Wanderlog's Pro-gated offline.
5. **23-locale localization** vs TripIt's 5.
6. **Pricing latitude** — self-host-free + optional hosted tier can undercut $40–49/yr subs.
