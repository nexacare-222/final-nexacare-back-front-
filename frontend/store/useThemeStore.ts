import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  // Try to load initial theme state
  const isDarkInitial = typeof window !== 'undefined' 
    ? localStorage.getItem('nexacare_theme') === 'dark' || document.documentElement.classList.contains('dark')
    : false;

  if (isDarkInitial && typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

  return {
    isDarkMode: isDarkInitial,

    toggleTheme: () => set((state) => {
      const nextDark = !state.isDarkMode;
      if (typeof document !== 'undefined') {
        if (nextDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      localStorage.setItem('nexacare_theme', nextDark ? 'dark' : 'light');
      return { isDarkMode: nextDark };
    }),

    setDarkMode: (isDark) => set(() => {
      if (typeof document !== 'undefined') {
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      localStorage.setItem('nexacare_theme', isDark ? 'dark' : 'light');
      return { isDarkMode: isDark };
    })
  };
});
