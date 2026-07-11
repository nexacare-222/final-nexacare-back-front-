import React, { useState, useEffect } from 'react';
import { Patient, User, DischargeDetails } from '../types';
import { X, User as UserIcon, Calendar, FileText, CheckSquare, Pill, Plus, Trash2, AlertTriangle, CheckCircle2, Truck, DollarSign, Upload, Lock, FileSignature, Stethoscope, ChevronDown, Building2 } from 'lucide-react';
import TranslucentDatePicker from './TranslucentDatePicker';
import AnimatedInput from './AnimatedInput';
import { getCategorizedWards } from '../services/mockDataService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  user: User; // Doctor
  onDischarge: (patientId: string, dischargeData: DischargeDetails) => void;
}

const DischargePatientModal: React.FC<Props> = ({ isOpen, onClose, patients, user, onDischarge }) => {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  // Filter State
  const [selectedWard, setSelectedWard] = useState('');
  
  // Form States
  const [condition, setCondition] = useState('Improved / Stable');
  const [notes, setNotes] = useState('');
  
  // Medications
  const [meds, setMeds] = useState<{name: string, dose: string, freq: string, duration: string, instructions: string}[]>([]);
  const [newMed, setNewMed] = useState({name: '', dose: '', freq: '', duration: '', instructions: ''});

  // Follow Up
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpDept, setFollowUpDept] = useState('');
  const [followUpDoc, setFollowUpDoc] = useState('');
  const [warningSymptoms, setWarningSymptoms] = useState('');

  // Lifestyle
  const [activityLevel, setActivityLevel] = useState('Normal');
  const [diet, setDiet] = useState('');
  const [woundCare, setWoundCare] = useState('');
  const [restrictions, setRestrictions] = useState('');

  // Billing & Transfer
  const [billingStatus, setBillingStatus] = useState<'CLEARED' | 'PENDING' | 'REVIEW'>('PENDING');
  const [transferMode, setTransferMode] = useState('Private Vehicle');
  
  // Signature
  const [signature, setSignature] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  const wardStructure = getCategorizedWards();

  useEffect(() => {
    if (isOpen) {
        setCondition('Improved / Stable');
        setNotes('');
        setMeds([]);
        setFollowUpDate('');
        setFollowUpDept('');
        setFollowUpDoc('');
        setWarningSymptoms('');
        setActivityLevel('Normal');
        setDiet('');
        setWoundCare('');
        setRestrictions('');
        setBillingStatus('PENDING');
        setTransferMode('Private Vehicle');
        setSignature('');
        setAttachments([]);
        setSelectedPatientId('');
        setSelectedWard('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter Logic
  const filteredPatients = patients.filter(p => 
      !p.isDischarged && 
      (!selectedWard || p.currentLocation === selectedWard)
  );

  const activePatient = patients.find(p => p.id === selectedPatientId);

  const addMed = () => {
      if (newMed.name) {
          setMeds([...meds, newMed]);
          setNewMed({name: '', dose: '', freq: '', duration: '', instructions: ''});
      }
  };

  const removeMed = (idx: number) => {
      setMeds(meds.filter((_, i) => i !== idx));
  };

  const addAttachment = () => {
      // Mock attachment
      const name = `Discharge_Summary_${Date.now()}.pdf`;
      setAttachments([...attachments, name]);
  };

  const handleSubmit = () => {
      if (!selectedPatientId || !signature) return;
      if (billingStatus === 'PENDING') {
          if (!confirm("Billing is marked as PENDING. Are you sure you want to proceed with discharge?")) return;
      }

      const dischargeData: DischargeDetails = {
          condition,
          notes,
          medications: meds,
          followUp: {
              date: followUpDate,
              department: followUpDept,
              doctor: followUpDoc,
              instructions: warningSymptoms
          },
          lifestyle: {
              activity: activityLevel,
              diet,
              wound: woundCare,
              restrictions
          },
          billingStatus,
          transferMode,
          doctorSignature: signature,
          finalizedAt: Date.now(),
          attachments
      };

      onDischarge(selectedPatientId, dischargeData);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white/10 backdrop-blur-2xl w-full max-w-4xl rounded-[32px] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-scale-in border border-white/20 font-sans text-white will-change-transform">
        
        {/* Header - Thinned */}
        <div className="px-8 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div>
                <h2 className="text-xl font-bold text-white">Patient Discharge Form</h2>
                <p className="text-xs text-gray-300 opacity-80">Finalize summary & transfer orders</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"><X size={20}/></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar space-y-6">
            
            {/* 1. Patient Selection & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Filters Column */}
                <div className="md:col-span-1 space-y-3">
                    {/* Ward Filter */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                            <Building2 size={12} /> Ward
                        </label>
                        <div className="relative">
                            <select 
                                className="solid-input h-[38px] text-xs px-4"
                                value={selectedWard}
                                onChange={(e) => { setSelectedWard(e.target.value); setSelectedPatientId(''); }}
                            >
                                <option value="">All Wards</option>
                                {Object.entries(wardStructure).map(([category, data]) => (
                                    <optgroup label={category} key={category} className="text-black font-bold">
                                        {data.wards.map(w => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                        </div>
                    </div>

                    {/* Patient Select */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                            <UserIcon size={12} /> Patient
                        </label>
                        <div className="relative">
                            <select 
                                className="solid-input h-[38px] text-xs px-4"
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                            >
                                <option value="">-- Choose Patient --</option>
                                {filteredPatients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.currentLocation})</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                        </div>
                    </div>
                </div>

                {activePatient && (
                    <div className="md:col-span-2 bg-white/5 p-4 rounded-[20px] border border-white/10 flex items-center gap-4 shadow-sm animate-fade-in">
                        <div className="w-10 h-10 rounded-full bg-[#C4ED9C] text-[#072100] flex items-center justify-center font-bold text-base">{activePatient.name.charAt(0)}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs flex-1">
                            <div><p className="text-[10px] text-gray-400">ID</p><p className="font-bold text-white">{activePatient.id}</p></div>
                            <div><p className="text-[10px] text-gray-400">Age</p><p className="font-bold text-white">{activePatient.age}</p></div>
                            <div><p className="text-[10px] text-gray-400">Loc</p><p className="font-bold text-white truncate">{activePatient.currentLocation}</p></div>
                            <div><p className="text-[10px] text-gray-400">Diag</p><p className="font-bold truncate text-white">{activePatient.diagnosis || 'N/A'}</p></div>
                        </div>
                    </div>
                )}
            </div>

            {activePatient && (
                <>
                    {/* 2. Discharge Condition */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-[#C4ED9C] text-[#072100] p-1 rounded-md"><CheckSquare size={14}/></div>
                            <h3 className="text-sm font-bold text-white">Condition</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['Recovered', 'Improved', 'Referred', 'DAMA', 'Deceased'].map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => setCondition(opt)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${condition === opt ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Clinical Notes */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-emerald-500/20 text-emerald-400 p-1 rounded-md"><FileText size={14}/></div>
                            <h3 className="text-sm font-bold text-white">Clinical Summary</h3>
                        </div>
                        <textarea 
                            className="w-full bg-white rounded-[20px] p-4 text-xs font-semibold text-[#4d4d4d] outline-none shadow-sm resize-none h-24 focus:shadow-md transition-all placeholder-gray-400 border-none"
                            placeholder="Summary of treatment..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* 4. Medication Plan */}
                    <div className="bg-white/5 p-5 rounded-[24px] border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-amber-500/20 text-amber-400 p-1 rounded-md"><Pill size={14}/></div>
                            <h3 className="text-sm font-bold text-white">Medication Plan</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
                            <AnimatedInput className="h-[38px] text-xs" placeholder="Name" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} />
                            <AnimatedInput className="h-[38px] text-xs" placeholder="Dose" value={newMed.dose} onChange={e => setNewMed({...newMed, dose: e.target.value})} />
                            <AnimatedInput className="h-[38px] text-xs" placeholder="Freq" value={newMed.freq} onChange={e => setNewMed({...newMed, freq: e.target.value})} />
                            <AnimatedInput className="h-[38px] text-xs" placeholder="Duration" value={newMed.duration} onChange={e => setNewMed({...newMed, duration: e.target.value})} />
                            <div className="flex gap-2">
                                <AnimatedInput className="h-[38px] text-xs" placeholder="Instr" value={newMed.instructions} onChange={e => setNewMed({...newMed, instructions: e.target.value})} />
                                <button onClick={addMed} className="bg-emerald-500 hover:bg-emerald-400 text-[#072100] p-1.5 rounded-full flex-shrink-0 w-9 h-9 flex items-center justify-center transition-colors"><Plus size={16}/></button>
                            </div>
                        </div>

                        {meds.length > 0 && (
                            <div className="space-y-1.5">
                                {meds.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white/5 p-2 px-3 rounded-lg border border-white/10 text-[10px]">
                                        <div className="grid grid-cols-4 gap-2 flex-1">
                                            <span className="font-bold text-white truncate">{m.name}</span>
                                            <span className="text-gray-300">{m.dose} • {m.freq}</span>
                                            <span className="text-gray-300">{m.duration}</span>
                                            <span className="text-gray-400 italic truncate">{m.instructions}</span>
                                        </div>
                                        <button onClick={() => removeMed(i)} className="text-red-400 hover:bg-red-500/10 p-1 rounded transition-colors ml-2"><Trash2 size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 5. Follow Up & Lifestyle */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <div className="bg-blue-500/20 text-blue-400 p-1 rounded-md"><Calendar size={14}/></div> Follow-Up
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <TranslucentDatePicker className="h-[38px]" value={followUpDate} onChange={setFollowUpDate} placeholder="Date" />
                                <AnimatedInput className="h-[38px] text-xs" placeholder="Dept" value={followUpDept} onChange={e => setFollowUpDept(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <div className="bg-purple-500/20 text-purple-400 p-1 rounded-md"><UserIcon size={14}/></div> Activity
                            </h3>
                            <div className="relative">
                                <select className="solid-input h-[38px] text-xs px-4" value={activityLevel} onChange={e => setActivityLevel(e.target.value)}>
                                    <option>Bed Rest</option>
                                    <option>Normal</option>
                                    <option>Restricted</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                            </div>
                        </div>
                    </div>

                </>
            )}
        </div>

        {/* Footer - Thinned */}
        <div className="px-8 py-4 border-t border-white/10 bg-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-1/2">
                <AnimatedInput 
                    containerClassName="!h-[38px]"
                    className="h-[38px] text-xs"
                    placeholder="Type Name to Sign"
                    value={signature}
                    onChange={e => setSignature(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <button onClick={onClose} className="flex-1 md:flex-none px-5 py-2 rounded-full font-bold text-sm text-gray-300 hover:text-white transition-all">Cancel</button>
                <button 
                    onClick={handleSubmit}
                    disabled={!signature || !selectedPatientId}
                    className="flex-1 md:flex-none px-8 py-2.5 rounded-full font-bold text-white bg-[#BA1A1A] hover:bg-[#93000A] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Lock size={16} /> Finalize Discharge
                </button>
            </div>
        </div>
      </div>
      <style>{`
        .solid-input {
            width: 100%;
            height: 2.2em;
            border-radius: 2.2em;
            border: none;
            background-color: white;
            color: #4d4d4d;
            box-shadow: 0 1px 4px rgba(0,0,0,0.1);
            padding: 0 1em;
            font-size: 0.75rem;
            font-weight: 700;
            outline: none;
            transition: all 0.2s;
            appearance: none;
            cursor: pointer;
        }
        .solid-input:focus {
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default DischargePatientModal;