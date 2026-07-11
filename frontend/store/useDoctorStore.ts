import { create } from 'zustand';
import { User } from '../types';
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '../services/apiClient';

interface DoctorState {
  staff: User[];
  isInitialized: boolean;
  init: () => Promise<void>;
  addStaff: (newStaff: User, password: string) => void;
  removeStaff: (staffId: string) => void;
  updateStaff: (updatedStaff: User) => void;
}

export const useDoctorStore = create<DoctorState>((set, get) => ({
  staff: [],
  isInitialized: false,

  init: async () => {
    try {
      const { staff } = await apiGet<{ staff: User[] }>('/api/staff');
      set({ staff, isInitialized: true });
    } catch (err) {
      console.error('Failed to load staff:', err instanceof ApiError ? err.message : err);
      set({ isInitialized: true });
    }
  },

  addStaff: (newStaff, password) => {
    const previous = get().staff;
    set((state) => ({ staff: [...state.staff, newStaff] }));

    apiPost<{ staff: User }>('/api/staff', { ...newStaff, password })
      .then(({ staff: serverStaff }) => {
        set((state) => ({ staff: state.staff.map(s => s.id === newStaff.id ? serverStaff : s) }));
      })
      .catch((err) => {
        console.error('Failed to add staff on server:', err instanceof ApiError ? err.message : err);
        set({ staff: previous });
        alert('Could not save the new staff member to the server.');
      });
  },

  removeStaff: (staffId) => {
    const previous = get().staff;
    set((state) => ({ staff: state.staff.filter((s) => s.id !== staffId) }));

    apiDelete(`/api/staff/${staffId}`).catch((err) => {
      console.error('Failed to remove staff on server:', err instanceof ApiError ? err.message : err);
      set({ staff: previous });
      alert('Could not remove the staff member on the server.');
    });
  },

  updateStaff: (updatedStaff) => {
    set((state) => ({ staff: state.staff.map((s) => s.id === updatedStaff.id ? updatedStaff : s) }));

    apiPatch<{ staff: User }>(`/api/staff/${updatedStaff.id}`, updatedStaff)
      .then(({ staff: serverStaff }) => {
        set((state) => ({ staff: state.staff.map(s => s.id === serverStaff.id ? serverStaff : s) }));
      })
      .catch((err) => {
        console.error('Failed to sync staff update:', err instanceof ApiError ? err.message : err);
      });
  }
}));
