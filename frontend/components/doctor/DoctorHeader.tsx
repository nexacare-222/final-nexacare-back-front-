import React from 'react';
import { Activity, Bell } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import MenuToggle from '../MenuToggle';
import AnimatedInput from '../AnimatedInput';

interface Props {
  isDark: boolean;
  toggleTheme: () => void;
  headerSearch: string;
  setHeaderSearch: (val: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  setIsMobileContextOpen: (open: boolean) => void;
}

const DoctorHeader: React.FC<Props> = ({ 
    isDark, toggleTheme, headerSearch, setHeaderSearch, 
    isMobileMenuOpen, setIsMobileMenuOpen, setIsMobileContextOpen 
}) => {
  return (
    <>
        <div className="md:hidden h-20 flex items-center justify-between px-6 flex-shrink-0 z-20">
             <div className="flex items-center gap-4">
                <MenuToggle isOpen={isMobileMenuOpen} toggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
                <span className="font-heading font-bold text-3xl text-[#191C1B] dark:text-white">NexaCare</span>
             </div>
             <div className="flex items-center gap-3 -mr-2">
                 <ThemeToggle isDark={isDark} toggle={toggleTheme} />
                 <button onClick={() => setIsMobileContextOpen(true)} className="p-2 text-[#44474F] bg-[#FCFDF6] dark:bg-white/10 rounded-xl shadow-sm relative">
                     <Bell size={24} />
                     <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#BA1A1A] rounded-full border-2 border-[#FCFDF6] dark:border-[#212121]"></span>
                 </button>
             </div>
        </div>

        <header className="hidden md:flex h-20 items-center justify-between px-8 flex-shrink-0">
            <div className="flex items-center gap-6 flex-1 max-w-2xl">
                <div className="w-full">
                    <AnimatedInput value={headerSearch} onChange={(e) => setHeaderSearch(e.target.value)} placeholder="Search patients..." />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle isDark={isDark} toggle={toggleTheme} />
                <button className="hidden xl:flex items-center gap-2 bg-[#FFDAD6] text-[#410002] px-4 py-2 rounded-full text-xs font-bold hover:bg-[#FFB4AB] transition-colors"><Activity size={16} /> Go to OR</button>
                <button onClick={() => setIsMobileContextOpen(true)} className="w-10 h-10 flex items-center justify-center bg-[#FCFDF6] dark:bg-white/10 rounded-full shadow-sm hover:bg-[#DEE5D9] dark:hover:bg-white/20 text-[#44474F] dark:text-white transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#BA1A1A] rounded-full"></span>
                </button>
                
                {/* Brand Text Area - Larger text as requested */}
                <div className="flex items-center h-full px-2">
                    <span className="font-heading font-bold text-3xl text-[#191C1B] dark:text-white tracking-tight">NexaCare</span>
                </div>
            </div>
        </header>
    </>
  );
};

export default DoctorHeader;