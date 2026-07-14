# Competitive Feature Matrix

**Checked:** 2026-07-14 (web + App/Play listings + official help docs). The *Kuk Trip* column reflects the code-verified feature set where possible (see `FEATURE_INVENTORY.md`); items the code audit did not confirm are marked NOT VERIFIED. Competitor confidence is in the last column.

Availability: **FULLY / PARTIALLY / MISSING / NOT VERIFIED / N/A**.

| Capability | Kuk Trip | Wanderlog | TripIt | Google Maps/My Maps | Gap type | Competitor confidence |
|---|---|---|---|---|---|---|
| Collaborative / multi-user trips | FULLY (real-time WS sync) | FULLY (live editing) | PARTIALLY (share/invite; no co-planning) | PARTIALLY (shared pins) | Parity | VERIFIED |
| Itinerary builder (day-by-day) | FULLY | FULLY | PARTIALLY (auto-timeline from bookings) | MISSING | Parity | VERIFIED |
| Map + places | FULLY (OSM/Nominatim/Overpass + optional Google Places) | FULLY | PARTIALLY | FULLY | Parity | VERIFIED |
| Route optimization (multi-stop/day) | NOT VERIFIED | FULLY (≤15 stops/day) | MISSING | PARTIALLY | Table-stakes gap | VERIFIED (WL) |
| Budget / expense splitting (per-person) | FULLY | FULLY | MISSING | MISSING | Differentiation vs TI/GM | VERIFIED |
| Packing lists | FULLY | FULLY | MISSING | MISSING | Parity vs WL | VERIFIED |
| Reservations import (email parsing) | FULLY (LLM + KItinerary extractor) | FULLY (forward/Gmail) | FULLY (best-in-class) | MISSING | Table-stakes (match quality) | VERIFIED |
| Documents / files | FULLY (local storage) | PARTIALLY | PARTIALLY (3 free / 25 Pro) | MISSING | Advantage | VERIFIED (TI caps) |
| Offline access | FULLY (Dexie/IndexedDB + tile prefetch + mutation queue) | PARTIALLY (Pro-only) | FULLY | PARTIALLY | **Strength** | VERIFIED |
| Native mobile apps (iOS/Android) | MISSING (web/PWA only) | FULLY | FULLY | FULLY | **Competitive disadvantage** | VERIFIED |
| AI trip planner | PARTIALLY (LLM parsing/MCP; "generate trip" NOT VERIFIED) | FULLY (Pro AI) | MISSING | MISSING | Parity vs WL | VERIFIED |
| Templates / trip duplication | PARTIALLY (collections) | PARTIALLY | MISSING | PARTIALLY | Parity opportunity | PARTIALLY VERIFIED |
| Import / export | PARTIALLY (PDF export; AirTrail import) | PARTIALLY (PDF; Pro) | PARTIALLY (ICS; PDF) | PARTIALLY (KML) | Parity opportunity | PARTIALLY VERIFIED |
| Flight tracking (delay/gate) | PARTIALLY (AirTrail integration, no live alerts confirmed) | FULLY (Pro) | FULLY (core strength) | MISSING | Table-stakes gap | VERIFIED |
| Calendar sync | NOT VERIFIED | NOT VERIFIED | FULLY (tz-aware feed) | PARTIALLY | Table-stakes gap | VERIFIED (TI) |
| Sharing / public trips | PARTIALLY (share links/collections) | FULLY (public/friends-only/guides) | PARTIALLY (read-only link) | FULLY | Parity | VERIFIED |
| Notifications | PARTIALLY (in-app/email/webhook/ntfy; **no push**) | FULLY (flight push) | FULLY (flight/gate alerts) | PARTIALLY | Table-stakes gap (push) | VERIFIED |
| Localization | FULLY (23 locales) | NOT VERIFIED | PARTIALLY (5 languages) | FULLY | **Strength** | VERIFIED (TI) |
| Self-hosting / data ownership | FULLY | MISSING | MISSING | MISSING | **Differentiation (moat)** | VERIFIED (absence) |
| Pricing / free tier | Self-host free; hosted TBD | Generous free; Pro ≈ $39.99/yr | Free tier; Pro ≈ $48.99/yr | Free | Strength | VERIFIED |

## Feature-gap classification

- **Table-Stakes Gaps (reach parity to be credible):** native mobile apps; reservation email parsing at TripIt/Wanderlog quality; flight tracking + push; calendar sync; route optimization.
- **Competitive Disadvantage:** no confirmed native mobile presence while rivals lead on store ratings/reach.
- **Parity Opportunities (cheap wins):** templates/duplication, import/export (PDF/ICS/KML), public/friends-only sharing, wider localization surfacing.
- **Differentiation (where Kuk Trip can win):** self-hosting + data ownership (unique among all three); all-in-one group collaboration **+ expense splitting** in one open product; offline depth; documents as first-class; 23-locale reach.
- **Low-Value competitor features (deprioritize):** fare-monitoring, airport-navigation maps, loyalty-point tracking (TripIt-Pro business niche).
- **Overbuilt / avoid:** from-scratch fare-prediction engine; Polarsteps-style social feed.

## Pricing snapshot (reference only — do not price off competitors)

| Product | Free | Paid | Source/confidence |
|---|---|---|---|
| Wanderlog | Unlimited trips/collaborators, itinerary, map, budget/splitting, packing, basic reservations | Pro ≈ $39.99/yr (some listings $49.99) — offline maps, route optimization, unlimited AI, Gmail auto-scan, flight alerts, PDF export | VERIFIED (annual); upper bound PARTIALLY VERIFIED |
| TripIt | Email-parsed itinerary, mobile, calendar sync, offline, 3 docs/trip | Pro ≈ $48.99/yr — real-time flight alerts, fare monitoring, seat/alt-flight, airport maps, 25 docs/trip | VERIFIED (price varies $48.99–$49 by listing) |
| Google Maps / My Maps | Fully free | — | VERIFIED (Google Trips discontinued 2019) |

## Still NOT VERIFIED (manual checks)

- Wanderlog calendar sync (iCal/Google export) and localization list — site 403'd automated fetch; check App/Play "Languages" + in-app trip menu.
- Kuk Trip "generate trip" AI depth, live flight alerts, and calendar export — confirm in-repo/product.
