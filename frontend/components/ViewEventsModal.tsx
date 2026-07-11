
import React, { useState } from 'react';
import { CareEvent, Patient, User } from '../types';
import { X, Calendar, Clock, CheckCircle2, AlertCircle, AlertTriangle, ChevronRight, ArrowLeft, User as UserIcon, Stethoscope, Pill, Activity, MapPin, Paperclip, ClipboardCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  events: CareEvent[];
  patients: Patient[];
  staff: User[];
}

const ViewEventsModal: React.FC<Props> = ({ isOpen, onClose, events, patients, staff }) => {
  const [selectedEvent, setSelectedEvent] = useState<CareEvent | null>(null);

  if (!isOpen) return null;

  const getPatient = (id: string) => patients.find(p => p.id === id);
  const getStaff = (id: string) => staff.find(s => s.id === id);

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'COMPLETED': return 'bg-[#C4ED9C] text-[#072100] border-[#C4ED9C]';
          case 'PENDING': return 'bg-[#FFDDB3] text-[#291800] border-[#FFDDB3]';
          case 'MISSED': return 'bg-[#FFDAD6] text-[#410002] border-[#FFDAD6]';
          case 'IN_PROGRESS': return 'bg-[#E8DEF8] text-[#1D192B] border-[#E8DEF8]';
          default: return 'bg-[#E0E5D9] text-[#44474F]';
      }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white/10 backdrop-blur-2xl w-[95%] max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-scale-in text-white font-sans border border-white/20 will-change-transform">
        
        {/* Header */}
        <div className="px-6 py-6 border-b border-white/10 flex justify-between items-center flex-shrink-0 bg-white/5">
            <div className="flex items-center gap-3">
                {selectedEvent ? (
                    <button onClick={() => setSelectedEvent(null)} className="p-2 bg-white/10 rounded-full text-white/70 hover:bg-white/20 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                ) : null}
                <div>
                    <h3 className="font-normal text-xl md:text-2xl tracking-tight text-white">
                        {selectedEvent ? 'Event Details' : 'Care Events'}
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">
                        {selectedEvent ? `ID: ${selectedEvent.id.split('-').pop()}` : `Total: ${events.length} records found`}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
            {!selectedEvent ? (
                /* --- LIST VIEW --- */
                <div className="space-y-3">
                    {events.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-bold">No care events created yet.</p>
                        </div>
                    ) : (
                        events.map(evt => {
                            const patient = getPatient(evt.patientId);
                            const nurse = getStaff(evt.nurseId);
                            
                            return (
                                <div 
                                    key={evt.id}
                                    onClick={() => setSelectedEvent(evt)}
                                    className="bg-white/5 p-5 rounded-[24px] border border-white/10 hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.98] backdrop-blur-sm"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border rounded-full flex items-center gap-1 ${getStatusColor(evt.status)}`}>
                                                {evt.status}
                                            </span>
                                            {evt.priority === 'URGENT' && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#FFDAD6] text-[#410002] rounded-full flex items-center gap-1">
                                                    <AlertTriangle size={10} /> Urgent
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono font-medium">
                                            {new Date(evt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-lg border border-white/10">
                                            {patient?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg group-hover:text-emerald-300 transition-colors">{patient?.name}</h4>
                                            <p className="text-xs text-gray-400 font-bold flex items-center gap-1"><MapPin size={12}/> {patient?.currentLocation}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                        <div className="text-xs text-gray-400 flex items-center gap-1.5">
                                            <Stethoscope size={14} className="text-gray-500"/>
                                            Assigned: <span className="font-bold text-gray-200">{nurse?.name}</span>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-500 group-hover:text-white transition-colors"/>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* --- DETAIL VIEW --- */
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Patient Info Card */}
                    <div className="bg-white/5 p-6 rounded-[24px] border border-white/10 backdrop-blur-sm">
                        <div className="flex items-start justify-between">
                             <div className="flex items-center gap-4">
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getPatient(selectedEvent.patientId)?.name || '')}&background=random`} className="w-14 h-14 rounded-[18px] object-cover" alt="" />
                                <div>
                                    <h2 className="text-xl font-normal text-white">{getPatient(selectedEvent.patientId)?.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold bg-white/10 text-gray-300 px-2 py-1 rounded-md border border-white/5">
                                            {getPatient(selectedEvent.patientId)?.currentLocation}
                                        </span>
                                    </div>
                                </div>
                             </div>
                             <div className="text-right">
                                 <div className={`inline-flex px-3 py-1.5 rounded-full font-bold text-xs border uppercase tracking-wider mb-2 ${getStatusColor(selectedEvent.status)}`}>
                                     {selectedEvent.status}
                                 </div>
                                 <p className="text-xs text-gray-400 font-mono">
                                     {new Date(selectedEvent.timestamp).toLocaleString()}
                                 </p>
                             </div>
                        </div>
                    </div>

                    {/* Staff & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-5 rounded-[24px] border border-white/10 backdrop-blur-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><UserIcon size={12}/> Assigned Nurse</p>
                            <div className="flex items-center gap-3">
                                <img src={getStaff(selectedEvent.nurseId)?.avatar} className="w-8 h-8 rounded-full" alt="" />
                                <p className="text-sm font-bold text-white">{getStaff(selectedEvent.nurseId)?.name}</p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-5 rounded-[24px] border border-white/10 backdrop-blur-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><AlertCircle size={12}/> Priority</p>
                            <p className={`text-sm font-bold ${selectedEvent.priority === 'URGENT' ? 'text-red-400' : 'text-white'}`}>
                                {selectedEvent.priority}
                            </p>
                        </div>
                    </div>

                    {/* Detailed Execution Checklist */}
                    <div className="bg-white/5 p-6 rounded-[24px] border border-white/10 backdrop-blur-sm">
                        <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <Activity size={16}/> Vitals & Checks Execution
                        </h4>
                        
                        {selectedEvent.checklist && selectedEvent.checklist.length > 0 ? (
                            <div className="space-y-3">
                                {selectedEvent.checklist.map((check, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-3 rounded-[16px] ${check.completed ? 'bg-emerald-900/30 border border-emerald-500/20' : 'bg-white/5'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1 rounded-full ${check.completed ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                                                {check.completed ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{check.item}</p>
                                                {check.timestamp && (
                                                    <p className="text-[10px] text-emerald-400 font-mono">
                                                        Done at {new Date(check.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {check.value && (
                                            <span className="text-sm font-bold text-emerald-300 bg-emerald-900/40 px-3 py-1 rounded-lg border border-emerald-500/30 shadow-sm">
                                                {check.value}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : selectedEvent.checks.length > 0 ? (
                            // Fallback for legacy events without checklist structure
                            <div className="grid grid-cols-2 gap-3">
                                {selectedEvent.checks.map(check => (
                                    <div key={check} className="flex items-center gap-3 p-3 bg-white/5 rounded-[16px] border border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm font-bold text-white uppercase">{check}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-xs text-gray-500 italic">No specific checks requested.</p>}
                    </div>

                    {/* Medications */}
                    <div className="bg-white/5 p-6 rounded-[24px] border border-white/10 backdrop-blur-sm">
                        <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <Pill size={16}/> Medications
                        </h4>
                        {selectedEvent.medications.length > 0 ? (
                            <div className="space-y-2">
                                {selectedEvent.medications.map((med, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-white/5 rounded-[16px] border border-white/5">
                                        <div>
                                            <p className="text-sm font-bold text-white">{med.name}</p>
                                            <p className="text-xs text-gray-400">{med.dose}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${med.status === 'GIVEN' ? 'bg-[#C4ED9C] text-[#072100]' : 'bg-white/10 text-gray-400'}`}>
                                            {med.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-xs text-gray-500 italic">No medications ordered.</p>}
                    </div>

                    {/* Nurse Notes & Attachments */}
                    {(selectedEvent.nurseNotes || (selectedEvent.attachments && selectedEvent.attachments.length > 0)) && (
                        <div className="bg-blue-900/20 p-5 rounded-[24px] border border-blue-500/20 backdrop-blur-sm">
                            <h4 className="text-xs font-bold text-blue-300 uppercase mb-3 tracking-widest flex items-center gap-2">
                                <ClipboardCheck size={14} /> Medical Staff Report
                            </h4>
                            
                            {selectedEvent.nurseNotes && (
                                <p className="text-sm text-blue-100 leading-relaxed font-medium mb-3">"{selectedEvent.nurseNotes}"</p>
                            )}

                            {selectedEvent.attachments && selectedEvent.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedEvent.attachments.map((file, i) => (
                                        <div key={i} className="bg-white/10 text-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-blue-500/30">
                                            <Paperclip size={12} /> {file}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Original Instructions (if different from execution) */}
                    {selectedEvent.notes && (
                        <div className="bg-yellow-900/20 p-5 rounded-[24px] backdrop-blur-sm border border-yellow-500/20">
                            <h4 className="text-xs font-bold text-yellow-500 uppercase mb-2 tracking-widest">Doctor's Original Notes</h4>
                            <p className="text-sm text-yellow-100 leading-relaxed font-medium">{selectedEvent.notes}</p>
                        </div>
                    )}

                </div>
            )}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
      `}</style>
    </div>
  );
};

export default ViewEventsModal;
