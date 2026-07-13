// Kuklabs universal design tokens — mirror of
// docs/kuklabs/KUKLABS_DESIGN_TOKENS.json (KUKLABS_UI_AUTH_AGENT_PACK_V2).
// Product repositories consume these verbatim; only productBrand may differ.
// Kept as a typed TS object so the auth screen can reference exact values
// without a JSON-import build step.
export const kuklabsTokens = {
  fontFamily: 'Inter',
  fontWeights: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
  radius: { small: 8, control: 12, authControl: 16, card: 16, modal: 20, productIcon: 24, pill: 999 },
  colors: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSecondary: '#F2F4F7',
    textPrimary: '#101828',
    textSecondary: '#475467',
    textMuted: '#667085',
    placeholder: '#98A2B3',
    border: '#D0D5DD',
    dividerSoft: '#EAECF0',
    success: '#039855',
    warning: '#DC6803',
    error: '#D92D20',
    info: '#1570EF',
  },
  authPage: {
    contentMaxWidthMobile: 420,
    horizontalPaddingMobile: 20,
    productIcon: 80,
    productIconMax: 88,
    tabsHeight: 56,
    inputHeight: 58,
    buttonHeight: 58,
    googleButtonHeight: 58,
    welcomeText: { size: 24, lineHeight: 30, weight: 500 },
    productName: { size: 38, lineHeight: 44, weight: 800 },
    tagline: { size: 15, lineHeight: 22, weight: 400 },
    tabLabel: { size: 16, lineHeight: 22, weight: 600 },
    inputText: { size: 16, lineHeight: 24, weight: 400 },
    primaryButtonText: { size: 17, lineHeight: 24, weight: 600 },
    legalText: { size: 13, lineHeight: 19, weight: 400 },
    poweredBy: { size: 13, lineHeight: 18 },
  },
} as const

export type KuklabsTokens = typeof kuklabsTokens
