# KukTrip Extraction Audit (Phase 1 — read-only)

_Source repo: `amithkukllod777/kukbook-erp` (`origin/main`) · Target repo: `amithkukllod777/kuktrip` · Audited 2026-08._

**Method.** Exhaustive `git grep` over `kukbook-erp@origin/main` for: `KukTrip`, `kuktrip`,
`trip.kuklabs.com`, `com.kuklabs.trip`, `itinerary`, `travel`, `traveler`, `destination`,
`reservation`, `journey`, `activity discovery`. Nothing in the source repo was modified.

**Headline result.** KukBook contains **no KukTrip product _code_** — the domain-feature terms
(`itinerary`, `traveler`, `travel planner`, `activity discovery`) return **0 files**. The only
KukTrip-specific material is a set of **20 placeholder documentation stubs** under
`docs/products/KukTrip/`, auto-generated on 2026-08-04 from the owner's product list at a time when
KukBook could not reach KukTrip's source. Those stubs themselves record: _"no source in this
repository … deployed at `/opt/kuktrip`."_ The actual KukTrip source + richer docs already live in
**this repo** (the TREK-derived KukTrip app). Everything else that mentions KukTrip is **shared
Kuklabs platform** (registry, super-admin launcher, AuthKit, Firebase) and must stay in KukBook.

## Classification legend
- **A · KUKTRIP-OWNED** → copy to kuktrip repo (this migration).
- **B · SHARED KUKLABS PLATFORM** → stays in kukbook-erp; KukTrip consumes via a stable contract.
- **C · KUKBOOK-OWNED** → untouched.
- **D · AMBIGUOUS** → keep in KukBook, document, do not move.

## Findings

| Path (kukbook-erp) | Purpose | Class | Depends on | Target already has equivalent? | Action |
|---|---|---|---|---|---|
| `docs/products/KukTrip/01_Product_Vision.md` … `20_Daily_Progress.md` (20 files) | Placeholder product-doc stubs (8–19 lines each; most say "placeholder, no invented content"; platform topics deferred to `docs/platform/`) | **A** | none (docs only) | Partially — kuktrip has richer `qa-audit/`, SSO/marketing, but no numbered product-doc set | **COPY** → `docs/product/KukTrip/` (preserved verbatim as origin record), then **DEPRECATE** at source (Phase 7) |
| `docs/products/README.md` | Index of the per-product docs sets (lists KukTrip among others) | **B/D** | product registry | — | **DO_NOT_TOUCH** (update its KukTrip row to a pointer in Phase 7) |
| `shared/products/registry.ts` | Ecosystem product registry; carries `kuktrip: { subdomain:"trip", status:"live", dependsOn:["platform-core"] }` | **B** | platform-core | Not applicable (registry is platform-owned) | **KEEP** — required for ecosystem discovery; the KukTrip entry stays |
| `shared/superAdminApps.ts` | Super-admin app launcher union; lists `kuktrip` | **B** | registry, admin | — | **KEEP** — removing it would hide KukTrip from the owner panel |
| `client/src/authkit/**` (`README.md`, `useAuthMachine.ts`, `KuklabsAuthCard.tsx`, `index.ts`) | The ONE Kuklabs Account auth pack every app consumes; README names KukTrip as a consumer | **B** | platform auth (`trpc.auth.*`), `.kuklabs.com` cookie | KukTrip consumes the **contract**, not a copy | **KEEP** — never fork auth |
| `client/src/pages/DirectLogin.tsx` | Shared `/login` (email+password, mobile+email OTP, Google) served on every subdomain | **B** | AuthKit, platform auth | KukTrip redirects here (Kuklabs-only login) | **KEEP** |
| `client/src/pages/SuperAdminDashboard.tsx` | Owner control center; "KukLabs Apps" launcher links to `trip.kuklabs.com` | **B** | admin, registry | — | **KEEP** |
| `kukadmin/androidApp/google-services.json` | **Shared Firebase project** config (FCM). One project for the whole ecosystem | **B** | Firebase/Google Cloud | KukTrip native uses the **same** project | **DO_NOT_TOUCH** |
| `docs/audits/KUKBOOK_P0_P1_REMEDIATION_PLAN.md` | KukBook remediation plan; mentions KukTrip in passing | **C** | — | — | **DO_NOT_TOUCH** |
| `server/googleAuth.ts`, `client/src/authkit/useAuthMachine.ts` `safeReturnTo`, `DirectLogin.tsx` `postAuthDestination` | Shared auth return-path handling (cross-subdomain `*.kuklabs.com` returnTo — see kukbook-erp PR #1026) | **B** | platform auth | KukTrip depends on this for seamless SSO return | **KEEP** |

## What is NOT present in KukBook (confirmed absent — nothing to migrate)
- No KukTrip DB tables / Drizzle models / `.cjs` migrations (`itinerary`/`reservation`-as-travel = 0).
- No KukTrip tRPC routers, routes, pages, or components.
- No KukTrip AI prompts, assets, or tests.
- No separate KukTrip users/auth/OTP/Firebase — and none must ever be created (identity mandate).

## Net migration scope
**Copy the 20 placeholder docs → `docs/product/KukTrip/` in this repo; consolidate them with the
richer material already here; leave every shared-platform file in KukBook untouched.** No code, no
schema, no auth, no Firebase moves. This is a documentation-ownership transfer only.
