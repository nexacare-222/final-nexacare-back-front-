
import React, { useState, useEffect } from 'react';
import { Patient, User as UserData } from '../types';
import { X, ArrowRight, MapPin, Activity, Calendar, Clock, Search, User, Stethoscope, Filter, ChevronDown } from 'lucide-react';
import { getCategorizedWards, getCategorizedStaff, MEDICAL_STAFF_CATEGORIES } from '../services/mockDataService';
import ModernTimePicker from './ModernTimePicker';
import ModernSearchBar from './ModernSearchBar';
import RetroButton from './RetroButton';
import AnimatedInput from './AnimatedInput';
import TranslucentDatePicker from './TranslucentDatePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  medicalStaff?: UserData[];
  onTransfer: (patientId: string, toWard: string, toBed: string, status: string, reason: string, time: string, assignedStaffId?: string) => void;
}

const TRANSFER_STATUSES = [
  { id: 'Stable', label: 'Stable' },
  { id: 'Observation', label: 'Observation' },
  { id: 'Critical', label: 'Critical' },
  { id: 'Emergency', label: 'Emergency' },
];

const DoctorTransferModal: React.FC<Props> = ({ isOpen, onClose, patients, medicalStaff = [], onTransfer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [targetWard, setTargetWard] = useState('');
  const [targetBed, setTargetBed] = useState('');
  
  const [datePart, setDatePart] = useState('');
  const [timePart, setTimePart] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [status, setStatus] = useState('Stable');
  const [reason, setReason] = useState('');
  
  // Staff Selection State
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [selectedStaffCategory, setSelectedStaffCategory] = useState('');

  const wardStructure = getCategorizedWards();
  const staffStructure = getCategorizedStaff();

  useEffect(() => {
    if (isOpen) {
        setSearchTerm('');
        setSelectedPatientId('');
        setTargetWard('');
        setTargetBed('');
        
        const now = new Date();
        setDatePart(now.toISOString().split('T')[0]);
        setTimePart(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        
        setStatus('Stable');
        setReason('');
        setAssignedStaffId('');
        setSelectedStaffCategory('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStaff = medicalStaff.filter(s => {
      if (!selectedStaffCategory) return true;
      return s.staffCategory === selectedStaffCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatientId && targetWard && targetBed && datePart && timePart) {
      const finalDateTime = `${datePart}T${timePart}`;
      onTransfer(selectedPatientId, targetWard, targetBed, status, reason, finalDateTime, assignedStaffId);
      onClose();
    }
  };

  const formatDisplayTime = (t: string) => {
      if (!t) return '--:--';
      const [h, m] = t.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all duration-300">
      
      {/* Material 3 Card Container */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-[32px] shadow-2xl w-[95%] max-w-lg relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in font-sans text-white border border-white/20 will-change-transform">
        
        {/* Header */}
        <div className="px-6 py-6 flex justify-between items-start flex-shrink-0 border-b border-white/10">
          <div>
            <h2 className="text-xl md:text-2xl font-normal tracking-tight text-white">Transfer patient</h2>
            <p className="text-sm text-gray-300 mt-1">Select details for internal movement</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          <form id="transfer-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Patient Selection */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1">Patient</label>
                
                <div className="mb-2">
                    <AnimatedInput 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search name or ID"
                    />
                </div>

                {/* Dropdown */}
                <div className="relative">
                     <select 
                        required
                        className="solid-input pl-10"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                    >
                        <option value="">Select from list</option>
                        {filteredPatients.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <User size={18} className="text-gray-500" />
                    </div>
                </div>

                {selectedPatient && (
                    <div className="flex items-center gap-2 px-2 py-1 animate-fade-in">
                        <span className="bg-[#C4ED9C] text-[#072100] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <MapPin size={12}/> {selectedPatient.currentLocation}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">ID: {selectedPatient.id.split('-').pop()}</span>
                    </div>
                )}
            </div>

            {/* 2. Destination */}
            <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1">Destination</label>
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative col-span-2 sm:col-span-1">
                         <select 
                            required
                            className="solid-input"
                            value={targetWard}
                            onChange={(e) => setTargetWard(e.target.value)}
                        >
                            <option value="">Select Ward</option>
                            {Object.entries(wardStructure).map(([category, data]) => (
                                <optgroup label={category} key={category} className="text-black font-bold">
                                    {data.wards.map(w => (
                                        <option key={w} value={w} disabled={w === selectedPatient?.currentLocation}>
                                            {w}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div className="relative col-span-2 sm:col-span-1">
                         <AnimatedInput
                            required
                            type="text"
                            placeholder="Bed No."
                            value={targetBed}
                            onChange={(e) => setTargetBed(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Assign Staff (Optional) */}
            {medicalStaff.length > 0 && (
                <div className="bg-white/5 p-4 rounded-[24px] border border-white/10 space-y-3">
                    <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1 flex items-center gap-2">
                        <Stethoscope size={12} /> Transfer Responsibility
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Category Filter */}
                        <div className="relative">
                            <select 
                                className="solid-input pl-10"
                                value={selectedStaffCategory}
                                onChange={(e) => { setSelectedStaffCategory(e.target.value); setAssignedStaffId(''); }}
                            >
                                <option value="">All Categories</option>
                                {MEDICAL_STAFF_CATEGORIES.map(category => {
                                    const data = staffStructure[category];
                                    if (!data) return null;
                                    return (
                                        <optgroup label={category} key={category} className={`font-bold ${data.color.replace('text-', 'text-opacity-80 text-')}`}>
                                            {data.roles.map(r => <option key={r} value={r} className="text-black">{r}</option>)}
                                        </optgroup>
                                    );
                                })}
                            </select>
                            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                        </div>

                        {/* Staff Selection */}
                        <div className="relative">
                            <select 
                                className="solid-input pl-10"
                                value={assignedStaffId}
                                onChange={(e) => setAssignedStaffId(e.target.value)}
                            >
                                <option value="">Select Staff (Optional)</option>
                                {filteredStaff.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Timing */}
            <div className="grid grid-cols-2 gap-3 pt-2">
                <TranslucentDatePicker 
                    value={datePart}
                    onChange={(date) => setDatePart(date)}
                    placeholder="Date"
                />
                <button 
                    type="button"
                    onClick={() => setShowTimePicker(true)}
                    className="bg-[#C4ED9C] hover:bg-[#B8E090] rounded-[2.5em] h-[2.5em] flex items-center justify-center text-[#072100] transition-colors shadow-sm"
                >
                    <span className="text-sm font-bold font-sans ml-1">{formatDisplayTime(timePart)}</span>
                    <Clock size={16} className="ml-2 opacity-80" />
                </button>
            </div>

            {/* 5. Status Chips */}
            <div className="pt-2">
                <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1 mb-2 block">Clinical Status</label>
                <div className="flex flex-wrap gap-2">
                    {TRANSFER_STATUSES.map(s => {
                        const isSelected = status === s.id;
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setStatus(s.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${
                                    isSelected 
                                    ? 'bg-[#426936] text-white border-[#426936] shadow-md' 
                                    : 'bg-transparent text-gray-300 border-gray-600 hover:bg-white/10'
                                }`}
                            >
                                {isSelected && <Activity size={14} />}
                                {s.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 6. Reason */}
            <div className="pt-1">
                <textarea 
                    required
                    rows={2}
                    placeholder="Reason for transfer request..."
                    className="w-full bg-white rounded-[20px] p-4 text-sm font-semibold text-[#4d4d4d] outline-none shadow-sm resize-none focus:shadow-md transition-all placeholder-gray-400 border-none"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 flex items-center justify-end gap-3 bg-white/5 border-t border-white/10">
            <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-full text-white/70 font-bold text-sm hover:bg-white/10 transition-colors"
            >
                Cancel
            </button>
            <RetroButton form="transfer-form" type="submit" label="Confirm Transfer" icon={<ArrowRight size={18} />} />
        </div>
      </div>

      {/* Time Picker */}
      {showTimePicker && (
          <ModernTimePicker 
            initialTime={timePart}
            onSave={(t) => { setTimePart(t); setShowTimePicker(false); }}
            onCancel={() => setShowTimePicker(false)}
          />
      )}
      
      <style>{`
        .solid-input {
            width: 100%;
            height: 2.5em;
            border-radius: 2.5em;
            border: none;
            background-color: white;
            color: #4d4d4d;
            box-shadow: 1px 1px 10px rgba(0,0,0,0.1);
            padding: 0 1.5em;
            font-size: 14px;
            font-weight: 600;
            outline: none;
            transition: all 0.2s;
            appearance: none;
            cursor: pointer;
            text-align: center;
        }
        .solid-input:focus {
            box-shadow: 2px 4px 15px rgba(0,0,0,0.15);
            transform: scale(1.01);
        }
      `}</style>
    </div>
  );
};

export default DoctorTransferModal;
