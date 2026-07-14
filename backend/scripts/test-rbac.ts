import { signAccessToken } from '../lib/auth/jwt';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function generateTestToken(role: string, sub: string) {
  return await signAccessToken({
    role,
    email: 'test@example.com',
    linkedPatientId: null,
    sub,
  });
}

async function runTests() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found in DB. Test will fail.');
    return;
  }
  const token = await generateTestToken('NURSE', user.id);
  console.log('Testing with Role: NURSE');
  console.log('Generated JWT:', token);

  const headers = { Cookie: `nexacare_access_token=${token}` };
  const BASE_URL = 'http://localhost:4000/api/test-rbac';

  console.log('\n--- Test 1: Route with no roles option ---');
  const res1 = await fetch(BASE_URL, { method: 'GET', headers });
  console.log('Status:', res1.status);
  console.log('Body:', await res1.json());

  console.log('\n--- Test 2: Route with empty roles array ---');
  const res2 = await fetch(BASE_URL, { method: 'PUT', headers });
  console.log('Status:', res2.status);
  console.log('Body:', await res2.json());

  console.log('\n--- Test 3: Route with roles = ["ADMIN"] ---');
  const res3 = await fetch(BASE_URL, { method: 'POST', headers });
  console.log('Status:', res3.status);
  console.log('Body:', await res3.json());
}

runTests().catch(console.error);
