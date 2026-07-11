import { create } from 'zustand';

interface OfflineState {
  isOnline: boolean;
  isUpdateAvailable: boolean;
  isLoading: boolean;
  deferredPrompt: any | null;
  setIsOnline: (online: boolean) => void;
  setIsUpdateAvailable: (available: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setDeferredPrompt: (prompt: any | null) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isUpdateAvailable: false,
  isLoading: true,
  deferredPrompt: null,
  setIsOnline: (online) => set({ isOnline: online }),
  setIsUpdateAvailable: (available) => set({ isUpdateAvailable: available }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt })
}));
