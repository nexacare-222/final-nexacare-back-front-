import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRefreshTokenCookie, setAuthCookies, clearAuthCookies } from '@/lib/auth/cookies';
import { verifyRefreshToken, signAccessToken, signRefreshToken, REFRESH_TOKEN_TTL_SECONDS } from '@/lib/auth/jwt';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';

export async function POST(request: Request): Promise<Response> {
  const meta = requestMeta(request);
  const token = await getRefreshTokenCookie();

  if (!token) {
    return NextResponse.json({ error: 'No refresh token present' }, { status: 401 });
  }

  const verified = await verifyRefreshToken(token);
  if (!verified.ok) {
    await clearAuthCookies();
    return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
  }

  const { sub: userId, jti, tokenVersion } = verified.payload;

  const storedToken = await prisma.refreshToken.findUnique({ where: { jti } });

  // Reuse detection: if this exact refresh token was already rotated away
  // (or doesn't exist at all), someone is replaying a stolen token. Nuke
  // every session for the user and force a fresh login.
  if (!storedToken || storedToken.revokedAt || storedToken.userId !== userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenVersion: { increment: 1 } },
    }).catch(() => null);
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }).catch(() => null);
    await clearAuthCookies();
    await recordAudit({
      userId,
      action: 'REFRESH_TOKEN_REUSE_DETECTED',
      metadata: { jti },
      ...meta,
    });
    return NextResponse.json({ error: 'Session invalidated. Please log in again.' }, { status: 401 });
  }

  if (storedToken.expiresAt < new Date()) {
    await clearAuthCookies();
    return NextResponse.json({ error: 'Refresh token expired' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== 'ACTIVE' || user.refreshTokenVersion !== tokenVersion) {
    await clearAuthCookies();
    return NextResponse.json({ error: 'Session no longer valid' }, { status: 401 });
  }

  // Rotate: issue a new refresh token, mark the old one consumed.
  const { token: newRefreshToken, jti: newJti } = await signRefreshToken(
    user.id,
    user.refreshTokenVersion,
  );

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { jti },
      data: { revokedAt: new Date(), replacedByJti: newJti },
    }),
    prisma.refreshToken.create({
      data: {
        jti: newJti,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    }),
  ]);

  const newAccessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    linkedPatientId: user.linkedPatientId,
  });

  await setAuthCookies(newAccessToken, newRefreshToken);
  await recordAudit({ userId: user.id, action: 'TOKEN_REFRESHED', ...meta });

  return NextResponse.json({ ok: true });
}
