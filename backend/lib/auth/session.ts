import { prisma } from '../prisma';
import { signAccessToken, signRefreshToken, REFRESH_TOKEN_TTL_SECONDS } from './jwt';
import { setAuthCookies } from './cookies';
import { recordAudit, requestMeta } from '../audit/auditLog';
import type { AuthenticatedUser } from './credentials';

/**
 * Shared by /api/auth/login and /api/auth/login-qr so both entry points
 * issue cookies identically (same TTLs, same refresh-token bookkeeping,
 * same audit trail).
 */
export async function issueSession(
  user: Pick<AuthenticatedUser, 'id' | 'role' | 'email' | 'linkedPatientId' | 'refreshTokenVersion'>,
  request: Request,
  action: string,
): Promise<void> {
  const meta = requestMeta(request);

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
  await recordAudit({ userId: user.id, action, ...meta });
}
