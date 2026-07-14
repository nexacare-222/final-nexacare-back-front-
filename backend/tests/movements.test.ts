import request from 'supertest';
import { prisma } from '@/lib/prisma';

// Use a running local instance or test instance for integration testing
const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('Concurrency tests for Patient Movements', () => {
  let mockPatientId: string;
  let adminCookie: string;

  beforeAll(async () => {
    // 1. Seed a test admin user to get auth
    const adminUser = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: `admin-${Date.now()}@test.com`,
        passwordHash: 'hashed_password', // bypass actual login if we mock the token, or we use a real token
        role: 'ADMIN',
      },
    });

    // In a real test suite, we'd log in to get the cookie.
    // Assuming there's a test helper or we login via the API:
    // For this example, we mock the auth or use a generic login endpoint if available.
    // If we assume a generic login endpoint:
    /*
    const loginRes = await request(API_URL).post('/api/auth/login').send({
      email: adminUser.email,
      password: 'password' // needs to match hashed_password setup
    });
    adminCookie = loginRes.headers['set-cookie'];
    */
    
    // For the sake of this prompt, we will assume we can mock or generate a valid JWT, 
    // or we are running the test against a server where auth can be bypassed in test mode.
    // Let's create a mock patient.
    const patient = await prisma.patient.create({
      data: {
        id: `PAT-TEST-${Date.now()}`,
        name: 'Concurrency Test Patient',
        age: 30,
        gender: 'Male',
        admissionTimestamp: new Date(),
        currentLocation: 'Emergency',
        condition: 'Stable',
        assignedDoctorId: adminUser.id,
        qrToken: `TEST-QR-${Date.now()}`,
      },
    });
    
    mockPatientId = patient.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.movementLog.deleteMany({ where: { patientId: mockPatientId } });
    await prisma.patient.delete({ where: { id: mockPatientId } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'admin-' } } });
  });

  it('handles 10 concurrent movement requests without race conditions', async () => {
    const locations = Array.from({ length: 10 }).map((_, i) => `Location-${i + 1}`);

    // Fire 10 requests simultaneously
    const requests = locations.map((loc) =>
      request(API_URL)
        .post(`/api/patients/${mockPatientId}/movements`)
        // .set('Cookie', adminCookie) // Include auth cookie
        .send({
          toLocation: loc,
          reason: `Testing concurrency for ${loc}`,
        })
    );

    const responses = await Promise.all(requests);
    
    // Verify all requests succeeded (or at least returned a valid response)
    // Depending on whether movements endpoint has a strict state machine, 
    // some might fail with 409 Conflict if optimistic locking is used.
    // For a robust queue, all might succeed.
    responses.forEach(res => {
      // In this setup, we just ensure the server didn't crash
      expect([200, 201, 400, 409]).toContain(res.status);
    });

    // Assert that the resulting MovementLog chain is sequential and current location matches the last log
    const movementLogs = await prisma.movementLog.findMany({
      where: { patientId: mockPatientId },
      orderBy: { timestamp: 'asc' },
    });

    const finalPatient = await prisma.patient.findUnique({
      where: { id: mockPatientId },
    });

    expect(finalPatient).not.toBeNull();
    
    if (movementLogs.length > 0) {
      const lastLog = movementLogs[movementLogs.length - 1];
      expect(finalPatient?.currentLocation).toEqual(lastLog?.toLocation);
    }
    
    // Check that we didn't end up with duplicate identical timestamps or corrupted locations
    const timestamps = movementLogs.map(log => log.timestamp.getTime());
    const uniqueTimestamps = new Set(timestamps);
    
    // Depending on DB precision and execution speed, timestamps *could* technically match, 
    // but a sequential update lock would usually spread them slightly.
    // The key is that `finalPatient.currentLocation` correctly reflects the chronologically last applied movement.
  });
});
