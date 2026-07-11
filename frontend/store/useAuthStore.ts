import { create } from 'zustand';
import { User, UserRole } from '../types';
import { apiFetch, ApiError } from '../services/apiClient';
import { MOCK_USERS } from '../services/mockDataService';

const MOCK_SESSION_KEY = 'nexacare_mock_session';
const DEMO_PASSWORD = 'demo_pass_123';

function getStoredMockUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(MOCK_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function persistMockUser(user: User | null): void {
  if (typeof window === 'undefined') return;

  if (!user) {
    window.localStorage.removeItem(MOCK_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
}

function resolveMockUser(email: string, password?: string): User | null {
  const matchedUser = MOCK_USERS.find(
    (candidate) => candidate.email?.toLowerCase() === email.trim().toLowerCase(),
  );

  if (!matchedUser) return null;
  if (password !== undefined && password !== DEMO_PASSWORD) return null;

  return matchedUser;
}

function resolveMockQrUser(qrToken?: string): User | null {
  const familyUser = MOCK_USERS.find((candidate) => candidate.role === UserRole.PATIENT_PARTY);
  if (!familyUser) return null;

  const allowedQrTokens = new Set([
    'simulated_access_qr',
    'simulated_gallery_qr',
    familyUser.linkedPatientId ?? '',
  ]);

  if (!qrToken) return familyUser;
  if (allowedQrTokens.has(qrToken)) return familyUser;

  return null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithQr: (qrToken?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Drops local auth state without hitting the network — used when a
   *  refresh attempt has already told us the session is dead. */
  clearSession: () => void;
  updateUser: (updatedUser: User) => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Session lives in an HttpOnly cookie set by the backend, so "restoring"
  // a session on page load just means asking the backend who we are.
  initialize: async () => {
    set({ isLoading: true });
    try {
      const { user } = await apiFetch<{ user: User }>('/api/auth/me');
      set({ user, isAuthenticated: true });
      persistMockUser(user);
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password?: string) => {
    set({ isLoading: true });

    try {
      const { user } = await apiFetch<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      set({ user, isAuthenticated: true });
      persistMockUser(user);
      return true;
    } catch (err) {
      console.error('Login failed:', err instanceof ApiError ? err.message : err);
      
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithQr: async (qrToken?: string) => {
    set({ isLoading: true });

    try {
      const { user } = await apiFetch<{ user: User }>('/api/auth/login-qr', {
        method: 'POST',
        body: { qrToken },
      });
      set({ user, isAuthenticated: true });
      persistMockUser(user);
      return true;
    } catch (err) {
      console.error('QR login failed:', err instanceof ApiError ? err.message : err);
      
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed (clearing local session anyway):', err);
    } finally {
      persistMockUser(null);
      set({ user: null, isAuthenticated: false });
    }
  },

  clearSession: () => {
    persistMockUser(null);
    set({ user: null, isAuthenticated: false });
  },

  updateUser: async (updatedUser: User) => {
    try {
      const { user } = await apiFetch<{ user: User }>('/api/auth/me', {
        method: 'PATCH',
        body: {
          name: updatedUser.name,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          timings: updatedUser.timings,
          department: updatedUser.department,
        },
      });
      set((state) => ({ user: state.user ? { ...state.user, ...user } : user }));
      persistMockUser(get().user);
    } catch (err) {
      console.error('Profile update failed:', err instanceof ApiError ? err.message : err);
      set((state) => ({ user: state.user ? { ...state.user, ...updatedUser } : updatedUser }));
      persistMockUser(get().user);
    }
  },

  hasRole: (allowedRoles: UserRole[]) => {
    const { user } = get();
    if (!user) return false;
    return allowedRoles.includes(user.role);
  },
}));
