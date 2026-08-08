# KukTrip iOS

Native SwiftUI client for the KukTrip product.

## Identity

This app uses the canonical Kuklabs AuthKit REST contract at:

`https://www.kuklabs.com/v1/auth/`

Every request carries:

`X-Kuklabs-Product: kuktrip`

It does **not** create a separate KukTrip users/password/session system. Access and rotating refresh tokens belong to the same Kuklabs Account and are stored in the iOS Keychain (`ThisDeviceOnly`).

## Product

- Bundle ID: `com.kuklabs.trip`
- SwiftUI
- Swift 6 mode
- iOS 18 deployment target
- async/await + Observation
- Home / Trips / Create / Explore / Profile shell
- one shared KukTrip backend/source of truth with Web and Android

Local iOS persistence added later is cache/offline state only.

## Generate the Xcode project

The source of truth is `project.yml` (XcodeGen):

```bash
brew install xcodegen
cd ios-app
xcodegen generate
open KukTrip.xcodeproj
```

CI generates the project before building so generated Xcode project files do not need to be hand-maintained.

## Next native parity steps

1. product API bearer transport + refresh coordination
2. trips dashboard
3. trip detail/day itinerary
4. reservations/bookings
5. maps/routes
6. costs and expense splitting
7. packing/files/collaboration
8. AI Trip Builder and Copilot
9. Explore/social activities with safety controls
10. notifications + offline sync
11. shared Firebase registration and APNs/FCM integration
