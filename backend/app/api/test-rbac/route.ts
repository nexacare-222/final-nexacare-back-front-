import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/rbac/withAuth';

// 1. Missing roles option entirely (should fail-closed)
export const GET = withAuth(
  async () => {
    return NextResponse.json({ success: true, message: 'You reached the no-roles route!' });
  }
);

// 2. Empty roles array (should fail-closed)
export const PUT = withAuth(
  async () => {
    return NextResponse.json({ success: true, message: 'You reached the empty-roles route!' });
  },
  { roles: [] }
);

// 3. Admin-only route
export const POST = withAuth(
  async () => {
    return NextResponse.json({ success: true, message: 'You reached the admin-only route!' });
  },
  { roles: ['ADMIN'] }
);
