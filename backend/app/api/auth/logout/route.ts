import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRefreshTokenCookie, clearAuthCookies } from '@/lib/auth/cookies';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { recordAudit, requestMeta } from '@/lib/audit/auditLog';

export async function POST(request: Request): Promise<Response> {
  const meta = requestMeta(request);
  const token = await getRefreshTokenCookie();

  if (token) {
    const verified = await verifyRefreshToken(token);
    if (verified.ok) {
      await prisma.refreshToken
        .update({
          where: { jti: verified.payload.jti },
          data: { revokedAt: new Date() },
        })
        .catch(() => null); // token may already be rotated/gone — fine, we're logging out either way

      await recordAudit({ userId: verified.payload.sub, action: 'LOGOUT', ...meta });
    }
  }

  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
