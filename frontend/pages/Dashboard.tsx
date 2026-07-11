import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Patient, UserRole, LabReport } from '../types';
import { Plus, ArrowRightLeft, Filter, Search, Users, Activity, BedDouble, HeartPulse, UserPlus } from 'lucide-react';
import MovePatientModal from '../components/MovePatientModal';
import RegisterPatientModal from '../components/RegisterPatientModal';
import EditPatientModal from '../components/EditPatientModal';
import QRCodeDisplay from '../components/QRCodeDisplay';
import AssignStaffModal from '../components/AssignStaffModal';
import StatsDetailModal from '../components/StatsDetailModal';
import ModernSearchBar from '../components/ModernSearchBar';
import NeuButton from '../components/NeuButton';
import StatWidget from '../components/dashboard/StatWidget';
import PatientListCard from '../components/dashboard/PatientListCard';

// Zustand Stores
import { useAuthStore } from '../store/useAuthStore';
import { usePatientStore } from '../store/usePatientStore';
import { useDoctorStore } from '../store/useDoctorStore';
import { useSettingsStore } from '../store/useSettingsStore';

interface Props {
  user?: User;
  patients?: Patient[];
  staff?: User[];
  onMovePatient?: (id: string, to: string, reason: string, time?: string, staffId?: string) => void;
  onRegisterPatient?: (p: Partial<Patient>) => void;
  onUpdatePatient?: (p: Patient) => void;
  onAssignStaff?: (patientId: string, staffId: string, role: UserRole, time: string) => void;
  onAddReport?: (report: LabReport) => void;
  autoOpenRegister?: boolean;
  onNavigate?: (path: string) => void;
}

const Dashboard: React.FC<Props> = ({ autoOpenRegister = false }) => {
  // Use Zustand hooks to completely eliminate prop drilling
  const user = useAuthStore(state => state.user);
  
  const patients = usePatientStore(state => state.patients);
  const onMovePatient = usePatientStore(state => state.addMovement);
  const onRegisterPatient = usePatientStore(state => state.registerPatient);
  const onUpdatePatient = usePatientStore(state => state.updatePatient);
  const onAssignStaff = usePatientStore(state => state.assignStaff);
  const onAddReport = usePatientStore(state => state.addReport);

  const staff = useDoctorStore(state => state.staff);

  const onNavigate = useSettingsStore(state => state.navigate);

  const [isMoveModalOpen, setMoveModalOpen] = useState(false);
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [activeStatModal, setActiveStatModal] = useState<'PATIENTS' | 'DOCTORS' | 'STAFF' | 'BEDS' | null>(null);

  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [qrPatient, setQrPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    sortOrder: 'newest' // 'newest' | 'oldest'
  });
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
            setIsFilterOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      if (autoOpenRegister && user?.role === UserRole.ADMIN) {
          setRegisterModalOpen(true);
      }
  }, [autoOpenRegister, user?.role]);

  if (!user) return null;

  if (user.role === UserRole.PATIENT_PARTY) {
    if (user.linkedPatientId) {
        return <div className="p-8 text-center text-[#747871] text-base">Redirecting to patient profile...</div>;
    }
    return (
        <div className="p-8 text-center animate-fade-in">
            <h2 className="text-2xl font-heading font-bold text-[#191C1B]">Account Not Linked</h2>
            <p className="text-[#44474F] mt-2 text-base">Your account is not currently linked to any active patient record.</p>
        </div>
    );
  }

  const isAdmin = user.role === UserRole.ADMIN;
  // Dynamic text colors for dark mode visibility
  const textColor = 'text-[#191C1B] dark:text-white';
  const subtitleColor = 'text-[#44474F] dark:text-slate-400';

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesLocation = filters.location ? p.currentLocation === filters.location : true;

        return matchesSearch && matchesLocation;
    }).sort((a, b) => {
        if (filters.sortOrder === 'oldest') {
            return a.admissionTimestamp - b.admissionTimestamp;
        }
        return b.admissionTimestamp - a.admissionTimestamp;
    });
  }, [patients, searchTerm, filters]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(patients.map(p => p.currentLocation))).sort();
  }, [patients]);

  const getDashboardHeader = () => {
    switch (user.role) {
        case UserRole.ADMIN: return { title: "Admin Console", subtitle: "Overview & Actions" };
        case UserRole.DOCTOR: return { title: "Doctor Dashboard", subtitle: "My Patients" };
        case UserRole.NURSE: return { title: "Nurse Station", subtitle: "Ward Overview" };
        default: return { title: "Dashboard", subtitle: "Patient Status" };
    }
  };

  const { title, subtitle } = getDashboardHeader();
  const activeFilterCount = (filters.location ? 1 : 0) + (filters.sortOrder !== 'newest' ? 1 : 0);

  // Statistics
  const totalPatients = patients.length;
  const allDoctors = staff.filter(s => s.role === UserRole.DOCTOR);
  const totalDoctors = allDoctors.length;
  const activeDoctors = allDoctors.filter(s => s.isOnline).length;
  const allNurses = staff.filter(s => s.role === UserRole.NURSE || s.role === UserRole.STAFF);
  const totalNurses = allNurses.length;
  const activeNurses = allNurses.filter(s => s.isOnline).length;
  const totalCapacity = 120;
  const bedsLeft = totalCapacity - totalPatients;

  return (
    <div className={`max-w-7xl mx-auto pb-20 md:pb-0 font-sans ${textColor}`}>
      <style>{`
        .hover-card {
          transition: 400ms transform, 400ms box-shadow, 400ms background-color, 400ms filter, 400ms opacity;
        }
        
        .hover-card:hover {
          transform: scale(1.04);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
          z-index: 10;
          position: relative;
        }

        .hover-container:hover > .hover-card:not(:hover) {
          filter: blur(2.5px);
          transform: scale(0.96);
          opacity: 0.85;
        }
      `}</style>

      <div className="animate-fade-in px-4 md:px-0 pt-6 md:pt-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
            <div>
                <h1 className={`text-2xl md:text-4xl font-heading font-bold ${textColor}`}>{title}</h1>
                <p className={`${subtitleColor} font-medium mt-1 text-sm md:text-lg`}>{subtitle}</p>
            </div>
            
            {isAdmin && (
                <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                    <NeuButton label="Assign" icon={<UserPlus size={18} />} onClick={() => setAssignModalOpen(true)} className="flex-shrink-0" />
                    <NeuButton label="Transfer" icon={<ArrowRightLeft size={18} />} onClick={() => setMoveModalOpen(true)} className="flex-shrink-0" />
                    <NeuButton label="Admit" icon={<Plus size={18} />} onClick={() => setRegisterModalOpen(true)} className="flex-shrink-0" />
                </div>
            )}
          </div>

          {/* Statistics Row - WITH ANIMATION */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 hover-container">
              <StatWidget 
                label="Total Patients" 
                value={totalPatients} 
                icon={<Users size={24} />} 
                theme={{ bg: 'dark:bg-slate-800/40 bg-white', border: 'border-slate-200 dark:border-slate-700', iconBg: 'bg-cyan-50 dark:bg-cyan-900/30', iconColor: 'text-cyan-700 dark:text-cyan-400', hoverBorder: 'border-cyan-200' }} 
                onClick={() => setActiveStatModal('PATIENTS')}
                className="hover-card"
              />
              <StatWidget 
                label="Doctors Active" 
                value={activeDoctors} 
                subValue={<span className="text-xs md:text-sm text-slate-400 font-medium align-middle opacity-80">/ {totalDoctors}</span>}
                icon={<Activity size={24} />} 
                theme={{ bg: 'dark:bg-slate-800/40 bg-white', border: 'border-slate-200 dark:border-slate-700', iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-700 dark:text-emerald-400', hoverBorder: 'border-emerald-200' }} 
                onClick={() => setActiveStatModal('DOCTORS')}
                className="hover-card"
              />
              <StatWidget 
                label="Nurses Active" 
                value={activeNurses} 
                subValue={<span className="text-xs md:text-sm text-slate-400 font-medium align-middle opacity-80">/ {totalNurses}</span>}
                icon={<HeartPulse size={24} />} 
                theme={{ bg: 'dark:bg-slate-800/40 bg-white', border: 'border-slate-200 dark:border-slate-700', iconBg: 'bg-rose-50 dark:bg-rose-900/30', iconColor: 'text-rose-700 dark:text-rose-400', hoverBorder: 'border-rose-200' }} 
                onClick={() => setActiveStatModal('STAFF')}
                className="hover-card"
              />
              <StatWidget 
                label="Beds Left" 
                value={bedsLeft} 
                subValue={<span className="text-xs md:text-sm text-slate-400 font-medium align-middle opacity-80">/ {totalCapacity}</span>}
                icon={<BedDouble size={24} />} 
                theme={{ bg: 'dark:bg-slate-800/40 bg-white', border: 'border-slate-200 dark:border-slate-700', iconBg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', hoverBorder: 'border-amber-200' }} 
                onClick={() => setActiveStatModal('BEDS')}
                className="hover-card"
              />
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-[24px] border border-slate-200 dark:border-slate-700 mb-6 md:mb-8 flex flex-col sm:flex-row gap-4 shadow-sm z-20 relative items-center">
             <div className="flex-1 w-full">
                <ModernSearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search patient name or ID..." />
             </div>
             
             <div className="relative w-full sm:w-auto h-full" ref={filterRef}>
                 <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`w-full sm:w-auto px-6 py-4 h-[60px] rounded-[50px] font-bold text-base flex items-center gap-2 justify-center transition-all ${isFilterOpen || activeFilterCount > 0 ? 'bg-[#C4ED9C] text-[#072100] shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
                 >
                    <Filter size={20} />
                    <span>Filters</span>
                    {activeFilterCount > 0 && <span className="bg-[#072100] text-[#C4ED9C] text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full">{activeFilterCount}</span>}
                 </button>

                 {isFilterOpen && (
                     <div className="absolute right-0 top-full mt-2 w-full sm:w-80 bg-white dark:bg-slate-800 rounded-[24px] shadow-xl border border-slate-200 dark:border-slate-700 p-5 z-30 animate-fade-in origin-top-right text-[#191C1B] dark:text-white">
                          <div className="flex justify-between items-center mb-5">
                              <h3 className="font-bold text-base">Filter & Sort</h3>
                              {activeFilterCount > 0 && (
                                 <button onClick={() => setFilters({ location: '', sortOrder: 'newest' })} className="text-xs font-bold text-[#BA1A1A] hover:bg-[#FFDAD6] px-3 py-1.5 rounded-full transition-colors">Reset</button>
                              )}
                          </div>
                          <div className="space-y-4">
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Sort Order</label>
                                  <select className="w-full pl-4 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold text-[#191C1B] dark:text-white" value={filters.sortOrder} onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}>
                                      <option value="newest">Most Recent (Newest)</option>
                                      <option value="oldest">Most Former (Oldest)</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Department</label>
                                  <select className="w-full pl-4 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold text-[#191C1B] dark:text-white" value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})}>
                                      <option value="">All Locations</option>
                                      {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                  </select>
                              </div>
                          </div>
                     </div>
                 )}
             </div>
          </div>

          {/* List View - WITH ANIMATION */}
          <div className="flex flex-col gap-3 hover-container">
            {filteredPatients.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-slate-800/40 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Search size={32} className="text-slate-400" /></div>
                    <h3 className="text-lg font-bold text-[#191C1B] dark:text-white">No patients found</h3>
                    {(activeFilterCount > 0 || searchTerm) && (
                        <button onClick={() => { setSearchTerm(''); setFilters({location: '', sortOrder: 'newest'}); }} className="mt-4 text-[#006D42] dark:text-emerald-400 font-bold text-sm bg-[#E0F2F1] dark:bg-emerald-900/30 px-4 py-2 rounded-full hover:bg-[#B2DFDB] dark:hover:bg-emerald-900/50 transition-colors">Clear filters</button>
                    )}
                </div>
            ) : (
                filteredPatients.map((patient, idx) => (
                    <PatientListCard 
                        key={patient.id}
                        patient={patient}
                        doctorName={staff.find(s => s.id === patient.assignedDoctorId)?.name}
                        isAdmin={isAdmin}
                        onEdit={(p) => setEditPatient(p)}
                        onQr={(p) => setQrPatient(p)}
                        onNavigate={onNavigate}
                        style={{ animationDelay: `${idx * 50}ms` }}
                        className="hover-card"
                    />
                ))
            )}
          </div>
      </div>

      {/* Modals */}
      <MovePatientModal isOpen={isMoveModalOpen} onClose={() => setMoveModalOpen(false)} patients={patients} staff={staff} onMove={onMovePatient} />
      <RegisterPatientModal isOpen={isRegisterModalOpen} onClose={() => setRegisterModalOpen(false)} onRegister={onRegisterPatient} />
      {editPatient && <EditPatientModal isOpen={!!editPatient} onClose={() => setEditPatient(null)} patient={editPatient} staff={staff} onUpdate={onUpdatePatient} onAddReport={onAddReport} />}
      {qrPatient && <QRCodeDisplay patient={qrPatient} onClose={() => setQrPatient(null)} />}
      <AssignStaffModal isOpen={isAssignModalOpen} onClose={() => setAssignModalOpen(false)} patients={patients} staff={staff} onAssign={onAssignStaff} />
      <StatsDetailModal isOpen={!!activeStatModal} onClose={() => setActiveStatModal(null)} type={activeStatModal} patients={patients} staff={staff} onNavigate={onNavigate} />
    </div>
  );
};

export default Dashboard;
