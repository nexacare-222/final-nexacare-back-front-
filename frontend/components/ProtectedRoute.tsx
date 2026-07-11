import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../types';
import Login from '../pages/Login';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Enforces general authentication. If the user is not authenticated,
 * it intercepts and displays the Login component.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const initializeAuth = useAuthStore(state => state.initialize);

  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#C6D5DE] dark:bg-[#212121]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#681fef] border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
};

interface RoleGateProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Enforces Role-Based Access Control (RBAC) on child components.
 * If the user's role is not included in allowedRoles, it shows a polished "Access Denied" screen
 * or renders a custom fallback element.
 */
export const RoleGate: React.FC<RoleGateProps> = ({
  allowedRoles,
  children,
  fallback
}) => {
  const user = useAuthStore(state => state.user);
  const hasRole = useAuthStore(state => state.hasRole);
  const logout = useAuthStore(state => state.logout);

  const isAuthorized = hasRole(allowedRoles);

  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-slate-900 p-8 text-center border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
            <ShieldAlert size={32} id="auth-shield-alert-icon" />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Access Denied
          </h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Your current account role (<span className="font-semibold text-[#681fef]">{user?.role}</span>) 
            does not have permission to view this section of NexaCare.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <ArrowLeft size={16} />
              Return to Dashboard
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#681fef] py-3 text-sm font-bold text-white hover:bg-opacity-90 transition-all shadow-md shadow-[#681fef]/20"
            >
              <LogOut size={16} />
              Sign Out & Switch Accounts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
