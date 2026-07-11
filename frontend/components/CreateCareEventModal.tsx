import React, { useState, useEffect } from 'react';
import { Patient, User, CareEventCreationData } from '../types';
import { X, Clock, Plus, Trash2, CheckSquare, Pill, Activity, AlertTriangle, Syringe, Thermometer, Wind, User as UserIcon, MapPin, ClipboardList, ArrowRight, Check, ListPlus, Upload, BriefcaseMedical, ChevronDown, Filter, Zap, ShieldAlert } from 'lucide-react';
import ModernTimePicker from './ModernTimePicker';
import AnimatedInput from './AnimatedInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | undefined; 
  patients: Patient[]; 
  medicalStaff: User[]; 
  onSave: (eventData: CareEventCreationData) => void;
}

const QUICK_CHECKS = [
  { id: 'Check BP', label: 'Check BP', icon: Activity, color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { id: 'Glucometer', label: 'Glucometer', icon: Activity, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'Check SpO2', label: 'Check SpO2', icon: Wind, color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'Temperature', label: 'Temperature', icon: Thermometer, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'ECG 12-Lead', label: 'ECG 12-Lead', icon: Activity, color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { id: 'Nebulization', label: 'Nebulization', icon: Wind, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { id: 'Dressing Change', label: 'Dressing Change', icon: CheckSquare, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'Blood Sample', label: 'Blood Sample', icon: Syringe, color: 'bg-red-100 text-red-700 border-red-200' },
];

const CreateCareEventModal: React.FC<Props> = ({ isOpen, onClose, patient, patients, medicalStaff, onSave }) => {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState('');
  const [meds, setMeds] = useState<{name: string, dose: string}[]>([]);
  const [medInput, setMedInput] = useState({ name: '', dose: '' });
  const [assignedNurseId, setAssignedNurseId] = useState('');
  const [staffCategoryFilter, setStaffCategoryFilter] = useState('');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT'>('ROUTINE');
  const [notes, setNotes] = useState('');
  const [scheduledTimes, setScheduledTimes] = useState<string[]>([]);
  const [timeInput, setTimeInput] = useState(''); 
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (patient) {
            setSelectedPatientId(patient.id);
            if (patient.assignedNurseIds && patient.assignedNurseIds.length > 0) {
                setAssignedNurseId(patient.assignedNurseIds[0]);
            }
        } else {
            setSelectedPatientId('');
            setAssignedNurseId('');
        }
        setScheduledTimes([]);
        setChecklistItems([]);
        setCustomItem('');
        setMeds([]);
        setNotes('');
        setPriority('ROUTINE');
        setTimeInput('');
        setStaffCategoryFilter('');
    }
  }, [isOpen, patient]);

  if (!isOpen) return null;

  const activePatient = patients.find(p => p.id === selectedPatientId);
  const staffCategories = ['Nurse', 'Wardboy', 'Paramedic', 'Technologist', 'Staff Intern'];
  const filteredStaff = medicalStaff.filter(n => {
      if (!staffCategoryFilter) return true;
      return n.staffCategory === staffCategoryFilter;
  });

  const addChecklistItem = (item: string) => {
      if (item && !checklistItems.includes(item)) {
          setChecklistItems([...checklistItems, item]);
          setCustomItem('');
      }
  };

  const removeChecklistItem = (item: string) => {
      setChecklistItems(checklistItems.filter(i => i !== item));
  };

  const toggleQuickCheck = (item: string) => {
      if (checklistItems.includes(item)) removeChecklistItem(item);
      else addChecklistItem(item);
  };

  const addMed = () => {
    if (medInput.name && medInput.dose) {
      setMeds([...meds, { ...medInput }]);
      setMedInput({ name: '', dose: '' });
    }
  };

  const removeMed = (idx: number) => {
    setMeds(meds.filter((_, i) => i !== idx));
  };

  const addTime = (timeVal: string) => {
      if (timeVal && !scheduledTimes.includes(timeVal)) {
          setScheduledTimes([...scheduledTimes, timeVal].sort());
      }
  };

  const handleSubmit = () => {
    if (!selectedPatientId || !assignedNurseId) return;
    onSave({
      patientId: selectedPatientId,
      nurseId: assignedNurseId,
      priority,
      checks: checklistItems,
      checklist: checklistItems.map(item => ({ item, completed: false })),
      medications: meds.map(m => ({ ...m, status: 'PENDING' })),
      notes,
      scheduledTimes: scheduledTimes.length > 0 ? scheduledTimes : ['Immediate'],
      timestamp: Date.now()
    });
    onClose();
  };

  const displayTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      const p = h >= 12 ? 'PM' : 'AM';
      const hr = h % 12 || 12;
      return `${hr}:${String(m).padStart(2, '0')} ${p}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[24px] transition-all duration-500">
      <div className="bg-white/10 backdrop-blur-3xl w-[95%] max-w-4xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-scale-in text-white font-sans border border-white/20 will-change-transform">
        
        {/* Header - Thinned */}
        <div className="px-10 py-4 flex justify-between items-center flex-shrink-0 border-b border-white/10 bg-white/5">
          <div>
            <h3 className="font-heading font-bold text-xl tracking-tight text-white">Create Care Order</h3>
            <p className="text-xs text-gray-300 opacity-80">Finalize treatment and nursing tasks</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar space-y-6">
            
            {/* 1. Context Selection & Priority */}
            <div className="bg-white/5 p-6 rounded-[28px] border border-white/10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient and Staff Selection */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-2 block tracking-widest">Patient</label>
                            <div className="relative">
                                <select 
                                    className="solid-input h-[45px] text-base"
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                >
                                    <option value="">Select Patient</option>
                                    {patients.map(p => <option key={p.id} value={p.id} className="text-black font-bold">{p.name}</option>)}
                                </select>
                                <UserIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-2 block tracking-widest">Assign Direct Member</label>
                            <div className="relative">
                                <select 
                                    className="solid-input h-[45px] text-base"
                                    value={assignedNurseId}
                                    onChange={(e) => setAssignedNurseId(e.target.value)}
                                >
                                    <option value="">-- No Member Selected --</option>
                                    {filteredStaff.map(n => <option key={n.id} value={n.id} className="text-black font-bold">{n.name} {n.isOnline ? '(ONLINE)' : ''}</option>)}
                                </select>
                                <BriefcaseMedical size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Priority & Staff Filter */}
                    <div className="space-y-4">
                        {/* PRIORITY SELECTOR */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-2 block tracking-widest flex items-center gap-2">
                                <AlertTriangle size={12} className={priority === 'URGENT' ? 'text-rose-400' : 'text-gray-400'} /> Priority Level
                            </label>
                            <div className="flex gap-2 p-1 bg-white/5 rounded-[24px] border border-white/10">
                                <button 
                                    type="button"
                                    onClick={() => setPriority('ROUTINE')}
                                    className={`flex-1 py-2.5 rounded-full text-xs font-black transition-all ${priority === 'ROUTINE' ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    ROUTINE
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setPriority('URGENT')}
                                    className={`flex-1 py-2.5 rounded-full text-xs font-black transition-all flex items-center justify-center gap-2 ${priority === 'URGENT' ? 'bg-[#BA1A1A] text-white shadow-lg scale-105 border border-white/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {priority === 'URGENT' && <ShieldAlert size={14} />}
                                    URGENT
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 block">Staff Category Filter</label>
                            <div className="relative">
                                <select 
                                    className="solid-input h-[38px] !px-4 text-sm"
                                    value={staffCategoryFilter}
                                    onChange={e => { setStaffCategoryFilter(e.target.value); setAssignedNurseId(''); }}
                                >
                                    <option value="">All Care Staff</option>
                                    {staffCategories.map(c => <option key={c} value={c} className="text-black font-bold">{c}</option>)}
                                </select>
                                <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Schedule & Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white/5 p-6 rounded-[28px] border border-white/10 flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block flex items-center gap-2"><Clock size={12} /> Schedule</label>
                    <div className="flex gap-2 mb-3">
                        <button 
                            onClick={() => setShowTimePicker(true)}
                            className="flex-1 bg-white text-neutral-textPrimary px-4 py-3 rounded-[24px] font-black text-sm text-left shadow-md flex items-center justify-between"
                        >
                            {timeInput ? displayTime(timeInput) : "Select Time"}
                            <Clock size={16} className="opacity-40" />
                        </button>
                        <button onClick={() => { addTime(timeInput); setTimeInput(''); }} disabled={!timeInput} className="bg-brand-green text-neutral-textPrimary px-4 rounded-[24px] font-black text-xs shadow-lg disabled:opacity-30">ADD</button>
                    </div>
                    <div className="flex flex-wrap gap-2 overflow-y-auto max-h-24 custom-scrollbar">
                        {scheduledTimes.map(t => (
                            <span key={t} className="bg-brand-green text-neutral-textPrimary px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-sm border border-brand-greenDark/20">
                                {displayTime(t)}
                                <button onClick={() => setScheduledTimes(prev => prev.filter(st => st !== t))}><X size={12}/></button>
                            </span>
                        ))}
                    </div>
                 </div>

                 <div className="bg-white/5 p-6 rounded-[28px] border border-white/10">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block flex items-center gap-2"><ListPlus size={12} /> Checklist</label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                        {checklistItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 group">
                                <span className="text-xs font-bold text-white">{item}</span>
                                <button onClick={() => removeChecklistItem(item)} className="text-gray-500 hover:text-status-criticalText transition-colors"><Trash2 size={14}/></button>
                            </div>
                        ))}
                        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-full border border-white/10 mt-2">
                             <input className="flex-1 bg-transparent border-none text-white font-bold placeholder-gray-500 focus:ring-0 text-xs ml-2" type="text" placeholder="Custom step..." value={customItem} onChange={(e) => setCustomItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addChecklistItem(customItem)} />
                             <button onClick={() => addChecklistItem(customItem)} className="w-8 h-8 rounded-full bg-brand-green text-neutral-textPrimary flex items-center justify-center font-black shadow-lg"><Plus size={16}/></button>
                        </div>
                    </div>
                 </div>
            </div>

            {/* 3. Quick Select Chips */}
            <div className="flex flex-wrap gap-2">
                {QUICK_CHECKS.map(check => (
                    <button key={check.id} onClick={() => toggleQuickCheck(check.label)} className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] transition-all shadow-sm ${checklistItems.includes(check.label) ? 'bg-white text-neutral-textPrimary border-white scale-105' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>
                        {check.label}
                    </button>
                ))}
            </div>

            {/* 4. Medications */}
            <div className="bg-white/5 p-6 rounded-[28px] border border-white/10">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block flex items-center gap-2"><Pill size={12} /> Medications</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    <AnimatedInput className="h-[45px] text-sm" placeholder="Drug Name" value={medInput.name} onChange={e => setMedInput({...medInput, name: e.target.value})} />
                    <AnimatedInput className="h-[45px] text-sm" placeholder="Dose (e.g. 10ml)" value={medInput.dose} onChange={e => setMedInput({...medInput, dose: e.target.value})} />
                    <button onClick={addMed} className="h-[45px] bg-brand-green text-neutral-textPrimary rounded-[24px] font-black shadow-lg text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"><Plus size={18}/> ADD</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {meds.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white/10 p-3 rounded-xl border border-white/5">
                            <span className="font-black text-sm">{m.name} <span className="text-gray-400 font-bold opacity-60 text-xs">— {m.dose}</span></span>
                            <button onClick={() => removeMed(idx)} className="text-status-criticalText p-1.5 hover:bg-red-500/10 rounded-full transition-all"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>

        </div>

        {/* Footer - Thinned */}
        <div className="px-10 py-4 flex items-center justify-end gap-4 bg-white/5 border-t border-white/10">
            <button onClick={onClose} className="px-6 py-2 rounded-full text-white/70 font-bold text-sm hover:bg-white/10 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={!selectedPatientId || !assignedNurseId} className="px-8 py-3 bg-brand-green text-neutral-textPrimary rounded-[24px] font-black text-base hover:bg-brand-greenDark hover:shadow-glow disabled:opacity-30 transition-all active:scale-95 flex items-center gap-2">
                <Check size={22} strokeWidth={3} /> CONFIRM ORDER
            </button>
        </div>

      </div>

      {showTimePicker && <ModernTimePicker initialTime={timeInput || '12:00'} onSave={(t) => { setTimeInput(t); setShowTimePicker(false); }} onCancel={() => setShowTimePicker(false)} />}
      
      <style>{`
        .solid-input {
            width: 100%;
            height: 2.2em;
            border-radius: 2.2em;
            border: none;
            background-color: white;
            color: #1F2937;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 0 1.2em;
            font-size: 0.875rem;
            font-weight: 800;
            outline: none;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            appearance: none;
            cursor: pointer;
            text-align: left;
        }
      `}</style>
    </div>
  );
};

export default CreateCareEventModal;