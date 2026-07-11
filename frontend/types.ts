

export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  PATIENT_PARTY = 'PATIENT_PARTY',
  STAFF = 'STAFF' // For Wardboys, Techs, etc.
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  email?: string;
  phone?: string;
  age?: number;
  linkedPatientId?: string; // Optional field to link a user (e.g. Family) to a specific patient
  
  // Detailed Staff Fields
  staffCategory?: string;
  specialization?: string; // For doctors
  dob?: string;
  aadharNumber?: string;
  address?: string;
  timings?: string; // e.g. "09:00 AM - 05:00 PM"
  weekSchedule?: string[]; // e.g. ["Mon", "Tue", "Wed"]
  isOnline?: boolean; // For status
  department?: string;
}

export interface MovementLog {
  id: string;
  patientId: string;
  fromLocation: string | null;
  toLocation: string;
  movedByAdminId: string;
  timestamp: number; // Unix timestamp
  reason?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: number;
  isAttachment?: boolean;
  attachmentType?: 'PDF' | 'IMAGE';
  channel?: 'FAMILY' | 'TEAM'; // New field to separate chats
}

export interface VitalsData {
  hr: number;
  bpSys: number;
  bpDia: number;
  spo2: number;
  temp: number;
  resp: number;
  lastUpdated: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface VitalsSubmissionData {
  patientId: string;
  timestamp: number;
  vitals: {
    temp: string;
    spo2: string;
    hr: string;
    bpSys: string;
    bpDia: string;
    resp: string;
    notes: string;
    [key: string]: string;
  };
  custom: { name: string; value: string; unit: string }[];
}

// New Care Event Types
export type CareEventStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';

export interface CareEvent {
  id: string;
  patientId: string;
  doctorId: string;
  nurseId: string;
  timestamp: number; // When it was created/scheduled
  priority: 'ROUTINE' | 'URGENT';
  status: CareEventStatus;
  notes?: string;
  
  // Planned requirements
  checks: string[]; // List of check IDs (e.g., 'bp', 'sugar')
  medications: { name: string; dose: string; status: 'PENDING' | 'GIVEN' }[];
  scheduledTimes?: string[]; 

  // Execution Details
  startTime?: number; // When nurse started the task
  completedAt?: number; // When nurse submitted
  nurseNotes?: string;
  attachments?: string[]; // URLs/names of uploaded files
  
  // Detailed Checklist Execution
  checklist?: CareEventChecklistItem[]; 
}

export interface CareEventChecklistItem {
  item: string; 
  completed: boolean; 
  timestamp?: number;
  notes?: string;
  value?: string; // For recording readings (e.g. "120/80")
}

export interface CareEventCreationData {
  patientId: string;
  doctorId?: string;
  nurseId: string;
  timestamp: number;
  priority: 'ROUTINE' | 'URGENT';
  status?: CareEventStatus;
  notes?: string;
  checks: string[];
  medications: { name: string; dose: string; status: 'PENDING' | 'GIVEN' }[];
  scheduledTimes?: string[];
  checklist?: CareEventChecklistItem[];
}

// Lab Reports
export interface LabReport {
  id: string;
  patientId: string;
  testName: string; // e.g. "Complete Blood Count", "X-Ray Chest"
  category: 'Pathology' | 'Radiology' | 'Microbiology' | 'Biochemistry';
  date: string;
  timestamp: number;
  status: 'COMPLETED' | 'PENDING';
  doctorName: string;
  resultSummary: string; // e.g. "Normal", "Abnormal", "Inconclusive"
  data: Record<string, { value: string; unit: string; range: string; flag?: 'HIGH' | 'LOW' }>;
  fileUrl?: string; // For PDF download simulation
}

export interface Notification {
  id: string;
  userId: string; // The recipient of the notification
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'ALERT' | 'NEW_MESSAGE' | 'TASK_ASSIGNED';
  patientId?: string; // Optional context
}

export interface DischargeDetails {
  condition: string;
  notes: string;
  medications: { name: string; dose: string; freq: string; duration: string; instructions: string }[];
  followUp: { date: string; department: string; doctor: string; instructions: string };
  lifestyle: { activity: string; diet: string; wound: string; restrictions: string };
  billingStatus: 'CLEARED' | 'PENDING' | 'REVIEW';
  transferMode: string;
  finalizedAt: number;
  doctorSignature: string;
  attachments: string[];
}

export interface Patient {
  id: string; // PAT-YYYY-XXXXX
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  admissionTimestamp: number;
  currentLocation: string; // Ward/Dept
  condition: string;
  assignedDoctorId: string;
  assignedNurseIds: string[];
  // Map of StaffID -> Assigned Time String (e.g. "09:00 AM")
  assignmentTimings?: Record<string, string>; 
  movements: MovementLog[];
  qrToken: string; // Secure token for QR generation
  
  // Clinical Fields for Doctor Dashboard
  diagnosis?: string;
  severity?: 'Stable' | 'Monitor' | 'Critical';
  vitals?: VitalsData;
  
  // Detailed Fields
  bloodGroup?: string;
  allergies?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;

  // New Admin Edit Fields
  aadharNumber?: string;
  dob?: string; // YYYY-MM-DD
  state?: string;
  familyMemberName?: string;
  familyMemberRelationship?: string; // e.g. Father, Mother, Spouse
  familyMemberPhone?: string;

  // Discharge
  dischargeDetails?: DischargeDetails;
  isDischarged?: boolean;
}

export interface AppState {
  currentUser: User | null;
  patients: Patient[];
  messages: Record<string, ChatMessage[]>; // keyed by patientId
  staff: User[]; // Central store for all staff (doctors, nurses, etc.)
  careEvents: CareEvent[]; // Store for doctor created events
  reports: LabReport[]; // Medical reports store
  notifications: Notification[];
}