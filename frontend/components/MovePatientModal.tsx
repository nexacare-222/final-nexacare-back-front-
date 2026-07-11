
import React, { useState, useEffect } from 'react';
import { Patient, User, UserRole } from '../types';
import { ArrowRight, MapPin, Activity, ArrowRightLeft, User as UserIcon, Clock, BriefcaseMedical, ChevronDown, Filter, Stethoscope } from 'lucide-react';
import { getCategorizedWards, getCategorizedStaff } from '../services/mockDataService';
import RetroButton from './RetroButton';
import AnimatedInput from './AnimatedInput';
import Modal from './ui/Modal';
import ModernTimePicker from './ModernTimePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onMove: (patientId: string, toLocation: string, reason: string, transferTime?: string, assignedStaffId?: string) => void;
  patients: Patient[];
  staff: User[];
}

const MovePatientModal: React.FC<Props> = ({ isOpen, onClose, onMove, patients, staff }) => {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Fields for Staff & Time
  const [transferTime, setTransferTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const wardStructure = getCategorizedWards();
  const staffStructure = getCategorizedStaff();
  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStaff = staff.filter(s => {
      if (!selectedCategory) return true;
      return s.staffCategory === selectedCategory;
  });

  useEffect(() => {
      if (isOpen) {
          const now = new Date();
          setTransferTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
          setSelectedStaffId('');
          setSelectedCategory('');
          setReason('');
          setToLocation('');
          setSelectedPatientId('');
          setSearchTerm('');
      }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatientId && toLocation && reason) {
      onMove(selectedPatientId, toLocation, reason, transferTime, selectedStaffId);
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
    <>
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Transfer Patient"
        subtitle="Move patient to new ward"
        icon={<ArrowRightLeft size={20} strokeWidth={2.5} />}
        footer={
            <>
                <button 
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-full text-white/70 font-bold text-sm hover:bg-white/10 transition-colors"
                >
                    Cancel
                </button>
                <RetroButton 
                    form="transfer-form" 
                    type="submit" 
                    label="Confirm Move" 
                    icon={<Activity size={18} />} 
                />
            </>
        }
    >
        <form id="transfer-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Patient Selection */}
            <div className="bg-white/5 p-4 rounded-[24px] border border-white/10 space-y-3">
                <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1 flex items-center gap-2">
                    <UserIcon size={12} /> Select Patient
                </label>
                
                <div className="mb-2">
                    <AnimatedInput 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search name or ID"
                    />
                </div>

                <div className="relative">
                    <select 
                        required
                        className="solid-input"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                    >
                        <option value="">Choose from list...</option>
                        {filteredPatients.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <ChevronDown size={18} className="text-gray-500" />
                    </div>
                </div>

                {selectedPatient && (
                    <div className="flex items-center gap-2 px-2 py-1 animate-fade-in">
                        <span className="bg-[#C4ED9C] text-[#072100] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <MapPin size={12}/> Current: {selectedPatient.currentLocation}
                        </span>
                    </div>
                )}
            </div>

            {/* Destination & Time */}
            <div className="bg-white/5 p-4 rounded-[24px] border border-white/10 space-y-3">
                <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1 flex items-center gap-2">
                    <MapPin size={12} /> Destination & Time
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <select 
                            required
                            className="solid-input"
                            value={toLocation}
                            onChange={(e) => setToLocation(e.target.value)}
                        >
                            <option value="">Target Ward</option>
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
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                    <button 
                        type="button"
                        onClick={() => setShowTimePicker(true)}
                        className="bg-white text-[#4d4d4d] rounded-[2.5em] h-[2.5em] flex items-center justify-center font-bold text-sm shadow-sm hover:bg-gray-100 transition-colors"
                    >
                        {formatDisplayTime(transferTime)} <Clock size={16} className="ml-2 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Assign Staff (Optional) */}
            <div className="bg-white/5 p-4 rounded-[24px] border border-white/10 space-y-3">
                <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1 flex items-center gap-2">
                    <BriefcaseMedical size={12} /> Assign Responsibility (Optional)
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                        <select 
                            className="solid-input pl-10"
                            value={selectedCategory}
                            onChange={(e) => { setSelectedCategory(e.target.value); setSelectedStaffId(''); }}
                        >
                            <option value="">All Categories</option>
                            {Object.entries(staffStructure).map(([category, data]) => (
                                <optgroup label={category} key={category} className={`font-bold ${(data?.color || 'text-slate-600').replace('text-', 'text-opacity-80 text-')}`}>
                                    {data?.roles?.map(r => <option key={r} value={r} className="text-black">{r}</option>)}
                                </optgroup>
                            ))}
                        </select>
                        <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>

                    <div className="relative">
                        <select 
                            className="solid-input pl-10"
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                        >
                            <option value="">Select Staff</option>
                            {filteredStaff.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <Stethoscope size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Reason */}
            <div>
                <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1 mb-2 block">Reason for Movement</label>
                <textarea 
                    required
                    rows={2}
                    className="w-full bg-white rounded-[20px] p-4 text-sm font-semibold text-[#4d4d4d] outline-none shadow-sm resize-none focus:shadow-md transition-all placeholder-gray-400 border-none"
                    placeholder="Clinical reason for transfer..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
            </div>
        </form>
        
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
            }
            .solid-input:focus {
                box-shadow: 2px 4px 15px rgba(0,0,0,0.15);
                transform: scale(1.01);
            }
        `}</style>
    </Modal>

    {showTimePicker && (
        <ModernTimePicker 
            initialTime={transferTime}
            onSave={(t) => { setTransferTime(t); setShowTimePicker(false); }}
            onCancel={() => setShowTimePicker(false)}
        />
    )}
    </>
  );
};

export default MovePatientModal;
