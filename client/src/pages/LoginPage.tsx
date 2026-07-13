import React from 'react'
import { SUPPORTED_LANGUAGES, useTranslation } from '../i18n'
import { Eye, EyeOff, Mail, Lock, User, Globe, ChevronDown, Shield, KeyRound, Fingerprint, Plane } from 'lucide-react'
import { useLogin } from './login/useLogin'
import ToggleSwitch from '../components/Settings/ToggleSwitch'
import { productBrand } from '../config/productBrand'
import { kuklabsTokens as K } from '../design-system/kuklabsTokens'

// Kuklabs universal auth shell (KUKLABS_UI_AUTH_AGENT_PACK_V2). Layout, sizing,
// typography and colours come from the shared standard + design tokens; only
// productBrand (icon, name, tagline, accent) differs per product.
const ACCENT = productBrand.accentColor // approved product accent (accent-600)
const ACCENT_HOVER = '#1D4ED8'
const ACCENT_SUBTLE = '#EFF4FF'
const C = K.colors
const A = K.authPage
const R = K.radius.authControl // 16
const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

/** KukTrip product app icon — the real KukTrip "K" mark (public/icons/icon.svg),
 *  the same asset used for the favicon / PWA icon. Uses the product icon, never
 *  the Kuklabs corporate logo. */
function ProductMark({ size = A.productIcon }: { size?: number }): React.ReactElement {
  return (
    <img
      src="/icons/icon.svg"
      width={size}
      height={size}
      alt={productBrand.productName}
      style={{ display: 'block', borderRadius: K.radius.productIcon, boxShadow: '0 8px 24px rgba(37,99,235,0.18)' }}
    />
  )
}

/** Official Google multicolour "G" (mandatory per pack — never restyled). */
function GoogleG({ size = 18 }: { size?: number }): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/** "Kuk" (neutral) + "Trip" (accent) product wordmark. */
function ProductName(): React.ReactElement {
  return (
    <h1 style={{ margin: 0, fontSize: `calc(${A.productName.size}px * var(--fs-scale-title, 1))`, fontWeight: A.productName.weight, letterSpacing: '-0.02em', lineHeight: `${A.productName.lineHeight}px`, color: C.textPrimary }}>
      Kuk<span style={{ color: ACCENT }}>{productBrand.shortName}</span>
    </h1>
  )
}

export default function LoginPage(): React.ReactElement {
  const { t, language } = useTranslation()
  // Page = wiring container: the whole auth surface lives in the useLogin hook.
  const {
    navigate,
    mode, setMode,
    username, setUsername, email, setEmail, password, setPassword, rememberMe, setRememberMe, showPassword, setShowPassword,
    isLoading, error, setError, insecureCookie, appConfig, inviteToken,
    langDropdownOpen, setLangDropdownOpen, setLanguageLocal,
    showTakeoff, mfaStep, setMfaStep, setMfaToken, mfaCode, setMfaCode,
    passwordChangeStep, newPassword, setNewPassword, confirmPassword, setConfirmPassword,
    noRedirect, showRegisterOption, oidcOnly,
    handleDemoLogin, handleSubmit, handlePasskeyLogin,
  } = useLogin()

  const oidcButtonShown = !!(appConfig?.oidc_configured && appConfig?.oidc_login && !oidcOnly)
  const passkeyAvailable = !!(appConfig?.passkey_login && appConfig?.passkey_configured && !oidcOnly
    && mode === 'login' && !mfaStep && !passwordChangeStep)
  // The Kuklabs standard federated button is "Continue with Google". KukTrip's
  // federated login is generic OIDC; when the configured provider is Google we
  // render the official Google button, otherwise the provider-generic SSO button.
  const isGoogleProvider = /google/i.test(appConfig?.oidc_display_name || '')

  // Login / Sign Up tabs — only in the plain login/register state where
  // switching modes is actually offered.
  const showTabs = !!(showRegisterOption && appConfig?.has_users && !appConfig?.demo_mode && !mfaStep && !passwordChangeStep && !oidcOnly)

  const inputBase: React.CSSProperties = {
    width: '100%', height: A.inputHeight, padding: '0 14px 0 46px', border: `1px solid ${C.border}`,
    borderRadius: R, fontSize: `calc(${A.inputText.size}px * var(--fs-scale-body, 1))`, fontFamily: 'inherit', outline: 'none',
    color: C.textPrimary, background: C.surface, boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const focusOn = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT_SUBTLE}` }
  const focusOff = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }

  // Shared style for a full-width secondary (federated / passkey) button.
  const secondaryBtn: React.CSSProperties = {
    marginTop: 14, width: '100%', height: A.googleButtonHeight,
    background: C.surface, color: C.textPrimary,
    border: `1px solid ${C.border}`, borderRadius: R,
    fontSize: `calc(${A.primaryButtonText.size}px * var(--fs-scale-body, 1))`, fontWeight: 600,
    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    textDecoration: 'none', cursor: 'pointer', boxSizing: 'border-box',
    transition: 'background 180ms cubic-bezier(0.23,1,0.32,1), border-color 180ms cubic-bezier(0.23,1,0.32,1)',
  }

  if (showTakeoff) {
    return (
      <div className="takeoff-overlay" style={{ position: 'fixed', inset: 0, zIndex: 99999, overflow: 'hidden', fontFamily: FONT }}>
        {/* Sky gradient */}
        <div className="takeoff-sky" style={{ position: 'absolute', inset: 0 }} />

        {/* Stars */}
        {Array.from({ length: 60 }, (_, i) => (
          <div key={i} className="takeoff-star" style={{
            position: 'absolute',
            width: i % 3 === 0 ? 3 : 1.5,
            height: i % 3 === 0 ? 3 : 1.5,
            borderRadius: '50%',
            background: 'white',
            top: `${(i * 37) % 100}%`,
            left: `${(i * 53) % 100}%`,
            animationDelay: `${0.3 + (i % 5) * 0.1}s, ${(i % 7) * 0.14}s`,
          }} />
        ))}

        {/* Clouds rushing past */}
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="takeoff-cloud" style={{
            position: 'absolute',
            width: 120 + i * 40,
            height: 40 + i * 10,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            filter: 'blur(8px)',
            right: -200,
            top: `${25 + i * 12}%`,
            animationDelay: `${0.3 + i * 0.25}s`,
          }} />
        ))}

        {/* Speed lines */}
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="takeoff-speedline" style={{
            position: 'absolute',
            width: 80 + (i % 4) * 40,
            height: 1.5,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            top: `${10 + (i * 7) % 80}%`,
            right: -200,
            animationDelay: `${0.5 + i * 0.12}s`,
          }} />
        ))}

        {/* Plane */}
        <div className="takeoff-plane" style={{ position: 'absolute', left: '50%', bottom: '10%', transform: 'translate(-50%, 0)' }}>
          <svg viewBox="0 0 480 120" style={{ width: 200, filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))' }}>
            <g fill="white" transform="translate(240,60) rotate(-12)">
              <ellipse cx="0" cy="0" rx="120" ry="12" />
              <path d="M-20,-10 L-60,-55 L-40,-55 L0,-15 Z" />
              <path d="M-20,10 L-60,55 L-40,55 L0,15 Z" />
              <path d="M-100,-5 L-120,-30 L-108,-30 L-90,-8 Z" />
              <path d="M-100,5 L-120,30 L-108,30 L-90,8 Z" />
              <ellipse cx="60" cy="0" rx="18" ry="8" />
            </g>
          </svg>
        </div>

        {/* Contrail */}
        <div className="takeoff-trail" style={{
          position: 'absolute', left: '50%', bottom: '8%',
          width: 3, height: 0, background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.5))',
          transformOrigin: 'bottom center',
        }} />

        {/* Logo fade in + burst */}
        <div className="takeoff-logo" style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
          <ProductMark size={80} />
          <h1 style={{ margin: 0, fontSize: 'calc(40px * var(--fs-scale-title, 1))', fontWeight: 800, letterSpacing: '-0.02em', color: 'white' }}>
            Kuk<span style={{ color: '#93C5FD' }}>{productBrand.shortName}</span>
          </h1>
        </div>


        <style>{`
          .takeoff-sky {
            background: linear-gradient(to top, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #0a0a23 100%);
            animation: skyShift 2.6s ease-in-out forwards;
          }
          @keyframes skyShift {
            0%   { background: linear-gradient(to top, #0a0a23 0%, #0f172a 40%, #111827 100%); }
            100% { background: linear-gradient(to top, #000011 0%, #000016 50%, #000011 100%); }
          }

          .takeoff-star {
            opacity: 0;
            animation: starAppear 0.5s ease-out forwards, starTwinkle 2s ease-in-out infinite alternate;
          }
          @keyframes starAppear {
            0%   { opacity: 0; transform: scale(0); }
            100% { opacity: 0.7; transform: scale(1); }
          }
          @keyframes starTwinkle {
            0%   { opacity: 0.3; }
            100% { opacity: 0.9; }
          }

          .takeoff-cloud {
            animation: cloudRush 0.6s ease-in forwards;
          }
          @keyframes cloudRush {
            0%   { right: -200px; opacity: 0; }
            20%  { opacity: 0.4; }
            100% { right: 120%; opacity: 0; }
          }

          .takeoff-speedline {
            animation: speedRush 0.4s ease-in forwards;
          }
          @keyframes speedRush {
            0%   { right: -200px; opacity: 0; }
            30%  { opacity: 0.6; }
            100% { right: 120%; opacity: 0; }
          }

          .takeoff-plane {
            animation: planeUp 1s ease-in forwards;
          }
          @keyframes planeUp {
            0%   { transform: translate(-50%, 0) rotate(0deg) scale(1); bottom: 8%; left: 50%; opacity: 1; }
            100% { transform: translate(-50%, 0) rotate(-22deg) scale(0.15); bottom: 120%; left: 58%; opacity: 0; }
          }

          .takeoff-trail {
            animation: trailGrow 0.9s ease-out 0.15s forwards;
          }
          @keyframes trailGrow {
            0%   { height: 0; opacity: 0; transform: translateX(-50%) rotate(-5deg); }
            30%  { height: 150px; opacity: 0.6; }
            60%  { height: 350px; opacity: 0.4; }
            100% { height: 600px; opacity: 0; transform: translateX(-50%) rotate(-8deg); }
          }

          .takeoff-logo {
            opacity: 0;
            animation: logoReveal 0.5s ease-out 0.9s forwards;
          }
          @keyframes logoReveal {
            0%   { opacity: 0; transform: translate(-50%, -40%) scale(0.9); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>
      </div>
    )
  }

  const orDivider = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
      <div style={{ flex: 1, height: 1, background: C.dividerSoft }} />
      <span style={{ fontSize: `calc(13px * var(--fs-scale-body, 1))`, color: C.placeholder }}>{t('common.or')}</span>
      <div style={{ flex: 1, height: 1, background: C.dividerSoft }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: C.background, fontFamily: FONT, position: 'relative', padding: `20px ${A.horizontalPaddingMobile}px 32px` }}>

      {/* Language dropdown (accessible control) */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <button
          onClick={(e) => { e.stopPropagation(); setLangDropdownOpen(o => !o) }}
          aria-haspopup="listbox"
          aria-expanded={langDropdownOpen}
          aria-label="Change language"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 999,
            background: 'rgba(16,24,40,0.05)', border: 'none',
            fontSize: `calc(13px * var(--fs-scale-body, 1))`, fontWeight: 500, color: C.textSecondary,
            cursor: 'pointer', fontFamily: 'inherit', minHeight: 40,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'rgba(16,24,40,0.09)'}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'rgba(16,24,40,0.05)'}
        >
          <Globe size={15} />
          {SUPPORTED_LANGUAGES.find(l => l.value === language)?.label ?? language.toUpperCase()}
          <ChevronDown size={13} style={{ transition: 'transform 0.15s', transform: langDropdownOpen ? 'rotate(180deg)' : 'none' }} />
        </button>

        {langDropdownOpen && (
          <div
            role="listbox"
            aria-label="Select language"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: C.surface, borderRadius: 12,
              boxShadow: '0 4px 24px rgba(16,24,40,0.12)',
              border: `1px solid ${C.dividerSoft}`,
              minWidth: 190, maxHeight: 320, overflowY: 'auto',
            }}
          >
            {SUPPORTED_LANGUAGES.map(({ value, label }) => (
              <button
                key={value}
                role="option"
                aria-selected={value === language}
                onClick={() => { setLanguageLocal(value); setLangDropdownOpen(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 16px', border: 'none',
                  background: value === language ? ACCENT_SUBTLE : 'transparent',
                  color: value === language ? ACCENT : C.textSecondary,
                  fontWeight: value === language ? 600 : 400,
                  fontSize: `calc(14px * var(--fs-scale-body, 1))`, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (value !== language) e.currentTarget.style.background = C.surfaceSecondary }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { if (value !== language) e.currentTarget.style.background = 'transparent' }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Centered auth column */}
      <div style={{ width: '100%', maxWidth: A.contentMaxWidthMobile, margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>

        {/* Product icon + Welcome to + Product name + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 28 }}>
          <ProductMark />
          <p style={{ margin: '18px 0 2px', fontSize: `calc(${A.welcomeText.size}px * var(--fs-scale-subtitle, 1))`, lineHeight: `${A.welcomeText.lineHeight}px`, fontWeight: A.welcomeText.weight, color: C.textPrimary }}>{t('login.welcomeTo')}</p>
          <ProductName />
          <p style={{ margin: '12px 0 0', fontSize: `calc(${A.tagline.size}px * var(--fs-scale-subtitle, 1))`, color: C.textSecondary, lineHeight: 1.5, maxWidth: 360 }}>
            {t('login.productTagline')}
          </p>
        </div>

        {oidcOnly ? (
          <div style={{ background: C.surface, borderRadius: R, border: `1px solid ${C.dividerSoft}`, padding: '28px 24px', boxShadow: '0 1px 3px rgba(16,24,40,0.06)' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: `calc(20px * var(--fs-scale-title, 1))`, fontWeight: 700, color: C.textPrimary }}>{t('login.title')}</h2>
            <p style={{ margin: '0 0 20px', fontSize: `calc(14px * var(--fs-scale-body, 1))`, color: C.textMuted }}>{noRedirect ? t('login.oidcLoggedOut') : t('login.oidcOnly')}</p>
            {error && (
              <div role="alert" style={{ padding: '10px 14px', background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 10, fontSize: `calc(13px * var(--fs-scale-body, 1))`, color: '#B42318', marginBottom: 16 }}>
                {error}
              </div>
            )}
            <a href={`/api/auth/oidc/login${inviteToken ? '?invite=' + encodeURIComponent(inviteToken) : ''}`}
              style={{
                width: '100%', height: A.buttonHeight,
                background: ACCENT, color: 'white',
                border: 'none', borderRadius: R,
                fontSize: `calc(${A.primaryButtonText.size}px * var(--fs-scale-body, 1))`, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                textDecoration: 'none', transition: 'background 180ms cubic-bezier(0.23,1,0.32,1)',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = ACCENT_HOVER }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = ACCENT }}
            >
              {isGoogleProvider ? <GoogleG size={18} /> : <Shield size={16} />}
              {isGoogleProvider ? t('login.continueWithGoogle') : t('login.oidcSignIn', { name: appConfig?.oidc_display_name || 'SSO' })}
            </a>
          </div>
        ) : (
          <>
            {/* Login / Sign Up tabs (underline indicator, per approved reference) */}
            {showTabs && (
              <div role="tablist" aria-label={t('login.title')} style={{ display: 'flex', alignItems: 'stretch', height: A.tabsHeight, background: C.surface, border: `1px solid ${C.dividerSoft}`, borderRadius: R, marginBottom: 16, boxShadow: '0 1px 2px rgba(16,24,40,0.04)', overflow: 'hidden' }}>
                {(['login', 'register'] as const).map((m, idx) => {
                  const active = mode === m
                  return (
                    <React.Fragment key={m}>
                      {idx === 1 && <div aria-hidden="true" style={{ width: 1, alignSelf: 'center', height: 24, background: C.dividerSoft }} />}
                      <button
                        role="tab"
                        aria-selected={active}
                        onClick={() => { setMode(m); setError(''); setMfaStep(false); setMfaToken(''); setMfaCode('') }}
                        style={{
                          flex: 1, border: 'none', cursor: 'pointer', background: 'transparent',
                          fontFamily: 'inherit', fontSize: `calc(${A.tabLabel.size}px * var(--fs-scale-body, 1))`, fontWeight: A.tabLabel.weight,
                          color: active ? ACCENT : C.textSecondary,
                          borderBottom: active ? `2px solid ${ACCENT}` : '2px solid transparent',
                          transition: 'color 150ms, border-color 150ms',
                        }}
                      >
                        {m === 'login' ? t('login.tabLogin') : t('login.tabSignUp')}
                      </button>
                    </React.Fragment>
                  )
                })}
              </div>
            )}

            <div style={{ background: C.surface, borderRadius: R, border: `1px solid ${C.dividerSoft}`, padding: '24px 24px 26px', boxShadow: '0 1px 3px rgba(16,24,40,0.06)' }}>
              {/* Contextual heading for step-up / special states */}
              {(passwordChangeStep || (mode === 'login' && mfaStep) || (mode === 'register' && !showTabs)) && (
                <div style={{ marginBottom: 18 }}>
                  <h2 style={{ margin: '0 0 4px', fontSize: `calc(19px * var(--fs-scale-title, 1))`, fontWeight: 700, color: C.textPrimary }}>
                    {passwordChangeStep
                      ? t('login.setNewPassword')
                      : mode === 'login' && mfaStep
                        ? t('login.mfaTitle')
                        : (!appConfig?.has_users ? t('login.createAdmin') : t('login.createAccount'))}
                  </h2>
                  <p style={{ margin: 0, fontSize: `calc(14px * var(--fs-scale-body, 1))`, color: C.textMuted }}>
                    {passwordChangeStep
                      ? t('login.setNewPasswordHint')
                      : mode === 'login' && mfaStep
                        ? t('login.mfaSubtitle')
                        : (!appConfig?.has_users ? t('login.createAdminHint') : t('login.createAccountHint'))}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && (
                  <div role="alert" style={{ padding: '10px 14px', background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 10, fontSize: `calc(13px * var(--fs-scale-body, 1))`, color: '#B42318' }}>
                    {error}
                  </div>
                )}

                {insecureCookie && (
                  <div style={{ padding: '12px 14px', background: '#FFFAEB', border: '1px solid #FEDF89', borderRadius: 10, fontSize: `calc(13px * var(--fs-scale-body, 1))`, color: '#B54708' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('login.insecureCookie.title')}</div>
                    <div style={{ lineHeight: 1.55 }}>{t('login.insecureCookie.body')}</div>
                    <a href="https://github.com/mauriceboe/TREK/wiki/Troubleshooting" target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: 6, fontWeight: 600, color: '#B54708', textDecoration: 'underline' }}>
                      {t('login.insecureCookie.link')} ↗
                    </a>
                  </div>
                )}

                {passwordChangeStep && (
                  <>
                    <div style={{ padding: '10px 14px', background: '#FFFAEB', border: '1px solid #FEDF89', borderRadius: 10, fontSize: `calc(13px * var(--fs-scale-body, 1))`, color: '#B54708' }}>
                      {t('settings.mustChangePassword')}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: `calc(14px * var(--fs-scale-body, 1))`, fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('settings.newPassword')}</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.placeholder }} />
                        <input
                          type="password" value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} required
                          placeholder={t('settings.newPassword')} style={inputBase}
                          onFocus={focusOn} onBlur={focusOff}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: `calc(14px * var(--fs-scale-body, 1))`, fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('settings.confirmPassword')}</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.placeholder }} />
                        <input
                          type="password" value={confirmPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} required
                          placeholder={t('settings.confirmPassword')} style={inputBase}
                          onFocus={focusOn} onBlur={focusOff}
                        />
                      </div>
                    </div>
                  </>
                )}

                {mode === 'login' && mfaStep && !passwordChangeStep && (
                  <div>
                    <label style={{ display: 'block', fontSize: `calc(14px * var(--fs-scale-body, 1))`, fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('login.mfaCodeLabel')}</label>
                    <div style={{ position: 'relative' }}>
                      <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.placeholder }} />
                      <input
                        type="text"
                        inputMode="text"
                        autoComplete="one-time-code"
                        value={mfaCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMfaCode(e.target.value.toUpperCase().slice(0, 24))}
                        placeholder="000000 or XXXX-XXXX"
                        required
                        autoFocus
                        style={inputBase}
                        onFocus={focusOn} onBlur={focusOff}
                      />
                    </div>
                    <p style={{ fontSize: `calc(13px * var(--fs-scale-body, 1))`, color: C.textMuted, marginTop: 8 }}>{t('login.mfaHint')}</p>
                    <button
                      type="button"
                      onClick={() => { setMfaStep(false); setMfaToken(''); setMfaCode(''); setError('') }}
                      style={{ marginTop: 8, background: 'none', border: 'none', color: C.textMuted, fontSize: `calc(13px * var(--fs-scale-body, 1))`, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                    >
                      {t('login.mfaBack')}
                    </button>
                  </div>
                )}

                {/* Full Name / username (register only) */}
                {mode === 'register' && !passwordChangeStep && (
                  <div>
                    <label style={{ display: 'block', fontSize: `calc(14px * var(--fs-scale-body, 1))`, fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('login.username')}</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.placeholder }} />
                      <input
                        type="text" value={username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} required
                        placeholder="admin" style={inputBase}
                        onFocus={focusOn} onBlur={focusOff}
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                {!(mode === 'login' && mfaStep) && !passwordChangeStep && (
                  <div>
                    <label style={{ display: 'block', fontSize: `calc(14px * var(--fs-scale-body, 1))`, fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('common.email')}</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.placeholder }} />
                      <input
                        type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required
                        placeholder={t('login.emailPlaceholder')} style={inputBase}
                        onFocus={focusOn} onBlur={focusOff}
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                {!(mode === 'login' && mfaStep) && !passwordChangeStep && (
                  <div>
                    <label style={{ display: 'block', fontSize: `calc(14px * var(--fs-scale-body, 1))`, fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('common.password')}</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.placeholder }} />
                      <input
                        type={showPassword ? 'text' : 'password'} value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required
                        placeholder="••••••••" style={{ ...inputBase, paddingRight: 46 }}
                        onFocus={focusOn} onBlur={focusOff}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: C.placeholder,
                          width: 24, height: 24,
                        }}>
                        <Eye size={17} style={{
                          position: 'absolute', inset: 3,
                          opacity: showPassword ? 0 : 1,
                          transform: showPassword ? 'scale(0.7) rotate(-20deg)' : 'scale(1) rotate(0)',
                          transition: 'opacity 180ms cubic-bezier(0.23,1,0.32,1), transform 180ms cubic-bezier(0.23,1,0.32,1)',
                        }} />
                        <EyeOff size={17} style={{
                          position: 'absolute', inset: 3,
                          opacity: showPassword ? 1 : 0,
                          transform: showPassword ? 'scale(1) rotate(0)' : 'scale(0.7) rotate(20deg)',
                          transition: 'opacity 180ms cubic-bezier(0.23,1,0.32,1), transform 180ms cubic-bezier(0.23,1,0.32,1)',
                        }} />
                      </button>
                    </div>
                    {mode === 'login' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ToggleSwitch on={rememberMe} onToggle={() => setRememberMe(!rememberMe)} label={t('login.rememberMe')} />
                          <span
                            onClick={() => setRememberMe(!rememberMe)}
                            style={{ cursor: 'pointer', color: '#344054', fontSize: `calc(13px * var(--fs-scale-body, 1))`, fontWeight: 500, userSelect: 'none' }}
                          >
                            {t('login.rememberMe')}
                          </span>
                        </div>
                        <button type="button" onClick={() => navigate('/forgot-password')} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          color: ACCENT, fontSize: `calc(13px * var(--fs-scale-body, 1))`, fontWeight: 600, fontFamily: 'inherit',
                        }}>{t('login.forgotPassword')}</button>
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={isLoading} style={{
                  marginTop: 4, width: '100%', height: A.buttonHeight, background: ACCENT, color: 'white',
                  border: 'none', borderRadius: R, fontSize: `calc(${A.primaryButtonText.size}px * var(--fs-scale-body, 1))`, fontWeight: 600, cursor: isLoading ? 'default' : 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: isLoading ? 0.7 : 1, transition: 'background 0.15s, opacity 0.15s',
                }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!isLoading) e.currentTarget.style.background = ACCENT_HOVER }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = ACCENT}
                >
                  {isLoading
                    ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />{passwordChangeStep ? t('settings.updatePassword') : mode === 'register' ? t('login.creating') : (mode === 'login' && mfaStep ? t('login.mfaVerify') : t('login.signingIn'))}</>
                    : <>{passwordChangeStep ? t('settings.updatePassword') : mode === 'register' ? t('login.createAccount') : (mode === 'login' && mfaStep ? t('login.mfaVerify') : t('login.tabLogin'))}</>
                  }
                </button>
              </form>
            </div>
          </>
        )}

        {/* Federated (Google / SSO) button — when OIDC configured, not in oidc-only mode */}
        {oidcButtonShown && (
          <>
            {orDivider}
            <a href={`/api/auth/oidc/login${inviteToken ? '?invite=' + encodeURIComponent(inviteToken) : ''}`}
              style={secondaryBtn}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = C.placeholder }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border }}
            >
              {isGoogleProvider ? <GoogleG size={18} /> : <Shield size={16} />}
              {isGoogleProvider ? t('login.continueWithGoogle') : t('login.oidcSignIn', { name: appConfig!.oidc_display_name })}
            </a>
          </>
        )}

        {/* Passkey login button */}
        {passkeyAvailable && (
          <>
            {!oidcButtonShown && orDivider}
            <button type="button" onClick={handlePasskeyLogin} disabled={isLoading}
              style={{ ...secondaryBtn, color: '#344054', cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!isLoading) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = C.placeholder } }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border }}
            >
              <Fingerprint size={16} />
              {t('login.passkey.signIn')}
            </button>
          </>
        )}

        {/* Demo login button */}
        {appConfig?.demo_mode && (
          <button onClick={handleDemoLogin} disabled={isLoading}
            style={{
              marginTop: 20, width: '100%', height: A.buttonHeight,
              background: ACCENT_SUBTLE,
              color: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: R,
              fontSize: `calc(${A.primaryButtonText.size}px * var(--fs-scale-body, 1))`, fontWeight: 600, cursor: isLoading ? 'default' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: isLoading ? 0.7 : 1, transition: 'background 180ms, opacity 180ms',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!isLoading) e.currentTarget.style.background = '#E0EAFF' }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = ACCENT_SUBTLE }}
          >
            <Plane size={18} />
            {t('login.demoHint')}
          </button>
        )}

        {/* Terms & Privacy + Powered by Kuklabs */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <p style={{ margin: '0 0 12px', fontSize: `calc(${A.legalText.size}px * var(--fs-scale-caption, 1))`, color: C.textMuted, lineHeight: 1.5 }}>
            {t('login.legalPrefix')}{' '}
            <a href={productBrand.termsUrl} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, fontWeight: 500, textDecoration: 'none' }}>{t('login.termsOfUse')}</a>
            {' '}{t('login.legalAnd')}{' '}
            <a href={productBrand.privacyUrl} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, fontWeight: 500, textDecoration: 'none' }}>{t('login.privacyPolicy')}</a>
          </p>
          <p style={{ margin: 0, fontSize: `calc(${A.poweredBy.size}px * var(--fs-scale-caption, 1))`, color: C.placeholder }}>
            {t('login.poweredBy')} <span style={{ fontWeight: 600, color: C.textMuted }}>Kuklabs</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
