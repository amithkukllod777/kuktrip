import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { JWT_SECRET } from '../config';
import { AuthRequest, OptionalAuthRequest, User } from '../types';
import { applyIdempotency } from './idempotency';
import { isDemoEmail } from '../services/demo';
import { resolveKuklabsBearerUser } from '../services/kuklabsBearer';

export function extractToken(req: Request): string | null {
  // Prefer httpOnly cookie; fall back to Authorization: Bearer (MCP, API clients,
  // and native Kuklabs AuthKit access tokens).
  const cookieToken = (req as any).cookies?.trek_session;
  if (cookieToken) return cookieToken;
  const authHeader = req.headers['authorization'];
  return (authHeader && authHeader.split(' ')[1]) || null;
}

/**
 * Verify a LOCAL KukTrip/TREK JWT and load its user, enforcing the
 * password_version gate.
 *
 * This function deliberately stays local-only because requireCookieAuth uses it
 * for sensitive OAuth-management endpoints. A native AuthKit bearer must never
 * become equivalent to the app's httpOnly cookie merely by being copied into a
 * cookie header.
 */
export function verifyJwtAndLoadUser(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as {
      id: number;
      pv?: number;
      purpose?: string;
    };
    if (decoded.purpose) return null;
    if (!Number.isFinite(decoded.id)) return null;
    const row = db
      .prepare('SELECT id, username, email, role, password_version FROM users WHERE id = ?')
      .get(decoded.id) as (User & { password_version?: number }) | undefined;
    if (!row) return null;
    const tokenPv = typeof decoded.pv === 'number' ? decoded.pv : 0;
    const currentPv = typeof row.password_version === 'number' ? row.password_version : 0;
    if (tokenPv !== currentPv) return null;
    const { password_version: _pv, ...user } = row;
    return user as User;
  } catch {
    return null;
  }
}

/**
 * Product-API session verifier.
 *
 * Order matters:
 * 1. existing local session/Bearer token (web/PWA, MCP, legacy clients), then
 * 2. central Kuklabs AuthKit bearer issued specifically to `kuktrip`.
 *
 * During the shared-MySQL migration the central identity is mapped to the
 * compatibility local row by openId. Once Issue #18 removes that compatibility
 * layer, this function can resolve the shared Kuklabs user directly instead.
 */
export function verifyProductTokenAndLoadUser(token: string): User | null {
  return verifyJwtAndLoadUser(token) || resolveKuklabsBearerUser(token);
}

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'Access token required', code: 'AUTH_REQUIRED' });
    return;
  }

  const user = verifyProductTokenAndLoadUser(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'AUTH_REQUIRED' });
    return;
  }
  (req as AuthRequest).user = user;
  applyIdempotency(req, res, next, user.id);
};

/** Like `authenticate` but rejects requests that don't carry an httpOnly session cookie.
 * Used on state-mutating OAuth endpoints (consent POST, client CRUD, session revoke)
 * to prevent Bearer JWT tokens obtained by other means from managing OAuth clients. */
const requireCookieAuth = (req: Request, res: Response, next: NextFunction): void => {
  const cookieToken = (req as any).cookies?.trek_session;
  if (!cookieToken) {
    res.status(401).json({ error: 'Cookie session required for this endpoint', code: 'COOKIE_AUTH_REQUIRED' });
    return;
  }
  const user = verifyJwtAndLoadUser(cookieToken);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired session', code: 'AUTH_REQUIRED' });
    return;
  }
  (req as AuthRequest).user = user;
  next();
};

const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);

  if (!token) {
    (req as OptionalAuthRequest).user = null;
    return next();
  }

  (req as OptionalAuthRequest).user = verifyProductTokenAndLoadUser(token) || null;
  next();
};

const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  if (!authReq.user || authReq.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

const demoUploadBlock = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  if (process.env.DEMO_MODE?.toLowerCase() === 'true' && isDemoEmail(authReq.user?.email)) {
    res.status(403).json({ error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' });
    return;
  }
  next();
};

export { authenticate, requireCookieAuth, optionalAuth, adminOnly, demoUploadBlock };
