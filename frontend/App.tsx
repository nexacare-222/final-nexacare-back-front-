import React, { useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';

// Retry wrapper for lazy imports — retries up to 3 times on chunk-load failure
function lazyRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3,
): React.LazyExoticComponent<T> {
  return lazy(() => {
    const attempt = (n: number): Promise<{ default: T }> =>
      factory().catch((err: any) => {
        if (n <= 0) throw err;
        return new Promise<{ default: T }>((resolve) =>
          setTimeout(() => resolve(attempt(n - 1)), 1000),
        );
      });
    return attempt(retries);
  });
}

const Dashboard = lazyRetry(() => import('./pages/Dashboard'));
const DoctorDashboard = lazyRetry(() => import('./pages/DoctorDashboard'));
const NurseDashboard = lazyRetry(() => import('./pages/NurseDashboard'));
const PatientDetail = lazyRetry(() => import('./pages/PatientDetail'));
const StaffManagement = lazyRetry(() => import('./pages/StaffManagement'));

import Loader from './components/Loader';
import LazyErrorBoundary from './components/LazyErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import { Menu } from 'lucide-react';
import { UserRole } from './types';
import ThemeToggle from './components/ThemeToggle';
import { ProtectedRoute, RoleGate } from './components/ProtectedRoute';

// Zustand Stores
import { useAuthStore } from './store/useAuthStore';
import { useOfflineStore } from './store/useOfflineStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useThemeStore } from './store/useThemeStore';
import { usePatientStore } from './store/usePatientStore';
import { useDoctorStore } from './store/useDoctorStore';
import { useMessageStore } from './store/useMessageStore';
import { useNotificationStore } from './store/useNotificationStore';

const AppContent: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const handleLogin = useAuthStore(state => state.login);

  const isOnline = useOfflineStore(state => state.isOnline);
  const isUpdateAvailable = useOfflineStore(state => state.isUpdateAvailable);
  const isLoading = useOfflineStore(state => state.isLoading);
  const setIsLoading = useOfflineStore(state => state.setIsLoading);

  const currentPath = useSettingsStore(state => state.currentPath);
  const sidebarOpen = useSettingsStore(state => state.sidebarOpen);
  const setSidebarOpen = useSettingsStore(state => state.setSidebarOpen);
  const navigate = useSettingsStore(state => state.navigate);

  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const toggleTheme = useThemeStore(state => state.toggleTheme);

  const setIsOnline = useOfflineStore(state => state.setIsOnline);
  const setIsUpdateAvailable = useOfflineStore(state => state.setIsUpdateAvailable);

  const setDeferredPrompt = useOfflineStore(state => state.setDeferredPrompt);

  // Initialize event listeners on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleUpdate = () => setIsUpdateAvailable(true);
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('nexacare-update-available', handleUpdate);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('nexacare-update-available', handleUpdate);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setIsLoading, setIsOnline, setIsUpdateAvailable, setDeferredPrompt]);

  // Once a session is confirmed, hydrate the data stores from the backend
  // (they start empty — no more mock arrays).
  useEffect(() => {
    if (!user) return;
    usePatientStore.getState().init();
    useDoctorStore.getState().init();
    useMessageStore.getState().init();
    useNotificationStore.getState().init();
  }, [user]);

  if (isLoading) {
    return <Loader />;
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (user.role) {
      case UserRole.DOCTOR:
        return (
          <RoleGate allowedRoles={[UserRole.DOCTOR]}>
            <DoctorDashboard />
          </RoleGate>
        );
      case UserRole.NURSE:
      case UserRole.STAFF:
        return (
          <RoleGate allowedRoles={[UserRole.NURSE, UserRole.STAFF]}>
            <NurseDashboard />
          </RoleGate>
        );
      case UserRole.ADMIN:
        if (currentPath === '/register') {
          return (
            <RoleGate allowedRoles={[UserRole.ADMIN]}>
              <Dashboard autoOpenRegister={true} />
            </RoleGate>
          );
        }
        if (currentPath === '/doctors') {
          return (
            <RoleGate allowedRoles={[UserRole.ADMIN]}>
              <StaffManagement type="DOCTOR" />
            </RoleGate>
          );
        }
        if (currentPath === '/medical-staff') {
          return (
            <RoleGate allowedRoles={[UserRole.ADMIN]}>
              <StaffManagement type="MEDICAL_STAFF" />
            </RoleGate>
          );
        }
        if (currentPath.startsWith('/patient/')) {
          return (
            <RoleGate allowedRoles={[UserRole.ADMIN]}>
              <PatientDetail />
            </RoleGate>
          );
        }
        return (
          <RoleGate allowedRoles={[UserRole.ADMIN]}>
            <Dashboard />
          </RoleGate>
        );
      
      case UserRole.PATIENT_PARTY:
        const pid = user.linkedPatientId;
        if (pid) {
          return (
            <RoleGate allowedRoles={[UserRole.PATIENT_PARTY]}>
              <PatientDetail patientId={pid} />
            </RoleGate>
          );
        }
        return <div className="p-8 text-center text-slate-500">No linked patient found.</div>;
        
      default:
        return <div className="p-8 text-center text-red-500">Unknown Role</div>;
    }
  };

  const isAdmin = user && user.role === UserRole.ADMIN;
  const isFullHeaderPage = currentPath === '/doctors' || currentPath === '/medical-staff';
  const isPatientDetailPage = currentPath.startsWith('/patient/');
  const showHeader = isAdmin && (currentPath === '/' || currentPath === '/register');
  const showSidebar = isAdmin;
  const isCustomDashboardRole = user && (user.role === UserRole.DOCTOR || user.role === UserRole.NURSE || user.role === UserRole.STAFF);

  return (
    <div className="flex h-screen overflow-hidden bg-[#C6D5DE] dark:bg-[#212121] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <OfflineBanner 
        isOnline={isOnline} 
        isUpdateAvailable={isUpdateAvailable} 
        onRefresh={() => window.location.reload()} 
      />
      
      {showSidebar && (
        <Sidebar />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {showHeader ? (
          <Header />
        ) : (isAdmin && !isFullHeaderPage && !isPatientDetailPage) && (
          <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start pointer-events-none">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full shadow-sm text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 transition-all pointer-events-auto"
            >
              <Menu size={20} />
            </button>
            <div className="pointer-events-auto flex gap-2">
              <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} />
            </div>
          </div>
        )}
        
        <main className={`flex-1 ${isCustomDashboardRole ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto'} bg-transparent ${(!showHeader && !isCustomDashboardRole && !isFullHeaderPage) ? 'pt-0' : ''}`}>
          <LazyErrorBoundary>
            <Suspense fallback={<Loader />}>
              {renderContent()}
            </Suspense>
          </LazyErrorBoundary>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ProtectedRoute>
      <AppContent />
    </ProtectedRoute>
  );
};

export default App;
