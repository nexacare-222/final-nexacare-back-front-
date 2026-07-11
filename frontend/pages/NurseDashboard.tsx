import React, { useState, useEffect, useMemo } from 'react';
import { User, Patient, CareEvent, ChatMessage, Notification, LabReport, CareEventChecklistItem } from '../types';
import { LayoutDashboard, MessageSquare, LogOut, Bell, X, Activity, MapPin, ArrowRight, User as UserIcon, ChevronDown } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
import VitalsEntryModal from '../components/VitalsEntryModal';
import ShiftHandoverModal from '../components/ShiftHandoverModal';
import TaskDetailPanel from '../components/TaskDetailPanel';
import UserProfileModal from '../components/UserProfileModal';
import ThemeToggle from '../components/ThemeToggle';
import MenuToggle from '../components/MenuToggle';
import NurseTaskCard from '../components/nurse/NurseTaskCard';
import DoctorPatientDetail from '../components/doctor/DoctorPatientDetail';
import SeverityBadge from '../components/doctor/SeverityBadge';
import { generatePatientSummary } from '../services/geminiService';
import PillSlider from '../components/PillSlider';
import ModernSearchBar from '../components/ModernSearchBar';
import { getCategorizedWards } from '../services/mockDataService';
import Logo from '../components/Logo';
import Modal from '../components/ui/Modal';

// Zustand Stores
import { useAuthStore } from '../store/useAuthStore';
import { usePatientStore } from '../store/usePatientStore';
import { useDoctorStore } from '../store/useDoctorStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useMessageStore } from '../store/useMessageStore';
import { useThemeStore } from '../store/useThemeStore';

interface Props {
  user?: User;
  patients?: Patient[];
  staff?: User[];
  events?: CareEvent[];
  messages?: Record<string, ChatMessage[]>;
  notifications?: Notification[];
  reports?: LabReport[];
  onMarkNotificationRead?: (id: string) => void;
  onLogout?: () => void;
  onSendMessage?: (pid: string, txt: string, isAttach?: boolean, channel?: 'FAMILY' | 'TEAM') => void;
  onUpdateUser?: (user: User) => void;
  onTaskComplete?: (taskId: string, nurseNotes: string, checklist: CareEventChecklistItem[], attachments: string[]) => void;
  onShiftHandover?: (targetStaffId: string, patientIds: string[], notes: string) => void;
  isDark?: boolean;
  toggleTheme?: () => void;
}

interface NurseTask extends CareEvent {
    startTime?: number;
    timeDue: string;
    isOverdue: boolean;
    nurseNotes?: string;
    checklist: CareEventChecklistItem[];
}

const NurseDashboard: React.FC<Props> = () => {
  // Use selectors from Zustand stores
  const user = useAuthStore(state => state.user);
  const onLogout = useAuthStore(state => state.logout);
  const onUpdateUser = useAuthStore(state => state.updateUser);

  const patients = usePatientStore(state => state.patients);
  const events = usePatientStore(state => state.careEvents);
  const reports = usePatientStore(state => state.reports);
  const saveVitals = usePatientStore(state => state.saveVitals);
  const onTaskComplete = usePatientStore(state => state.completeTask);
  const onShiftHandover = usePatientStore(state => state.shiftHandover);

  const staff = useDoctorStore(state => state.staff);

  const messages = useMessageStore(state => state.messages);
  const onSendMessage = useMessageStore(state => state.sendMessage);

  const notifications = useNotificationStore(state => state.notifications);
  const onMarkNotificationRead = useNotificationStore(state => state.markAsRead);

  const isDark = useThemeStore(state => state.isDarkMode);
  const toggleTheme = useThemeStore(state => state.toggleTheme);

  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [dashboardFilter, setDashboardFilter] = useState<'DUE' | 'ASSIGNED' | 'COMPLETED' | 'MISSED'>('DUE');
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [localTasks, setLocalTasks] = useState<NurseTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<NurseTask | null>(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showAllPatientsModal, setShowAllPatientsModal] = useState(false);
  const [showAssignedPatientsModal, setShowAssignedPatientsModal] = useState(false);
  
  // Detail View State
  const [viewingPatientId, setViewingPatientId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState('TIMELINE');
  const [detailChatChannel, setDetailChatChannel] = useState<'TEAM' | 'FAMILY'>('TEAM');
  const [aiSummary, setAiSummary] = useState('');

  // Chat Section State
  const [chatChannel, setChatChannel] = useState<'DOCTOR' | 'FAMILY' | 'UNSEEN'>('DOCTOR');
  const [chatSearch, setChatSearch] = useState('');
  const [chatWard, setChatWard] = useState('');
  const [chatPatientId, setChatPatientId] = useState<string | null>(null);
  const [viewedUnseenPatients, setViewedUnseenPatients] = useState<Set<string>>(new Set());

  if (!user) return null;

  const filteredNotifications = useMemo(() => notifications.filter(n => n.userId === user.id), [notifications, user.id]);
  const unreadNotifications = useMemo(() => filteredNotifications.filter(n => !n.read).sort((a,b) => b.timestamp - a.timestamp), [filteredNotifications]);
  const wardStructure = useMemo(() => getCategorizedWards(), []);

  useEffect(() => {
      const enriched = events.map(evt => ({
          ...evt,
          timeDue: new Date(evt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          isOverdue: evt.status === 'PENDING' && (Date.now() - evt.timestamp > 3600000),
          checklist: evt.checklist || []
      }));
      setLocalTasks(enriched);
  }, [events]);

  const handleSelectPatient = (id: string) => {
      setViewingPatientId(id);
      setDetailTab('TIMELINE');
      
      const p = patients.find(pat => pat.id === id);
      if (p) {
          setAiSummary('Analyzing patient data...');
          generatePatientSummary(p).then(setAiSummary);
      }
  };

  const myPatients = useMemo(() => patients.filter(p => (p.assignedNurseIds || []).includes(user.id)), [patients, user.id]);
  const viewingPatient = useMemo(() => patients.find(p => p.id === viewingPatientId), [patients, viewingPatientId]);
  
  const dueTasks = useMemo(() => localTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').sort((a,b) => b.timestamp - a.timestamp), [localTasks]);
  const completedTasks = useMemo(() => localTasks.filter(t => t.status === 'COMPLETED').sort((a,b) => (b.completedAt || 0) - (a.completedAt || 0)), [localTasks]);
  const missedTasks = useMemo(() => localTasks.filter(t => t.status === 'MISSED'), [localTasks]);

  const getTimeRemaining = (task: NurseTask) => {
      const diff = (task.timestamp + 3600000) - Date.now();
      if (diff < 0) return { text: 'Overdue', color: 'text-[#BA1A1A] dark:text-red-400' };
      const mins = Math.floor(diff / 60000);
      return { text: `Due in ${mins} min`, color: mins < 15 ? 'text-[#BA1A1A]' : 'text-[#00695C] dark:text-emerald-400' };
  };

  const handleTaskAction = (taskId: string, action: 'START' | 'COMPLETE', data?: { notes?: string, checklist?: CareEventChecklistItem[], attachments?: string[] }) => {
      if (action === 'COMPLETE') {
          onTaskComplete(taskId, data?.notes || '', data?.checklist || [], data?.attachments || []);
          setLocalTasks(prev => prev.map(t => 
              t.id === taskId ? { 
                  ...t, 
                  status: 'COMPLETED', 
                  completedAt: Date.now(), 
                  nurseNotes: data?.notes,
                  checklist: data?.checklist || [],
                  attachments: data?.attachments
              } : t
          ));
      } else {
          setLocalTasks(prev => prev.map(t => {
              if (t.id !== taskId) return t;
              if (action === 'START') return { ...t, status: 'IN_PROGRESS', startTime: Date.now() };
              return t;
          }));
      }
  };

  const chatList = useMemo(() => {
      let filtered = patients.filter(p => {
          const matchWard = chatWard ? p.currentLocation.includes(chatWard) : true;
          const searchLower = chatSearch.toLowerCase();
          const matchSearch = !chatSearch || 
              p.name.toLowerCase().includes(searchLower) ||
              p.id.toLowerCase().includes(searchLower) ||
              p.currentLocation.toLowerCase().includes(searchLower);
          return matchWard && matchSearch;
      });

      let threads = filtered.map(p => {
          const allMsgs = messages[p.id] || [];
          let relevantMsgs: ChatMessage[] = [];
          
          if (chatChannel === 'DOCTOR') {
              relevantMsgs = allMsgs.filter(m => m.channel === 'TEAM' || !m.channel);
          } else if (chatChannel === 'FAMILY') {
              relevantMsgs = allMsgs.filter(m => m.channel === 'FAMILY');
          } else {
              relevantMsgs = []; 
          }

          const lastMsg = relevantMsgs.length > 0 ? relevantMsgs[relevantMsgs.length - 1] : null;
          return { patient: p, lastMsg };
      }).filter((t): t is {patient: Patient, lastMsg: ChatMessage | null} => t !== null);

      threads.sort((a, b) => {
          const tA = a.lastMsg?.timestamp || 0;
          const tB = b.lastMsg?.timestamp || 0;
          return tB - tA;
      });

      return threads;
  }, [patients, messages, chatChannel, chatWard, chatSearch]);

  const unseenMessagesList = useMemo(() => {
      if (chatChannel !== 'UNSEEN') return [];
      
      const unseen: {patient: Patient, msg: ChatMessage}[] = [];
      patients.forEach(p => {
          if (viewedUnseenPatients.has(p.id)) return;
          const msgs = messages[p.id] || [];
          const doctorMsgs = msgs.filter(m => (m.channel === 'TEAM' || !m.channel) && m.senderRole === 'DOCTOR');
          if (doctorMsgs.length > 0) {
              const lastDoctorMsg = doctorMsgs[doctorMsgs.length - 1];
              const threadLastMsg = msgs[msgs.length - 1];
              if (threadLastMsg.id === lastDoctorMsg.id) {
                  unseen.push({ patient: p, msg: lastDoctorMsg });
              }
          }
      });
      return unseen.sort((a,b) => b.msg.timestamp - a.msg.timestamp);
  }, [patients, messages, chatChannel, viewedUnseenPatients]);

  const handleChatListClick = (patient: Patient) => {
      setChatPatientId(patient.id);
  };

  const handleUnseenClick = (patient: Patient) => {
      setViewedUnseenPatients(prev => new Set(prev).add(patient.id));
      setChatChannel('DOCTOR');
      setChatPatientId(patient.id);
  };

  const renderSidebar = () => (
      <div className={`fixed top-4 left-4 bottom-4 w-[260px] bg-white/60 dark:bg-black/40 backdrop-blur-[32px] border border-white/80 dark:border-white/10 flex flex-col transform transition-transform duration-300 z-40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] md:relative md:top-0 md:left-0 md:bottom-0 md:h-full md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[110%]'} text-slate-800 dark:text-white ring-1 ring-black/5 dark:ring-white/5`}>
          <div className="p-6 flex items-center justify-between md:hidden">
              <Logo size="md" showText={true} textClassName="text-slate-800 dark:text-white" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-slate-800 dark:text-white/70 dark:hover:text-white"><X size={24}/></button>
          </div>
          <div className="p-8 pb-4 hidden md:block">
              <Logo size="md" showText={true} textClassName="text-slate-800 dark:text-white" />
          </div>
          <div className="h-px bg-slate-200 dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent mx-6 mb-4"></div>
          <nav className="flex-1 px-4 space-y-2">
              <button onClick={() => { setActiveTab('DASHBOARD'); setIsMobileMenuOpen(false); setViewingPatientId(null); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[20px] text-sm font-bold transition-all group relative overflow-hidden ${activeTab === 'DASHBOARD' ? 'bg-[#CCF5A6] text-[#0f172a] shadow-lg border border-[#CCF5A6]' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'}`}>
                  <LayoutDashboard size={20} className={activeTab === 'DASHBOARD' ? 'text-[#0f172a]' : 'text-slate-400 group-hover:text-slate-600 dark:text-white/50 dark:group-hover:text-white'} />
                  <span className="tracking-wide">Dashboard</span>
              </button>
              <button onClick={() => { setActiveTab('CHAT'); setIsMobileMenuOpen(false); setViewingPatientId(null); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[20px] text-sm font-bold transition-all group relative overflow-hidden ${activeTab === 'CHAT' ? 'bg-[#CCF5A6] text-[#0f172a] shadow-lg border border-[#CCF5A6]' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'}`}>
                  <MessageSquare size={20} className={activeTab === 'CHAT' ? 'text-[#0f172a]' : 'text-slate-400 group-hover:text-slate-600 dark:text-white/50 dark:group-hover:text-white'} />
                  <span className="tracking-wide">Communications</span>
              </button>
          </nav>
          <div className="p-4 mt-auto space-y-2">
              <button onClick={() => setShowHandoverModal(true)} className="w-full py-3 bg-[#191C1B] hover:bg-[#000] dark:bg-white/10 dark:hover:bg-white/20 border border-transparent dark:border-white/10 text-white rounded-[16px] text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg backdrop-blur-md">Shift Handover</button>
              <button onClick={onLogout} className="w-full py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:bg-white/40 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5 rounded-[16px] transition-colors text-sm font-bold"><LogOut size={18} /> Sign Out</button>
          </div>
      </div>
  );


  const activeChatPatient = patients.find(p => p.id === chatPatientId);
  const activeChatMessages = activeChatPatient ? (messages[activeChatPatient.id] || []).filter(m => 
      chatChannel === 'FAMILY' ? m.channel === 'FAMILY' : (m.channel === 'TEAM' || !m.channel)
  ) : [];

  return (
    <div className={`flex h-screen bg-[#C6D5DE] dark:bg-[#212121] font-sans text-[#191C1B] dark:text-white overflow-hidden transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
        {renderSidebar()}
        <div className="flex-1 flex flex-col min-w-0 relative">
            <div className="h-20 bg-[#FCFDF6] dark:bg-black/20 border-b border-[#DEE5D9] dark:border-white/5 flex items-center justify-between px-6 flex-shrink-0 z-30 relative transition-colors">
                <div className="flex items-center gap-4 md:hidden">
                    <MenuToggle isOpen={isMobileMenuOpen} toggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
                    <Logo size="sm" showText={true} />
                </div>
                <div className="hidden md:flex flex-col"><h1 className="text-2xl font-bold text-[#191C1B] dark:text-white">Nurse Station</h1><p className="text-sm text-[#44474F] dark:text-slate-400">Shift: 07:00 AM - 07:00 PM</p></div>
                <div className="flex items-center gap-4">
                    <ThemeToggle isDark={isDark} toggle={toggleTheme} />
                    <div className="relative">
                        <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2.5 bg-[#FCFDF6] dark:bg-white/10 rounded-full text-[#44474F] dark:text-white/70 hover:bg-[#EFF1E6] dark:hover:bg-white/20 border border-[#DEE5D9] dark:border-white/10 transition-colors relative">
                            <Bell size={24} />
                            {unreadNotifications.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#BA1A1A] rounded-full border border-[#FCFDF6] dark:border-black"></span>}
                        </button>
                        {isNotificationsOpen && (
                            <div className="absolute top-14 right-0 w-80 bg-[#FCFDF6] dark:bg-slate-900 rounded-[24px] shadow-xl border border-[#DEE5D9] dark:border-white/10 z-50 overflow-hidden flex flex-col max-h-[500px] animate-fade-in origin-top-right">
                                <div className="p-4 border-b border-[#EFF1E6] dark:border-white/5 flex justify-between items-center bg-[#F1F5F9]/50 dark:bg-black/20">
                                    <h3 className="font-bold text-[#191C1B] dark:text-white">Notifications</h3>
                                    <button onClick={() => setIsNotificationsOpen(false)} className="p-1 hover:bg-[#DEE5D9] dark:hover:bg-white/10 rounded-full transition-colors"><X size={16} className="text-[#44474F] dark:text-slate-400"/></button>
                                </div>
                                <div className="overflow-y-auto custom-scrollbar p-2 space-y-2">
                                    {unreadNotifications.length === 0 && <p className="text-center text-sm text-[#747871] dark:text-slate-500 py-8">No notifications</p>}
                                    {unreadNotifications.map(item => (
                                        <div key={item.id} className="p-3 bg-white dark:bg-white/5 border border-[#DEE5D9] dark:border-white/5 rounded-2xl flex items-start gap-2.5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="w-1.5 h-1.5 bg-[#BA1A1A] rounded-full mt-1.5 flex-shrink-0"></div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-[#191C1B] dark:text-white leading-tight">{item.message}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] text-[#44474F] dark:text-slate-400 font-bold opacity-60">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    <button onClick={() => onMarkNotificationRead(item.id)} className="text-[10px] text-[#006492] dark:text-emerald-400 hover:underline font-bold">Dismiss</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
                {viewingPatientId && viewingPatient ? (
                    <div className="flex-1 flex flex-col h-full bg-[#FCFDF6] dark:bg-white/5 overflow-hidden transition-colors">
                        <div className="px-6 py-4 border-b border-[#DEE5D9] dark:border-white/5 flex items-center gap-3">
                            <button onClick={() => setViewingPatientId(null)} className="p-1.5 hover:bg-[#EFF1E6] dark:hover:bg-white/10 rounded-full text-slate-500 hover:text-slate-900 transition-colors"><X size={18} /></button>
                            <span className="font-black text-slate-800 dark:text-white">Active Patient Overview</span>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <DoctorPatientDetail 
                               selectedPatient={viewingPatient}
                               user={user}
                               activeTab={detailTab}
                               setActiveTab={setDetailTab}
                               chatChannel={detailChatChannel}
                               setChatChannel={setDetailChatChannel}
                               aiSummary={aiSummary}
                               aiPatientId={viewingPatientId}
                               messages={messages}
                               events={events}
                               staff={staff}
                               reports={reports}
                               onSendMessage={onSendMessage}
                               setSelectedPatientId={setViewingPatientId}
                               activeNav="Patients"
                               onViewReport={() => {}}
                            />
                        </div>
                    </div>
                ) : activeTab === 'CHAT' ? (
                    <div className="flex-1 flex overflow-hidden">
                        {/* Thread List */}
                        <div className={`w-full md:w-[320px] lg:w-[380px] bg-[#FCFDF6] dark:bg-white/5 border-r border-[#DEE5D9] dark:border-white/5 flex flex-col h-full transition-all ${chatPatientId ? 'hidden md:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-[#DEE5D9] dark:border-white/5 space-y-3 bg-[#F1F5F9]/30 dark:bg-black/10">
                                <PillSlider 
                                    name="chat-type"
                                    options={[
                                        { id: 'DOCTOR', label: 'Doctor Chats' },
                                        { id: 'FAMILY', label: 'Family Chats' },
                                        { id: 'UNSEEN', label: 'Urgent Unseen' }
                                    ]}
                                    value={chatChannel}
                                    onChange={(id) => { setChatChannel(id as 'DOCTOR' | 'FAMILY' | 'UNSEEN'); setChatPatientId(null); }}
                                    className="p-1 bg-slate-200/50 dark:bg-white/5 rounded-2xl"
                                />
                                <ModernSearchBar 
                                    placeholder="Search patients..." 
                                    value={chatSearch} 
                                    onChange={(e) => setChatSearch(e.target.value)} 
                                    className="h-11 rounded-2xl"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {chatChannel === 'UNSEEN' ? (
                                    unseenMessagesList.length === 0 ? (
                                        <p className="text-center text-sm text-[#747871] dark:text-slate-500 py-12">No unseen doctor messages</p>
                                    ) : (
                                        unseenMessagesList.map(({ patient, msg }) => (
                                            <div key={patient.id} onClick={() => handleUnseenClick(patient)} className="p-4 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl cursor-pointer border border-transparent transition-all hover:border-[#EFF1E6] dark:hover:border-white/5">
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="font-bold text-[#191C1B] dark:text-white truncate text-sm">{patient.name}</span>
                                                    <span className="text-[10px] text-red-500 font-bold whitespace-nowrap bg-red-150 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Unseen</span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate font-medium">{msg.content}</p>
                                            </div>
                                        ))
                                    )
                                ) : (
                                    chatList.length === 0 ? (
                                        <p className="text-center text-sm text-[#747871] dark:text-slate-500 py-12">No threads found</p>
                                    ) : (
                                        chatList.map(({ patient, lastMsg }) => (
                                            <div key={patient.id} onClick={() => handleChatListClick(patient)} className={`p-4 rounded-2xl cursor-pointer border transition-all ${chatPatientId === patient.id ? 'bg-[#E3F2FD] border-[#90CAF9] dark:bg-white/10 dark:border-white/20' : 'hover:bg-slate-100 dark:hover:bg-white/5 border-transparent'}`}>
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="font-bold text-[#191C1B] dark:text-white truncate text-sm">{patient.name}</span>
                                                    {lastMsg && <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate font-medium">{lastMsg ? lastMsg.content : 'No messages yet'}</p>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </div>

                        {/* Active Thread */}
                        <div className={`flex-1 flex flex-col h-full bg-[#FCFDF6] dark:bg-[#1a1a1a] transition-all ${chatPatientId ? 'flex' : 'hidden md:flex'}`}>
                            {activeChatPatient ? (
                                <ChatWindow 
                                    patient={activeChatPatient} 
                                    messages={activeChatMessages} 
                                    onSendMessage={(text) => onSendMessage(activeChatPatient.id, text, false, chatChannel === 'FAMILY' ? 'FAMILY' : 'TEAM')} 
                                    currentUser={user} 
                                />
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                                    <MessageSquare size={64} className="opacity-15 mb-4" />
                                    <h3 className="text-lg font-bold">Communications Central</h3>
                                    <p className="text-xs max-w-sm mt-1">Select a patient card on the left sidebar to coordinate treatments with medical staff or update families.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6 md:space-y-8">
                        {/* Top Overview Cards */}
                        <div className="flex flex-row gap-4 md:gap-6 hover-container">
                            <div onClick={() => {
                                setShowAllPatientsModal(true);
                            }} className="flex-1 bg-[#FCFDF6] dark:bg-white/5 p-4 rounded-[20px] border border-[#DEE5D9] dark:border-white/10 flex items-center justify-between shadow-sm hover-card cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-all">
                                <div><p className="text-[10px] md:text-xs font-bold text-[#44474F] dark:text-slate-400 uppercase tracking-wider">All Patients</p><h3 className="text-2xl md:text-3xl font-bold text-[#191C1B] dark:text-white mt-1">{patients.length}</h3></div>
                                <div className="p-2 md:p-3 bg-[#E1EBF3] dark:bg-white/10 rounded-full text-[#006492] dark:text-emerald-400"><Activity size={20} className="md:w-6 md:h-6" /></div>
                            </div>
                            <div onClick={() => {
                                setShowAssignedPatientsModal(true);
                            }} className="flex-1 bg-[#FCFDF6] dark:bg-white/5 p-4 rounded-[20px] border border-[#DEE5D9] dark:border-white/10 flex items-center justify-between shadow-sm hover-card cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-all">
                                <div><p className="text-[10px] md:text-xs font-bold text-[#44474F] dark:text-slate-400 uppercase tracking-wider">Assigned</p><h3 className="text-2xl md:text-3xl font-bold text-[#191C1B] dark:text-white mt-1">{myPatients.length}</h3></div>
                                <div className="p-2 md:p-3 bg-[#E1EBF3] dark:bg-white/10 rounded-full text-[#006492] dark:text-emerald-400"><UserIcon size={20} className="md:w-6 md:h-6" /></div>
                            </div>
                        </div>

                        {/* Middle Content */}
                        <div className="flex flex-col gap-6 lg:gap-8 items-start w-full">
                            {/* Task Central block */}
                            <div id="task-board-section" className="w-full space-y-4 md:space-y-6">
                                <h3 className="text-lg font-bold text-[#191C1B] dark:text-white mb-2">Tasks Overview</h3>
                                <div className="flex items-center justify-center pb-2">
                                        <PillSlider 
                                            name="dashboard-task-filter"
                                            options={[
                                                { id: 'DUE', label: 'Due Tasks' },
                                                { id: 'ASSIGNED', label: 'Completed' }
                                            ]}
                                            value={dashboardFilter === 'DUE' ? 'DUE' : 'ASSIGNED'}
                                            onChange={(id) => setDashboardFilter(id === 'DUE' ? 'DUE' : 'COMPLETED')}
                                            className="p-1 bg-slate-200/50 dark:bg-white/5 rounded-2xl"
                                        />
                                    </div>
                                    
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                                        {dashboardFilter === 'DUE' ? (
                                            dueTasks.length === 0 ? (
                                                <div className="col-span-full"><p className="p-8 text-center text-sm text-[#747871] dark:text-slate-500 bg-[#FCFDF6] dark:bg-white/5 border border-dashed rounded-[24px]">All tasks completed! Excellent work.</p></div>
                                            ) : (
                                                dueTasks.map(task => (
                                                    <NurseTaskCard 
                                                        key={task.id}
                                                        task={task}
                                                        patient={patients.find(p => p.id === task.patientId)}
                                                        doctor={staff.find(s => s.id === task.doctorId)}
                                                        timeText={getTimeRemaining(task).text}
                                                        timeColor={getTimeRemaining(task).color}
                                                        onSelect={() => setSelectedTask(task)}
                                                    />
                                                ))
                                            )
                                        ) : (
                                            completedTasks.length === 0 ? (
                                                <div className="col-span-full"><p className="p-8 text-center text-sm text-[#747871] dark:text-slate-500 bg-[#FCFDF6] dark:bg-white/5 border border-dashed rounded-[24px]">No completed tasks on this shift.</p></div>
                                            ) : (
                                                completedTasks.map(task => (
                                                    <NurseTaskCard 
                                                        key={task.id}
                                                        task={task}
                                                        patient={patients.find(p => p.id === task.patientId)}
                                                        doctor={staff.find(s => s.id === task.doctorId)}
                                                        timeText="Completed"
                                                        timeColor="text-green-600 dark:text-emerald-400"
                                                        onSelect={() => setSelectedTask(task)}
                                                    />
                                                ))
                                            )
                                        )}
                                    </div>
                                </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Task Details Drawer */}
        {selectedTask && (
            <TaskDetailPanel 
                task={selectedTask}
                isOpen={!!selectedTask}
                patient={patients.find(p => p.id === selectedTask.patientId)}
                doctor={staff.find(s => s.id === selectedTask.doctorId)}
                onClose={() => setSelectedTask(null)}
                onAction={(taskId, action, data) => handleTaskAction(taskId, action as 'START' | 'COMPLETE', data)}
            />
        )}

        <VitalsEntryModal 
            isOpen={showVitalsModal}
            onClose={() => setShowVitalsModal(false)}
            patient={patients.find(p => p.id === selectedPatientId)}
            onSubmit={(data) => {
                if (selectedPatientId) {
                    saveVitals(selectedPatientId, data.vitals);
                    setShowVitalsModal(false);
                }
            }}
        />

        <ShiftHandoverModal 
            isOpen={showHandoverModal}
            onClose={() => setShowHandoverModal(false)}
            staff={staff}
            user={user}
            patients={myPatients}
            onSubmit={(targetId, patientIds, notes) => {
                onShiftHandover(targetId, patientIds, notes);
                setShowHandoverModal(false);
                alert('Handover documentation submitted successfully.');
            }}
        />

        <UserProfileModal 
            user={user}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onUpdateUser={onUpdateUser}
        />

        <Modal 
            isOpen={showAllPatientsModal}
            onClose={() => setShowAllPatientsModal(false)}
            title="All Ward Patients"
            icon={<UserIcon />}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {patients.map(p => (
                    <div key={p.id} onClick={() => {
                        handleSelectPatient(p.id);
                        setShowAllPatientsModal(false);
                    }} className="bg-[#FCFDF6] dark:bg-white/5 p-4 rounded-[20px] border border-[#DEE5D9] dark:border-white/10 hover:bg-[#F5F9FF] dark:hover:bg-white/10 hover:border-[#D7E3FF] transition-all cursor-pointer group">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-[#E1EBF3] dark:bg-white/10 text-[#00325B] dark:text-white flex items-center justify-center font-bold text-lg group-hover:bg-[#CCF5A6] group-hover:text-[#072100] transition-colors">{p.name.charAt(0)}</div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-[#191C1B] dark:text-white text-base truncate group-hover:text-[#006492] dark:group-hover:text-emerald-400">{p.name}</h4>
                                    <span className="text-[10px] text-[#44474F] dark:text-slate-400 font-mono bg-[#EFF1E6] dark:bg-white/5 px-2 py-0.5 rounded-md border dark:border-white/10">{p.id}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-[#44474F] dark:text-slate-400">
                                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-[#006492] dark:text-emerald-400" /><span className="truncate">{p.currentLocation}</span></div>
                                <div className="flex items-center gap-1.5"><Activity size={12} className="text-[#006492] dark:text-emerald-400" /><span className="truncate">{p.diagnosis || 'Under Evaluation'}</span></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Modal>

        <Modal 
            isOpen={showAssignedPatientsModal}
            onClose={() => setShowAssignedPatientsModal(false)}
            title="Assigned Patients"
            icon={<UserIcon />}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myPatients.length > 0 ? (
                    myPatients.map(p => (
                        <div key={p.id} onClick={() => {
                            handleSelectPatient(p.id);
                            setShowAssignedPatientsModal(false);
                        }} className="bg-[#FCFDF6] dark:bg-white/5 p-4 rounded-[20px] border border-[#DEE5D9] dark:border-white/10 hover:bg-[#F5F9FF] dark:hover:bg-white/10 hover:border-[#D7E3FF] transition-all cursor-pointer group">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-12 rounded-xl bg-[#E1EBF3] dark:bg-white/10 text-[#00325B] dark:text-white flex items-center justify-center font-bold text-lg group-hover:bg-[#CCF5A6] group-hover:text-[#072100] transition-colors">{p.name.charAt(0)}</div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-[#191C1B] dark:text-white text-base truncate group-hover:text-[#006492] dark:group-hover:text-emerald-400">{p.name}</h4>
                                        <span className="text-[10px] text-[#44474F] dark:text-slate-400 font-mono bg-[#EFF1E6] dark:bg-white/5 px-2 py-0.5 rounded-md border dark:border-white/10">{p.id}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 text-xs text-[#44474F] dark:text-slate-400">
                                    <div className="flex items-center gap-1.5"><MapPin size={12} className="text-[#006492] dark:text-emerald-400" /><span className="truncate">{p.currentLocation}</span></div>
                                    <div className="flex items-center gap-1.5"><Activity size={12} className="text-[#006492] dark:text-emerald-400" /><span className="truncate">{p.diagnosis || 'Under Evaluation'}</span></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full p-8 text-center text-sm text-[#747871] dark:text-slate-500 bg-[#FCFDF6] dark:bg-white/5 border border-dashed rounded-[24px]">
                        No patients currently assigned.
                    </div>
                )}
            </div>
        </Modal>
    </div>
  );
};

export default NurseDashboard;
