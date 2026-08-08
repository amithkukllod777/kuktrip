import jwt from 'jsonwebtoken';
import { KUKLABS_SSO_ENABLED, KUKLABS_JWT_SECRET } from '../config';
import type { User } from '../types';
import { provisionKuklabsUser } from './kuklabsSso';

/**
 * Native/separate-repo Kuklabs AuthKit access tokens are the same HS256
 * Kuklabs session JWT used by the platform, plus `sid` and `prd` claims.
 *
 * This adapter lets Android/iOS authenticate to the transitional KukTrip
 * runtime while it still owns TREK-local product rows. Identity stays central:
 * the token is issued by Kuklabs AuthKit and maps by `openId` only.
 */
export interface KuklabsBearerIdentity {
  openId: string;
  name: string;
  sid?: string;
  product: string;
}

export function verifyKuklabsBearerToken(
  token: string | undefined | null,
): KuklabsBearerIdentity | null {
  if (!KUKLABS_SSO_ENABLED || !KUKLABS_JWT_SECRET) return null;
  if (!token || typeof token !== 'string') return null;

  try {
    const decoded = jwt.verify(token, KUKLABS_JWT_SECRET, {
      algorithms: ['HS256'],
    }) as {
      openId?: unknown;
      name?: unknown;
      sid?: unknown;
      prd?: unknown;
    };

    const openId = typeof decoded.openId === 'string' ? decoded.openId.trim() : '';
    const product = typeof decoded.prd === 'string' ? decoded.prd.trim().toLowerCase() : '';
    if (!openId || product !== 'kuktrip') return null;

    return {
      openId,
      name: typeof decoded.name === 'string' ? decoded.name.trim() : '',
      sid: typeof decoded.sid === 'string' ? decoded.sid : undefined,
      product,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve a verified central AuthKit bearer into the local compatibility row.
 * This compatibility provisioning disappears when Issue #18 completes the
 * shared-MySQL product-data migration; it is not a second identity system.
 */
export function resolveKuklabsBearerUser(token: string): User | null {
  const identity = verifyKuklabsBearerToken(token);
  if (!identity) return null;
  return provisionKuklabsUser({ openId: identity.openId, name: identity.name });
}
