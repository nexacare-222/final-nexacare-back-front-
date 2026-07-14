import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic in-memory store for rate limiting. 
// Note: In a multi-instance or serverless edge deployment, this state is isolated per worker/isolate. 
// For distributed scale, swap this with @upstash/ratelimit and Redis.
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 150; // 150 requests per minute

export function middleware(request: NextRequest) {
  // Only apply rate limiting to /api routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 1. Extract the IP, prioritizing X-Forwarded-For proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  // X-Forwarded-For can be a comma-separated list of IPs. The first is the original client.
  const ip = forwardedFor 
    ? forwardedFor.split(',')[0].trim() 
    : request.ip ?? '127.0.0.1';

  // 2. Check rate limit
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (record) {
    if (now - record.timestamp < RATE_LIMIT_WINDOW_MS) {
      if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        // eslint-disable-next-line no-console
        console.warn(`[RateLimit] Blocked request from IP: ${ip}`);
        return NextResponse.json(
          { error: 'Too Many Requests', message: 'Rate limit exceeded, please try again later.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
      record.count += 1;
    } else {
      // Reset window
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    }
  } else {
    // New IP
    rateLimitMap.set(ip, { count: 1, timestamp: now });
  }

  // Optional: Periodically clean up stale entries from the Map to prevent memory leaks over time.
  // We can do this lazily (e.g., 10% chance on request).
  if (Math.random() < 0.1) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now - val.timestamp > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  return NextResponse.next();
}

// Ensure the middleware only runs on API routes
export const config = {
  matcher: ['/api/:path*'],
};
