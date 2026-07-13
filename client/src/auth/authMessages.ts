// Friendly auth error policy (KUKLABS_UI_AUTH_AGENT_PACK_V2 →
// KUKLABS_AUTH_CONTENT_TEMPLATES.json). Raw server errors / JSON must never
// reach the UI; wrong email/phone/password collapses to ONE safe generic
// message so we don't leak which field was wrong.
export const authMessages = {
  genericSignInError:
    "We couldn't sign you in. Check your email or mobile number and password, then try again.",
  invalidEmail: 'Enter a valid email address.',
  invalidPhone: 'Enter a valid mobile number for the selected country.',
  emptyIdentity: 'Enter your email address or mobile number.',
  emptyPassword: 'Enter your password.',
  weakPassword: 'Use at least 8 characters with at least one letter and one number.',
  termsRequired: 'Review and accept the Terms of Use and Privacy Policy to continue.',
  otpInvalid: "That verification code isn't correct. Check it and try again.",
  otpExpired: 'That verification code has expired. Request a new code.',
  offline: "You're offline. Check your internet connection and try again.",
  serverError: 'Something went wrong on our side. Please try again in a moment.',
  genericFallback: "We couldn't complete that action. Please try again.",
} as const

export type AuthMessageKey = keyof typeof authMessages
