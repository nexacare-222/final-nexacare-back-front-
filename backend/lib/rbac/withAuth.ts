import { NextResponse } from 'next/server';
import { getAccessTokenCookie } from '../auth/cookies';
import { verifyAccessToken, type AccessTokenPayload } from '../auth/jwt';
import { recordAudit, requestMeta } from '../audit/auditLog';
import { sessionContext } from '../auth/sessionContext';

export type Role = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT_PARTY' | 'STAFF';

export interface Session {
  userId: string;
  role: Role;
  email: string;
  linkedPatientId: string | null;
}

type RouteHandler<Ctx> = (request: Request, ctx: Ctx, session: Session) => Promise<Response> | Response;

interface WithAuthOptions {
  /** If omitted, any authenticated user (any role) may call the route. */
  roles?: Role[];
}

/**
 * Wraps a Next.js App Router route handler with:
 *   1. Access-token verification straight from the HttpOnly cookie
 *      (never trusts a header the client could set itself).
 *   2. Strict RBAC — if `roles` is provided and the caller's role isn't in
 *      the list, the request is short-circuited with 403 *before* the
 *      handler (and therefore before any DB access) ever runs.
 *   3. An audit-log entry for every denial, so repeated unauthorized access
 *      attempts are visible without instrumenting every route by hand.
 *
 * Usage:
 *   export const POST = withAuth(async (req, ctx, session) => { ... },
 *     { roles: ['DOCTOR', 'ADMIN'] });
 */
export function withAuth<Ctx = unknown>(handler: RouteHandler<Ctx>, options: WithAuthOptions = {}) {
  return async (request: Request, ctx: Ctx): Promise<Response> => {
    const meta = requestMeta(request);
    const token = await getAccessTokenCookie();

    if (!token) {
      return unauthorized('missing_token');
    }

    const verified = await verifyAccessToken(token);
    if (!verified.ok) {
      return unauthorized(verified.reason === 'expired' ? 'token_expired' : 'invalid_token');
    }

    const payload: AccessTokenPayload = verified.payload;
    const session: Session = {
      userId: payload.sub,
      role: payload.role as Role,
      email: payload.email,
      linkedPatientId: payload.linkedPatientId ?? null,
    };

    if (!options.roles || options.roles.length === 0) {
      await recordAudit({
        userId: session.userId,
        action: 'ACCESS_DENIED_NO_ROLES',
        resourceType: new URL(request.url).pathname,
        metadata: { actualRole: session.role, method: request.method },
        ...meta,
      });
      return forbidden();
    }

    if (!options.roles.includes(session.role)) {
      await recordAudit({
        userId: session.userId,
        action: 'ACCESS_DENIED',
        resourceType: new URL(request.url).pathname,
        metadata: { requiredRoles: options.roles, actualRole: session.role, method: request.method },
        ...meta,
      });
      return forbidden();
    }

    return sessionContext.run(session, () => handler(request, ctx, session));
  };
}

function unauthorized(reason: string): NextResponse {
  return NextResponse.json({ error: 'Unauthorized', reason }, { status: 401 });
}

function forbidden(): NextResponse {
  return NextResponse.json(
    {
      error: 'Forbidden',
      reason: 'Access Denied',
    },
    { status: 403 },
  );
}
