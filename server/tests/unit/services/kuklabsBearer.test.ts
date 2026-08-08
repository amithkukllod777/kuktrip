import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import jwtLib from 'jsonwebtoken';

const { KUKLABS_SECRET, TREK_SECRET, testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
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
  KUKLABS_ADMIN_OPENIDS: [],
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import {
  resolveKuklabsBearerUser,
  verifyKuklabsBearerToken,
} from '../../../src/services/kuklabsBearer';
import {
  verifyJwtAndLoadUser,
  verifyProductTokenAndLoadUser,
} from '../../../src/middleware/auth';

function authKitToken(
  payload: Record<string, unknown> = {},
  options: jwtLib.SignOptions = {},
): string {
  return jwtLib.sign(
    {
      openId: 'google:native-user',
      appId: 'kukbook',
      name: 'Native User',
      sid: 'device-session-1',
      prd: 'kuktrip',
      ...payload,
    },
    KUKLABS_SECRET,
    { algorithm: 'HS256', expiresIn: '1h', ...options },
  );
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

describe('Kuklabs native AuthKit bearer bridge', () => {
  it('KUKLABS-BEARER-001 accepts an AuthKit token issued to kuktrip', () => {
    expect(verifyKuklabsBearerToken(authKitToken())).toEqual({
      openId: 'google:native-user',
      name: 'Native User',
      sid: 'device-session-1',
      product: 'kuktrip',
    });
  });

  it('KUKLABS-BEARER-002 rejects an access token issued to another product', () => {
    expect(verifyKuklabsBearerToken(authKitToken({ prd: 'kukbook' }))).toBeNull();
  });

  it('KUKLABS-BEARER-003 rejects a web cookie token with no product claim', () => {
    expect(verifyKuklabsBearerToken(authKitToken({ prd: undefined }))).toBeNull();
  });

  it('KUKLABS-BEARER-004 rejects forged and expired tokens', () => {
    const forged = jwtLib.sign(
      { openId: 'google:native-user', prd: 'kuktrip' },
      'wrong-secret',
      { algorithm: 'HS256', expiresIn: '1h' },
    );
    expect(verifyKuklabsBearerToken(forged)).toBeNull();
    expect(verifyKuklabsBearerToken(authKitToken({}, { expiresIn: -5 }))).toBeNull();
  });

  it('KUKLABS-BEARER-005 resolves the central identity to one compatibility user row', () => {
    const token = authKitToken();
    const a = resolveKuklabsBearerUser(token);
    const b = resolveKuklabsBearerUser(token);
    expect(a).not.toBeNull();
    expect(a!.id).toBe(b!.id);
    const linked = testDb
      .prepare("SELECT oidc_sub, oidc_issuer FROM users WHERE id = ?")
      .get(a!.id) as any;
    expect(linked).toEqual({ oidc_sub: 'google:native-user', oidc_issuer: 'kuklabs' });
  });

  it('KUKLABS-BEARER-006 product auth accepts central bearer but cookie-only verifier does not', () => {
    const token = authKitToken();
    expect(verifyJwtAndLoadUser(token)).toBeNull();
    expect(verifyProductTokenAndLoadUser(token)).not.toBeNull();
  });
});
