/**
 * Prisma rows -> frontend `types.ts` DTOs. The frontend historically ran on
 * an in-memory mock dataset where timestamps were plain `number`s (Date.now())
 * and a few relations (assignedNurseIds, movements, vitals) were flattened
 * onto the Patient object. These serializers keep that exact wire-shape so
 * the store-wiring cutover doesn't require touching every component.
 */
import type {
  Patient as PatientRow,
  User as UserRow,
  CareEvent as CareEventRow,
  LabReport as LabReportRow,
  Notification as NotificationRow,
  ChatMessage as ChatMessageRow,
  MovementLog as MovementLogRow,
  VitalsReading,
  PatientNurse,
  DischargeDetail,
} from '@prisma/client';

const toTs = (d: Date | null | undefined): number | undefined =>
  d ? d.getTime() : undefined;

export function serializeUser(u: Omit<UserRow, 'passwordHash'>) {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    avatar: u.avatar ?? undefined,
    email: u.email,
    phone: u.phone ?? undefined,
    age: u.age ?? undefined,
    linkedPatientId: u.linkedPatientId ?? undefined,
    staffCategory: u.staffCategory ?? undefined,
    specialization: u.specialization ?? undefined,
    dob: u.dob ?? undefined,
    // aadharNumber stripped for security
    address: u.address ?? undefined,
    timings: u.timings ?? undefined,
    weekSchedule: u.weekSchedule ?? [],
    isOnline: u.isOnline,
    department: u.department ?? undefined,
  };
}

type PatientWithRelations = PatientRow & {
  assignedNurses?: PatientNurse[];
  movements?: MovementLogRow[];
  vitals?: VitalsReading[];
  dischargeDetails?: DischargeDetail | null;
};

export function serializePatient(p: PatientWithRelations) {
  const latestVitals = p.vitals && p.vitals.length > 0
    ? [...p.vitals].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0]
    : undefined;

  return {
    id: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender,
    admissionTimestamp: toTs(p.admissionTimestamp),
    currentLocation: p.currentLocation,
    condition: p.condition,
    assignedDoctorId: p.assignedDoctorId,
    assignedNurseIds: (p.assignedNurses ?? []).map((n) => n.nurseId),
    assignmentTimings: (p.assignmentTimings as Record<string, string> | null) ?? {},
    movements: (p.movements ?? []).map(serializeMovement),
    // qrToken stripped for security
    diagnosis: p.diagnosis ?? undefined,
    severity: p.severity ?? undefined,
    vitals: latestVitals ? serializeVitals(latestVitals) : undefined,
    bloodGroup: p.bloodGroup ?? undefined,
    allergies: p.allergies ?? [],
    emergencyContactName: p.emergencyContactName ?? undefined,
    emergencyContactPhone: p.emergencyContactPhone ?? undefined,
    address: p.address ?? undefined,
    insuranceProvider: p.insuranceProvider ?? undefined,
    insurancePolicyNumber: p.insurancePolicyNumber ?? undefined,
    // aadharNumber stripped for security
    dob: p.dob ?? undefined,
    state: p.state ?? undefined,
    familyMemberName: p.familyMemberName ?? undefined,
    familyMemberRelationship: p.familyMemberRelationship ?? undefined,
    familyMemberPhone: p.familyMemberPhone ?? undefined,
    isDischarged: p.isDischarged,
    dischargeDetails: p.dischargeDetails ? serializeDischarge(p.dischargeDetails) : undefined,
  };
}

export function serializeMovement(m: MovementLogRow) {
  return {
    id: m.id,
    patientId: m.patientId,
    fromLocation: m.fromLocation,
    toLocation: m.toLocation,
    movedByAdminId: m.movedByAdminId,
    timestamp: toTs(m.timestamp),
    reason: m.reason ?? undefined,
  };
}

export function serializeVitals(v: VitalsReading) {
  return {
    hr: v.hr,
    bpSys: v.bpSys,
    bpDia: v.bpDia,
    spo2: v.spo2,
    temp: v.temp,
    resp: v.resp,
    lastUpdated: toTs(v.recordedAt),
    trend: (v.trend as 'UP' | 'DOWN' | 'STABLE') ?? 'STABLE',
  };
}

export function serializeDischarge(d: DischargeDetail) {
  return {
    condition: d.condition,
    notes: d.notes,
    medications: d.medications,
    followUp: {
      date: d.followUpDate,
      department: d.followUpDept,
      doctor: d.followUpDoctor,
      instructions: d.followUpNotes,
    },
    lifestyle: {
      activity: d.lifestyleActivity,
      diet: d.lifestyleDiet,
      wound: d.lifestyleWound,
      restrictions: d.lifestyleRestrictions,
    },
    billingStatus: d.billingStatus,
    transferMode: d.transferMode,
    finalizedAt: toTs(d.finalizedAt),
    doctorSignature: d.doctorSignature,
    attachments: d.attachments,
  };
}

export function serializeCareEvent(e: CareEventRow) {
  return {
    id: e.id,
    patientId: e.patientId,
    doctorId: e.doctorId,
    nurseId: e.nurseId,
    timestamp: toTs(e.timestamp),
    priority: e.priority,
    status: e.status,
    notes: e.notes ?? undefined,
    checks: e.checks,
    medications: e.medications,
    scheduledTimes: e.scheduledTimes,
    startTime: toTs(e.startTime),
    completedAt: toTs(e.completedAt),
    nurseNotes: e.nurseNotes ?? undefined,
    attachments: e.attachments,
    checklist: e.checklist ?? undefined,
  };
}

export function serializeLabReport(r: LabReportRow) {
  return {
    id: r.id,
    patientId: r.patientId,
    testName: r.testName,
    category: r.category,
    date: r.date,
    timestamp: toTs(r.timestamp),
    status: r.status,
    doctorName: r.doctorName,
    resultSummary: r.resultSummary,
    data: r.data,
    fileUrl: r.fileUrl ?? undefined,
  };
}

export function serializeNotification(n: NotificationRow) {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    timestamp: toTs(n.timestamp),
    read: n.read,
    type: n.type,
    patientId: n.patientId ?? undefined,
  };
}

export function serializeChatMessage(m: ChatMessageRow) {
  return {
    id: m.id,
    senderId: m.senderId,
    senderName: m.senderName,
    senderRole: m.senderRole,
    content: m.content,
    timestamp: toTs(m.timestamp),
    isAttachment: m.isAttachment,
    attachmentType: m.attachmentType ?? undefined,
    channel: m.channel,
  };
}
