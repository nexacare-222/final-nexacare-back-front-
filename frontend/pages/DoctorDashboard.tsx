import React, { useState, useMemo } from 'react';
import { UserRole, DischargeDetails, User, Patient, CareEvent, ChatMessage, LabReport, CareEventCreationData } from '../types';
import { Zap, AlertCircle, X, Plus } from 'lucide-react';
import { generatePatientSummary } from '../services/geminiService';
import CreateCareEventModal from '../components/CreateCareEventModal';
import ViewEventsModal from '../components/ViewEventsModal';
import MedicalReportsModal from '../components/MedicalReportsModal';
import DoctorTransferModal from '../components/DoctorTransferModal';
import UserProfileModal from '../components/UserProfileModal';
import DischargePatientModal from '../components/DischargePatientModal';

// Modular Imports
import DoctorSidebar from '../components/doctor/DoctorSidebar';
import DoctorHeader from '../components/doctor/DoctorHeader';
import QuickActions from '../components/doctor/QuickActions';
import PatientGrid from '../components/doctor/PatientGrid';
import DoctorMessages from '../components/doctor/DoctorMessages';
import DoctorAnalytics from '../components/doctor/DoctorAnalytics';
import DoctorPatientDetail from '../components/doctor/DoctorPatientDetail';
import StatsDetailModal from '../components/StatsDetailModal';
import DoctorHandoverForm from '../components/doctor/DoctorHandoverForm';

// Zustand Stores
import { useAuthStore } from '../store/useAuthStore';
import { usePatientStore } from '../store/usePatientStore';
import { useDoctorStore } from '../store/useDoctorStore';
import { useMessageStore } from '../store/useMessageStore';
import { useThemeStore } from '../store/useThemeStore';

interface Props {
  // Keeping Props optional for backwards-compatibility or direct render usage
  user?: User;
  patients?: Patient[];
  staff?: User[];
  events?: CareEvent[];
  messages?: Record<string, ChatMessage[]>;
  reports?: LabReport[];
  onLogout?: () => void;
  onSendMessage?: (pid: string, txt: string, isAttach?: boolean, channel?: 'FAMILY' | 'TEAM') => void;
  onCreateEvent?: (eventData: CareEventCreationData) => void;
  onUpdateUser?: (user: User) => void;
  onMovePatient?: (id: string, to: string, reason: string, time?: string, staffId?: string) => void;
  onShiftHandover?: (targetStaffId: string, patientIds: string[], notes: string) => void;
  isDark?: boolean;
  toggleTheme?: () => void;
}

const DoctorDashboard: React.FC<Props> = () => {
  // Select state directly from Zustand stores to eliminate prop drilling
  const user = useAuthStore(state => state.user);
  const onLogout = useAuthStore(state => state.logout);
  const onUpdateUser = useAuthStore(state => state.updateUser);

  const patients = usePatientStore(state => state.patients);
  const events = usePatientStore(state => state.careEvents);
  const reports = usePatientStore(state => state.reports);
  const onCreateEvent = usePatientStore(state => state.createCareEvent);
  const onMovePatient = usePatientStore(state => state.addMovement);
  const onShiftHandover = usePatientStore(state => state.shiftHandover);

  const staff = useDoctorStore(state => state.staff);

  const messages = useMessageStore(state => state.messages);
  const onSendMessage = useMessageStore(state => state.sendMessage);

  const isDark = useThemeStore(state => state.isDarkMode);
  const toggleTheme = useThemeStore(state => state.toggleTheme);

  // Navigation & View State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('TIMELINE');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [onDuty, setOnDuty] = useState(true);
  
  // Search & Filter State
  const [headerSearch, setHeaderSearch] = useState('');
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [listFilter, setListFilter] = useState<'ASSIGNED' | 'ALL'>('ALL');
  
  // Chat Context State
  const [chatChannel, setChatChannel] = useState<'TEAM' | 'FAMILY'>('TEAM');
  
  // AI & Analytics State
  const [aiSummary, setAiSummary] = useState('');
  const [aiPatientId, setAiPatientId] = useState('');
  
  // Modal Visibility State
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileContextOpen, setIsMobileContextOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeStatModal, setActiveStatModal] = useState<'PATIENTS' | 'DOCTORS' | 'STAFF' | 'BEDS' | null>(null);
  
  const [isCareEventModalOpen, setIsCareEventModalOpen] = useState(false);
  const [isViewEventsModalOpen, setIsViewEventsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  
  const [initialReportId, setInitialReportId] = useState<string | null>(null);

  if (!user) return null;

  // --- Derived Data ---
  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);
  const medicalStaff = useMemo(() => staff.filter(s => s.role === UserRole.NURSE || s.role === UserRole.STAFF), [staff]);
  
  const treatedPatientIds = useMemo(() => {
    const fifteenDaysAgo = Date.now() - (15 * 24 * 60 * 60 * 1000);
    return new Set(
      events
        .filter(e => e.doctorId === user.id && e.timestamp >= fifteenDaysAgo)
        .map(e => e.patientId)
    );
  }, [events, user.id]);
  
  const myPatients = useMemo(() => {
    return patients.filter(p => 
      p.assignedDoctorId === user.id || treatedPatientIds.has(p.id)
    );
  }, [patients, user.id, treatedPatientIds]);
  
  const activePatients = useMemo(() => patients.filter(p => !p.isDischarged), [patients]);
  const myActivePatients = useMemo(() => myPatients.filter(p => !p.isDischarged), [myPatients]);
  const filteredPatients = useMemo(() => listFilter === 'ASSIGNED' ? myActivePatients : activePatients, [listFilter, myActivePatients, activePatients]);
  
  const analyticsPatients = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(analyticsSearch.toLowerCase())
    );
  }, [patients, analyticsSearch]);
  
  const myEvents = useMemo(() => events.filter(e => e.doctorId === user.id), [events, user.id]);

  // --- Handlers ---
  const handleSelectPatient = (id: string, tab: string = 'TIMELINE', channel: 'TEAM' | 'FAMILY' = 'TEAM') => {
    setSelectedPatientId(id);
    setActiveTab(tab);
    setChatChannel(channel);
    setAiPatientId(id);
    
    const p = patients.find(pat => pat.id === id);
    if (p) {
        setAiSummary('Analyzing patient data...');
        generatePatientSummary(p).then(setAiSummary);
    }
  };
  
  const handleSaveCareEvent = (eventData: CareEventCreationData) => {
      onCreateEvent(eventData);
      alert('Care Event Created Successfully');
  };

  const handleTransferPatient = (patientId: string, toWard: string, toBed: string, status: string, reason: string, time: string, assignedStaffId?: string) => {
      const locationString = `${toWard} ${toBed ? `(${toBed})` : ''}`;
      onMovePatient(patientId, locationString, reason, time, assignedStaffId);
      alert('Transfer Requested Successfully & Notifications Sent!');
  };

  const handleDischargePatient = (patientId: string, dischargeData: DischargeDetails) => {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const nurseChecklistItems = [
          'Remove IV Lines / Cannula',
          'Remove Catheter (if applicable)',
          'Final Vitals Check',
          'Handover Discharge Summary',
          'Patient Education'
      ];

      const nurseEvent: CareEventCreationData = {
          patientId: patientId,
          nurseId: patient.assignedNurseIds?.[0] || medicalStaff[0]?.id || '',
          doctorId: user.id,
          priority: 'URGENT',
          status: 'PENDING',
          notes: 'Prepare patient for discharge. Complete all handover protocols.',
          checks: [],
          checklist: nurseChecklistItems.map(item => ({ item, completed: false })),
          medications: [],
          scheduledTimes: ['Immediate'],
          timestamp: Date.now()
      };
      onCreateEvent(nurseEvent);
      alert(`Discharge process initiated for ${patient.name}. Nurse notified.`);
  };

  const handleNavClick = (id: string) => {
      setActiveNav(id);
      setIsMobileMenuOpen(false);
      if (id === 'My Patients') {
          setListFilter('ASSIGNED');
          setSelectedPatientId(null);
      } else if (id === 'Dashboard') {
          setListFilter('ALL');
          setSelectedPatientId(null);
      } else if (id === 'Messages' || id === 'Analytics' || id === 'Shift Transfer') {
          setSelectedPatientId(null);
      }
  };

  const handleDoctorHandoverSubmit = (targetStaffId: string, patientIds: string[], notes: string) => {
      onShiftHandover(targetStaffId, patientIds, notes);
      alert('Shift Transfer Completed successfully.');
      setActiveNav('Dashboard');
  };

  return (
    <div className={`flex h-screen bg-[#C6D5DE] dark:bg-[#212121] font-sans overflow-hidden relative text-[#191C1B] dark:text-slate-100 transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
      
      {(isMobileMenuOpen || isMobileContextOpen) && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-md transition-opacity" onClick={() => { setIsMobileMenuOpen(false); setIsMobileContextOpen(false); }} />
      )}

      {/* --- SIDEBAR --- */}
      <DoctorSidebar 
        activeNav={activeNav}
        setActiveNav={handleNavClick}
        user={user}
        onLogout={onLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onDuty={onDuty}
        setOnDuty={setOnDuty}
        setIsProfileOpen={setIsProfileOpen}
      />

      {/* --- CENTER COLUMN: Workspace --- */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <DoctorHeader 
            isDark={isDark}
            toggleTheme={toggleTheme}
            headerSearch={headerSearch}
            setHeaderSearch={setHeaderSearch}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            setIsMobileContextOpen={setIsMobileContextOpen}
        />

        <div className="flex-1 overflow-hidden flex flex-col relative px-2 md:px-8 pb-4 md:pb-8">
            <div className="w-full h-full bg-[#FCFDF6] dark:bg-white/5 rounded-[24px] md:rounded-[32px] shadow-sm border border-[#DEE5D9] dark:border-white/10 overflow-hidden flex flex-col relative transition-colors">
                 
                 {selectedPatientId && selectedPatient ? (
                      <DoctorPatientDetail 
                         selectedPatient={selectedPatient}
                         user={user}
                         activeTab={activeTab}
                         setActiveTab={setActiveTab}
                         chatChannel={chatChannel}
                         setChatChannel={setChatChannel}
                         aiSummary={aiSummary}
                         aiPatientId={aiPatientId}
                         messages={messages}
                         events={events}
                         staff={staff}
                         reports={reports}
                         onSendMessage={onSendMessage}
                         setSelectedPatientId={setSelectedPatientId}
                         activeNav={activeNav}
                         onViewReport={(id) => { setInitialReportId(id); setIsReportsModalOpen(true); }}
                      />
                 ) : (
                      activeNav === 'Messages' ? (
                          <DoctorMessages 
                             patients={patients}
                             messages={messages}
                             handleSelectPatient={handleSelectPatient}
                             user={user}
                          />
                      ) : activeNav === 'Analytics' ? (
                          <DoctorAnalytics 
                             analyticsSearch={analyticsSearch}
                             setAnalyticsSearch={setAnalyticsSearch}
                             analyticsPatients={analyticsPatients}
                             handleSelectPatient={handleSelectPatient}
                          />
                      ) : activeNav === 'Shift Transfer' ? (
                          <DoctorHandoverForm 
                             user={user}
                             patients={patients}
                             staff={staff}
                             onSubmit={handleDoctorHandoverSubmit}
                          />
                      ) : (
                          <div className="flex flex-col h-full animate-fade-in">
                              {/* --- REFINED NAVIGATION TOOLBAR --- */}
                              <div className="p-4 md:p-6 bg-[#FCFDF6] dark:bg-black/20 border-b border-[#EFF1E6] dark:border-white/5 z-20 flex-shrink-0">
                                 <div className="flex items-center gap-3 md:gap-4">
                                     {/* Main Segmented Pill Bar - Optimized for Mobile */}
                                     <div className="bg-white dark:bg-white/10 rounded-full shadow-sm border border-slate-200 dark:border-white/10 flex items-center p-1 md:p-1.5 h-12 md:h-14 flex-1 md:flex-initial overflow-hidden">
                                         <button 
                                             onClick={() => setListFilter('ASSIGNED')}
                                             className={`flex-1 h-full flex items-center justify-center rounded-full text-[11px] md:text-sm font-bold transition-all px-2 md:px-6 whitespace-nowrap ${listFilter === 'ASSIGNED' ? 'bg-[#E3F2FD] text-[#1565C0] dark:bg-blue-900/40 dark:text-blue-100' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}
                                         >
                                             My Patients
                                         </button>
                                         
                                         <div className="w-px h-5 md:h-6 bg-slate-200 dark:bg-white/10 mx-0.5 md:mx-1"></div>

                                         <button 
                                             onClick={() => setListFilter('ALL')}
                                             className={`flex-1 h-full flex items-center justify-center rounded-full text-[11px] md:text-sm font-bold transition-all px-2 md:px-6 whitespace-nowrap ${listFilter === 'ALL' ? 'bg-[#E3F2FD] text-[#1565C0] dark:bg-blue-900/40 dark:text-blue-100' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}
                                         >
                                             All Patients
                                         </button>

                                         <div className="w-px h-5 md:h-6 bg-slate-200 dark:bg-white/10 mx-0.5 md:mx-1"></div>

                                         <button 
                                             onClick={() => setIsDischargeModalOpen(true)}
                                             className="flex-1 h-full flex items-center justify-center rounded-full text-[11px] md:text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 transition-all px-2 md:px-6 whitespace-nowrap"
                                         >
                                             Discharge
                                         </button>
                                     </div>
                                     
                                     {/* Circular Action Button */}
                                     <div className="relative">
                                         <button 
                                             onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                                             className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#62abff] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 flex-shrink-0"
                                         >
                                             <Plus size={28} className="md:w-8 md:h-8" />
                                         </button>

                                         <QuickActions 
                                             isOpen={isQuickActionsOpen}
                                             toggle={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                                             onClose={() => setIsQuickActionsOpen(false)}
                                             onOpenCareEvent={() => setIsCareEventModalOpen(true)}
                                             onOpenViewEvents={() => setIsViewEventsModalOpen(true)}
                                             onOpenReports={() => setIsReportsModalOpen(true)}
                                             onOpenTransfer={() => setIsTransferModalOpen(true)}
                                         />
                                     </div>
                                 </div>
                              </div>
                              
                              <PatientGrid 
                                 filteredPatients={filteredPatients}
                                 handleSelectPatient={handleSelectPatient}
                                 user={user}
                                 listFilter={listFilter}
                              />
                          </div>
                      )
                 )}
            </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN: Context Panel (Notifications/Alerts) --- */}
      <div className={`fixed inset-y-0 right-0 z-40 w-[300px] md:w-[320px] bg-[#C6D5DE] dark:bg-[#212121] flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-out lg:relative lg:translate-x-0 ${isMobileContextOpen ? 'translate-x-0' : 'translate-x-full'} transition-colors`}>
         <div className="lg:hidden p-6 flex justify-between items-center">
              <span className="font-bold text-lg text-[#191C1B] dark:text-white">Context & Actions</span>
              <button onClick={() => setIsMobileContextOpen(false)} className="p-2 bg-[#DEE5D9] dark:bg-white/10 rounded-full"><X size={20}/></button>
         </div>
         <div className="flex-1 p-4 m-3 mb-3 bg-[#FCFDF6] dark:bg-white/5 rounded-[28px] shadow-sm border border-[#DEE5D9] dark:border-white/10 overflow-y-auto custom-scrollbar transition-colors">
            <h3 className="text-xs font-bold text-[#44474F] dark:text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center justify-between">Priority Alerts <span className="bg-[#BA1A1A] text-white text-[10px] px-2 py-0.5 rounded-full">3</span></h3>
            <div className="space-y-3">
                <div className="bg-[#FFDAD6] dark:bg-red-950/40 p-4 rounded-[20px] border border-[#FFB4AB] dark:border-red-900/50">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={18} className="text-[#BA1A1A] dark:text-red-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-[#410002] dark:text-red-100">Sepsis Warning</p>
                            <p className="text-xs text-[#690005] dark:text-red-200/70 mt-1 leading-snug">Heart rate elevated &gt; 110 bpm. Patient ID: PAT-2025-001</p>
                        </div>
                    </div>
                    <button className="w-full mt-3 py-2 bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-[#410002] dark:text-white rounded-xl text-xs font-bold transition-colors">Review Vitals</button>
                </div>
            </div>
         </div>
      </div>
        
      {/* --- MODALS --- */}
      <CreateCareEventModal isOpen={isCareEventModalOpen} onClose={() => setIsCareEventModalOpen(false)} patient={selectedPatient} patients={activePatients} medicalStaff={medicalStaff} onSave={handleSaveCareEvent} />
      <ViewEventsModal isOpen={isViewEventsModalOpen} onClose={() => setIsViewEventsModalOpen(false)} events={myEvents} patients={patients} staff={staff} />
      <MedicalReportsModal isOpen={isReportsModalOpen} onClose={() => { setIsReportsModalOpen(false); setInitialReportId(null); }} patients={patients} reports={reports} selectedPatientId={selectedPatientId} initialReportId={initialReportId} />
      <DoctorTransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} patients={activePatients} medicalStaff={medicalStaff} onTransfer={handleTransferPatient} />
      <DischargePatientModal isOpen={isDischargeModalOpen} onClose={() => setIsDischargeModalOpen(false)} patients={activePatients} user={user} onDischarge={handleDischargePatient} />
      <UserProfileModal user={user} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onUpdateUser={onUpdateUser} />
      <StatsDetailModal isOpen={!!activeStatModal} onClose={() => setActiveStatModal(null)} type={activeStatModal} patients={activePatients} staff={staff} onNavigate={() => {}} />
    </div>
  );
};

export default DoctorDashboard;
