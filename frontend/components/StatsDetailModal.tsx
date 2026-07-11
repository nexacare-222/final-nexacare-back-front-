import React, { useState, useRef, useEffect } from 'react';
import { User, Patient, UserRole } from '../types';
import { X, MapPin, ChevronRight, Stethoscope, Activity, BedDouble, User as UserIcon, Search, Filter, ChevronDown, Calendar, RotateCcw } from 'lucide-react';
import AnimatedInput from './AnimatedInput';
import TranslucentDatePicker from './TranslucentDatePicker';

type StatViewType = 'PATIENTS' | 'DOCTORS' | 'STAFF' | 'BEDS';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: StatViewType | null;
  patients: Patient[];
  staff: User[];
  onNavigate: (path: string) => void;
}

const WARD_CAPACITIES: Record<string, number> = {
  'ICU': 15,
  'General Ward A': 30,
  'General Ward B': 30,
  'Emergency Ward': 20,
  'Pediatrics': 15,
  'Cardiology': 10
};

const StatsDetailModal: React.FC<Props> = ({ isOpen, onClose, type, patients, staff, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    sortOrder: 'newest' as 'newest' | 'oldest',
    ward: '',
    startDate: '',
    endDate: ''
  });
  
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  if (!isOpen || !type) return null;

  const getTitle = () => {
    switch (type) {
      case 'PATIENTS': return 'All Admitted Patients';
      case 'DOCTORS': return 'Doctor Availability';
      case 'STAFF': return 'Medical Staff Roster';
      case 'BEDS': return 'Bed Occupancy Map';
      default: return '';
    }
  };

  const getHeaderIcon = () => {
    switch (type) {
        case 'PATIENTS': return <UserIcon size={24} />;
        case 'DOCTORS': return <Stethoscope size={24} />;
        case 'STAFF': return <Activity size={24} />;
        case 'BEDS': return <BedDouble size={24} />;
    }
  };

  const getThemeColors = () => {
      switch (type) {
          case 'PATIENTS': return { bg: 'bg-[#E0F2F1]', text: 'text-[#00695C]', border: 'border-[#B2DFDB]', iconBg: 'bg-[#B2DFDB]' };
          case 'DOCTORS': return { bg: 'bg-[#C4ED9C]', text: 'text-[#072100]', border: 'border-[#A6D37E]', iconBg: 'bg-[#A6D37E]' };
          case 'STAFF': return { bg: 'bg-[#FFDAD6]', text: 'text-[#410002]', border: 'border-[#FFB4AB]', iconBg: 'bg-[#FFB4AB]' };
          case 'BEDS': return { bg: 'bg-[#FFDDB3]', text: 'text-[#291800]', border: 'border-[#FFB951]', iconBg: 'bg-[#FFB951]' };
          default: return { bg: 'bg-[#C6D5DE]', text: 'text-[#191C1B]', border: 'border-[#C2C8BC]', iconBg: 'bg-[#C2C8BC]' };
      }
  };

  const theme = getThemeColors();
  
  const uniqueWards = Array.from(new Set(patients.map(p => p.currentLocation.split(' – ')[0].split(' (')[0]))).sort();

  const resetFilters = () => {
    setFilters({ sortOrder: 'newest', ward: '', startDate: '', endDate: '' });
    setSearchTerm('');
  };

  const activeFiltersCount = (filters.ward ? 1 : 0) + (filters.startDate ? 1 : 0) + (filters.endDate ? 1 : 0) + (filters.sortOrder !== 'newest' ? 1 : 0);

  const renderPatients = () => {
    let filtered = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesWard = filters.ward ? p.currentLocation.includes(filters.ward) : true;
        
        let matchesDate = true;
        if (filters.startDate) {
            const start = new Date(filters.startDate).getTime();
            matchesDate = matchesDate && p.admissionTimestamp >= start;
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate).getTime() + (24 * 60 * 60 * 1000);
            matchesDate = matchesDate && p.admissionTimestamp <= end;
        }
        
        return matchesSearch && matchesWard && matchesDate;
    });

    filtered.sort((a, b) => {
        return filters.sortOrder === 'newest' 
            ? b.admissionTimestamp - a.admissionTimestamp 
            : a.admissionTimestamp - b.admissionTimestamp;
    });

    return (
      <div className="space-y-2 hover-container">
        {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-500 bg-white/30 rounded-[32px] border border-dashed border-slate-300">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg">No patients match your filters</p>
                <button onClick={resetFilters} className="mt-4 text-[#00695C] font-bold underline">Clear all filters</button>
            </div>
        ) : filtered.map((p, idx) => (
          <div 
            key={p.id} 
            className="group flex items-center justify-between p-2.5 px-4 bg-[#FCFDF6] border border-[#DEE5D9] rounded-[20px] hover:border-[#00695C] hover:shadow-sm transition-all duration-300 hover-card"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-heading font-bold text-base border border-[#B2DFDB] group-hover:bg-[#C4ED9C] group-hover:text-[#072100] transition-colors">
                  {p.name.charAt(0)}
               </div>
               <div>
                  <h4 className="font-bold text-[#191C1B] text-sm group-hover:text-[#00695C] transition-colors leading-tight">{p.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-[#44474F] font-mono bg-[#EFF1E6] px-1 py-0.5 rounded border border-[#DEE5D9]">{p.id}</span>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-[#747871]">
                          <MapPin size={10} className="text-[#00695C]" /> {p.currentLocation}
                      </span>
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="hidden sm:flex flex-col items-end">
                   <p className="text-[8px] font-bold text-[#747871] uppercase tracking-wider mb-0.5">Severity</p>
                   <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border ${
                        p.severity === 'Critical' ? 'bg-[#FFDAD6] text-[#410002] border-[#FFB4AB]' : 
                        p.severity === 'Monitor' ? 'bg-[#FFDDB3] text-[#291800] border-[#FFB951]' : 
                        'bg-[#C4ED9C] text-[#072100] border-[#A6D37E]'
                   }`}>
                       {p.severity || 'Stable'}
                   </span>
               </div>
               <button 
                  onClick={() => onNavigate(`/patient/${p.id}`)}
                  className="px-4 py-1.5 bg-[#191C1B] text-[#C4ED9C] text-[10px] font-bold rounded-full hover:bg-[#2F312E] transition-all flex items-center gap-2 shadow-sm"
                >
                  View <ChevronRight size={12} />
                </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStaffList = (role: 'DOCTOR' | 'STAFF') => {
      let list = staff.filter(s => {
          const isRoleMatch = role === 'DOCTOR' ? s.role === UserRole.DOCTOR : (s.role === UserRole.NURSE || s.role === UserRole.STAFF);
          const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.department || '').toLowerCase().includes(searchTerm.toLowerCase());
          const matchesWard = filters.ward ? (s.department || '').includes(filters.ward) : true;
          return isRoleMatch && matchesSearch && matchesWard;
      });

      list.sort((a, b) => {
          if (filters.sortOrder === 'newest') {
              return (a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1);
          }
          return (a.isOnline === b.isOnline ? 0 : a.isOnline ? 1 : -1);
      });

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 hover-container">
            {list.length === 0 ? (
                 <div className="col-span-full text-center py-20 text-slate-500 bg-white/30 rounded-[32px] border border-dashed border-slate-300">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold text-lg">No staff matching these filters</p>
                    <button onClick={resetFilters} className="mt-4 text-[#00695C] font-bold underline">Clear all filters</button>
                </div>
            ) : list.map((s, idx) => (
                <div 
                    key={s.id} 
                    className={`flex items-center justify-between p-3 rounded-[20px] border transition-all duration-300 group hover:shadow-sm hover-card ${s.isOnline ? 'bg-[#FCFDF6] border-[#DEE5D9] hover:border-[#C4ED9C]' : 'bg-[#EFF1E6] border-[#DEE5D9] opacity-80'}`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-xl object-cover border border-[#DEE5D9] shadow-sm bg-white" />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${s.isOnline ? 'bg-[#4CE06D]' : 'bg-[#747871]'}`}></span>
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-[#191C1B] text-sm group-hover:text-[#00695C] transition-colors truncate leading-tight">{s.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold text-[#44474F] truncate">{role === 'DOCTOR' ? s.specialization : s.staffCategory}</span>
                                <span className="text-[8px] text-[#747871] font-medium flex items-center gap-0.5">
                                    <MapPin size={8} /> {s.department || 'General'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                         {s.isOnline ? (
                             <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#C4ED9C] text-[#072100] text-[8px] font-bold uppercase border border-[#A6D37E]">
                                 Active
                             </span>
                         ) : (
                             <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#E0E5D9] text-[#44474F] text-[8px] font-bold uppercase border border-[#C2C8BC]">
                                 Offline
                             </span>
                         )}
                         <p className="mt-1 text-[8px] font-mono text-[#747871]">{s.timings?.split(' - ')[0] || '09:00 AM'}</p>
                    </div>
                </div>
            ))}
        </div>
      );
  };

  const renderBeds = () => {
    const occupiedCounts: Record<string, number> = {};
    const occupiedBedNumbers: Record<string, number[]> = {};

    (patients || []).forEach(p => {
        let ward = Object.keys(WARD_CAPACITIES).find(w => p.currentLocation.startsWith(w)) || 'Other';
        occupiedCounts[ward] = (occupiedCounts[ward] || 0) + 1;

        const match = p.currentLocation.match(/Bed\s+(\d+)/i);
        if (match && ward !== 'Other') {
            if (!occupiedBedNumbers[ward]) occupiedBedNumbers[ward] = [];
            occupiedBedNumbers[ward].push(parseInt(match[1], 10));
        }
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 hover-container">
            {Object.entries(WARD_CAPACITIES).map(([wardName, capacity]) => {
                const occupied = occupiedCounts[wardName] || 0;
                const available = capacity - occupied;
                const occupiedSet = new Set(occupiedBedNumbers[wardName] || []);
                const allBeds = Array.from({length: capacity}, (_, i) => i + 1);
                const isCritical = available <= 2;

                return (
                    <div key={wardName} className="bg-[#FCFDF6] border border-[#DEE5D9] rounded-[24px] overflow-hidden shadow-sm flex flex-col hover:border-[#747871] transition-colors hover-card">
                        <div className="bg-[#EFF1E6] px-5 py-3 border-b border-[#DEE5D9] flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#FCFDF6] p-1.5 rounded-lg border border-[#DEE5D9] text-[#44474F]">
                                    <BedDouble size={16} />
                                </div>
                                <div>
                                    <span className="font-bold text-[#191C1B] text-base block leading-none">{wardName}</span>
                                    <span className="text-[9px] text-[#747871] font-bold uppercase tracking-wide">Capacity: {capacity}</span>
                                </div>
                            </div>
                            <div className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-2 ${
                                isCritical ? 'bg-[#FFDAD6] text-[#410002] border-[#FFB4AB]' : 'bg-[#C4ED9C] text-[#072100] border-[#A6D37E]'
                            }`}>
                                <span className="text-base font-heading leading-none">{available}</span>
                                <span className="uppercase opacity-80">Free</span>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex flex-wrap gap-1.5">
                                {allBeds.map(bedNum => {
                                    const isOccupied = occupiedSet.has(bedNum);
                                    return (
                                        <div 
                                            key={bedNum} 
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all duration-200 ${
                                                isOccupied 
                                                ? 'bg-[#E0E5D9] text-[#44474F] border-[#C2C8BC] cursor-not-allowed' 
                                                : 'bg-[#F1F8E9] text-[#33691E] border-[#DCEDC8] hover:bg-[#C4ED9C] hover:text-[#072100] hover:border-[#A6D37E] cursor-default'
                                            }`}
                                            title={`Bed ${bedNum}: ${isOccupied ? 'Occupied' : 'Available'}`}
                                        >
                                            {bedNum}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#C6D5DE] dark:bg-[#1a1a1a] flex flex-col animate-fade-in h-screen w-screen font-sans overflow-hidden">
        <style>{`
            .hover-card {
              transition: 400ms transform, 400ms box-shadow, 400ms background-color, 400ms filter, 400ms opacity;
            }
            .hover-card:hover {
              transform: scale(1.01);
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
              z-index: 10;
              position: relative;
            }
            .hover-container:hover > .hover-card:not(:hover) {
              filter: blur(1px);
              opacity: 0.9;
            }
        `}</style>
            
        <div className="bg-white dark:bg-slate-900 border-b border-[#DEE5D9] dark:border-white/10 px-6 py-4 flex items-center justify-between flex-shrink-0 z-20">
            <div className="flex items-center gap-4 w-1/3">
                <button onClick={onClose} className="hover:bg-[#DEE5D9] dark:hover:bg-white/10 p-2.5 rounded-full text-[#44474F] dark:text-slate-400 hover:text-[#191C1B] dark:hover:text-white transition-colors border border-transparent">
                    <X size={22} />
                </button>
                <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center border shadow-sm ${theme.bg} ${theme.text} ${theme.border}`}>
                        {getHeaderIcon()}
                    </div>
                    <div className="hidden sm:block">
                        <h3 className="font-heading font-bold text-xl text-[#191C1B] dark:text-white leading-tight tracking-tight">{getTitle()}</h3>
                        <p className="text-[10px] text-[#44474F] dark:text-slate-500 uppercase tracking-widest font-bold">Live Feed</p>
                    </div>
                </div>
            </div>

            {/* CENTERED CONTROLS */}
            {type !== 'BEDS' && (
                <div className="flex flex-1 justify-center items-center gap-3 relative z-30">
                    <div className="w-full max-w-lg relative flex items-center">
                        <AnimatedInput 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Quick search..."
                            className="!h-11 shadow-lg bg-white/80 dark:bg-white/10 !text-left pl-10"
                            style={{ textAlign: 'left', paddingLeft: '2.5rem' }}
                        />
                        <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 h-11 px-5 rounded-[22px] font-bold text-xs transition-all shadow-md active:scale-95 ${isFilterOpen || activeFiltersCount > 0 ? 'bg-[#191C1B] text-[#C4ED9C]' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter size={16} />
                            <span className="hidden sm:inline">Filter & Sort</span>
                            {activeFiltersCount > 0 && (
                                <span className="bg-[#C4ED9C] text-[#072100] w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">{activeFiltersCount}</span>
                            )}
                        </button>

                        {isFilterOpen && (
                            <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-white/10 p-6 z-50 animate-fade-in origin-top-right text-slate-800 dark:text-white">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-black text-sm uppercase tracking-widest">Filter & Sort</h4>
                                    {activeFiltersCount > 0 && (
                                        <button onClick={resetFilters} className="text-[10px] font-bold text-rose-600 flex items-center gap-1 hover:underline">
                                            <RotateCcw size={12} /> Reset
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    {/* Sort Order */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Sort Order</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button 
                                                onClick={() => setFilters({...filters, sortOrder: 'newest'})}
                                                className={`py-2 px-3 rounded-xl text-[10px] font-black border transition-all ${filters.sortOrder === 'newest' ? 'bg-[#C4ED9C] text-[#072100] border-[#C4ED9C]' : 'bg-slate-50 dark:bg-white/5 text-slate-500 border-transparent'}`}
                                            >
                                                Newest
                                            </button>
                                            <button 
                                                onClick={() => setFilters({...filters, sortOrder: 'oldest'})}
                                                className={`py-2 px-3 rounded-xl text-[10px] font-black border transition-all ${filters.sortOrder === 'oldest' ? 'bg-[#C4ED9C] text-[#072100] border-[#C4ED9C]' : 'bg-slate-50 dark:bg-white/5 text-slate-500 border-transparent'}`}
                                            >
                                                Oldest
                                            </button>
                                        </div>
                                    </div>

                                    {/* Ward Filter */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Department Ward</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-[11px] font-bold outline-none appearance-none cursor-pointer"
                                                value={filters.ward}
                                                onChange={(e) => setFilters({...filters, ward: e.target.value})}
                                            >
                                                <option value="">All Locations</option>
                                                {uniqueWards.map(w => <option key={w} value={w} className="text-black">{w}</option>)}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Date Range (Patients Only) */}
                                    {type === 'PATIENTS' && (
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Admission Date Range</label>
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <TranslucentDatePicker 
                                                        value={filters.startDate}
                                                        onChange={(val) => setFilters({...filters, startDate: val})}
                                                        placeholder="From Date"
                                                        className="!h-10 text-[11px] !bg-slate-50 dark:!bg-white/5"
                                                    />
                                                    <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                                <div className="relative">
                                                    <TranslucentDatePicker 
                                                        value={filters.endDate}
                                                        onChange={(val) => setFilters({...filters, endDate: val})}
                                                        placeholder="To Date"
                                                        className="!h-10 text-[11px] !bg-slate-50 dark:!bg-white/5"
                                                    />
                                                    <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="w-1/3 hidden sm:flex justify-end pr-4">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] mr-2"></div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Secure Gateway</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#C6D5DE] dark:bg-[#1a1a1a] p-6 md:p-8">
            <div className="max-w-6xl mx-auto pb-24">
                {type === 'PATIENTS' && renderPatients()}
                {type === 'DOCTORS' && renderStaffList('DOCTOR')}
                {type === 'STAFF' && renderStaffList('STAFF')}
                {type === 'BEDS' && renderBeds()}
            </div>
        </div>
    </div>
  );
};

export default StatsDetailModal;