# KukTrip Source-of-Truth Map (Phase 2)

Where each concern lives **after** separation. Rule: product material → kuktrip repo; shared
Kuklabs identity/platform → kukbook-erp platform core, consumed by KukTrip through a stable
contract. Never fork the shared platform.

| Concern | Source of truth | Notes |
|---|---|---|
| KukTrip UI / features / app code | **kuktrip repo** (`client/`, `server/`, `shared/`) | TREK-derived app; already here |
| KukTrip product docs (vision, roadmap, features, backlog, changelog…) | **kuktrip repo** `docs/product/KukTrip/` + `docs/KUKTRIP_MASTER_ROADMAP.md` | Imported from KukBook's stubs, then enriched here |
| KukTrip QA / competitive / security audit | **kuktrip repo** `qa-audit/` | Already the richer source; KukBook's stub checklists defer to it |
| KukTrip-specific DB models / migrations | **kuktrip repo** owns the _definitions_ | Executed against the **shared Kuklabs MySQL** per platform migration policy; no separate DB/schema copy |
| KukTrip marketing site | **kuktrip repo** `marketing/` | Static; deploy to a marketing surface |
| KukTrip Android (native, `com.kuklabs.kuktrip` / app id `com.kuklabs.trip`) | **kuktrip repo** `android-app/` | Uses the shared Kuklabs Account + **shared Firebase project** |
| **Identity / AuthKit / One Kuklabs Account** | **kukbook-erp platform** (`client/src/authkit/`, `server/googleAuth.ts`, `/login`) | KukTrip consumes the contract (silent `.kuklabs.com` cookie + redirect to shared `/login`). **Never copied as a new auth impl.** |
| Shared user identity / `userId` | **kukbook-erp platform** (shared MySQL `users`) | KukTrip maps its local user to the KukLabs `openId`; one account, one id across apps |
| Shared MySQL database | **kukbook-erp platform** (`DATABASE_URL`) | Single ecosystem DB; KukTrip's tenant-scoped tables live here per policy |
| Global billing / product membership / entitlements | **kukbook-erp platform** | KukTrip reads membership; does not implement billing |
| Global notification service (FCM / email transport) | **kukbook-erp platform** + **shared Firebase/Resend** | KukTrip owns only its **notification templates/content** |
| Product-specific notification templates | **kuktrip repo** | Content owned by KukTrip; delivery by platform |
| Ecosystem product registry (`shared/products/registry.ts`) | **kukbook-erp platform** | The `kuktrip` entry stays; registry is where the ecosystem is discovered |
| Super-admin app launcher (`shared/superAdminApps.ts`, SuperAdminDashboard) | **kukbook-erp platform** | KukTrip appears as a shortcut; owner admin is the KukLabs superadmin (no separate KukTrip admin) |
| Google Cloud / Firebase project | **shared, single project** | Same OAuth client + Firebase across all apps |
| Legal / privacy / telemetry URLs | **kukbook-erp platform** (`kuklabs.com`) | KukTrip links to the shared legal/privacy surfaces |

## Conflict-resolution decisions (don't overwrite stronger docs)
- KukBook's 20 stubs are **thinner** than what already exists in kuktrip (`qa-audit/`, this session's
  SSO/marketing work). They are imported **as the origin record** and superseded in place by the
  richer kuktrip content, cross-linked — not deleted, not blindly overwritten.
- Platform-concern stubs (Architecture, API, Database, Security) in KukBook point to
  `docs/platform/`. In this repo they point to **`docs/architecture/KUKLABS_PLATFORM_INTEGRATION.md`**
  (the consumer-side contract), keeping the "one platform doc, not copied per app" principle.
