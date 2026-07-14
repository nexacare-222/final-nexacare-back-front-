import { PrismaClient, Prisma } from '@prisma/client';
import { sessionContext } from './auth/sessionContext';

/**
 * Singleton Prisma client.
 *
 * SECURITY: `omit.user.passwordHash` uses Prisma's Global Omit API so that
 * every `user` query anywhere in the app excludes `passwordHash` from the
 * result by default. The only place that should ever see the hash is the
 * password-verification code path in `lib/auth/credentials.ts`, which
 * explicitly overrides the omit per-query (`omit: { passwordHash: false }`).
 *
 * Never remove this default — it's the backstop against an engineer
 * accidentally returning `passwordHash` in an API response.
 */
const prismaClientSingleton = () => {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    omit: {
      user: {
        passwordHash: true,
      },
    },
  });

  // Prisma Client Extension for Row Level Security (RLS)
  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const session = sessionContext.getStore();
          
          // Safeguard: Internal queries, migrations, or unauthenticated requests
          // bypass RLS context setting.
          if (!session) return query(args);

          // Execute query within a transaction where session variables are set
          const [, result] = await baseClient.$transaction([
            baseClient.$executeRaw`
              SET LOCAL "app.current_user_id" = ${session.userId};
              SET LOCAL "app.current_role" = ${session.role};
            `,
            query(args),
          ]);
          
          return result;
        },
      },
    },
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
