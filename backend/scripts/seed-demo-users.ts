import { AccountStatus, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth/password';

const DEMO_PASSWORD = 'demo_pass_123';

const DEMO_USERS = [
  {
    email: 'sarah.admin@nexacare.com',
    name: 'Sarah Administrator',
    role: UserRole.ADMIN,
    staffCategory: 'Hospital Administrator',
    department: 'Administration',
    phone: '+91 98765 43210',
    isOnline: true,
  },
  {
    email: 'james.smith@nexacare.com',
    name: 'James Smith',
    role: UserRole.DOCTOR,
    staffCategory: 'Cardiologist',
    specialization: 'Cardiology',
    department: 'ICU – Cardiac ICU (CICU)',
    phone: '+91 98765 11111',
    timings: '09:00 AM - 05:00 PM',
    isOnline: false,
  },
  {
    email: 'emily.white@nexacare.com',
    name: 'Emily White',
    role: UserRole.DOCTOR,
    staffCategory: 'Neurosurgeon',
    specialization: 'Neurology',
    department: 'ICU – Neuro ICU',
    phone: '+91 98765 33333',
    timings: '10:00 AM - 06:00 PM',
    isOnline: true,
  },
  {
    email: 'linda.jones@nexacare.com',
    name: 'Linda Jones',
    role: UserRole.NURSE,
    staffCategory: 'ICU Nurse',
    department: 'ICU – Medical ICU',
    phone: '+91 98765 22222',
    timings: '07:00 AM - 07:00 PM',
    isOnline: false,
  },
  {
    email: 'mark.taylor@nexacare.com',
    name: 'Mark Taylor',
    role: UserRole.NURSE,
    staffCategory: 'Staff Nurse',
    department: 'General Ward',
    phone: '+91 98765 44444',
    timings: '08:00 PM - 08:00 AM',
    isOnline: true,
  },
  {
    email: 'susan.downey@nexacare.com',
    name: 'Susan Downey (Family)',
    role: UserRole.PATIENT_PARTY,
    isOnline: false,
  },
] as const;

async function main() {
  let created = 0;

  for (const user of DEMO_USERS) {
    const passwordHash = await hashPassword(DEMO_PASSWORD);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        status: AccountStatus.ACTIVE,
        passwordHash,
        phone: user.phone ?? null,
        staffCategory: user.staffCategory ?? null,
        specialization: user.specialization ?? null,
        department: user.department ?? null,
        timings: user.timings ?? null,
        isOnline: user.isOnline,
        weekSchedule: [],
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        status: AccountStatus.ACTIVE,
        passwordHash,
        phone: user.phone ?? null,
        staffCategory: user.staffCategory ?? null,
        specialization: user.specialization ?? null,
        department: user.department ?? null,
        timings: user.timings ?? null,
        isOnline: user.isOnline,
        weekSchedule: [],
      },
    });

    created += 1;
  }

  console.log(`Seeded ${created} demo auth users with password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Failed to seed demo users:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
