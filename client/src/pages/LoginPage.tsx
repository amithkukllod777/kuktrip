import React from 'react'
import { SUPPORTED_LANGUAGES, useTranslation } from '../i18n'
import { Eye, EyeOff, Mail, Lock, User, Globe, ChevronDown, Shield, KeyRound, Fingerprint, Plane } from 'lucide-react'
import { useLogin } from './login/useLogin'
import ToggleSwitch from '../components/Settings/ToggleSwitch'

// Kuklabs identity standard (KUKLABS_IDENTITY.md §6/§15): one approved product
// accent per product. KukTrip's accent is the family blue (accent-600).
const ACCENT = '#2563EB'
const ACCENT_HOVER = '#1D4ED8'
const ACCENT_SUBTLE = '#EFF4FF'

/** KukTrip product app icon — rounded-square (radius per §7.3) with a white
 *  paper-plane glyph on the product accent gradient. Kept inline so the auth
 *  screen stays self-contained. */
function KukTripMark({ size = 72 }: { size?: number }): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" role="img" aria-label="KukTrip">
      <defs>
        <linearGradient id="ktMark" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor={ACCENT} />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="24" fill="url(#ktMark)" />
      <path d="M74 24 L20 46 L43 53 L50 74 L61 55 L74 24 Z" fill="#fff" />
      <path d="M43 53 L74 24 L52 58 Z" fill="#fff" fillOpacity="0.72" />
    </svg>
  )
}

/** "Kuk" (neutral) + "Trip" (accent) product wordmark, per §15 / §19.1. */
function ProductName({ size }: { size: number }): React.ReactElement {
  return (
    <h1 style={{ margin: 0, fontSize: `calc(${size}px * var(--fs-scale-title, 1))`, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, color: '#101828' }}>
      Kuk<span style={{ color: ACCENT }}>Trip</span>
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

  // Login / Sign Up tabs (§15) — only in the plain login/register state where
  // switching modes is actually offered.
  const showTabs = !!(showRegisterOption && appConfig?.has_users && !appConfig?.demo_mode && !mfaStep && !passwordChangeStep && !oidcOnly)

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '15px 14px 15px 44px', border: '1px solid #D0D5DD',
    borderRadius: 12, fontSize: 'calc(15px * var(--fs-scale-body, 1))', fontFamily: 'inherit', outline: 'none',
    color: '#101828', background: 'white', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const focusOn = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT_SUBTLE}` }
  const focusOff = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#D0D5DD'; e.target.style.boxShadow = 'none' }

  if (showTakeoff) {
    return (
      <div className="takeoff-overlay" style={{ position: 'fixed', inset: 0, zIndex: 99999, overflow: 'hidden' }}>
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
          <KukTripMark size={80} />
          <h1 style={{ margin: 0, fontSize: 'calc(40px * var(--fs-scale-title, 1))', fontWeight: 800, letterSpacing: '-0.02em', color: 'white' }}>
            Kuk<span style={{ color: '#93C5FD' }}>Trip</span>
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#F8FAFC', fontFamily: 'var(--font-system)', position: 'relative', padding: '20px 16px 32px' }}>

      {/* Language dropdown (§22 accessible control) */}
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
            fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, color: '#475467',
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
              background: 'white', borderRadius: 12,
              boxShadow: '0 4px 24px rgba(16,24,40,0.12)',
              border: '1px solid #EAECF0',
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
                  color: value === language ? ACCENT : '#475467',
                  fontWeight: value === language ? 600 : 400,
                  fontSize: 'calc(14px * var(--fs-scale-body, 1))', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (value !== language) e.currentTarget.style.background = '#F2F4F7' }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { if (value !== language) e.currentTarget.style.background = 'transparent' }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Centered auth column (§15) */}
      <div style={{ width: '100%', maxWidth: 420, margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>

        {/* Product icon + Welcome to + Product name + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 28 }}>
          <KukTripMark size={72} />
          <p style={{ margin: '18px 0 2px', fontSize: 'calc(22px * var(--fs-scale-subtitle, 1))', fontWeight: 500, color: '#101828' }}>{t('login.welcomeTo')}</p>
          <ProductName size={40} />
          <p style={{ margin: '12px 0 0', fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', color: '#475467', lineHeight: 1.5, maxWidth: 360 }}>
            {t('login.productTagline')}
          </p>
        </div>

        {oidcOnly ? (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #EAECF0', padding: '28px 24px', boxShadow: '0 1px 3px rgba(16,24,40,0.06)' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 'calc(20px * var(--fs-scale-title, 1))', fontWeight: 700, color: '#101828' }}>{t('login.title')}</h2>
            <p style={{ margin: '0 0 20px', fontSize: 'calc(14px * var(--fs-scale-body, 1))', color: '#667085' }}>{noRedirect ? t('login.oidcLoggedOut') : t('login.oidcOnly')}</p>
            {error && (
              <div role="alert" style={{ padding: '10px 14px', background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: '#B42318', marginBottom: 16 }}>
                {error}
              </div>
            )}
            <a href={`/api/auth/oidc/login${inviteToken ? '?invite=' + encodeURIComponent(inviteToken) : ''}`}
              style={{
                width: '100%', padding: '14px',
                background: ACCENT, color: 'white',
                border: 'none', borderRadius: 12,
                fontSize: 'calc(15px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                textDecoration: 'none', transition: 'background 180ms cubic-bezier(0.23,1,0.32,1)',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = ACCENT_HOVER }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = ACCENT }}
            >
              <Shield size={16} />
              {t('login.oidcSignIn', { name: appConfig?.oidc_display_name || 'SSO' })}
            </a>
          </div>
        ) : (
          <>
            {/* Login / Sign Up tabs */}
            {showTabs && (
              <div role="tablist" aria-label={t('login.title')} style={{ display: 'flex', background: 'white', border: '1px solid #EAECF0', borderRadius: 12, padding: 5, marginBottom: 16, boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
                {(['login', 'register'] as const).map(m => {
                  const active = mode === m
                  return (
                    <button
                      key={m}
                      role="tab"
                      aria-selected={active}
                      onClick={() => { setMode(m); setError(''); setMfaStep(false); setMfaToken(''); setMfaCode('') }}
                      style={{
                        flex: 1, padding: '11px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 'calc(15px * var(--fs-scale-body, 1))', fontWeight: 600,
                        background: active ? ACCENT_SUBTLE : 'transparent',
                        color: active ? ACCENT : '#667085',
                        transition: 'background 150ms, color 150ms',
                      }}
                    >
                      {m === 'login' ? t('login.tabLogin') : t('login.tabSignUp')}
                    </button>
                  )
                })}
              </div>
            )}

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #EAECF0', padding: '24px 24px 26px', boxShadow: '0 1px 3px rgba(16,24,40,0.06)' }}>
              {/* Contextual heading for step-up / special states */}
              {(passwordChangeStep || (mode === 'login' && mfaStep) || (mode === 'register' && !showTabs)) && (
                <div style={{ marginBottom: 18 }}>
                  <h2 style={{ margin: '0 0 4px', fontSize: 'calc(19px * var(--fs-scale-title, 1))', fontWeight: 700, color: '#101828' }}>
                    {passwordChangeStep
                      ? t('login.setNewPassword')
                      : mode === 'login' && mfaStep
                        ? t('login.mfaTitle')
                        : (!appConfig?.has_users ? t('login.createAdmin') : t('login.createAccount'))}
                  </h2>
                  <p style={{ margin: 0, fontSize: 'calc(14px * var(--fs-scale-body, 1))', color: '#667085' }}>
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
                  <div role="alert" style={{ padding: '10px 14px', background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: '#B42318' }}>
                    {error}
                  </div>
                )}

                {insecureCookie && (
                  <div style={{ padding: '12px 14px', background: '#FFFAEB', border: '1px solid #FEDF89', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: '#B54708' }}>
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
                    <div style={{ padding: '10px 14px', background: '#FFFAEB', border: '1px solid #FEDF89', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: '#B54708' }}>
                      {t('settings.mustChangePassword')}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('settings.newPassword')}</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#98A2B3' }} />
                        <input
                          type="password" value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} required
                          placeholder={t('settings.newPassword')} style={inputBase}
                          onFocus={focusOn} onBlur={focusOff}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('settings.confirmPassword')}</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#98A2B3' }} />
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
                    <label style={{ display: 'block', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('login.mfaCodeLabel')}</label>
                    <div style={{ position: 'relative' }}>
                      <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#98A2B3' }} />
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
                    <p style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: '#667085', marginTop: 8 }}>{t('login.mfaHint')}</p>
                    <button
                      type="button"
                      onClick={() => { setMfaStep(false); setMfaToken(''); setMfaCode(''); setError('') }}
                      style={{ marginTop: 8, background: 'none', border: 'none', color: '#667085', fontSize: 'calc(13px * var(--fs-scale-body, 1))', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                    >
                      {t('login.mfaBack')}
                    </button>
                  </div>
                )}

                {/* Full Name / username (register only) */}
                {mode === 'register' && !passwordChangeStep && (
                  <div>
                    <label style={{ display: 'block', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('login.username')}</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#98A2B3' }} />
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
                    <label style={{ display: 'block', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('common.email')}</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#98A2B3' }} />
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
                    <label style={{ display: 'block', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, color: '#344054', marginBottom: 6 }}>{t('common.password')}</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#98A2B3' }} />
                      <input
                        type={showPassword ? 'text' : 'password'} value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required
                        placeholder="••••••••" style={{ ...inputBase, paddingRight: 46 }}
                        onFocus={focusOn} onBlur={focusOff}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#98A2B3',
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
                            style={{ cursor: 'pointer', color: '#344054', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, userSelect: 'none' }}
                          >
                            {t('login.rememberMe')}
                          </span>
                        </div>
                        <button type="button" onClick={() => navigate('/forgot-password')} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          color: ACCENT, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, fontFamily: 'inherit',
                        }}>{t('login.forgotPassword')}</button>
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={isLoading} style={{
                  marginTop: 4, width: '100%', padding: '14px', background: ACCENT, color: 'white',
                  border: 'none', borderRadius: 12, fontSize: 'calc(15px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: isLoading ? 'default' : 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: isLoading ? 0.7 : 1, transition: 'background 0.15s, opacity 0.15s',
                }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!isLoading) e.currentTarget.style.background = ACCENT_HOVER }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = ACCENT}
                >
                  {isLoading
                    ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />{passwordChangeStep ? t('settings.updatePassword') : mode === 'register' ? t('login.creating') : (mode === 'login' && mfaStep ? t('login.mfaVerify') : t('login.signingIn'))}</>
                    : <>{passwordChangeStep ? t('settings.updatePassword') : mode === 'register' ? t('login.createAccount') : (mode === 'login' && mfaStep ? t('login.mfaVerify') : t('login.signIn'))}</>
                  }
                </button>
              </form>
            </div>
          </>
        )}

        {/* OIDC / SSO login button (only when OIDC is configured, oidc_login enabled, not in oidc-only mode) */}
        {appConfig?.oidc_configured && appConfig?.oidc_login && !oidcOnly && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <div style={{ flex: 1, height: 1, background: '#EAECF0' }} />
              <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: '#98A2B3' }}>{t('common.or')}</span>
              <div style={{ flex: 1, height: 1, background: '#EAECF0' }} />
            </div>
            <a href={`/api/auth/oidc/login${inviteToken ? '?invite=' + encodeURIComponent(inviteToken) : ''}`}
              style={{
                marginTop: 14, width: '100%', padding: '13px',
                background: 'white', color: '#344054',
                border: '1px solid #D0D5DD', borderRadius: 12,
                fontSize: 'calc(15px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                textDecoration: 'none', transition: 'background 180ms cubic-bezier(0.23,1,0.32,1), border-color 180ms cubic-bezier(0.23,1,0.32,1)',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#98A2B3' }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#D0D5DD' }}
            >
              <Shield size={16} />
              {t('login.oidcSignIn', { name: appConfig.oidc_display_name })}
            </a>
          </>
        )}

        {/* Passkey login button (instance toggle on + a usable RP ID resolves) */}
        {passkeyAvailable && (
          <>
            {!oidcButtonShown && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
                <div style={{ flex: 1, height: 1, background: '#EAECF0' }} />
                <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: '#98A2B3' }}>{t('common.or')}</span>
                <div style={{ flex: 1, height: 1, background: '#EAECF0' }} />
              </div>
            )}
            <button type="button" onClick={handlePasskeyLogin} disabled={isLoading}
              style={{
                marginTop: 14, width: '100%', padding: '13px',
                background: 'white', color: '#344054',
                border: '1px solid #D0D5DD', borderRadius: 12,
                fontSize: 'calc(15px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: isLoading ? 'default' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: isLoading ? 0.7 : 1,
                transition: 'background 180ms cubic-bezier(0.23,1,0.32,1), border-color 180ms cubic-bezier(0.23,1,0.32,1)',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!isLoading) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#98A2B3' } }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#D0D5DD' }}
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
              marginTop: 20, width: '100%', padding: '14px',
              background: ACCENT_SUBTLE,
              color: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: 12,
              fontSize: 'calc(15px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: isLoading ? 'default' : 'pointer',
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

        {/* Terms & Privacy + Powered by Kuklabs (§15) */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <p style={{ margin: '0 0 12px', fontSize: 'calc(13px * var(--fs-scale-caption, 1))', color: '#667085', lineHeight: 1.5 }}>
            {t('login.legalPrefix')}{' '}
            <a href="https://kuklabs.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, fontWeight: 500, textDecoration: 'none' }}>{t('login.termsOfUse')}</a>
            {' '}{t('login.legalAnd')}{' '}
            <a href="https://kuklabs.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, fontWeight: 500, textDecoration: 'none' }}>{t('login.privacyPolicy')}</a>
          </p>
          <p style={{ margin: 0, fontSize: 'calc(13px * var(--fs-scale-caption, 1))', color: '#98A2B3' }}>
            {t('login.poweredBy')} <span style={{ fontWeight: 600, color: '#667085' }}>Kuklabs</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
