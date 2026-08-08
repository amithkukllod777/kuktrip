# KukTrip Explore / Social Safety Model

Status: architecture contract for the Explore/social implementation.

## Non-negotiable defaults

Traveler discovery is **OFF by default**. A Kuklabs Account existing or creating a trip does not make the user discoverable.

Public discovery must never expose a user's live precise location. Activity discovery uses an approximate/public coordinate where needed; exact meeting coordinates are disclosed only according to the activity's join/privacy policy.

## Identity

All social ownership, hosting, membership, blocking, reporting and moderation records use the authoritative shared Kuklabs `users.id`. KukTrip never creates a social-only identity.

## Age and family safety

KukTrip supports family travel, so social discovery cannot inherit an 18+ stranger-meetup assumption blindly.

Initial public stranger-discovery rule:

- traveler-to-traveler discovery: adults only
- public activity hosting/joining: adults only unless a separately reviewed family activity mode is enabled
- minors are never individually discoverable
- children's ages/names/precise locations are never exposed to public participant discovery
- family/kids activity metadata describes suitability, not discoverable child profiles

`kac_agePolicy` exists so the server can enforce these rules rather than leaving them to UI copy.

## Location privacy

`kuktrip_activities` separates:

- `kac_publicLat` / `kac_publicLng`: intentionally lower-precision discovery coordinate
- `kac_meetingLat` / `kac_meetingLng`: exact meeting coordinate
- `kac_locationPrivacy`: disclosure policy

API rules:

1. List/search responses return only public coordinates.
2. Exact meeting coordinates require an authorized participant/host and the activity's disclosure condition to be satisfied.
3. Blocked users cannot retrieve participant-only activity details.
4. Exact coordinates must not appear in logs, analytics events or public share previews.

## Joining

Supported join modes:

- `open`
- `approval`
- `invite_only`

Participant state is explicit (`pending`, `approved`, `declined`, `left`, `removed`). Capacity checks must be transaction-safe to prevent overbooking races.

## Blocking

Blocking is directional and immediately affects:

- traveler matching
- activity participant visibility
- invites
- direct/social notifications
- participant-only chat visibility where policy requires

The server, not only the clients, enforces block rules.

## Reporting and moderation

Reports can target an activity, a user, or both. Minimum reason families:

- harassment
- hate/abuse
- sexual/inappropriate behavior
- unsafe activity
- spam/scam
- impersonation
- privacy/location abuse
- underage concern
- other

Moderation status exists on activities independently of normal lifecycle status so an activity can be hidden/reviewed without falsifying cancellation state.

## Messaging

Activity messages are scoped to an activity and authenticated sender. Before public launch:

- membership/host authorization on reads and writes
- rate limits
- blocked-user enforcement
- report/delete/moderation states
- content length limits
- no arbitrary HTML execution
- abuse/audit events

## AI

KukTrip AI may recommend an activity only from data the current user is authorized to see. AI does not bypass location privacy, block state, age policy, moderation status or join approval.

AI recommendations are suggestions. Joining an activity and adding it to an itinerary remain explicit user actions.

## Launch gate

Public traveler matching/social discovery cannot ship until all are implemented and tested:

- opt-in preference
- block
- report
- moderation state
- age gate/policy
- precise-location authorization
- capacity race protection
- host/join authorization
- abuse rate limits
- account/session revocation behavior

This gate is stricter than ordinary place discovery because the feature facilitates real-world meetings between people.
