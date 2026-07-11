import { create } from 'zustand';
import { Patient, CareEvent, LabReport, MovementLog, Notification, UserRole, CareEventChecklistItem, CareEventCreationData } from '../types';
import { useOfflineStore } from './useOfflineStore';
import { useAuthStore } from './useAuthStore';
import { useNotificationStore } from './useNotificationStore';
import { useDoctorStore } from './useDoctorStore';
import { apiGet, apiPost, apiPatch, ApiError } from '../services/apiClient';

interface PatientState {
  patients: Patient[];
  careEvents: CareEvent[];
  reports: LabReport[];
  isInitialized: boolean;

  init: () => Promise<void>;
  addMovement: (patientId: string, toLocation: string, reason: string, timeString?: string, assignedStaffId?: string) => void;
  registerPatient: (newPatientData: Partial<Patient>) => void;
  updatePatient: (updatedPatient: Patient) => void;
  assignStaff: (patientId: string, staffId: string, role: UserRole, time: string) => void;
  shiftHandover: (targetStaffId: string, patientIds: string[], notes: string) => void;
  createCareEvent: (eventData: CareEventCreationData) => void;
  completeTask: (taskId: string, nurseNotes: string, checklist: CareEventChecklistItem[], attachments: string[]) => void;
  addReport: (report: LabReport) => void;
  saveVitals: (patientId: string, vitals: Record<string, string | number>) => void;
}

/** Every mutator below applies an optimistic local update immediately (so
 *  existing call sites — none of which `await` these calls — keep their
 *  original snappy UX), then fires the real request and reconciles state
 *  from the server response once it lands. Failures are logged and, where
 *  the user needs to know, surfaced with an alert. */
export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  careEvents: [],
  reports: [],
  isInitialized: false,

  init: async () => {
    try {
      const [patientsRes, eventsRes, reportsRes] = await Promise.all([
        apiGet<{ patients: Patient[] }>('/api/patients'),
        apiGet<{ careEvents: CareEvent[] }>('/api/care-events'),
        apiGet<{ reports: LabReport[] }>('/api/lab-reports'),
      ]);
      set({
        patients: patientsRes.patients,
        careEvents: eventsRes.careEvents,
        reports: reportsRes.reports,
        isInitialized: true,
      });
    } catch (err) {
      console.error('Failed to load patient data:', err instanceof ApiError ? err.message : err);
      set({ isInitialized: true });
    }
  },

  addMovement: (patientId, toLocation, reason, timeString, assignedStaffId) => {
    const isOnline = useOfflineStore.getState().isOnline;
    if (!isOnline) {
      alert("Network required to transfer patients. Movement logged locally but not synced.");
      return;
    }

    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    let timestamp = Date.now();
    if (timeString) {
      const [h, m] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(h);
      date.setMinutes(m);
      timestamp = date.getTime();
    }

    const currentPatients = get().patients;
    const patient = currentPatients.find(p => p.id === patientId);

    const newMovement: MovementLog = {
      id: `mov-${Date.now()}`,
      patientId,
      fromLocation: patient?.currentLocation || null,
      toLocation,
      movedByAdminId: currentUser.id,
      timestamp,
      reason
    };

    if (assignedStaffId) {
      const notif: Notification = {
        id: `notif-mov-${Date.now()}`,
        userId: assignedStaffId,
        title: 'Patient Transfer Assignment',
        message: `You have been assigned to ${patient?.name || 'Patient'} during transfer to ${toLocation}. Reason: ${reason}`,
        timestamp: Date.now(),
        read: false,
        type: 'ALERT',
        patientId: patientId
      };
      useNotificationStore.getState().addNotification(notif);
    }

    const updatedPatients = currentPatients.map(p => {
      if (p.id === patientId) {
        let updatedAssignmentTimings = { ...p.assignmentTimings };
        if (assignedStaffId && timeString) {
          updatedAssignmentTimings[assignedStaffId] = timeString;
        }

        let updatedNurses = [...(p.assignedNurseIds || [])];
        if (assignedStaffId) {
          const staff = useDoctorStore.getState().staff;
          const staffMember = staff.find(s => s.id === assignedStaffId);
          if (staffMember && (staffMember.role === UserRole.NURSE || staffMember.role === UserRole.STAFF)) {
            if (!updatedNurses.includes(assignedStaffId)) {
              updatedNurses.push(assignedStaffId);
            }
          }
        }

        return {
          ...p,
          currentLocation: toLocation,
          movements: [...(p.movements || []), newMovement],
          assignmentTimings: updatedAssignmentTimings,
          assignedNurseIds: updatedNurses
        };
      }
      return p;
    });

    set({ patients: updatedPatients });

    apiPost<{ patient: Patient }>(`/api/patients/${patientId}/movements`, { toLocation, reason, timeString, assignedStaffId })
      .then(({ patient: serverPatient }) => {
        set((state) => ({ patients: state.patients.map(p => p.id === patientId ? serverPatient : p) }));
      })
      .catch((err) => {
        console.error('Failed to sync patient movement:', err instanceof ApiError ? err.message : err);
        alert('Transfer could not be saved to the server. It may not persist — please retry.');
      });
  },

  registerPatient: (newPatientData) => {
    const isOnline = useOfflineStore.getState().isOnline;
    if (!isOnline) {
      alert("Registration requires active hospital network connection.");
      return;
    }
    const newPatient = newPatientData as Patient;
    set((state) => ({
      patients: [newPatient, ...state.patients]
    }));

    apiPost<{ patient: Patient }>('/api/patients', newPatientData)
      .then(({ patient: serverPatient }) => {
        set((state) => ({
          patients: state.patients.map(p => p.id === newPatient.id ? serverPatient : p)
        }));
      })
      .catch((err) => {
        console.error('Failed to register patient on server:', err instanceof ApiError ? err.message : err);
        set((state) => ({ patients: state.patients.filter(p => p.id !== newPatient.id) }));
        alert('Registration failed to save to the server. Please try again.');
      });
  },

  updatePatient: (updatedPatient) => {
    set((state) => ({
      patients: state.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p)
    }));

    apiPatch<{ patient: Patient }>(`/api/patients/${updatedPatient.id}`, updatedPatient)
      .then(({ patient: serverPatient }) => {
        set((state) => ({ patients: state.patients.map(p => p.id === serverPatient.id ? serverPatient : p) }));
      })
      .catch((err) => {
        console.error('Failed to sync patient update:', err instanceof ApiError ? err.message : err);
      });
  },

  assignStaff: (patientId, staffId, role, time) => {
    const currentPatients = get().patients;
    const patient = currentPatients.find(p => p.id === patientId);

    if (role === UserRole.NURSE || role === UserRole.STAFF) {
      const notif: Notification = {
        id: `notif-assign-${Date.now()}`,
        userId: staffId,
        title: 'New Patient Assignment',
        message: `You have been assigned to patient ${patient?.name || 'Unknown'}. Report time: ${time}.`,
        timestamp: Date.now(),
        read: false,
        type: 'TASK_ASSIGNED',
        patientId: patientId
      };
      useNotificationStore.getState().addNotification(notif);
    }

    const updatedPatients = currentPatients.map(p => {
      if (p.id !== patientId) return p;

      const updated = { ...p };
      if (role === UserRole.DOCTOR) {
        updated.assignedDoctorId = staffId;
      } else if (role === UserRole.NURSE || role === UserRole.STAFF) {
        const currentNurses = p.assignedNurseIds || [];
        if (!currentNurses.includes(staffId)) {
          updated.assignedNurseIds = [...currentNurses, staffId];
        }
      }

      updated.assignmentTimings = {
        ...updated.assignmentTimings,
        [staffId]: time
      };

      return updated;
    });

    set({ patients: updatedPatients });

    apiPost<{ patient: Patient }>(`/api/patients/${patientId}/assign`, { staffId, role, time })
      .then(({ patient: serverPatient }) => {
        set((state) => ({ patients: state.patients.map(p => p.id === patientId ? serverPatient : p) }));
      })
      .catch((err) => {
        console.error('Failed to sync staff assignment:', err instanceof ApiError ? err.message : err);
      });
  },

  shiftHandover: (targetStaffId, patientIds, notes) => {
    const currentUser = useAuthStore.getState().user;
    const currentPatients = get().patients;

    const notification: Notification = {
      id: `notif-handover-${Date.now()}`,
      userId: targetStaffId,
      title: 'Shift Handover Received',
      message: `You have received a shift handover from ${currentUser?.name || 'Staff'}. ${patientIds.length} patients assigned. Notes: ${notes.substring(0, 50)}...`,
      timestamp: Date.now(),
      read: false,
      type: 'ALERT',
    };
    useNotificationStore.getState().addNotification(notification);

    const updatedPatients = currentPatients.map(p => {
      if (patientIds.includes(p.id)) {
        const staff = useDoctorStore.getState().staff;
        const targetStaff = staff.find(s => s.id === targetStaffId);
        if (targetStaff?.role === UserRole.DOCTOR) {
          return {
            ...p,
            assignedDoctorId: targetStaffId
          };
        } else {
          const currentNurses = p.assignedNurseIds || [];
          if (!currentNurses.includes(targetStaffId)) {
            return {
              ...p,
              assignedNurseIds: [...currentNurses, targetStaffId]
            };
          }
        }
      }
      return p;
    });

    set({ patients: updatedPatients });

    apiPost<{ patients: Patient[] }>('/api/patients/shift-handover', { targetStaffId, patientIds, notes })
      .then(({ patients: serverPatients }) => {
        set((state) => ({
          patients: state.patients.map(p => serverPatients.find(sp => sp.id === p.id) || p)
        }));
      })
      .catch((err) => {
        console.error('Failed to sync shift handover:', err instanceof ApiError ? err.message : err);
      });
  },

  createCareEvent: (eventData) => {
    const isOnline = useOfflineStore.getState().isOnline;
    if (!isOnline) {
      alert("Unable to create clinical events while offline.");
      return;
    }

    const currentUser = useAuthStore.getState().user;
    const tempId = `evt-${Date.now()}`;
    const newEvent: CareEvent = {
      id: tempId,
      doctorId: currentUser?.id || '',
      status: 'PENDING',
      ...eventData
    };

    const patient = get().patients.find(p => p.id === eventData.patientId);
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      userId: eventData.nurseId,
      title: 'New Task Assigned',
      message: `New ${eventData.priority} task for ${patient?.name || 'Patient'}`,
      timestamp: Date.now(),
      read: false,
      type: 'TASK_ASSIGNED',
      patientId: eventData.patientId
    };
    useNotificationStore.getState().addNotification(newNotification);

    set((state) => ({
      careEvents: [...state.careEvents, newEvent]
    }));

    apiPost<{ careEvent: CareEvent }>('/api/care-events', eventData)
      .then(({ careEvent: serverEvent }) => {
        set((state) => ({
          careEvents: state.careEvents.map(e => e.id === tempId ? serverEvent : e)
        }));
      })
      .catch((err) => {
        console.error('Failed to sync care event:', err instanceof ApiError ? err.message : err);
        set((state) => ({ careEvents: state.careEvents.filter(e => e.id !== tempId) }));
        alert('Task could not be saved to the server. Please try again.');
      });
  },

  completeTask: (taskId, nurseNotes, checklist, attachments) => {
    set((state) => ({
      careEvents: state.careEvents.map(e =>
        e.id === taskId ? {
          ...e,
          status: 'COMPLETED',
          completedAt: Date.now(),
          nurseNotes,
          checklist,
          attachments
        } : e
      )
    }));

    apiPatch<{ careEvent: CareEvent }>(`/api/care-events/${taskId}/complete`, { nurseNotes, checklist, attachments })
      .then(({ careEvent: serverEvent }) => {
        set((state) => ({ careEvents: state.careEvents.map(e => e.id === taskId ? serverEvent : e) }));
      })
      .catch((err) => {
        console.error('Failed to sync task completion:', err instanceof ApiError ? err.message : err);
      });
  },

  addReport: (report) => {
    const tempId = report.id || `report-${Date.now()}`;
    const optimisticReport = { ...report, id: tempId };

    set((state) => ({
      reports: [optimisticReport, ...state.reports]
    }));

    apiPost<{ report: LabReport }>('/api/lab-reports', {
      patientId: report.patientId,
      testName: report.testName,
      category: report.category,
      date: report.date,
      doctorName: report.doctorName,
      resultSummary: report.resultSummary,
      data: report.data || {},
      fileUrl: report.fileUrl,
    })
      .then(({ report: serverReport }) => {
        set((state) => ({
          reports: state.reports.map(r => r.id === tempId ? serverReport : r)
        }));
      })
      .catch((err) => {
        console.error('Failed to save report to server:', err instanceof ApiError ? err.message : err);
        set((state) => ({ reports: state.reports.filter(r => r.id !== tempId) }));
        alert('Report could not be saved to the server. Please try again.');
      });
  },

  saveVitals: (patientId, vitals) => {
    const parsed = {
      hr: Number(vitals.hr) || 0,
      bpSys: Number(vitals.bpSys) || 0,
      bpDia: Number(vitals.bpDia) || 0,
      spo2: Number(vitals.spo2) || 0,
      temp: Number(vitals.temp) || 0,
      resp: Number(vitals.resp) || 0,
    };

    set((state) => ({
      patients: state.patients.map(p => p.id === patientId ? {
        ...p,
        vitals: { ...parsed, lastUpdated: Date.now(), trend: 'STABLE' }
      } : p)
    }));

    apiPost<{ vitals: Patient['vitals'] }>(`/api/patients/${patientId}/vitals`, parsed)
      .then(({ vitals: serverVitals }) => {
        set((state) => ({
          patients: state.patients.map(p => p.id === patientId ? { ...p, vitals: serverVitals } : p)
        }));
      })
      .catch((err) => {
        console.error('Failed to sync vitals:', err instanceof ApiError ? err.message : err);
      });
  }
}));
