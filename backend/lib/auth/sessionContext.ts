import { AsyncLocalStorage } from 'async_hooks';
import type { Session } from '../rbac/withAuth';

/**
 * Global session context using Node's AsyncLocalStorage.
 * This allows deeply nested backend functions (like Prisma Client Extensions)
 * to access the current request's user context without needing it passed
 * explicitly through every function signature.
 */
export const sessionContext = new AsyncLocalStorage<Session>();
