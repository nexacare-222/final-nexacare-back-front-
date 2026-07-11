import { create } from 'zustand';
import { Notification } from '../types';
import { apiGet, apiPatch, ApiError } from '../services/apiClient';

interface NotificationState {
  notifications: Notification[];
  isInitialized: boolean;
  init: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  addNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  isInitialized: false,

  init: async () => {
    try {
      const { notifications } = await apiGet<{ notifications: Notification[] }>('/api/notifications');
      set({ notifications, isInitialized: true });
    } catch (err) {
      console.error('Failed to load notifications:', err instanceof ApiError ? err.message : err);
      set({ isInitialized: true });
    }
  },

  // Notifications are created server-side as a side effect of the action
  // that triggers them (movement, assignment, handover, new task, etc.) —
  // this just reflects that locally for the recipient's optimistic UI.
  addNotification: (notif) => set((state) => ({
    notifications: [notif, ...state.notifications]
  })),

  addNotifications: (newNotifs) => set((state) => ({
    notifications: [...newNotifs, ...state.notifications]
  })),

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    }));

    apiPatch(`/api/notifications/${id}/read`).catch((err) => {
      console.error('Failed to sync notification read-state:', err instanceof ApiError ? err.message : err);
    });
  },

  clearAll: () => set({ notifications: [] })
}));
