import React, { useState, useEffect } from 'react';
import { Patient, VitalsData, VitalsSubmissionData } from '../types';
import { X, Activity, Thermometer, Wind, Heart, AlertTriangle, Zap, Plus, Trash2, ChevronUp, ChevronDown, ListPlus, Info, User as UserIcon, FileText } from 'lucide-react';
import AnimatedInput from './AnimatedInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
  onSubmit: (data: VitalsSubmissionData) => void;
}

interface VitalConfig {
    key: string;
    label: string;
    unit: string;
    min: number;
    max: number;
    normalRange: [number, number];
    icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    color: string;
    accent: string;
}

const PRIMARY_VITALS_CONFIG: Record<string, VitalConfig> = {
    temp: { key: 'temp', label: 'TEMPERATURE', unit: '°F', min: 94, max: 106, normalRange: [97.5, 99.5], icon: Thermometer, color: 'text-orange-400', accent: '#fb923c' },
    spo2: { key: 'spo2', label: 'OXYGEN SAT.', unit: '%', min: 70, max: 100, normalRange: [95, 100], icon: Wind, color: 'text-sky-400', accent: '#38bdf8' },
    hr: { key: 'hr', label: 'HEART RATE', unit: 'bpm', min: 30, max: 220, normalRange: [60, 100], icon: Heart, color: 'text-rose-400', accent: '#fb7185' },
    resp: { key: 'resp', label: 'RESP. RATE', unit: '/min', min: 5, max: 50, normalRange: [12, 20], icon: Activity, color: 'text-emerald-400', accent: '#34d399' },
};

const VitalsEntryModal: React.FC<Props> = ({ isOpen, onClose, patient, onSubmit }) => {
  const [formData, setFormData] = useState<VitalsSubmissionData['vitals']>({
    temp: '',
    spo2: '',
    hr: '',
    bpSys: '',
    bpDia: '',
    resp: '',
    notes: ''
  });

  const [customVitals, setCustomVitals] = useState<{name: string, value: string, unit: string}[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustom, setNewCustom] = useState({ name: '', unit: '' });

  useEffect(() => {
    if (isOpen) {
        setFormData({ temp: '', spo2: '', hr: '', bpSys: '', bpDia: '', resp: '', notes: '' });
        setCustomVitals([]);
    }
  }, [isOpen]);

  if (!isOpen || !patient) return null;

  const handleInputChange = (key: string, value: string) => {
      setFormData(prev => ({ ...prev, [key]: value }));
  };

  const addCustomVital = () => {
      if (newCustom.name) {
          setCustomVitals([...customVitals, { ...newCustom, value: '' }]);
          setNewCustom({ name: '', unit: '' });
          setShowAddCustom(false);
      }
  };

  const handleCustomChange = (index: number, value: string) => {
      const updated = [...customVitals];
      updated[index].value = value;
      setCustomVitals(updated);
  };

  const removeCustom = (index: number) => {
      setCustomVitals(customVitals.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
        patientId: patient.id,
        timestamp: Date.now(),
        vitals: formData,
        custom: customVitals
    });
  };

  const getVitalStatus = (key: string, value: string) => {
      const num = parseFloat(value);
      if (isNaN(num)) return null;
      
      const config = PRIMARY_VITALS_CONFIG[key];
      if (!config) {
          if (key === 'bpSys') return num > 140 ? 'High' : num < 90 ? 'Low' : 'Normal';
          if (key === 'bpDia') return num > 90 ? 'High' : num < 60 ? 'Low' : 'Normal';
          return null;
      }

      if (num < config.normalRange[0]) return 'Low';
      if (num > config.normalRange[1]) return 'High';
      return 'Normal';
  };

  const isClinicallyCritical = () => {
      const hr = parseFloat(formData.hr);
      const spo2 = parseFloat(formData.spo2);
      const bpSys = parseFloat(formData.bpSys);
      return (hr > 130 || hr < 45) || (spo2 < 88) || (bpSys > 180 || bpSys < 85);
  };

  // Fix: Added React.FC type to handle 'key' prop correctly in map iterators
  const CompactVitalCard: React.FC<{ config: VitalConfig }> = ({ config }) => {
      const value = formData[config.key];
      const status = getVitalStatus(config.key, value);
      const numVal = parseFloat(value) || 0;
      
      // Calculate gauge fill
      const percentage = Math.min(100, Math.max(0, ((numVal - config.min) / (config.max - config.min)) * 100));
      const strokeDash = (percentage / 100) * 283; // Circumference of 45r circle is ~282.7

      return (
          <div className="bg-[#2a2a2a] rounded-[40px] p-5 border border-white/5 flex flex-col items-center group transition-all hover:bg-[#323232] shadow-xl w-full max-w-[240px] mx-auto">
              <div className="flex items-center gap-2 mb-4 w-full px-2">
                  <config.icon size={18} className={config.color} />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{config.label}</span>
              </div>

              {/* Central Circular Display */}
              <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                  <svg className="w-full h-full -rotate-90">
                      <circle cx="56" cy="56" r="45" fill="transparent" stroke="#333" strokeWidth="6" />
                      <circle 
                        cx="56" cy="56" r="45" fill="transparent" stroke={config.accent} strokeWidth="6" 
                        strokeDasharray="283" 
                        strokeDashoffset={283 - strokeDash}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out opacity-20"
                      />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <input 
                        type="number"
                        className="bg-transparent text-center text-3xl font-black text-white outline-none w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="--"
                        value={value}
                        onChange={e => handleInputChange(config.key, e.target.value)}
                      />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{config.unit}</span>
                  </div>
              </div>

              <div className="flex gap-2 w-full px-1">
                  <button 
                    type="button"
                    onClick={() => handleInputChange(config.key, (parseFloat(value || '0') - 1).toString())} 
                    className="flex-1 h-11 bg-[#1f1f1f] rounded-[18px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-black transition-all active:scale-95"
                  >
                    <ChevronDown size={22}/>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleInputChange(config.key, (parseFloat(value || '0') + 1).toString())} 
                    className="flex-1 h-11 bg-[#1f1f1f] rounded-[18px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-black transition-all active:scale-95"
                  >
                    <ChevronUp size={22}/>
                  </button>
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl transition-all duration-500 overflow-y-auto">
      <div className="bg-[#121212] w-full max-w-4xl rounded-[60px] shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col my-auto animate-scale-in font-sans text-white border border-white/5 relative overflow-hidden">
        
        {/* Header Section matching reference image */}
        <div className="px-10 py-10 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-[24px] bg-[#CBEF8A] text-black flex items-center justify-center shadow-[0_0_30px_rgba(203,239,138,0.2)]">
                    <Activity size={32} strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="font-heading font-black text-5xl text-white tracking-tight leading-none">Vitals Intake</h3>
                    <div className="flex items-center gap-4 mt-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                           <UserIcon size={14} className="text-[#CBEF8A]" /> {patient.name}
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                        <div className="flex items-center gap-2">
                           {patient.currentLocation}
                        </div>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5 shadow-inner">
                <X size={32} />
            </button>
        </div>

        {/* Clinical Grid */}
        <div className="flex-1 px-10 pb-10 custom-scrollbar relative z-10 overflow-y-auto max-h-[70vh]">
            <form id="vitals-form" onSubmit={handleSubmit} className="space-y-8">
                
                {isClinicallyCritical() && (
                    <div className="bg-[#BA1A1A]/20 rounded-[32px] p-6 flex items-center gap-6 animate-pulse border border-[#BA1A1A]/30">
                        <div className="bg-[#BA1A1A] p-3 rounded-2xl text-white">
                            <AlertTriangle size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="font-black text-lg tracking-tight text-white uppercase">Critical Alert</p>
                            <p className="text-xs font-bold text-red-200/80 leading-snug uppercase tracking-wider">Entries exceed safety thresholds. Immediate review requested.</p>
                        </div>
                    </div>
                )}

                {/* Primary Vitals Grid - Refined Sizing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.values(PRIMARY_VITALS_CONFIG).map(config => (
                        <CompactVitalCard key={config.key} config={config} />
                    ))}
                </div>

                {/* Hemodynamics Section (BP) - Refined Style */}
                <div className="bg-[#1a1a1a] rounded-[48px] p-8 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
                    <div className="flex-shrink-0 text-center md:text-left">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">HEMODYNAMICS</h4>
                        <p className="text-3xl font-black text-white tracking-tight uppercase">Blood Pressure</p>
                        <div className="flex gap-2 mt-4 justify-center md:justify-start">
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/5 text-gray-500">Systolic</span>
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/5 text-gray-500">Diastolic</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center">
                            <input 
                                type="number" 
                                className="bg-[#121212] w-24 h-24 rounded-[32px] text-center text-4xl font-black text-white outline-none border border-white/10 focus:border-[#CBEF8A] transition-all placeholder-white/5"
                                placeholder="SYS"
                                value={formData.bpSys}
                                onChange={e => handleInputChange('bpSys', e.target.value)}
                            />
                            <span className="text-[9px] font-bold text-gray-500 uppercase mt-3 tracking-widest">mmHg</span>
                        </div>
                        <div className="text-6xl font-thin text-white/5">/</div>
                        <div className="flex flex-col items-center">
                            <input 
                                type="number"
                                className="bg-[#121212] w-24 h-24 rounded-[32px] text-center text-4xl font-black text-white outline-none border border-white/10 focus:border-[#CBEF8A] transition-all placeholder-white/5"
                                placeholder="DIA"
                                value={formData.bpDia}
                                onChange={e => handleInputChange('bpDia', e.target.value)}
                            />
                            <span className="text-[9px] font-bold text-gray-500 uppercase mt-3 tracking-widest">mmHg</span>
                        </div>
                    </div>
                </div>

                {/* Custom Parameters Section */}
                <div className="bg-[#1a1a1a] rounded-[48px] p-8 border border-white/5">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#CBEF8A]/20 p-2 rounded-xl text-[#CBEF8A]"><ListPlus size={20}/></div>
                            <h4 className="text-xl font-black text-white tracking-tight uppercase">Custom Inputs</h4>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setShowAddCustom(true)}
                            className="px-6 py-3 bg-white/5 hover:bg-[#CBEF8A] hover:text-black rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2"
                        >
                            <Plus size={14}/> Add New
                        </button>
                    </div>

                    {showAddCustom && (
                        <div className="mb-8 p-6 bg-white/5 rounded-[32px] border border-[#CBEF8A]/20 animate-fade-in flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-[9px] font-black text-gray-500 uppercase ml-2 tracking-widest">Parameter Name</label>
                                <AnimatedInput value={newCustom.name} onChange={e => setNewCustom({...newCustom, name: e.target.value})} placeholder="e.g. Glucose" className="!bg-[#121212] !h-12 !text-left pl-6" />
                            </div>
                            <div className="w-full md:w-32 space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase ml-2 tracking-widest">Unit</label>
                                <AnimatedInput value={newCustom.unit} onChange={e => setNewCustom({...newCustom, unit: e.target.value})} placeholder="mg/dL" className="!bg-[#121212] !h-12" />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button type="button" onClick={() => setShowAddCustom(false)} className="flex-1 h-12 px-4 text-xs font-bold text-gray-400 hover:text-white">Cancel</button>
                                <button type="button" onClick={addCustomVital} disabled={!newCustom.name} className="flex-1 md:flex-none h-12 bg-[#CBEF8A] text-black px-8 rounded-full font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-all">Add</button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customVitals.map((cv, idx) => (
                            <div key={idx} className="bg-white/5 p-4 rounded-[28px] border border-white/5 flex items-center justify-between group">
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 truncate">{cv.name}</p>
                                    <div className="flex items-baseline gap-2">
                                        <input 
                                            type="text" 
                                            className="bg-transparent text-xl font-black text-white outline-none w-20 border-b border-white/10 focus:border-[#CBEF8A] transition-all"
                                            placeholder="--"
                                            value={cv.value}
                                            onChange={e => handleCustomChange(idx, e.target.value)}
                                        />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{cv.unit}</span>
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeCustom(idx)} className="p-2 text-gray-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                            </div>
                        ))}
                        {customVitals.length === 0 && !showAddCustom && (
                            <div className="col-span-full py-10 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-30">
                                <Info size={24} className="mx-auto mb-3" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Case-specific parameters can be added above</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Observations */}
                <div className="space-y-4">
                     <div className="flex items-center gap-3 ml-4">
                        <FileText size={18} className="text-[#CBEF8A]" />
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Observations</h4>
                     </div>
                     <textarea 
                        className="w-full bg-[#1a1a1a] rounded-[40px] p-8 text-base font-bold text-white outline-none border border-white/5 focus:border-[#CBEF8A]/30 transition-all placeholder-white/5 h-28 resize-none shadow-inner"
                        placeholder="Detail symptoms, visible distress, or patient feedback..."
                        value={formData.notes}
                        onChange={e => handleInputChange('notes', e.target.value)}
                     />
                </div>

            </form>
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-8 bg-black/40 border-t border-white/5 backdrop-blur-xl relative z-20">
            <button 
                type="submit" 
                form="vitals-form"
                className={`w-full h-20 rounded-[30px] font-black text-2xl flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-[0.98] group ${
                    isClinicallyCritical() 
                    ? 'bg-[#BA1A1A] text-white hover:bg-[#93000A]' 
                    : 'bg-[#CBEF8A] text-black hover:bg-[#9FD45A]'
                }`}
            >
                {isClinicallyCritical() ? <AlertTriangle size={28} className="animate-bounce" /> : <Zap size={28} fill="currentColor" />}
                <span className="uppercase tracking-tight">{isClinicallyCritical() ? 'BROADCAST CRITICAL ALERT' : 'SIGN & RECORD VITALS'}</span>
            </button>
        </div>

      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default VitalsEntryModal;