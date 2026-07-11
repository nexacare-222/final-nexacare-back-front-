import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCredentials } from '@/lib/auth/credentials';
import { signAccessToken, signRefreshToken, REFRESH_TOKEN_TTL_SECONDS } from '@/lib/auth/jwt';
import { setAuthCookies } from '@/lib/auth/cookies';
import { loginSchema, parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';

// Simple in-memory rate limiting stub — replace with a shared store (Redis)
// before running more than one server instance. Kept here so the route is
// never accidentally shipped with zero throttling.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isRateLimited(key: string): boolean {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return false;
  }
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: Request): Promise<Response> {
  const meta = requestMeta(request);

  try {
    const body = await request.json().catch(() => null);
    const { email, password } = parseOrThrow(loginSchema, body);

    const rateLimitKey = `${meta.ipAddress ?? 'unknown'}:${email}`;
    if (isRateLimited(rateLimitKey)) {
      await recordAudit({ action: 'LOGIN_RATE_LIMITED', metadata: { email }, ...meta });
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const user = await verifyCredentials(email, password);
    if (!user) {
      await recordAudit({ action: 'LOGIN_FAILED', metadata: { email }, ...meta });
      // Deliberately generic — never reveal whether the email exists.
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      linkedPatientId: user.linkedPatientId,
    });

    const { token: refreshToken, jti } = await signRefreshToken(user.id, user.refreshTokenVersion);

    await prisma.refreshToken.create({
      data: {
        jti,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    await setAuthCookies(accessToken, refreshToken);
    await recordAudit({ userId: user.id, action: 'LOGIN_SUCCESS', ...meta });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        linkedPatientId: user.linkedPatientId,
      },
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Invalid request', details: err.message }, { status: 400 });
    }
    // eslint-disable-next-line no-console
    console.error('[auth/login] unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
