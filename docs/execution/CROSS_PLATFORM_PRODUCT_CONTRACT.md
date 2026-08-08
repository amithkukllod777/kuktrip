# KukTrip Cross-Platform Product Contract

KukTrip is one product with three first-class clients: Web/PWA, Android and iOS.

## Shared navigation model
Primary product destinations:
- Home
- Trips
- Create (`+`)
- Explore
- Profile

Map is a contextual surface inside Trips and Explore, not a permanently required bottom tab.

## Core feature parity
All clients must support the same core user capabilities, even when native UX differs:

1. Kuklabs Account sign-in and session management
2. Home dashboard
3. Trip create/edit/archive/share
4. Day-by-day itinerary
5. Places and map
6. Routes and transport
7. Reservations/bookings
8. Costs, budgets and split expenses
9. Packing/to-do lists
10. Travel files/documents
11. Collaboration, polls and notes
12. Journal/photos/Travel Atlas
13. AI Trip Builder
14. KukTrip Copilot
15. Explore nearby/destination activities
16. Create/join social activities
17. Notifications
18. Offline travel access
19. Profile/settings/security

## Platform-specific implementation

### Web/PWA
- React/TypeScript existing client
- responsive desktop/tablet/mobile
- PWA/offline support
- canonical public website: `https://trip.kuklabs.com/`

### Android
- Kotlin
- Jetpack Compose only
- application ID: `com.kuklabs.trip`
- UDF/ViewModel architecture
- Coroutines/Flow
- modern Navigation Compose
- Hilt/KSP where dependency injection is useful
- DataStore/Room only for local/offline cache
- same Kuklabs server-side source of truth

### iOS
- Swift
- SwiftUI
- async/await and structured concurrency
- Observation / modern state model appropriate to deployment target
- NavigationStack
- local persistence only for offline/cache
- same Kuklabs server-side source of truth

## API principle
Client UX can differ by platform. Business rules and authoritative state do not.

The server owns:
- identity mapping
- authorization
- trip membership/roles
- canonical trip data
- social safety rules
- AI action authorization
- booking integration state
- billing/entitlements

Clients may cache, queue and optimistically render but may not become independent sources of truth.

## Offline principle
Offline is a supported execution state, not a separate database architecture.
- reads may come from encrypted/scoped local cache
- writes may queue locally
- sync resolves back to the shared server state
- cache must be scoped to the Kuklabs user
- logout/account switch must not expose previous user's offline data

## AI action principle
AI can propose and prepare actions. Mutating actions affecting itinerary, bookings, social participation, money or sharing require deterministic validation and user approval where appropriate.

## Release parity
A feature is marked `cross-platform complete` only when:
- server contract is stable
- web implementation is complete or explicitly N/A
- Android implementation is complete or explicitly N/A
- iOS implementation is complete or explicitly N/A
- analytics/error reporting exists
- accessibility and offline behavior are defined
- platform tests pass
