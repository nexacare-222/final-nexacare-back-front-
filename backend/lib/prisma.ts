import { PrismaClient } from '@prisma/client';

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
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    omit: {
      user: {
        passwordHash: true,
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
