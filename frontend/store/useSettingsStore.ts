import { create } from 'zustand';

interface SettingsState {
  sidebarOpen: boolean;
  currentPath: string;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPath: (path: string) => void;
  navigate: (path: string) => void;
  handleAppRefresh: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  sidebarOpen: false,
  currentPath: '/',
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  setCurrentPath: (path) => set({ currentPath: path }),
  
  navigate: (path) => set({ currentPath: path }),
  
  handleAppRefresh: () => {
    if (typeof window !== 'undefined') {
      if (window.navigator.serviceWorker && window.navigator.serviceWorker.controller) {
        window.navigator.serviceWorker.controller.postMessage('SKIP_WAITING');
      }
      window.location.reload();
    }
  }
}));
