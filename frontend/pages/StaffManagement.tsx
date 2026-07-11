import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Plus, Search, Trash2, Phone, Mail } from 'lucide-react';
import AddStaffModal from '../components/AddStaffModal';
import StaffDetailModal from '../components/StaffDetailModal';
import NeuButton from '../components/NeuButton';
import AnimatedInput from '../components/AnimatedInput';
import MenuToggle from '../components/MenuToggle';
import ThemeToggle from '../components/ThemeToggle';
import { getCategorizedStaff, DOCTOR_CATEGORIES, MEDICAL_STAFF_CATEGORIES } from '../services/mockDataService';

// Zustand Stores
import { useDoctorStore } from '../store/useDoctorStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';

interface Props {
  type: 'DOCTOR' | 'MEDICAL_STAFF';
  staffList?: User[];
  onAddStaff?: (staff: User) => void;
  onRemoveStaff?: (id: string) => void;
  onUpdateStaff?: (staff: User) => void;
  toggleSidebar?: () => void;
  isDark?: boolean;
  toggleTheme?: () => void;
}

const StaffManagement: React.FC<Props> = ({ type }) => {
  // Use selectors from Zustand stores to completely eliminate prop drilling
  const staffList = useDoctorStore(state => state.staff);
  const onAddStaff = useDoctorStore(state => state.addStaff);
  const onRemoveStaff = useDoctorStore(state => state.removeStaff);
  const onUpdateStaff = useDoctorStore(state => state.updateStaff);

  const toggleSidebar = () => useSettingsStore.getState().setSidebarOpen(true);

  const isDark = useThemeStore(state => state.isDarkMode);
  const toggleTheme = useThemeStore(state => state.toggleTheme);

  const staffStructure = getCategorizedStaff();
  const tabs = type === 'DOCTOR' ? DOCTOR_CATEGORIES : MEDICAL_STAFF_CATEGORIES;
  
  // Single requested color for all boxes
  const THEME_COLOR = '#a78bfa';

  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  
  const [flippedStaffId, setFlippedStaffId] = useState<string | null>(null);

  const filteredStaff = staffList.filter(s => {
      const matchesType = type === 'DOCTOR' ? s.role === UserRole.DOCTOR : (s.role === UserRole.NURSE || s.role === UserRole.STAFF);
      const categoryRoles = staffStructure[activeTab]?.roles || [];
      const matchesTab = categoryRoles.includes(s.staffCategory || '');
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (s.department || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesTab && matchesSearch;
  });

  const handleCardClick = (id: string) => {
      setFlippedStaffId(flippedStaffId === id ? null : id);
  };

  return (
    <div className="animate-fade-in font-sans text-neutral-textPrimary min-h-screen flex flex-col dark:bg-[#212121]">
        
        <div className="w-full bg-white/80 dark:bg-[#111]/80 backdrop-blur-2xl border-b border-neutral-borderDefault dark:border-white/5 px-6 py-4 md:px-10 flex items-center justify-between sticky top-0 z-40 transition-all shadow-sm">
            <div className="flex items-center gap-4">
                 <MenuToggle isOpen={false} toggle={toggleSidebar} />
                 <div className="flex flex-col ml-2">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-brand-purple dark:text-[#E9E7F8]">
                        {type === 'DOCTOR' ? 'Doctor Directory' : 'Medical Staff Hub'}
                    </h1>
                    <p className="text-[10px] md:text-xs text-neutral-textSecondary dark:text-slate-500 font-bold uppercase tracking-[0.2em] opacity-80">
                        Workforce Management
                    </p>
                 </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <ThemeToggle isDark={isDark} toggle={toggleTheme} />
                <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden sm:block"></div>
                <NeuButton 
                    label={`Add ${type === 'DOCTOR' ? 'Doctor' : 'Staff'}`}
                    icon={<Plus size={18} strokeWidth={3} />}
                    onClick={() => setIsAddModalOpen(true)}
                    className="staff-add-purple"
                    isActive={true}
                />
            </div>
        </div>

        <div className="max-w-[1600px] mx-auto w-full px-6 py-10 pb-24">
            
            {/* Unified Navigation Tabs Section (Dock style for both) */}
            <div className="mb-14 pt-4 flex justify-center">
                <div className="container-items shadow-xl ring-1 ring-black/5 dark:ring-white/5">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`item-color ${activeTab === tab ? 'active' : ''}`}
                            style={{ '--color': THEME_COLOR } as React.CSSProperties}
                            onClick={() => setActiveTab(tab)}
                        >
                            <span className="item-color-text !text-slate-900 drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.3)]">
                                {tab}
                            </span>
                            {activeTab === tab && (
                                <div className="absolute -bottom-1 left-0 w-full h-[2.5px] bg-black dark:bg-white rounded-full shadow-sm animate-fade-in transition-all duration-300"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Unified Content Block: Search + Grid */}
            <div className="bg-white/30 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[48px] shadow-sm overflow-hidden flex flex-col transition-all">
                
                {/* Header of the block: Search Bar */}
                <div className="p-8 md:p-10 border-b border-slate-200 dark:border-white/10 bg-white/20 dark:bg-black/10">
                    <div className="max-w-2xl mx-auto">
                        <AnimatedInput 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Quick find staff by name or specialty..."
                            containerClassName="shadow-none"
                            className="!bg-white/80 dark:!bg-white/10"
                        />
                    </div>
                </div>

                {/* Body of the block: Grid */}
                <div className="p-6 md:p-12">
                    {filteredStaff.length === 0 ? (
                        <div className="text-center py-28 animate-fade-in">
                            <Search className="text-neutral-textMuted mx-auto mb-6 opacity-40" size={48} />
                            <p className="text-neutral-textPrimary dark:text-white font-bold text-2xl">No records found</p>
                            <button onClick={() => {setSearchTerm(''); setActiveTab(tabs[0]);}} className="mt-8 text-brand-purple font-bold hover:underline">Clear all filters</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-y-12 gap-x-6 place-items-center">
                            {filteredStaff.map((staff) => (
                                <div key={staff.id} className="flip-container" onClick={() => handleCardClick(staff.id)}>
                                    <div className={`flip-card ${flippedStaffId === staff.id ? 'is-flipped' : ''}`}>
                                        
                                        <div className="flip-front">
                                            <div className="flip-card-top">
                                                <p className="flip-card-top-para">Profile</p>
                                            </div>
                                            
                                            <div className="flip-avatar-wrapper">
                                                <img src={staff.avatar} alt={staff.name} className="flip-avatar-img" />
                                                <div className={`flip-status-dot ${staff.isOnline ? 'online' : ''}`}></div>
                                            </div>

                                            <div className="flip-content-front">
                                                <p className="flip-heading">{staff.name}</p>
                                                <p className="flip-subheading">{staff.staffCategory || staff.specialization}</p>
                                                <p className="flip-follow">Click for info...</p>
                                            </div>
                                        </div>

                                        <div className="flip-back">
                                            <p className="flip-heading-back">DETAILED INFO</p>
                                            
                                            <div className="flip-info-stack">
                                                <div className="flip-info-item">
                                                    <span className="label">ID:</span>
                                                    <span className="value truncate max-w-[100px]">{staff.id}</span>
                                                </div>
                                                <div className="flip-info-item">
                                                    <span className="label">DEPT:</span>
                                                    <span className="value truncate max-w-[100px]">{staff.department || 'General'}</span>
                                                </div>
                                                <div className="flip-info-item">
                                                    <span className="label">SHIFT:</span>
                                                    <span className="value">{staff.timings || '09:00 - 05:00'}</span>
                                                </div>
                                                <div className="flip-info-item">
                                                    <span className="label">PHONE:</span>
                                                    <span className="value truncate max-w-[100px] font-mono">{staff.phone || 'N/A'}</span>
                                                </div>
                                                <div className="flip-info-item border-none">
                                                    <span className="label">EMAIL:</span>
                                                    <span className="value truncate max-w-[100px] font-mono">{staff.email || 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div className="flip-icons">
                                                <button className="flip-icon-btn" onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${staff.email}`; }} title="Email"><Mail size={14}/></button>
                                                <button className="flip-icon-btn" onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${staff.phone}`; }} title="Call"><Phone size={14}/></button>
                                                <button className="flip-icon-btn delete" onClick={(e) => { e.stopPropagation(); onRemoveStaff(staff.id); }} title="Delete Profile"><Trash2 size={14}/></button>
                                            </div>

                                            <button 
                                                className="flip-manage-btn" 
                                                onClick={(e) => { e.stopPropagation(); setSelectedStaff(staff); }}
                                            >
                                                MANAGE PROFILE
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <AddStaffModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
            onAdd={onAddStaff} 
            categoryType={type}
        />

        <StaffDetailModal 
            staff={selectedStaff} 
            isOpen={!!selectedStaff} 
            onClose={() => setSelectedStaff(null)} 
            onUpdate={onUpdateStaff} 
        />

        <style>{`
            .staff-add-purple.active {
                --inner-gradient: linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%) !important;
                --text-gradient: linear-gradient(135deg, #2e1065 0%, #4c1d95 100%) !important;
            }

            /* --- Card Styles (Unchanged) --- */
            .flip-container {
                height: 330px;
                width: 230px;
                color: white;
                perspective: 1000px;
                font-family: inherit;
            }

            .flip-card {
                width: 100%;
                height: 100%;
                background: #000;
                border-radius: 1.5rem;
                position: relative;
                transition: transform 1500ms cubic-bezier(0.4, 0, 0.2, 1);
                transform-style: preserve-3d;
                cursor: pointer;
            }

            .flip-card.is-flipped {
                transform: rotateX(180deg) rotateZ(-180deg);
            }

            .flip-card-top {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 9%;
                position: absolute;
                width: 50%;
                background-color: transparent;
                border: 2px solid #000;
                top: 0;
                border-top: none;
                border-radius: 0 0 1rem 1rem;
                box-shadow: 0px 0px 8px 3px rgba(255, 255, 255, 0.3);
                z-index: 10;
            }

            .flip-card-top-para {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #fff;
            }

            .flip-front,
            .flip-back {
                height: 100%;
                width: 100%;
                border-radius: 1.5rem;
                box-shadow: 0px 0px 12px 1px rgba(255, 255, 255, 0.4);
                position: absolute;
                backface-visibility: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 16px;
                overflow: hidden;
            }

            .flip-front {
                background: #000;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .flip-back {
                background-color: #000;
                border: 1px solid rgba(255,255,255,0.1);
                transform: rotateX(180deg) rotateZ(-180deg);
                gap: 6px;
            }

            .flip-avatar-wrapper {
                position: relative;
                width: 90px;
                height: 90px;
                margin-top: 5px;
            }

            .flip-avatar-img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #fff;
                box-shadow: 0 0 15px rgba(255,255,255,0.2);
            }

            .flip-status-dot {
                position: absolute;
                bottom: 4px;
                right: 4px;
                width: 12px;
                height: 12px;
                background: #6b7280;
                border: 2px solid #000;
                border-radius: 50%;
            }

            .flip-status-dot.online {
                background: #10b981;
                box-shadow: 0 0 8px #10b981;
            }

            .flip-content-front {
                text-align: center;
                margin-top: 15px;
            }

            .flip-heading {
                font-size: 16px;
                font-weight: 800;
                margin-bottom: 2px;
                color: #fff;
                line-height: 1.2;
            }

            .flip-subheading {
                font-size: 9px;
                font-weight: 700;
                color: #8b5cf6;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            }

            .flip-follow {
                font-size: 10px;
                font-weight: 500;
                color: rgba(255,255,255,0.4);
                font-style: italic;
            }

            .flip-heading-back {
                font-size: 16px;
                font-weight: 800;
                color: #8b5cf6;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 6px;
            }

            .flip-info-stack {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 0;
            }

            .flip-info-item {
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                padding: 6px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .flip-info-item .label {
                color: rgba(255,255,255,0.4);
                font-weight: 800;
                text-transform: uppercase;
            }

            .flip-info-item .value {
                font-weight: 700;
                color: #fff;
                text-align: right;
                font-family: inherit;
            }

            .flip-icons {
                display: flex;
                flex-direction: row;
                gap: 10px;
                margin-top: 8px;
            }

            .flip-icon-btn {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: transparent;
                border: 1px solid rgba(255,255,255,0.2);
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }

            .flip-icon-btn:hover {
                background: rgba(255,255,255,0.1);
                border-color: #fff;
                transform: translateY(-2px);
            }

            .flip-icon-btn.delete:hover {
                background: #ef4444;
                border-color: #ef4444;
            }

            .flip-manage-btn {
                margin-top: 8px;
                width: 100%;
                padding: 8px;
                background: #fff;
                color: #000;
                border: none;
                border-radius: 100px;
                font-weight: 900;
                font-size: 11px;
                transition: all 0.3s;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                box-shadow: 0 4px 10px rgba(255,255,255,0.1);
            }

            .flip-manage-btn:hover {
                background: #8b5cf6;
                color: #fff;
                transform: scale(1.03);
                box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
            }
        `}</style>
    </div>
  );
};

export default StaffManagement;
