
import React from 'react';
import { LayoutGrid, MessageSquare, Users, TrendingUp, LogOut, X } from 'lucide-react';
import { User } from '../../types';
import Logo from '../Logo';

interface Props {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  user: User;
  onLogout: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onDuty: boolean;
  setOnDuty: (duty: boolean) => void;
  setIsProfileOpen: (open: boolean) => void;
}

const NAV_ITEMS = [
    { id: 'Dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { id: 'Messages', icon: MessageSquare, label: 'Communications' },
    { id: 'My Patients', icon: Users, label: 'Patient List' },
    { id: 'Analytics', icon: TrendingUp, label: 'Analytics' },
];

const DoctorSidebar: React.FC<Props> = ({ 
    activeNav, setActiveNav, user, onLogout, 
    isMobileMenuOpen, setIsMobileMenuOpen, onDuty, setOnDuty, setIsProfileOpen 
}) => {
  return (
    <div className={`fixed inset-y-0 left-0 z-[100] w-[280px] flex flex-col flex-shrink-0 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex-1 bg-white/60 dark:bg-black/40 backdrop-blur-[32px] border-r border-white/80 dark:border-white/10 rounded-r-[45px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden text-slate-800 dark:text-white ring-1 ring-black/5 dark:ring-white/5">
            
            {/* Header Section */}
            <div className="p-7 pb-4 flex items-center justify-between">
                <Logo size="md" showText={true} textClassName="text-slate-800 dark:text-white text-3xl font-bold tracking-tight" />
                <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="md:hidden p-1 rounded-full text-slate-400 hover:text-slate-800 dark:text-white/60 dark:hover:text-white transition-all"
                >
                    <X size={24} strokeWidth={1.5} />
                </button>
            </div>

            <div className="h-px bg-slate-200 dark:bg-white/10 mx-7 mb-4"></div>

            {/* Navigation Section */}
            <nav className="flex-1 px-3.5 space-y-1 overflow-y-auto scrollbar-hide">
                {NAV_ITEMS.map((item) => (
                <button 
                    key={item.id} 
                    onClick={() => { setActiveNav(item.id); setIsMobileMenuOpen(false); }} 
                    className={`w-full flex items-center gap-3.5 px-6 py-3 rounded-[20px] font-bold transition-all group relative ${
                        activeNav === item.id 
                        ? 'bg-[#CCF5A6] text-[#0f172a] shadow-md' 
                        : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                    }`}
                >
                    <div className={`flex-shrink-0 transition-colors duration-300 ${activeNav === item.id ? 'text-[#0f172a]' : 'opacity-80 group-hover:opacity-100'}`}>
                        <item.icon size={21} strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-left tracking-tight text-[15px]">{item.label}</span>
                </button>
                ))}
            </nav>

            {/* User Profile Hook */}
            <div className="px-5 mb-4">
                <div 
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center gap-3.5 p-3.5 rounded-[22px] bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-all"
                >
                    <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/20" alt="" />
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">{user.name}</p>
                        <p className="text-[9px] text-[#006D42] dark:text-[#7cff67] font-black uppercase tracking-widest mt-0.5">{onDuty ? 'On Duty' : 'Off Duty'}</p>
                    </div>
                </div>
            </div>

            {/* Bottom Actions Area */}
            <div className="p-7 pt-0 space-y-5">
                <button 
                    onClick={() => setActiveNav('Shift Transfer')}
                    className="w-full bg-[#191C1B] hover:bg-[#000] dark:bg-[#3D444F] dark:hover:bg-[#333] text-white py-4 rounded-[18px] font-bold text-base transition-all shadow-lg active:scale-95 border border-transparent dark:border-white/5"
                >
                    Shift Handover
                </button>
                
                <button 
                    onClick={onLogout} 
                    className="w-full flex items-center justify-center gap-2.5 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white font-bold text-[15px] transition-colors py-2 active:scale-95"
                >
                    <LogOut size={20} strokeWidth={2.5} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
      </div>
  );
};

export default DoctorSidebar;
