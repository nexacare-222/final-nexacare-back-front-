import React, { useState } from 'react';
import { User, UserRole } from '../types';
import UserProfileModal from './UserProfileModal';
import ThemeToggle from './ThemeToggle';
import MenuToggle from './MenuToggle';
import LogoutButton from './LogoutButton';
import Logo from './Logo';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';

interface HeaderProps {
  // Legacy props kept optional for backwards compatibility
  user?: User | null;
  onLogout?: () => void;
  toggleSidebar?: () => void;
  onUpdateUser?: (user: User) => void;
  isDark?: boolean;
  toggleTheme?: () => void;
  isSidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const updateUser = useAuthStore(state => state.updateUser);
  
  const isSidebarOpen = useSettingsStore(state => state.sidebarOpen);
  const setSidebarOpen = useSettingsStore(state => state.setSidebarOpen);
  const navigate = useSettingsStore(state => state.navigate);

  const isDark = useThemeStore(state => state.isDarkMode);
  const toggleTheme = useThemeStore(state => state.toggleTheme);

  if (!user) return null;

  const toggleSidebarHandler = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const logoutHandler = () => {
    logout();
    navigate('/');
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-[#FFDAD6] text-[#410002] border-[#FFB4AB]';
      case UserRole.DOCTOR: return 'bg-[#E0F2F1] text-[#004D40] border-[#B2DFDB]';
      case UserRole.NURSE: return 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <>
    <header className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-30 h-20 flex items-center justify-between px-6 md:px-8 transition-all duration-300">
      <div className="flex items-center gap-4">
        <MenuToggle isOpen={isSidebarOpen} toggle={toggleSidebarHandler} />
        
        {/* Brand Area with Unified Logo */}
        <div className="hidden md:flex items-center">
             <Logo size="md" showText={true} />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        
        <ThemeToggle isDark={isDark} toggle={toggleTheme} />

        {/* User Profile Area */}
        <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-1.5 pl-4 pr-1.5 rounded-full border border-brand-purple/30 dark:border-white/10 hover:border-brand-purple/60 transition-all group shadow-sm hover:shadow-md bg-white/50 dark:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"
            onClick={() => setIsProfileOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsProfileOpen(true);
              }
            }}
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            aria-expanded={isProfileOpen}
            title="View Profile"
        >
            <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-brand-purple dark:group-hover:text-brand-greenSoft transition-colors">{user.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getRoleBadgeStyle(user.role)}`}>
                    {user.role.replace('_', ' ')}
                </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm group-hover:scale-105 transition-all">
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
            </div>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

        <LogoutButton onClick={logoutHandler} />
      </div>
    </header>

    <UserProfileModal 
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdateUser={updateUser}
    />
    </>
  );
};

export default Header;
