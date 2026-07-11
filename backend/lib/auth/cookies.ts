import { cookies } from 'next/headers';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from './jwt';

export const ACCESS_COOKIE = 'nexacare_access_token';
export const REFRESH_COOKIE = 'nexacare_refresh_token';

/**
 * NOTE on SameSite=Strict: this requires the frontend and this API to be
 * served from the same site (e.g. behind a shared reverse proxy /
 * same registrable domain with the frontend on a subdomain using SameSite=
 * Lax for the top-level navigation, API calls same-origin). If the Vite
 * frontend is deployed on a genuinely different origin with no shared
 * domain, Strict will silently block the cookie on cross-site fetches —
 * in that topology, use SameSite=None + Secure and add strict CORS
 * allow-listing instead. Documented here so this doesn't get "fixed" by
 * loosening it without understanding why.
 */
const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
    // Scope the refresh cookie to only the endpoint that needs it, so it
    // isn't attached (and therefore isn't exfiltratable) on every request.
    path: '/api/auth/refresh',
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, '', { ...baseCookieOptions, maxAge: 0 });
  store.set(REFRESH_COOKIE, '', { ...baseCookieOptions, maxAge: 0, path: '/api/auth/refresh' });
}

export async function getAccessTokenCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshTokenCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}
