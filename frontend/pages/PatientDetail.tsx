import React, { useState, useEffect } from 'react';
import { User, Patient, ChatMessage, UserRole, CareEvent, LabReport } from '../types';
import { ChevronLeft, Clock, MapPin, MessageSquare, Activity, ShieldAlert, Sparkles, User as UserIcon, Phone, HeartPulse, Stethoscope, Users, ClipboardList, Calendar, Shield, Briefcase, AlertCircle, CheckCircle2, AlertTriangle, Pill, FileText, BrainCircuit, LogOut, ArrowRight, ArrowLeft } from 'lucide-react';
import PatientTimeline from '../components/PatientTimeline';
import ChatWindow from '../components/ChatWindow';
import GlassActivityCard from '../components/patient/GlassActivityCard';
import { generateClinicalAnalysis } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import PillSlider from '../components/PillSlider';
import ThemeToggle from '../components/ThemeToggle';
import LogoutButton from '../components/LogoutButton';
import Logo from '../components/Logo';

// Zustand Stores
import { useAuthStore } from '../store/useAuthStore';
import { usePatientStore } from '../store/usePatientStore';
import { useDoctorStore } from '../store/useDoctorStore';
import { useMessageStore } from '../store/useMessageStore';
import { useThemeStore } from '../store/useThemeStore';
import { useSettingsStore } from '../store/useSettingsStore';

interface Props {
  user?: User;
  patients?: Patient[];
  messages?: Record<string, ChatMessage[]>;
  staff?: User[];
  careEvents?: CareEvent[]; 
  reports?: LabReport[];
  onSendMessage?: (patientId: string, text: string, isAttachment?: boolean, channel?: 'FAMILY' | 'TEAM') => void;
  patientId?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  isDark?: boolean;
  toggleTheme?: () => void;
}

const InfoRow = ({icon, label, value}: {icon: React.ReactNode, label: string, value: string}) => (
    <div className="flex items-center justify-between py-3 border-b border-black/5 dark:border-white/5 last:border-0 group hover:bg-black/5 dark:hover:bg-white/5 px-2 rounded-lg transition-colors">
        <span className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-md">{icon}</span> {label}
        </span>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{value}</span>
    </div>
);

const PatientDetail: React.FC<Props> = ({ patientId: directPatientId }) => {
  // Use Zustand states to completely remove prop drilling
  const user = useAuthStore(state => state.user);
  const onLogout = useAuthStore(state => state.logout);

  const patients = usePatientStore(state => state.patients);
  const careEvents = usePatientStore(state => state.careEvents || []);
  const reports = usePatientStore(state => state.reports || []);

  const staff = useDoctorStore(state => state.staff);

  const messages = useMessageStore(state => state.messages);
  const onSendMessage = useMessageStore(state => state.sendMessage);

  const isDark = useThemeStore(state => state.isDarkMode);
  const toggleTheme = useThemeStore(state => state.toggleTheme);

  const onNavigate = useSettingsStore(state => state.navigate);
  const currentPath = useSettingsStore(state => state.currentPath);

  const [activeTab, setActiveTab] = useState<'timeline' | 'chat' | 'info' | 'care' | 'analysis'>('timeline');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Derive patientId from URL path if not explicitly provided
  const patientId = directPatientId || currentPath.split('/')[2] || '';

  const patient = patients.find(p => p.id === patientId);

  useEffect(() => {
    if (activeTab === 'analysis' && patient && !aiAnalysis) {
        setLoadingAnalysis(true);
        const patientEvents = careEvents.filter(e => e.patientId === patientId);
        const patientReports = reports.filter(r => r.patientId === patientId);
        generateClinicalAnalysis(patient, patientEvents, patientReports).then(analysis => {
            setAiAnalysis(analysis);
            setLoadingAnalysis(false);
        });
    }
  }, [activeTab, patient, careEvents, reports, patientId, aiAnalysis]);

  if (!user) return null;

  if (user.role === UserRole.PATIENT_PARTY && user.linkedPatientId !== patientId) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-[#C6D5DE] dark:bg-[#212121]">
              <div className="bg-[#FFDAD6] p-4 rounded-full mb-4">
                <ShieldAlert size={48} className="text-[#BA1A1A]" />
              </div>
              <h2 className="text-2xl font-bold text-[#191C1B]">Unauthorized Access</h2>
              <button onClick={() => onNavigate('/')} className="mt-6 px-6 py-3 bg-[#191C1B] text-[#7cff67] rounded-[20px] font-bold">Return to My Patient</button>
          </div>
      );
  }

  if (!patient) return <div className="p-8 text-center text-[#747871]">Patient not found</div>;

  const professionalTabs = [
      { id: 'timeline', label: 'Timeline' },
      { id: 'chat', label: 'Communication' },
      { id: 'info', label: 'Details' },
      { id: 'care', label: 'Activity' },
      { id: 'analysis', label: 'AI Intelligence' }
  ];

  const familyTabs = [
      { id: 'timeline', label: 'Timeline' },
      { id: 'care', label: 'Activity' },
      { id: 'chat', label: 'Messages' },
      { id: 'info', label: 'Info' }
  ];

  const logoutHandler = () => {
    onLogout();
    onNavigate('/');
  };

  if (user.role === UserRole.PATIENT_PARTY) {
      const completedPatientEvents = careEvents
        .filter(e => e.patientId === patient.id && e.status === 'COMPLETED')
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
        .slice(0, 3);

      return (
          <div className="min-h-screen bg-[#C6D5DE] dark:bg-[#212121] p-4 md:p-8 font-sans text-[#191C1B] dark:text-white animate-fade-in relative transition-colors duration-300">
              
              <div className="flex items-center bg-white/80 dark:bg-black/40 backdrop-blur-md px-2 md:px-6 rounded-full border border-[#DEE5D9] dark:border-white/10 shadow-sm mb-6 max-w-4xl mx-auto transition-colors h-16 relative">
                  <div className="flex-1 flex justify-start">
                      <LogoutButton onClick={logoutHandler} title="Sign Out" className="scale-[0.8] md:scale-90" />
                  </div>
                  
                  <div className="flex-none text-center">
                    <Logo size="sm" showText={true} />
                  </div>

                  <div className="flex-1 flex justify-end items-center pr-2">
                      <ThemeToggle isDark={isDark} toggle={toggleTheme} />
                  </div>
              </div>

              <div className="max-w-4xl mx-auto bg-[#FCFDF6] dark:bg-gray-900/50 rounded-[32px] border border-[#DEE5D9] dark:border-white/10 p-6 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-colors">
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${patient.severity === 'Critical' ? 'bg-[#BA1A1A]' : 'bg-[#4CE06D]'}`}></div>
                  <div className="flex flex-col md:flex-row items-center gap-6 pl-4 w-full">
                      <div className="w-20 h-20 rounded-[24px] bg-[#C6D5DE] dark:bg-white/10 text-[#072100] dark:text-white flex items-center justify-center font-heading font-bold text-3xl border-2 border-[#DEE5D9] dark:border-white/10 shadow-inner flex-shrink-0">{patient.name.charAt(0)}</div>
                      <div className="text-center md:text-left flex-1">
                          <h1 className="text-3xl font-heading font-bold text-[#191C1B] dark:text-white tracking-tight">{patient.name}</h1>
                          <p className="text-sm text-[#44474F] dark:text-gray-400 font-medium mt-1">{patient.currentLocation}</p>
                      </div>
                      <div className="flex flex-col items-end">
                          <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                              patient.severity === 'Critical' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                          }`}>
                              {patient.condition}
                          </span>
                      </div>
                  </div>
              </div>

              <div className="max-w-4xl mx-auto bg-[#FCFDF6] dark:bg-gray-900/50 rounded-[32px] border border-[#DEE5D9] dark:border-white/10 shadow-sm overflow-hidden flex flex-col min-h-[500px] transition-colors">
                  <div className="py-6 border-b border-[#C6D5DE] dark:border-white/5 bg-[#FCFDF6] dark:bg-transparent flex justify-center sticky top-0 z-10 backdrop-blur-sm">
                      <PillSlider 
                          name="family-nav"
                          options={familyTabs}
                          value={activeTab}
                          onChange={(id) => setActiveTab(id as 'timeline' | 'chat' | 'info' | 'care' | 'analysis')}
                          variant="ghost" 
                      />
                  </div>

                  <div className="p-0 flex-1 bg-[#FCFDF6] dark:bg-transparent">
                      {activeTab === 'timeline' && (
                          <div className="p-6 md:p-8">
                              <PatientTimeline patient={patient} />
                          </div>
                      )}
                      {activeTab === 'chat' && (
                          <div className="h-[600px] flex flex-col">
                              <ChatWindow 
                                patient={patient} 
                                currentUser={user} 
                                messages={(messages[patient.id] || []).filter(m => m.channel === 'FAMILY')} 
                                onSendMessage={(text, isAttach) => onSendMessage(patient.id, text, isAttach, 'FAMILY')} 
                                className="h-full border-none rounded-none bg-transparent shadow-none"
                              />
                          </div>
                      )}
                      {activeTab === 'care' && (
                          <div className="p-6 md:p-8 space-y-6">
                              <div className="flex items-center gap-2 mb-4">
                                  <div className="bg-[#E8F5E9] dark:bg-emerald-900/30 p-2 rounded-xl text-[#1B5E20] dark:text-emerald-300">
                                      <ClipboardList size={20} />
                                  </div>
                                  <h3 className="text-lg font-bold text-[#191C1B] dark:text-white">Recent Care Activity</h3>
                              </div>
                              {completedPatientEvents.length === 0 ? <div className="text-center py-12 text-[#747871] text-sm italic">No care tasks completed recently.</div> : (
                                  <div className="w-full bg-[#1a1a1a] rounded-[32px] p-8 md:p-12 overflow-hidden flex justify-center relative min-h-[350px] shadow-inner">
                                      <div className="glass-container relative z-10 w-full">
                                          {completedPatientEvents.map((evt, idx) => <GlassActivityCard key={evt.id} event={evt} idx={idx} />)}
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                      {activeTab === 'info' && (
                          <div className="p-6 md:p-8">
                              <div className="flex items-center gap-4 mb-6">
                                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                                      <UserIcon size={24} />
                                  </div>
                                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Patient Details</h3>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                  <InfoRow icon={<Calendar size={14}/>} label="Admission Date" value={new Date(patient.admissionTimestamp).toLocaleDateString()} />
                                  <InfoRow icon={<UserIcon size={14}/>} label="Age / Gender" value={`${patient.age} Yrs / ${patient.gender}`} />
                                  <InfoRow icon={<Activity size={14}/>} label="Condition" value={patient.condition} />
                                  <InfoRow icon={<MapPin size={14}/>} label="Current Location" value={patient.currentLocation} />
                                  <InfoRow icon={<Briefcase size={14}/>} label="Insurance" value={patient.insuranceProvider || 'N/A'} />
                                  <InfoRow icon={<Stethoscope size={14}/>} label="Assigned Doctor" value={staff.find(s => s.id === patient.assignedDoctorId)?.name || 'N/A'} />
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  const assignedDoctor = staff.find(s => s.id === patient.assignedDoctorId);
  const assignedNurses = staff.filter(s => (patient.assignedNurseIds || []).includes(s.id));
  const patientMessages = (messages[patient.id] || []).filter(m => m.channel === 'FAMILY' || !m.channel);
  const patientEvents = careEvents.filter(e => e.patientId === patientId).sort((a,b) => b.timestamp - a.timestamp);

  return (
    <div className="min-h-screen bg-[#C6D5DE] dark:bg-[#212121] p-4 md:p-8 font-sans text-[#191C1B] dark:text-white transition-colors duration-300">
      
      {/* Header Segment */}
      <div className="max-w-6xl mx-auto flex items-center justify-between bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md px-4 md:px-8 rounded-full border border-slate-200 dark:border-white/5 h-20 shadow-sm mb-6 transition-colors">
         <div className="flex items-center gap-4">
             <button 
                 onClick={() => onNavigate('/')} 
                 className="p-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-white rounded-full transition-colors flex items-center gap-1 text-sm font-bold shadow-sm"
             >
                 <ChevronLeft size={20} /> <span className="hidden sm:inline">Back</span>
             </button>
         </div>
         <div>
             <Logo size="sm" showText={true} />
         </div>
         <div className="flex items-center gap-4">
             <ThemeToggle isDark={isDark} toggle={toggleTheme} />
         </div>
      </div>

      {/* Patient Profile Banner */}
      <div className="max-w-6xl mx-auto bg-white/90 dark:bg-[#1e1e1e] rounded-[32px] border border-slate-200 dark:border-white/5 p-6 md:p-8 mb-6 shadow-sm flex flex-col lg:flex-row items-center lg:items-stretch gap-8 relative overflow-hidden transition-colors">
          <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${patient.severity === 'Critical' ? 'bg-[#BA1A1A]' : 'bg-[#CCF5A6]'}`}></div>
          
          <div className="w-24 h-24 rounded-[30px] bg-slate-100 dark:bg-white/5 text-[#072100] dark:text-white flex items-center justify-center font-heading font-bold text-4xl border border-slate-200 dark:border-white/10 shadow-sm flex-shrink-0">
              {patient.name.charAt(0)}
          </div>

          <div className="flex-1 flex flex-col justify-between text-center lg:text-left min-w-0">
              <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 justify-center lg:justify-start">
                      <h1 className="text-3xl font-heading font-black text-slate-900 dark:text-white truncate">{patient.name}</h1>
                      <span className="text-xs font-bold font-mono bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg border dark:border-white/10 mt-2 sm:mt-0 max-w-max mx-auto sm:mx-0">{patient.id}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-sm text-slate-500 dark:text-slate-400 font-bold mt-3">
                      <span className="flex items-center gap-1.5"><MapPin size={16} className="text-[#006492] dark:text-emerald-400" />{patient.currentLocation}</span>
                      <span className="flex items-center gap-1.5"><HeartPulse size={16} className="text-[#006492] dark:text-emerald-400" />{patient.diagnosis || 'Diagnosis Pending'}</span>
                  </div>
              </div>
          </div>

          <div className="flex flex-col items-center lg:items-end justify-center lg:justify-between border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/5 pt-6 lg:pt-0 lg:pl-8 flex-shrink-0 min-w-[200px]">
              <span className={`px-4.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                  patient.severity === 'Critical' ? 'bg-[#FFDAD6] text-[#410002] border-[#FFB4AB]' : 'bg-[#CCF5A6] text-[#072100] border-[#9FF560]'
              }`}>
                  {patient.severity}
              </span>
              <p className="text-xs text-slate-400 font-bold mt-4 lg:mt-0">Admitted: {new Date(patient.admissionTimestamp).toLocaleString()}</p>
          </div>
      </div>

      {/* Main Workspace Tabs */}
      <div className="max-w-6xl mx-auto bg-[#FCFDF6] dark:bg-[#1a1a1a] rounded-[36px] border border-slate-200 dark:border-white/5 shadow-md flex flex-col min-h-[600px] overflow-hidden transition-colors">
          <div className="py-5 border-b border-slate-200 dark:border-white/5 bg-[#FCFDF6] dark:bg-transparent flex justify-center sticky top-0 z-20 backdrop-blur-md">
              <PillSlider 
                  name="professional-nav"
                  options={professionalTabs}
                  value={activeTab}
                  onChange={(id) => setActiveTab(id as 'timeline' | 'chat' | 'info' | 'care' | 'analysis')}
                  variant="ghost" 
              />
          </div>

          <div className="p-0 flex-1 bg-white/40 dark:bg-transparent">
              {activeTab === 'timeline' && (
                  <div className="p-6 md:p-8 animate-fade-in">
                      <PatientTimeline patient={patient} />
                  </div>
              )}

              {activeTab === 'chat' && (
                  <div className="h-[650px] flex flex-col animate-fade-in bg-white/20 dark:bg-black/10">
                      <ChatWindow 
                        patient={patient} 
                        currentUser={user} 
                        messages={patientMessages} 
                        onSendMessage={(text, isAttach) => onSendMessage(patient.id, text, isAttach, user.role === 'PATIENT_PARTY' ? 'FAMILY' : 'TEAM')} 
                        className="h-full border-none rounded-none bg-transparent shadow-none"
                      />
                  </div>
              )}

              {activeTab === 'info' && (
                  <div className="p-6 md:p-8 animate-fade-in space-y-8">
                      <div>
                          <div className="flex items-center gap-3.5 mb-6">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                                  <UserIcon size={24} />
                              </div>
                              <h3 className="text-2xl font-black text-slate-800 dark:text-white">Demographics & Logistics</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 bg-slate-50/50 dark:bg-white/5 p-6 rounded-[28px] border border-slate-100 dark:border-white/5">
                              <InfoRow icon={<Calendar size={14}/>} label="Admitted" value={new Date(patient.admissionTimestamp).toLocaleDateString()} />
                              <InfoRow icon={<UserIcon size={14}/>} label="Age / Gender" value={`${patient.age} Yrs / ${patient.gender}`} />
                              <InfoRow icon={<Activity size={14}/>} label="Criticality" value={patient.severity} />
                              <InfoRow icon={<MapPin size={14}/>} label="Ward & Bed" value={patient.currentLocation} />
                              <InfoRow icon={<Briefcase size={14}/>} label="Insurance" value={patient.insuranceProvider || 'None'} />
                              <InfoRow icon={<Phone size={14}/>} label="Contact" value={patient.emergencyContactPhone || 'N/A'} />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                          <div>
                              <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-xl text-teal-600 dark:text-teal-400">
                                      <Stethoscope size={18} />
                                  </div>
                                  <h4 className="font-bold text-base text-slate-800 dark:text-white">Assigned Doctors</h4>
                              </div>
                              <div className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-4">
                                  <div className="w-11 h-11 bg-teal-100 dark:bg-white/10 rounded-full flex items-center justify-center font-bold text-teal-700 dark:text-teal-200">
                                      {assignedDoctor?.name.charAt(0) || 'D'}
                                  </div>
                                  <div className="min-w-0">
                                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{assignedDoctor?.name || 'Unassigned'}</p>
                                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Lead Physician</p>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                                      <Users size={18} />
                                  </div>
                                  <h4 className="font-bold text-base text-slate-800 dark:text-white">Assigned Care Staff</h4>
                              </div>
                              <div className="space-y-2">
                                  {assignedNurses.length === 0 ? (
                                      <div className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 text-xs text-slate-400 text-center font-bold">No nursing staff assigned</div>
                                  ) : (
                                      assignedNurses.map(nurse => (
                                          <div key={nurse.id} className="p-3 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-3.5">
                                              <div className="w-8 h-8 bg-emerald-100 dark:bg-white/10 rounded-full flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-200 text-xs">
                                                  {nurse.name.charAt(0)}
                                              </div>
                                              <div>
                                                  <p className="text-xs font-bold text-slate-800 dark:text-white">{nurse.name}</p>
                                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Nurse</p>
                                              </div>
                                          </div>
                                      ))
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'care' && (
                  <div className="p-6 md:p-8 animate-fade-in space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="bg-[#E8F5E9] dark:bg-emerald-900/30 p-2.5 rounded-2xl text-[#1B5E20] dark:text-emerald-300">
                              <ClipboardList size={22} />
                          </div>
                          <h3 className="text-xl font-black text-slate-800 dark:text-white">Assigned Clinical Tasks</h3>
                      </div>
                      {patientEvents.length === 0 ? (
                          <div className="text-center py-16 text-[#747871] text-sm italic">No clinical tasks or logs on record for this patient.</div>
                      ) : (
                          <div className="space-y-4">
                              {patientEvents.map(evt => (
                                  <div key={evt.id} className="bg-slate-50/50 dark:bg-white/5 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 flex items-start gap-4">
                                      <div className={`p-2.5 rounded-full mt-1 ${evt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                          {evt.status === 'COMPLETED' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                              <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Task Assigned to Nurse</p>
                                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                                                  evt.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-slate-300'
                                              }`}>
                                                  {evt.priority}
                                              </span>
                                          </div>
                                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{evt.notes}</p>
                                          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                                              <span>Task Date: {new Date(evt.timestamp).toLocaleString()}</span>
                                              <span>Status: {evt.status}</span>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}

              {activeTab === 'analysis' && (
                  <div className="p-6 md:p-8 animate-fade-in space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-5">
                          <div className="flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                                  <Sparkles size={24} className="animate-pulse" />
                              </div>
                              <div>
                                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">AI Medical Copilot</h3>
                                  <p className="text-xs text-slate-400 font-bold mt-1">Advanced Clinical Pattern Synthesis</p>
                              </div>
                          </div>
                      </div>

                      {loadingAnalysis ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center">
                              <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4"></div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 font-black tracking-wide">Synthesizing diagnostics, lab records, and care logs...</p>
                          </div>
                      ) : (
                          <div className="p-6 md:p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[32px] overflow-hidden">
                              <div className="markdown-body text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4">
                                  <ReactMarkdown>{aiAnalysis || 'Awaiting analysis trigger.'}</ReactMarkdown>
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default PatientDetail;
