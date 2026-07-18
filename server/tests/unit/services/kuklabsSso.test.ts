/**
 * Unit tests for the KukLabs Account SSO adapter — KUKLABS-SSO-001…010.
 *
 * Covers cookie verification (valid / forged / expired / disabled) and
 * find-or-provision of the local user keyed by the KukLabs openId
 * (oidc_sub + oidc_issuer='kuklabs'), including the admin bootstrap /
 * allow-list role rules.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import jwtLib from 'jsonwebtoken';

// Hoisted so the vi.mock('../config') factory (also hoisted) can reference them.
const { KUKLABS_SECRET, TREK_SECRET, testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  return {
    KUKLABS_SECRET: 'shared-kuklabs-platform-secret-testing-only',
    TREK_SECRET: 'trek-local-jwt-secret-testing-only',
    testDb: db,
    dbMock: { db, closeDb: () => {}, reinitialize: () => {} },
  };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: TREK_SECRET,
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  SESSION_DURATION_SECONDS: 86400,
  SESSION_DURATION_REMEMBER_SECONDS: 2592000,
  KUKLABS_SSO_ENABLED: true,
  KUKLABS_JWT_SECRET: KUKLABS_SECRET,
  KUKLABS_COOKIE_NAME: 'app_session_id',
  KUKLABS_LOGIN_URL: 'https://www.kuklabs.com/login',
  KUKLABS_ADMIN_OPENIDS: ['google:owner-1'],
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { verifyKuklabsCookie, provisionKuklabsUser, mintTrekSession } from '../../../src/services/kuklabsSso';

function platformToken(payload: Record<string, unknown>, opts: jwtLib.SignOptions = {}): string {
  return jwtLib.sign(payload, KUKLABS_SECRET, { algorithm: 'HS256', expiresIn: '1h', ...opts });
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

describe('verifyKuklabsCookie', () => {
  it('KUKLABS-SSO-001: accepts a valid platform token and returns its identity', () => {
    const token = platformToken({ openId: 'google:abc', appId: 'kukbook', name: 'Asha' });
    expect(verifyKuklabsCookie(token)).toEqual({ openId: 'google:abc', name: 'Asha' });
  });

  it('KUKLABS-SSO-002: rejects a token signed with the wrong secret', () => {
    const forged = jwtLib.sign({ openId: 'google:abc' }, 'not-the-shared-secret', { algorithm: 'HS256', expiresIn: '1h' });
    expect(verifyKuklabsCookie(forged)).toBeNull();
  });

  it('KUKLABS-SSO-003: rejects an expired token', () => {
    const expired = platformToken({ openId: 'google:abc' }, { expiresIn: -10 });
    expect(verifyKuklabsCookie(expired)).toBeNull();
  });

  it('KUKLABS-SSO-004: rejects a token with no openId', () => {
    const token = platformToken({ appId: 'kukbook', name: 'Nobody' });
    expect(verifyKuklabsCookie(token)).toBeNull();
  });

  it('KUKLABS-SSO-005: returns null for missing/empty input', () => {
    expect(verifyKuklabsCookie(undefined)).toBeNull();
    expect(verifyKuklabsCookie('')).toBeNull();
  });
});

describe('provisionKuklabsUser', () => {
  it('KUKLABS-SSO-006: first KukLabs account bootstraps as admin', () => {
    const user = provisionKuklabsUser({ openId: 'google:first', name: 'First User' });
    expect(user).not.toBeNull();
    expect(user!.role).toBe('admin');
    const row = testDb.prepare('SELECT oidc_sub, oidc_issuer FROM users WHERE id = ?').get(user!.id) as any;
    expect(row.oidc_sub).toBe('google:first');
    expect(row.oidc_issuer).toBe('kuklabs');
  });

  it('KUKLABS-SSO-007: subsequent accounts are normal users', () => {
    provisionKuklabsUser({ openId: 'google:first', name: 'First' });
    const second = provisionKuklabsUser({ openId: 'google:second', name: 'Second' });
    expect(second!.role).toBe('user');
  });

  it('KUKLABS-SSO-008: an allow-listed openId is provisioned as admin even when not first', () => {
    provisionKuklabsUser({ openId: 'google:first', name: 'First' });
    const owner = provisionKuklabsUser({ openId: 'google:owner-1', name: 'Owner' });
    expect(owner!.role).toBe('admin');
  });

  it('KUKLABS-SSO-009: the same openId maps to the same row (idempotent)', () => {
    const a = provisionKuklabsUser({ openId: 'google:same', name: 'Once' });
    const b = provisionKuklabsUser({ openId: 'google:same', name: 'Twice' });
    expect(a!.id).toBe(b!.id);
    const count = (testDb.prepare('SELECT COUNT(*) c FROM users').get() as any).c;
    expect(count).toBe(1);
  });

  it('KUKLABS-SSO-010: minted trek_session verifies with the local secret and carries the user id', () => {
    const user = provisionKuklabsUser({ openId: 'google:token', name: 'Tok' });
    const token = mintTrekSession({ id: user!.id });
    const decoded = jwtLib.verify(token, TREK_SECRET) as any;
    expect(decoded.id).toBe(user!.id);
  });
});
