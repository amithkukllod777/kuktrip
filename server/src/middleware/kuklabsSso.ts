import type { Request, Response, NextFunction } from 'express';
import { KUKLABS_SSO_ENABLED, KUKLABS_COOKIE_NAME } from '../config';
import { verifyJwtAndLoadUser } from './auth';
import { verifyKuklabsCookie, provisionKuklabsUser, mintTrekSession } from '../services/kuklabsSso';
import { setAuthCookie } from '../services/cookie';

const TREK_COOKIE = 'trek_session';

/**
 * Silent KukLabs SSO bridge.
 *
 * Runs early in the request pipeline (right after cookie-parser). When a visitor
 * arrives at trip.kuklabs.com already signed into their Kuklabs Account, the
 * browser carries the platform's `.kuklabs.com` session cookie. This middleware
 * turns that into a local Kuk Trip session transparently — no second login:
 *
 *   • no-op if SSO is disabled (self-hosted / open-source installs), or
 *   • no-op if the request already carries a VALID `trek_session` (the common
 *     case — avoids a DB write on every authenticated request), else
 *   • verify the KukLabs cookie → provision/adopt the local user → mint a
 *     `trek_session`, set it on the response (so later requests are fast) AND on
 *     the current request (so this very request is authenticated downstream).
 *
 * Every branch fails OPEN: any error just falls through to the app's normal auth,
 * so a misconfigured secret degrades to "not signed in", never a 500.
 */
export function kuklabsSsoBridge(req: Request, res: Response, next: NextFunction): void {
  if (!KUKLABS_SSO_ENABLED) return next();

  try {
    const cookies = (req as any).cookies || {};

    // Already have a working Kuk Trip session? Leave it alone.
    const existing = cookies[TREK_COOKIE];
    if (existing && verifyJwtAndLoadUser(existing)) return next();

    // No KukLabs platform cookie → nothing to bridge (anonymous visitor).
    const platformToken = cookies[KUKLABS_COOKIE_NAME];
    if (!platformToken) return next();

    const identity = verifyKuklabsCookie(platformToken);
    if (!identity) return next();

    const user = provisionKuklabsUser(identity);
    if (!user) return next();

    const token = mintTrekSession(user);
    // Persist for subsequent requests…
    setAuthCookie(res, token, req);
    // …and authenticate THIS request: extractToken() reads req.cookies.trek_session.
    (req as any).cookies[TREK_COOKIE] = token;
  } catch (err) {
    // Never let SSO break a request — degrade to anonymous.
    console.warn('[KukLabsSSO] bridge error:', err instanceof Error ? err.message : err);
  }
  next();
}
