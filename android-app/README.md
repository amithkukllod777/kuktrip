# Kuk Trip — Native Android app (Kotlin + Jetpack Compose)

A **native Kotlin** Android client for Kuk Trip (not a TWA/WebView wrapper). This is the **foundation**: the Kuklabs-standard authentication screen wired to the Kuk Trip server's REST API, with the product theme and a CI job that builds a debug APK.

## Status

**Implemented**
- Gradle (Kotlin DSL) project, AGP 8.5.2, Kotlin 2.0.20, Jetpack Compose (BOM 2024.09), Material3.
- `AuthScreen` — Kuklabs universal auth layout: product mark → "Welcome to Kuk Trip" → tagline → **Login / Sign Up** tabs → email/password (show/hide) → Remember me / Forgot password → **Login** / **Create Account** → **Continue with Google** (when the server reports OIDC) → Terms/Privacy → **Powered by Kuklabs**.
- Theme tokens (`ui/theme/`) — Kuklabs neutrals/semantics + Kuk Trip accent `#2563EB`.
- Retrofit API client (`data/api/`) → `GET /api/auth/app-config`, `POST /api/auth/login`, `POST /api/auth/register`.
- `AuthViewModel` — state, validation, friendly-error policy (no raw errors).
- Placeholder "K" launcher icon (`res/drawable/ic_kuktrip_logo.xml`).
- GitHub Actions: `.github/workflows/android-build.yml` builds a debug APK on push/PR.

**Not yet (next steps)**
- Persist the session (cookie/token store) and add an authenticated **Home / Trips / Map / Profile** flow (Navigation-Compose).
- Real logo asset + adaptive icon + splash (swap the placeholder once the official artwork is provided).
- Bundle **Inter** font (drop `Inter-*.ttf` into `res/font/`, wire in `Type.kt`).
- Official Google "G" mark on the Google button (currently text-only), passkey/MFA/OIDC completion in-app, offline cache.

> This is a foundation, not a feature-complete app. Trips/maps/budget/offline parity with the web app is a larger, screen-by-screen effort.

## Configure the server URL

`app/build.gradle.kts` → `API_BASE_URL` (defaults to `https://trip.kuklabs.com/`). Override per build type, or point debug at your local/dev server. Must end with `/`.

## Build

**Android Studio:** open the `android-app/` folder and Run (Studio generates the Gradle wrapper automatically).

**CLI (no committed wrapper jar):**
```bash
cd android-app
gradle wrapper --gradle-version 8.9   # once, to create ./gradlew
./gradlew :app:assembleDebug
# APK → app/build/outputs/apk/debug/app-debug.apk
```
Requires JDK 17 + the Android SDK (compileSdk 34). CI (`android-build.yml`) does this automatically and uploads the APK as an artifact — no local Android SDK needed to get an installable debug APK.

## Package / identity
- Application id: `com.kuklabs.trip` · namespace `com.kuklabs.kuktrip`
- App name: **Kuk Trip** · minSdk 24 · targetSdk 34
