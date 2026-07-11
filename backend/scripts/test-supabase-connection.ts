import { testDatabaseConnection } from '@/lib/db';

async function main() {
  try {
    const now = await testDatabaseConnection();
    console.log('Supabase/Postgres connection successful. Current database time:', now);
    process.exit(0);
  } catch (error) {
    console.error('Supabase/Postgres connection failed:', error);
    process.exit(1);
  }
}

main();
