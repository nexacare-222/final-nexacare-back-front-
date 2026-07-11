import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(8).max(200),
});

export const createLabReportSchema = z.object({
  patientId: z.string().min(1),
  testName: z.string().min(1).max(200),
  category: z.enum(['Pathology', 'Radiology', 'Microbiology', 'Biochemistry']),
  date: z.string().min(1),
  doctorName: z.string().min(1).max(200),
  resultSummary: z.string().min(1).max(1000),
  data: z.record(
    z.object({
      value: z.string(),
      unit: z.string(),
      range: z.string(),
      flag: z.enum(['HIGH', 'LOW']).optional(),
    }),
  ),
  fileUrl: z.string().url().optional(),
});

export const qrLoginSchema = z.object({
  qrToken: z.string().min(1),
});

const medicationSchema = z.object({
  name: z.string().min(1),
  dose: z.string().min(1),
  status: z.enum(['PENDING', 'GIVEN']).optional(),
});

export const registerPatientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  age: z.number().int().min(0).max(150),
  gender: z.enum(['Male', 'Female', 'Other']),
  currentLocation: z.string().min(1),
  condition: z.string().min(1),
  assignedDoctorId: z.string().min(1),
  qrToken: z.string().min(1),
  diagnosis: z.string().optional(),
  severity: z.enum(['Stable', 'Monitor', 'Critical']).optional(),
  bloodGroup: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  address: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  aadharNumber: z.string().optional(),
  dob: z.string().optional(),
  state: z.string().optional(),
  familyMemberName: z.string().optional(),
  familyMemberRelationship: z.string().optional(),
  familyMemberPhone: z.string().optional(),
});

export const updatePatientSchema = registerPatientSchema.partial().omit({ id: true });

export const movementSchema = z.object({
  toLocation: z.string().min(1),
  reason: z.string().min(1),
  timeString: z.string().optional(),
  assignedStaffId: z.string().optional(),
});

export const assignStaffSchema = z.object({
  staffId: z.string().min(1),
  role: z.enum(['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT_PARTY', 'STAFF']),
  time: z.string().min(1),
});

export const shiftHandoverSchema = z.object({
  targetStaffId: z.string().min(1),
  patientIds: z.array(z.string().min(1)).min(1),
  notes: z.string().min(1),
});

export const vitalsSchema = z.object({
  hr: z.coerce.number(),
  bpSys: z.coerce.number(),
  bpDia: z.coerce.number(),
  spo2: z.coerce.number(),
  temp: z.coerce.number(),
  resp: z.coerce.number(),
});

export const createStaffSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(8).max(200),
  role: z.enum(['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT_PARTY', 'STAFF']),
  phone: z.string().optional(),
  age: z.number().int().optional(),
  staffCategory: z.string().optional(),
  specialization: z.string().optional(),
  dob: z.string().optional(),
  aadharNumber: z.string().optional(),
  address: z.string().optional(),
  timings: z.string().optional(),
  weekSchedule: z.array(z.string()).optional(),
  department: z.string().optional(),
  avatar: z.string().optional(),
});

export const updateStaffSchema = createStaffSchema.partial().omit({ password: true });

export const updateSelfSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  timings: z.string().optional(),
  department: z.string().optional(),
});

export const createCareEventSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().optional(),
  nurseId: z.string().min(1),
  timestamp: z.number().optional(),
  priority: z.enum(['ROUTINE', 'URGENT']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED']).optional(),
  notes: z.string().optional(),
  checks: z.array(z.string()).default([]),
  medications: z.array(medicationSchema).default([]),
  scheduledTimes: z.array(z.string()).optional(),
  checklist: z.array(z.record(z.unknown())).optional(),
});

export const completeCareEventSchema = z.object({
  nurseNotes: z.string().default(''),
  checklist: z.array(z.record(z.unknown())).default([]),
  attachments: z.array(z.string()).default([]),
});

export const createMessageSchema = z.object({
  patientId: z.string().min(1),
  content: z.string().min(1).max(5000),
  isAttachment: z.boolean().optional(),
  attachmentType: z.enum(['PDF', 'IMAGE']).optional(),
  channel: z.enum(['FAMILY', 'TEAM']).optional(),
});

/** Narrow, typed wrapper around Zod parsing for use inside route handlers. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new ValidationError(message);
  }
  return result.data;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
