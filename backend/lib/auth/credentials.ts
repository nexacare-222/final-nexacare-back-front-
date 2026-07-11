import { prisma } from '../prisma';
import { verifyPassword } from './password';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  linkedPatientId: string | null;
  refreshTokenVersion: number;
}

/**
 * Verifies email/password against the DB. Deliberately returns `null` for
 * every failure mode (user not found, wrong password, inactive account)
 * rather than distinct error types — this prevents user-enumeration via
 * response-shape or timing differences at the call site. Argon2's internal
 * verify time already dominates any timing signal.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    // Explicit per-query override of the global omit — this is the ONLY
    // call site in the codebase that should ever do this.
    omit: { passwordHash: false },
  });

  if (!user) {
    // Still run a hash comparison against a dummy hash so that a
    // non-existent email takes roughly the same time as a wrong password,
    // reducing the account-enumeration signal from response timing.
    await verifyPassword(
      '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$dGltaW5nc2FmZWd1YXJk',
      password,
    );
    return null;
  }

  if (user.status !== 'ACTIVE') {
    return null;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    linkedPatientId: user.linkedPatientId,
    refreshTokenVersion: user.refreshTokenVersion,
  };
}
