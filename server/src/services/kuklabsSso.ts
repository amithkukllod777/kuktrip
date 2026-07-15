import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import {
  KUKLABS_SSO_ENABLED,
  KUKLABS_JWT_SECRET,
  KUKLABS_ADMIN_OPENIDS,
} from '../config';
import { generateToken } from './authService';
import type { User } from '../types';

/**
 * KukLabs Account SSO — one Kuklabs Account across the ecosystem.
 *
 * Kuk Trip (trip.kuklabs.com) is a sibling of the KukLabs platform
 * (kuklabs.com / book.kuklabs.com), which sets a session cookie scoped to the
 * registrable domain `.kuklabs.com`. The browser therefore presents that cookie
 * to Kuk Trip automatically. This module turns that platform session into a
 * local Kuk Trip session:
 *
 *   1. verify the platform cookie with the SHARED HS256 signing secret, then
 *   2. find-or-provision a local Kuk Trip user keyed by the KukLabs `openId`
 *      (stored in the existing `users.oidc_sub` column with
 *      `oidc_issuer = 'kuklabs'` — no schema migration required), then
 *   3. mint a normal `trek_session` JWT so the rest of the app is unchanged.
 *
 * The KukLabs platform token is an HS256 JWT with the payload shape
 * `{ openId, appId, name, iat, exp }` (see KukBook `server/_core/sdk.ts`
 * `signSession`). Only `openId` is strictly required; `name` is best-effort.
 *
 * Entirely OPT-IN: gated on KUKLABS_SSO_ENABLED (see config.ts). When off, this
 * module is inert and Kuk Trip's own email+password / OIDC login is untouched —
 * so open-source / self-hosted installs are unaffected.
 */

const KUKLABS_ISSUER = 'kuklabs';

export interface KuklabsIdentity {
  openId: string;
  name: string;
}

/**
 * Verify a KukLabs platform session cookie and return its identity, or null if
 * the cookie is missing/expired/forged or SSO is disabled. Never throws.
 */
export function verifyKuklabsCookie(token: string | undefined | null): KuklabsIdentity | null {
  if (!KUKLABS_SSO_ENABLED || !KUKLABS_JWT_SECRET) return null;
  if (!token || typeof token !== 'string') return null;
  try {
    const decoded = jwt.verify(token, KUKLABS_JWT_SECRET, { algorithms: ['HS256'] }) as {
      openId?: unknown;
      name?: unknown;
    };
    const openId = typeof decoded.openId === 'string' ? decoded.openId.trim() : '';
    if (!openId) return null;
    const name = typeof decoded.name === 'string' ? decoded.name.trim() : '';
    return { openId, name };
  } catch {
    // Signature/expiry failures are expected for logged-out or cross-app traffic.
    return null;
  }
}

/**
 * A KukLabs openId (e.g. `google:1234…`) is not an email. Kuk Trip's `users`
 * table requires a UNIQUE, NOT NULL email, so derive a stable, non-routable
 * placeholder from the openId. Deterministic → the same Kuklabs Account always
 * maps to the same row; the `.invalid` TLD (RFC 2606) guarantees it can never
 * be mistaken for a deliverable mailbox.
 */
function placeholderEmail(openId: string): string {
  const digest = crypto.createHash('sha256').update(openId).digest('hex').slice(0, 20);
  return `kuklabs_${digest}@sso.kuklabs.invalid`;
}

/** Turn a display name / openId into a valid, collision-avoiding username. */
function deriveUsername(name: string, openId: string): string {
  const base =
    (name || openId.split(':').pop() || 'kukuser')
      .replace(/[^a-zA-Z0-9_.-]/g, '')
      .substring(0, 24) || 'kukuser';
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(base);
  if (!existing) return base;
  // Deterministic suffix from the openId keeps retries stable (no Date.now()).
  const suffix = crypto.createHash('sha256').update(openId).digest('hex').slice(0, 6);
  return `${base}_${suffix}`.substring(0, 32);
}

/**
 * Find-or-create the local Kuk Trip user for a verified KukLabs identity.
 * Mirrors the OIDC provisioning in oidcService.ts, but keyed to the fixed
 * `kuklabs` issuer. Returns the local user, or null on failure.
 */
export function provisionKuklabsUser(identity: KuklabsIdentity): User | null {
  const { openId, name } = identity;

  // 1. Existing KukLabs-linked account?
  let user = db
    .prepare('SELECT * FROM users WHERE oidc_sub = ? AND oidc_issuer = ?')
    .get(openId, KUKLABS_ISSUER) as User | undefined;
  if (user) {
    maybePromote(user, openId);
    return refreshUser(user.id);
  }

  // 2. First-ever KukLabs account on this instance becomes admin (bootstrap),
  //    matching TREK's first-user convention; explicit allow-list also promotes.
  const kuklabsCount = (
    db
      .prepare('SELECT COUNT(*) as count FROM users WHERE oidc_issuer = ?')
      .get(KUKLABS_ISSUER) as { count: number }
  ).count;
  const isAdmin = KUKLABS_ADMIN_OPENIDS.includes(openId) || kuklabsCount === 0;
  const role = isAdmin ? 'admin' : 'user';

  const email = placeholderEmail(openId);
  const username = deriveUsername(name, openId);
  const randomPass = crypto.randomBytes(32).toString('hex');
  const hash = bcrypt.hashSync(randomPass, 10);

  try {
    const ins = db
      .prepare(
        'INSERT INTO users (username, email, password_hash, role, oidc_sub, oidc_issuer, first_seen_version, login_count) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      )
      .run(username, email, hash, role, openId, KUKLABS_ISSUER, process.env.APP_VERSION || '0.0.0');
    return {
      id: Number(ins.lastInsertRowid),
      username,
      email,
      role,
      avatar: null,
    } as User;
  } catch (err) {
    console.warn('[KukLabsSSO] Failed to provision user:', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Promote an existing KukLabs user if they are on the admin allow-list. */
function maybePromote(user: User, openId: string): void {
  if (user.role !== 'admin' && KUKLABS_ADMIN_OPENIDS.includes(openId)) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', user.id);
  }
}

function refreshUser(userId: number): User | null {
  const row = db
    .prepare('SELECT id, username, email, role, avatar FROM users WHERE id = ?')
    .get(userId) as User | undefined;
  return row ?? null;
}

/** Mint a normal Kuk Trip `trek_session` JWT for a provisioned KukLabs user. */
export function mintTrekSession(user: { id: number }): string {
  return generateToken(user);
}
