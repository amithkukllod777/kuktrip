// KukTrip product brand config (KUKLABS_UI_AUTH_AGENT_PACK_V2 → REPO_INTEGRATION_GUIDE).
// Per the Kuklabs standard, ONLY these product-level values may differ between
// apps: product icon, product name, tagline, accent colour, product modules.
// Everything else (layout, typography, control sizing, error/version policy)
// comes from the shared standard + design tokens.
export const productBrand = {
  productId: 'kuktrip',
  productName: 'Kuk Trip',
  shortName: 'Trip',
  packageId: 'com.kuklabs.trip',
  subdomain: 'trip.kuklabs.com',
  assetPrefix: 'kuktrip_',
  // Approved product accent (family blue, accent-600) + dark-mode variant.
  accentColor: '#2563EB',
  accentColorDark: '#5B8CFF',
  tagline: 'Maps, budgets & real-time planning — synced with your Kuklabs account.',
  termsUrl: 'https://kuklabs.com/terms',
  privacyUrl: 'https://kuklabs.com/privacy',
  supportUrl: 'https://kuklabs.com/support',
  versionDisplayFormat: 'Version {version} (Build {build})',
} as const

export type ProductBrand = typeof productBrand
