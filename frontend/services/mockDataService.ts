
import { Patient, User, UserRole, MovementLog, ChatMessage, VitalsData, CareEvent, LabReport, Notification } from '../types';

// --- Helpers for Random Generation ---
export const generateId = () => Math.random().toString(36).substr(2, 9);

// --- COMPREHENSIVE WARD STRUCTURE ---
export const WARD_STRUCTURE: Record<string, { color: string, wards: string[] }> = {
  "General Care Wards": {
    color: "text-blue-500",
    wards: [
      "General Ward",
      "Semi-Private Ward",
      "Private Ward"
    ]
  },
  "Critical Care Wards": {
    color: "text-red-500",
    wards: [
      "ICU – Medical ICU",
      "ICU – Surgical ICU",
      "ICU – Cardiac ICU (CICU)",
      "ICU – Neuro ICU",
      "ICU – Trauma ICU",
      "HDU – High Dependency Unit",
      "CCU – Coronary Care Unit",
      "PICU – Pediatric ICU",
      "NICU – Neonatal ICU"
    ]
  },
  "Emergency & Acute Care": {
    color: "text-emerald-500",
    wards: [
      "Emergency Ward (ER)",
      "Trauma Ward"
    ]
  },
  "Surgical & Procedure Wards": {
    color: "text-yellow-500",
    wards: [
      "Pre-Op Ward",
      "Post-Op Ward",
      "PACU – Post-Anesthesia Care Unit",
      "OT Complex"
    ]
  },
  "Specialty Wards": {
    color: "text-purple-500",
    wards: [
      "Maternity Ward",
      "Labor Ward / Delivery Suite",
      "Pediatric Ward",
      "Oncology Ward",
      "Dialysis Unit",
      "Isolation Ward",
      "Burn Ward",
      "Geriatric Ward"
    ]
  },
  "Recovery & Long-Term Care": {
    color: "text-amber-700",
    wards: [
      "Rehabilitation Ward",
      "Palliative Care Ward"
    ]
  }
};

// --- COMPREHENSIVE STAFF STRUCTURE ---
export const STAFF_STRUCTURE: Record<string, { color: string, roles: string[] }> = {
  // --- DOCTORS ---
  "General Physicians": {
    color: "text-blue-600",
    roles: ["General Medicine Doctor", "Family Medicine Doctor"]
  },
  "Specialist Doctors": {
    color: "text-indigo-600",
    roles: [
      "Cardiologist", "Neurologist", "Nephrologist", "Pulmonologist", 
      "Endocrinologist", "Gastroenterologist", "Rheumatologist", 
      "Dermatologist", "Psychiatrist", "Oncologist", "Geriatrician"
    ]
  },
  "Surgeons": {
    color: "text-teal-600",
    roles: [
      "General Surgeon", "Orthopedic Surgeon", "Neurosurgeon", 
      "Cardiothoracic Surgeon", "Plastic Surgeon", "ENT Surgeon", 
      "Urologist", "Eye Surgeon (Ophthalmologist)", "Bariatric Surgeon"
    ]
  },
  "Emergency Specialists": {
    color: "text-red-600",
    roles: ["Emergency Medicine Doctor", "Trauma Surgeon"]
  },
  "Pediatric Specialists": {
    color: "text-orange-500",
    roles: ["Pediatrician", "Neonatologist"]
  },
  "Obstetrics & Gynecology": {
    color: "text-pink-600",
    roles: ["Obstetrician", "Gynecologist", "Maternal Health Specialists"]
  },

  // --- NURSING ---
  "General Nursing Staff": {
    color: "text-emerald-600",
    roles: ["Registered Nurse (RN)", "Staff Nurse", "Assistant Nurse"]
  },
  "Specialized Nurses": {
    color: "text-emerald-700",
    roles: [
      "ICU Nurse", "NICU Nurse", "PICU Nurse", "ER Nurse", 
      "OT Nurse (Scrub/Circulating)", "Dialysis Nurse", "Oncology Nurse", 
      "Cardiac Care Nurse", "Ward Nurse", "HDU Nurse", "Recovery Room Nurse (PACU)"
    ]
  },
  "Nursing Leadership": {
    color: "text-emerald-800",
    roles: ["Nursing Supervisor", "Nursing In-Charge", "Nursing Educator", "Matron / CNO"]
  },

  // --- OTHER STAFF ---
  "Paramedical Staff": {
    color: "text-cyan-600",
    roles: [
      "Physiotherapist", "Occupational Therapist", "Speech & Language Therapist", 
      "Dietitian / Clinical Nutritionist", "Pharmacist", "Radiographer / Imaging Technician", 
      "Sonographer", "Lab Technologist", "Dialysis Technician", 
      "Anesthesia Technician", "Perfusionist", "Respiratory Therapist"
    ]
  },
  "Operating Theatre (OT) Team": {
    color: "text-blue-500",
    roles: ["Anesthesiologist", "OT Nurse", "OT Technician", "Surgical Technologist", "Perfusionist"]
  },
  "Emergency & Critical Care Staff": {
    color: "text-red-500",
    roles: ["Trauma Technician", "Emergency Medical Technician (EMT)", "Paramedic", "Ventilator Technician", "Critical Care Specialist"]
  },
  "Diagnostic & Lab Staff": {
    color: "text-violet-600",
    roles: ["Lab Technicians", "Lab Assistants", "Pathologists", "Microbiologists", "Radiologists", "X-ray Technicians", "CT/MRI Technicians"]
  },
  "Administrative Medical Staff": {
    color: "text-slate-600",
    roles: ["Hospital Administrator", "Medical Superintendent", "Patient Coordinator", "Ward Clerk", "Admission Desk Staff", "Billing & Insurance Staff", "Medical Records Officer"]
  },
  "Support & Care Staff": {
    color: "text-stone-600",
    roles: ["Ward Boy / Ward Attendant", "Nurse Aide", "Sanitation Worker", "Transport Staff / Patient Porter", "Security", "Receptionist", "Housekeeping"]
  },
  "Special Units Staff": {
    color: "text-indigo-500",
    roles: ["ICU Resident Doctor", "Respiratory Therapist", "Neonatal Specialist", "Oncology Pharmacist", "Chemo Nurse"]
  }
};

export const DOCTOR_CATEGORIES = [
  "General Physicians", "Specialist Doctors", "Surgeons", 
  "Emergency Specialists", "Pediatric Specialists", "Obstetrics & Gynecology"
];

export const MEDICAL_STAFF_CATEGORIES = [
  "General Nursing Staff", "Specialized Nurses", "Nursing Leadership",
  "Paramedical Staff", "Operating Theatre (OT) Team", "Emergency & Critical Care Staff",
  "Diagnostic & Lab Staff", "Administrative Medical Staff", "Support & Care Staff", "Special Units Staff"
];

// Returns flattened list for simple validation or flat arrays
export const getDepartments = () => {
  let allWards: string[] = [];
  Object.values(WARD_STRUCTURE).forEach(cat => {
    allWards = [...allWards, ...cat.wards];
  });
  return allWards;
};

// Returns the full structure for UI generation
export const getCategorizedWards = () => WARD_STRUCTURE;
export const getCategorizedStaff = () => STAFF_STRUCTURE;

// --- STATIC USERS ---

// 1. ADMIN
const ADMIN_USER: User = {
    id: 'sarah.admin@nexacare.com', 
    name: 'Sarah Administrator',
    role: UserRole.ADMIN,
    avatar: 'https://i.pravatar.cc/300?u=admin-01',
    email: 'sarah.admin@nexacare.com',
    phone: '+91 98765 43210',
    isOnline: true,
    staffCategory: 'Hospital Administrator', 
    department: 'Administration'
};

// 2. SENIOR DOCTOR (Cardiology)
const DOCTOR_USER: User = {
    id: 'JamesSmithsn101', 
    name: 'James Smith',
    role: UserRole.DOCTOR,
    avatar: 'https://i.pravatar.cc/300?u=doc-james',
    email: 'james.smith@nexacare.com',
    phone: '+91 98765 11111',
    isOnline: false,
    staffCategory: 'Cardiologist',
    specialization: 'Cardiology',
    department: 'ICU – Cardiac ICU (CICU)',
    timings: '09:00 AM - 05:00 PM'
};

// 3. NEW DOCTOR (Neurology)
const DOCTOR_USER_2: User = {
    id: 'EmilyWhiteneu202',
    name: 'Emily White',
    role: UserRole.DOCTOR,
    avatar: 'https://i.pravatar.cc/300?u=doc-emily',
    email: 'emily.white@nexacare.com',
    phone: '+91 98765 33333',
    isOnline: true,
    staffCategory: 'Neurosurgeon',
    specialization: 'Neurology',
    department: 'ICU – Neuro ICU',
    timings: '10:00 AM - 06:00 PM'
};

// 4. NURSE (ICU)
const NURSE_USER: User = {
    id: 'LindaJonesns202',
    name: 'Linda Jones',
    role: UserRole.NURSE,
    avatar: 'https://i.pravatar.cc/300?u=nurse-linda',
    email: 'linda.jones@nexacare.com',
    phone: '+91 98765 22222',
    isOnline: false,
    staffCategory: 'ICU Nurse',
    department: 'ICU – Medical ICU',
    timings: '07:00 AM - 07:00 PM'
};

// 5. NEW NURSE (General Ward)
const NURSE_USER_2: User = {
    id: 'MarkTayloricu303',
    name: 'Mark Taylor',
    role: UserRole.NURSE,
    avatar: 'https://i.pravatar.cc/300?u=nurse-mark',
    email: 'mark.taylor@nexacare.com',
    phone: '+91 98765 44444',
    isOnline: true,
    staffCategory: 'Staff Nurse',
    department: 'General Ward',
    timings: '08:00 PM - 08:00 AM'
};

// 6. PATIENT PARTY
const FAMILY_USER: User = {
    id: 'fam-01',
    name: 'Susan Downey (Family)',
    role: UserRole.PATIENT_PARTY,
    avatar: 'https://i.pravatar.cc/300?u=fam-01',
    email: 'susan.downey@nexacare.com',
    linkedPatientId: 'PAT-2025-TEST01' 
};

// Exports
export const MOCK_USERS: User[] = [
    ADMIN_USER,
    DOCTOR_USER,
    DOCTOR_USER_2,
    NURSE_USER,
    NURSE_USER_2,
    FAMILY_USER
];

// --- COMPREHENSIVE MOCK PATIENT ---
const MOCK_PATIENT_1: Patient = {
    id: 'PAT-2025-TEST01',
    name: 'Robert Downey',
    age: 58,
    gender: 'Male',
    admissionTimestamp: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago
    currentLocation: 'ICU – Medical ICU',
    condition: 'Post-Op Cardiac Recovery',
    assignedDoctorId: 'JamesSmithsn101',
    assignedNurseIds: ['LindaJonesns202'],
    assignmentTimings: { 'JamesSmithsn101': '09:00 AM', 'LindaJonesns202': '07:00 AM' },
    movements: [
        { 
            id: 'mov-1', 
            patientId: 'PAT-2025-TEST01', 
            fromLocation: null, 
            toLocation: 'Emergency Ward (ER)', 
            movedByAdminId: 'sarah.admin@nexacare.com', 
            timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000), 
            reason: 'Emergency Admission - Chest Pain' 
        },
        { 
            id: 'mov-2', 
            patientId: 'PAT-2025-TEST01', 
            fromLocation: 'Emergency Ward (ER)', 
            toLocation: 'OT Complex', 
            movedByAdminId: 'sarah.admin@nexacare.com', 
            timestamp: Date.now() - (2.5 * 24 * 60 * 60 * 1000), 
            reason: 'Scheduled Angioplasty' 
        },
        { 
            id: 'mov-3', 
            patientId: 'PAT-2025-TEST01', 
            fromLocation: 'OT Complex', 
            toLocation: 'ICU – Medical ICU', 
            movedByAdminId: 'JamesSmithsn101', 
            timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000), 
            reason: 'Post-Surgery Stabilization' 
        }
    ],
    qrToken: 'secure-token-rd-01',
    
    // Clinical Fields
    diagnosis: 'Acute Coronary Syndrome',
    severity: 'Critical',
    vitals: {
        hr: 82, 
        bpSys: 130, 
        bpDia: 85, 
        spo2: 97, 
        temp: 98.4, 
        resp: 18,
        lastUpdated: Date.now() - (15 * 60 * 1000), 
        trend: 'STABLE'
    },
    
    // Personal Fields
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    emergencyContactName: 'Susan Downey',
    emergencyContactPhone: '+1 98765 00000',
    address: '10880 Malibu Point, CA',
    insuranceProvider: 'Stark Industries Health',
    insurancePolicyNumber: 'STARK-998877',
    aadharNumber: '1234-5678-9012',
    dob: '1965-04-04',
    state: 'California',
    familyMemberName: 'Susan Downey',
    familyMemberRelationship: 'Spouse',
    familyMemberPhone: '+1 98765 00000'
};

export const INITIAL_PATIENTS: Patient[] = [
    MOCK_PATIENT_1
];

export const MOCK_LAB_REPORTS: LabReport[] = [
    {
      id: 'REP-001',
      patientId: 'PAT-2025-TEST01',
      testName: 'Complete Blood Count (CBC)',
      category: 'Pathology',
      date: new Date(Date.now() - 86400000).toLocaleDateString(),
      timestamp: Date.now() - 86400000,
      status: 'COMPLETED',
      doctorName: 'Dr. James Smith',
      resultSummary: 'Abnormal',
      data: {
        'Hemoglobin': { value: '11.5', unit: 'g/dL', range: '13.5-17.5', flag: 'LOW' },
        'WBC': { value: '12.5', unit: 'K/uL', range: '4.5-11.0', flag: 'HIGH' },
        'Platelets': { value: '250', unit: 'K/uL', range: '150-450' },
        'RBC': { value: '4.8', unit: 'M/uL', range: '4.5-5.9' }
      }
    },
    {
      id: 'REP-002',
      patientId: 'PAT-2025-TEST01',
      testName: 'Chest X-Ray PA View',
      category: 'Radiology',
      date: new Date(Date.now() - 172800000).toLocaleDateString(),
      timestamp: Date.now() - 172800000,
      status: 'COMPLETED',
      doctorName: 'Dr. Emily White',
      resultSummary: 'Normal',
      data: {
        'Observation': { value: 'Clear fields', unit: '', range: '' },
        'Heart Size': { value: 'Normal', unit: '', range: '' }
      }
    }
];

export const MOCK_CARE_EVENTS: CareEvent[] = [
    {
        id: 'evt-001',
        patientId: 'PAT-2025-TEST01',
        doctorId: 'JamesSmithsn101',
        nurseId: 'LindaJonesns202',
        timestamp: Date.now() - 3600000 * 4, // 4 hours ago
        priority: 'ROUTINE',
        status: 'COMPLETED',
        checks: ['Check BP', 'Check SpO2'],
        medications: [{ name: 'Aspirin', dose: '75mg', status: 'GIVEN' }],
        notes: 'Morning vitals check.',
        startTime: Date.now() - 3600000 * 4.5,
        completedAt: Date.now() - 3600000 * 4,
        nurseNotes: 'Patient stable. BP slightly elevated but within acceptable range.',
        checklist: [
            { item: 'Check BP', completed: true, value: '130/85', timestamp: Date.now() - 3600000 * 4.1 },
            { item: 'Check SpO2', completed: true, value: '98%', timestamp: Date.now() - 3600000 * 4.1 },
            { item: 'Administer: Aspirin (75mg)', completed: true, timestamp: Date.now() - 3600000 * 4 }
        ]
    },
    {
        id: 'evt-002',
        patientId: 'PAT-2025-TEST01',
        doctorId: 'JamesSmithsn101',
        nurseId: 'LindaJonesns202',
        timestamp: Date.now() + 3600000, // Due in 1 hour
        priority: 'URGENT',
        status: 'PENDING',
        checks: ['Dressing Change', 'Monitor ECG'],
        medications: [],
        notes: 'Surgical site inspection required. Monitor for any signs of infection.',
        scheduledTimes: ['18:00'],
        checklist: [
            { item: 'Dressing Change', completed: false },
            { item: 'Monitor ECG', completed: false }
        ]
    }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'notif-001',
        userId: 'LindaJonesns202',
        title: 'New Task Assigned',
        message: 'Dr. James Smith assigned a new task for Patient ID: PAT-2025-TEST01 (Robert Downey)',
        timestamp: Date.now(),
        read: false,
        type: 'TASK_ASSIGNED',
        patientId: 'PAT-2025-TEST01'
    }
];

export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
    'PAT-2025-TEST01': [
        {
            id: 'msg-1',
            senderId: 'JamesSmithsn101',
            senderName: 'James Smith',
            senderRole: UserRole.DOCTOR,
            content: 'How is Robert responding to the post-op meds?',
            timestamp: Date.now() - 86400000,
            channel: 'TEAM'
        },
        {
            id: 'msg-2',
            senderId: 'LindaJonesns202',
            senderName: 'Linda Jones',
            senderRole: UserRole.NURSE,
            content: 'He is responding well. Pain is managed. Vitals are stable.',
            timestamp: Date.now() - 85000000,
            channel: 'TEAM'
        },
        {
            id: 'msg-3',
            senderId: 'fam-01',
            senderName: 'Susan Downey',
            senderRole: UserRole.PATIENT_PARTY,
            content: 'Doctor, when can we expect him to be moved to the general ward?',
            timestamp: Date.now() - 43200000,
            channel: 'FAMILY'
        }
    ]
};
