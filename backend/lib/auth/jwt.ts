import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';
import { randomUUID } from 'crypto';

/**
 * Two distinct signing secrets so that a leaked access-token secret can't be
 * used to forge refresh tokens (and vice versa). Both MUST be >= 32 random
 * bytes, base64 or hex encoded, and injected via env — never hardcoded.
 */
function getSecret(name: 'ACCESS_TOKEN_SECRET' | 'REFRESH_TOKEN_SECRET'): Uint8Array {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} is missing or too short (>= 32 chars required)`);
  }
  return new TextEncoder().encode(value);
}

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface AccessTokenPayload {
  sub: string; // userId
  role: string;
  email: string;
  linkedPatientId?: string | null;
}

export interface RefreshTokenPayload {
  sub: string; // userId
  jti: string; // unique token id, correlates to RefreshToken row
  tokenVersion: number; // must match User.refreshTokenVersion at verify time
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .setIssuer('nexacare-api')
    .setAudience('nexacare-frontend')
    .sign(getSecret('ACCESS_TOKEN_SECRET'));
}

export async function signRefreshToken(
  userId: string,
  tokenVersion: number,
  jti: string = randomUUID(),
): Promise<{ token: string; jti: string }> {
  const token = await new SignJWT({ tokenVersion })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL_SECONDS}s`)
    .setIssuer('nexacare-api')
    .setAudience('nexacare-frontend')
    .sign(getSecret('REFRESH_TOKEN_SECRET'));
  return { token, jti };
}

export type VerifyResult<T> = { ok: true; payload: T } | { ok: false; reason: 'expired' | 'invalid' };

export async function verifyAccessToken(token: string): Promise<VerifyResult<AccessTokenPayload>> {
  try {
    const { payload } = await jwtVerify(token, getSecret('ACCESS_TOKEN_SECRET'), {
      issuer: 'nexacare-api',
      audience: 'nexacare-frontend',
    });
    return {
      ok: true,
      payload: {
        sub: payload.sub as string,
        role: payload.role as string,
        email: payload.email as string,
        linkedPatientId: (payload.linkedPatientId as string | undefined) ?? null,
      },
    };
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) return { ok: false, reason: 'expired' };
    return { ok: false, reason: 'invalid' };
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<VerifyResult<RefreshTokenPayload>> {
  try {
    const { payload } = await jwtVerify(token, getSecret('REFRESH_TOKEN_SECRET'), {
      issuer: 'nexacare-api',
      audience: 'nexacare-frontend',
    });
    return {
      ok: true,
      payload: {
        sub: payload.sub as string,
        jti: payload.jti as string,
        tokenVersion: payload.tokenVersion as number,
      },
    };
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) return { ok: false, reason: 'expired' };
    return { ok: false, reason: 'invalid' };
  }
}
