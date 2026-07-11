import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, MapPin, Activity, Sparkles, ChevronLeft, ClipboardList, CheckSquare, Pill, Paperclip, Clock, CheckCircle2, BrainCircuit, Send, Loader2, Bot, Info } from 'lucide-react';
import PillSlider from '../PillSlider';
import PatientTimeline from '../PatientTimeline';
import ChatWindow from '../ChatWindow';
import DetailedRecoveryChart from './DetailedRecoveryChart';
import { Patient, User, ChatMessage, CareEvent, LabReport, CareEventChecklistItem } from '../../types';
import { generateClinicalAnalysis, askAiConsultant } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';
import AnimatedInput from '../AnimatedInput';

interface Props {
  selectedPatient: Patient;
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  chatChannel: 'TEAM' | 'FAMILY';
  setChatChannel: (channel: 'TEAM' | 'FAMILY') => void;
  aiSummary: string;
  aiPatientId: string;
  messages: Record<string, ChatMessage[]>;
  events: CareEvent[];
  staff: User[];
  reports: LabReport[];
  onSendMessage: (pid: string, txt: string, isAttach?: boolean, channel?: 'TEAM' | 'FAMILY') => void;
  setSelectedPatientId: (id: string | null) => void;
  activeNav: string;
  onViewReport: (id: string) => void;
}

const DoctorPatientDetail: React.FC<Props> = ({ 
    selectedPatient, user, activeTab, setActiveTab, chatChannel, setChatChannel, 
    aiSummary, aiPatientId, messages, events, staff, reports, onSendMessage, setSelectedPatientId, activeNav, onViewReport
}) => {
  
  const [analysis, setAnalysis] = useState<string>('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isAiConsulting, setIsAiConsulting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'ANALYSIS' && !analysis) {
        setLoadingAnalysis(true);
        const patientEvents = events.filter(e => e.patientId === selectedPatient.id);
        const patientReports = reports.filter(r => r.patientId === selectedPatient.id);
        generateClinicalAnalysis(selectedPatient, patientEvents, patientReports).then(result => {
            setAnalysis(result);
            setLoadingAnalysis(false);
        });
    }
  }, [activeTab, selectedPatient, events, reports, analysis]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory, isAiConsulting]);

  const handleAiConsult = async () => {
      if (!aiChatInput.trim() || isAiConsulting) return;
      
      const question = aiChatInput;
      setAiChatInput('');
      setAiChatHistory(prev => [...prev, { role: 'user', text: question }]);
      setIsAiConsulting(true);

      const response = await askAiConsultant(selectedPatient, question, aiChatHistory);
      
      setAiChatHistory(prev => [...prev, { role: 'model', text: response }]);
      setIsAiConsulting(false);
  };

  if (activeNav === 'Analytics' && activeTab === 'ANALYTICS') {
      return (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-scale-in">
                <div className="bg-[#EFF1E6] p-6 flex-shrink-0 z-10 border-b border-[#DEE5D9]">
                <button onClick={() => setSelectedPatientId(null)} className="text-xs font-bold text-[#E65100] bg-[#FFF3E0] px-4 py-2 rounded-full flex items-center gap-2 hover:bg-[#FFE0B2] transition-colors border border-[#FFCC80] mb-4">
                    <ChevronLeft size={16} /> Back to list
                </button>
                {selectedPatient && <DetailedRecoveryChart patient={selectedPatient} />}
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <h3 className="text-lg font-bold text-[#191C1B] mb-4">Vitals History</h3>
                    <div className="bg-[#FCFDF6] p-6 rounded-[24px] border border-[#DEE5D9]">
                        <p className="text-sm text-[#747871] italic">Detailed vitals graph would appear here.</p>
                    </div>
            </div>
        </div>
      );
  }

  const patientEvents = events
    .filter(e => e.patientId === selectedPatient.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-scale-in">
        <div className="bg-[#EFF1E6] p-4 flex-shrink-0 z-10 rounded-b-[24px] mb-2 shadow-sm transition-all">
            <div className="max-w-3xl mx-auto w-full">
                {selectedPatient && (
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="flex items-center gap-4">
                             <button onClick={() => setSelectedPatientId(null)} className="text-xs font-bold text-[#072100] bg-[#C4ED9C] p-2.5 rounded-full flex items-center justify-center hover:bg-[#B8E090] transition-colors shadow-sm" title="Back to list">
                                <ArrowRight className="rotate-180" size={20} /> 
                            </button>
                            <h2 className="text-2xl font-heading font-bold text-[#191C1B] tracking-tight">{selectedPatient.name}</h2>
                        </div>
                        
                        <PillSlider 
                            name="detail-tabs"
                            options={[
                                { id: 'TIMELINE', label: 'Timeline' },
                                { id: 'CARE', label: 'Activity' },
                                { id: 'ANALYSIS', label: 'AI Intelligence' },
                                { id: 'CHAT', label: 'Messages' },
                                { id: 'INFO', label: 'Info' }
                            ]}
                            value={activeTab}
                            onChange={(val) => setActiveTab(val)}
                        />
                    </div>
                )}
            </div>
        </div>

        <div className={`flex-1 overflow-y-auto custom-scrollbar pb-6 ${activeTab === 'CHAT' ? 'px-0' : 'px-6'}`}>
            <div className={`mx-auto w-full transition-all duration-300 ease-in-out ${activeTab === 'CHAT' ? 'max-w-full' : 'max-w-3xl'}`}>
                {selectedPatient && (
                    <>
                        {/* 1. TIMELINE */}
                        {activeTab === 'TIMELINE' && (
                            <PatientTimeline patient={selectedPatient} />
                        )}

                        {/* 2. CARE ACTIVITY */}
                        {activeTab === 'CARE' && (
                            <div className="space-y-4">
                                {patientEvents.length === 0 ? (
                                    <div className="text-center py-12 text-[#747871] bg-[#FCFDF6] rounded-[24px] border border-dashed border-[#DEE5D9]">
                                        <ClipboardList size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm font-bold">No care activity recorded.</p>
                                    </div>
                                ) : (
                                    patientEvents.map((evt) => (
                                        <div key={evt.id} className="bg-[#FCFDF6] p-5 rounded-[24px] border border-[#DEE5D9] shadow-sm hover:border-[#006D42] transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${evt.status === 'COMPLETED' ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]' : 'bg-[#EFF1E6] text-[#44474F] border-[#DEE5D9]'}`}>
                                                        {evt.status === 'COMPLETED' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-[#747871] uppercase tracking-wider block mb-0.5">
                                                            {new Date(evt.timestamp).toLocaleString()}
                                                        </span>
                                                        <h4 className="text-sm font-bold text-[#191C1B]">
                                                            {evt.medications.length > 0 ? 'Medication Administration' : 'Nursing Care Task'}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${evt.priority === 'URGENT' ? 'bg-[#FFDAD6] text-[#410002] border-[#FFB4AB]' : 'bg-[#E0F2F1] text-[#004D40] border-[#B2DFDB]'}`}>
                                                    {evt.priority}
                                                </span>
                                            </div>

                                            <div className="pl-[52px] space-y-3">
                                                {evt.medications.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {evt.medications.map((m, i) => (
                                                            <div key={i} className="flex items-center gap-2 bg-[#FFF8E1] text-[#FF6F00] px-3 py-1.5 rounded-xl text-xs font-bold border border-[#FFE082]">
                                                                <Pill size={12} /> {m.name} ({m.dose})
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {(evt.checklist || evt.checks).length > 0 && (
                                                    <div className="space-y-1">
                                                        {(evt.checklist || evt.checks.map(c => ({ item: c, completed: false, value: '' }))).map((item: CareEventChecklistItem, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-2 text-sm text-[#44474F]">
                                                                <CheckSquare size={14} className={item.completed ? 'text-[#006D42]' : 'text-[#747871]'} />
                                                                <span className={item.completed ? 'line-through opacity-70' : ''}>{item.item}</span>
                                                                {item.value && <span className="text-[10px] font-bold bg-[#E0F2F1] text-[#00695C] px-1.5 py-0.5 rounded">{item.value}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {evt.nurseNotes && (
                                                    <div className="bg-[#EFF1E6] p-3 rounded-xl text-xs text-[#191C1B] font-medium border border-[#DEE5D9]">
                                                        "{evt.nurseNotes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 3. AI ANALYSIS & CONSULTANT */}
                        {activeTab === 'ANALYSIS' && (
                            <div className="space-y-6">
                                {/* Static Clinical Insights Card */}
                                <div className="bg-[#191C1B] text-[#E0E5D9] rounded-[32px] p-8 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#006D42] opacity-20 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none group-hover:opacity-30 transition-opacity"></div>
                                    
                                    <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-[#006D42] text-[#C4ED9C] flex items-center justify-center shadow-glow">
                                            <BrainCircuit size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-heading font-bold text-white">Clinical Intelligence</h3>
                                            <p className="text-xs text-gray-400">Deep analysis powered by Gemini 3 Pro</p>
                                        </div>
                                        <button 
                                            onClick={() => {setAnalysis(''); setLoadingAnalysis(true);}} 
                                            className="text-white/40 hover:text-white transition-colors"
                                            title="Re-analyze"
                                        >
                                            <Clock size={16} />
                                        </button>
                                    </div>

                                    {loadingAnalysis ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center animate-pulse">
                                            <Sparkles size={32} className="text-[#C4ED9C] mb-3" />
                                            <p className="text-sm font-bold text-white tracking-wide">Synthesizing clinical data...</p>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-strong:text-[#C4ED9C] max-w-none text-sm leading-relaxed relative z-10 animate-fade-in">
                                            <ReactMarkdown>{analysis || "Analysis unavailable."}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>

                                {/* Interactive AI Consultant Chat */}
                                <div className="bg-white dark:bg-slate-900/60 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-[500px]">
                                    <div className="bg-slate-50 dark:bg-white/5 p-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                            <Bot size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white">AI Clinical Consultant</h4>
                                            <p className="text-[10px] text-slate-500 font-medium">Ask specific questions about this patient's case</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                                        {aiChatHistory.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-center px-8 text-slate-400">
                                                <Info size={32} className="mb-2 opacity-20" />
                                                <p className="text-xs font-medium">Try asking: "What are the risks for discharge today?" or "Summarize vitals trend over the last 24h."</p>
                                            </div>
                                        )}
                                        {aiChatHistory.map((chat, idx) => (
                                            <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                                    chat.role === 'user' 
                                                    ? 'bg-indigo-600 text-white shadow-md' 
                                                    : 'bg-white dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/5 shadow-sm'
                                                }`}>
                                                    <ReactMarkdown>{chat.text}</ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                        {isAiConsulting && (
                                            <div className="flex justify-start">
                                                <div className="bg-white dark:bg-white/10 p-3 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-2">
                                                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                                                    <span className="text-xs text-slate-500 italic">Consulting...</span>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    <div className="p-4 bg-white dark:bg-black/20 border-t border-slate-200 dark:border-white/10">
                                        <div className="flex gap-2 items-center">
                                            <div className="flex-1">
                                                <AnimatedInput 
                                                    value={aiChatInput}
                                                    onChange={e => setAiChatInput(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAiConsult()}
                                                    placeholder="Ask the AI about this case..."
                                                    className="!bg-slate-100 dark:!bg-white/5 !text-left pl-4"
                                                    style={{ textAlign: 'left' }}
                                                />
                                            </div>
                                            <button 
                                                onClick={handleAiConsult}
                                                disabled={!aiChatInput.trim() || isAiConsulting}
                                                className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-md active:scale-95"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. MESSAGES */}
                        {activeTab === 'CHAT' && (
                            <div className="flex flex-col h-full gap-4">
                                <div className="flex justify-center flex-shrink-0 animate-fade-in mt-2">
                                    <PillSlider 
                                        name="chat-channel"
                                        options={[
                                            { id: 'TEAM', label: 'Care Team' },
                                            { id: 'FAMILY', label: 'Family' }
                                        ]}
                                        value={chatChannel}
                                        onChange={(val) => setChatChannel(val as 'TEAM' | 'FAMILY')}
                                    />
                                </div>
                                <div className="h-[500px] bg-[#FCFDF6] border-t border-b md:border border-[#DEE5D9] md:rounded-[24px] overflow-hidden shadow-sm -mx-2 md:mx-0 w-auto">
                                    <ChatWindow 
                                        patient={selectedPatient} 
                                        currentUser={user} 
                                        messages={(messages[selectedPatient.id] || []).filter(m => chatChannel === 'TEAM' ? (m.channel === 'TEAM' || !m.channel) : m.channel === 'FAMILY')} 
                                        onSendMessage={(txt, isAttach) => onSendMessage(selectedPatient.id, txt, isAttach, chatChannel)} 
                                        className="!rounded-none !border-none !shadow-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* 5. INFO */}
                        {activeTab === 'INFO' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[#FCFDF6] p-6 rounded-[24px] border border-[#DEE5D9]">
                                    <h4 className="font-bold text-[#191C1B] mb-4 text-sm uppercase tracking-wider">Demographics</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between"><span className="text-[#747871]">Age/Gender</span> <span className="font-bold text-[#191C1B]">{selectedPatient.age} / {selectedPatient.gender}</span></div>
                                        <div className="flex justify-between"><span className="text-[#747871]">Blood Group</span> <span className="font-bold text-[#191C1B]">{selectedPatient.bloodGroup || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-[#747871]">Contact</span> <span className="font-bold text-[#191C1B]">{selectedPatient.emergencyContactPhone || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-[#747871]">Aadhar</span> <span className="font-bold text-[#191C1B]">{selectedPatient.aadharNumber || 'N/A'}</span></div>
                                    </div>
                                </div>
                                <div className="bg-[#FCFDF6] p-6 rounded-[24px] border border-[#DEE5D9]">
                                    <h4 className="font-bold text-[#191C1B] mb-4 text-sm uppercase tracking-wider">Clinical Context</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between"><span className="text-[#747871]">Diagnosis</span> <span className="font-bold text-[#191C1B]">{selectedPatient.diagnosis || 'Pending'}</span></div>
                                        <div className="flex justify-between"><span className="text-[#747871]">Condition</span> <span className="font-bold text-[#191C1B]">{selectedPatient.condition}</span></div>
                                        <div className="flex justify-between"><span className="text-[#747871]">Admission</span> <span className="font-bold text-[#191C1B]">{new Date(selectedPatient.admissionTimestamp).toLocaleDateString()}</span></div>
                                        <div className="flex justify-between"><span className="text-[#747871]">Allergies</span> <span className="font-bold text-[#BA1A1A]">{selectedPatient.allergies?.join(', ') || 'None'}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default DoctorPatientDetail;