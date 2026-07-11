import React, { memo } from 'react';
import { User, UserRole } from '../types';
import { LayoutDashboard, Users, UserPlus, X, Stethoscope, BriefcaseMedical } from 'lucide-react';
import Logo from './Logo';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';

interface SidebarProps {
  user?: User;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  onNavigate?: (path: string) => void;
  currentPath?: string;
}

const SidebarComponent: React.FC<SidebarProps> = () => {
  const user = useAuthStore(state => state.user);
  const isOpen = useSettingsStore(state => state.sidebarOpen);
  const setIsOpen = useSettingsStore(state => state.setSidebarOpen);
  const onNavigate = useSettingsStore(state => state.navigate);
  const currentPath = useSettingsStore(state => state.currentPath);

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE] },
    { 
      name: 'My Patient', 
      path: user.linkedPatientId ? `/patient/${user.linkedPatientId}` : '/', 
      icon: Users, 
      roles: [UserRole.PATIENT_PARTY] 
    },
  ];

  const adminItems = [
    { name: 'Register Patient', path: '/register', icon: UserPlus, roles: [UserRole.ADMIN] },
    { name: 'Doctors', path: '/doctors', icon: Stethoscope, roles: [UserRole.ADMIN] },
    { name: 'Medical Staff', path: '/medical-staff', icon: BriefcaseMedical, roles: [UserRole.ADMIN] },
  ];

  const handleNavigation = (path: string) => {
    onNavigate(path);
    setIsOpen(false);
  };

  const overlayClass = isOpen ? 'fixed inset-0 bg-black/30 backdrop-blur-sm z-40' : 'hidden';
  const sidebarContainerClass = `fixed inset-y-0 left-0 z-50 w-[300px] flex flex-col transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;

  return (
    <>
      <div className={overlayClass} onClick={() => setIsOpen(false)} aria-hidden="true" />
      
      <div className={sidebarContainerClass} role="navigation" aria-label="Sidebar navigation">
         <div className="flex-1 m-4 bg-white/60 dark:bg-black/40 backdrop-blur-[32px] border border-white/80 dark:border-white/10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden text-slate-800 ring-1 ring-black/5">
            
            <div className="p-8 pb-4 flex justify-between items-center">
                <Logo size="md" showText={true} />
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-white/40 dark:hover:bg-white/10 text-slate-400 hover:text-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-[#4B3FAE] outline-none" aria-label="Close sidebar">
                    <X size={20} id="sidebar-close-btn" />
                </button>
            </div>
            
            <nav className="flex-1 px-5 py-6 space-y-3 overflow-y-auto scrollbar-hide">
                {navItems.map((item) => (
                    item.roles.includes(user.role) && (
                        <button 
                            key={item.path} 
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-[22px] transition-all duration-300 group font-bold border active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#4B3FAE] outline-none ${
                                currentPath === item.path 
                                ? 'bg-[#CCF5A6] text-[#0f172a] border-[#CCF5A6] shadow-[0_8px_20px_rgba(204,245,166,0.5)] scale-[1.02]' 
                                : 'bg-white/40 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-white/60 dark:border-white/5 hover:bg-white/60'
                            }`}
                        >
                            <item.icon size={22} strokeWidth={2.5} className={currentPath === item.path ? 'text-[#0f172a]' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'} />
                            <span className="tracking-tight text-base">{item.name}</span>
                        </button>
                    )
                ))}

                {user.role === UserRole.ADMIN && (
                    <>
                        <div className="mt-8 mb-3 px-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/80">Admin Controls</p>
                        </div>
                        
                        {adminItems.map((item) => (
                            <button 
                                key={item.path} 
                                onClick={() => handleNavigation(item.path)}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-[22px] transition-all duration-300 group font-bold border active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#4B3FAE] outline-none ${
                                    currentPath === item.path 
                                    ? 'bg-[#CCF5A6] text-[#0f172a] border-[#CCF5A6] shadow-[0_8px_20px_rgba(204,245,166,0.5)] scale-[1.02]' 
                                    : 'bg-white/40 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-white/60 dark:border-white/5 hover:bg-white/60'
                                }`}
                            >
                                <item.icon size={22} strokeWidth={2.5} className={currentPath === item.path ? 'text-[#0f172a]' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'} />
                                <span className="tracking-tight text-base">{item.name}</span>
                            </button>
                        ))}
                    </>
                )}
            </nav>
            
            <div className="p-6 m-3 mb-4 bg-white/50 dark:bg-black/20 rounded-[32px] border border-white/80 dark:border-white/5 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                     <Logo size="sm" />
                     <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate">NexaCare Pro</p>
                          <p className="text-[11px] text-slate-500 font-bold opacity-70">Enterprise Edition</p>
                     </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-black mt-4 px-1">
                     <span className="opacity-50">v2.4.0</span>
                     <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7cff67] shadow-[0_0_8px_#7cff67]"></div> SECURE</span>
                </div>
            </div>
         </div>
      </div>
    </>
  );
};

const Sidebar = memo(SidebarComponent);
export default Sidebar;
