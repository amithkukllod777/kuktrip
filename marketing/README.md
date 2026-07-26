# Kuk Trip — marketing site

A single, self-contained, responsive landing page for **Kuk Trip** (the public
"user website"). It is the front door at the top of the funnel: it explains the
product and sends visitors into the app (`https://trip.kuklabs.com`) or the
shared Kuklabs sign-in.

- **`index.html`** — the whole site. No build step, no dependencies. All CSS/JS
  is inline; the only external asset is the Kuklabs-standard **Inter** webfont
  (with a full system-font fallback if the font host is blocked).
- **Responsive** — one layout that reflows cleanly from wide desktop down to a
  phone ("user website" + "mobile website" are the same page).
- **Theme-aware** — follows the visitor's light/dark preference and has an
  in-page toggle.
- **On-brand** — Kuk Trip accent `#2563EB`, itinerary/route visual motif,
  "Powered by Kuklabs" footer.

## How to serve it

It's a static file, so any static host or the existing nginx works. Two common
options on the shared EC2 that hosts the app:

**A. A marketing subdomain (recommended, keeps the app root clean):**
point e.g. `www.trip.kuklabs.com` (or `get.trip.kuklabs.com`) at this file:

```nginx
server {
    server_name www.trip.kuklabs.com;
    root /opt/kuktrip-marketing;      # copy marketing/ here
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    # (TLS via the same certbot flow as trip.kuklabs.com)
}
```

**B. Serve at the app root for logged-out visitors** and let the app live under
`/app` — only if you want the marketing page to be the literal root of
`trip.kuklabs.com`. The app currently owns `/`, so prefer option A to avoid
touching the running app.

The in-page links already point at `https://trip.kuklabs.com` (app) and
`https://trip.kuklabs.com/login` (shared Kuklabs sign-in), so no configuration
is required beyond hosting the file.

> The Android app section advertises the native Kotlin app (`com.kuklabs.trip`).
> Wire the "Open Kuk Trip" / store buttons to the Play Store listing once it's
> published.
