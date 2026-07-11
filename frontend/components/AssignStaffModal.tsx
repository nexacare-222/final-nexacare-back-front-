
import React, { useState } from 'react';
import { Patient, User, UserRole } from '../types';
import { UserPlus, Filter, Stethoscope, BriefcaseMedical, ChevronDown, Clock, User as UserIcon } from 'lucide-react';
import ModernTimePicker from './ModernTimePicker';
import RetroButton from './RetroButton';
import Modal from './ui/Modal';
import { getCategorizedStaff, DOCTOR_CATEGORIES, MEDICAL_STAFF_CATEGORIES } from '../services/mockDataService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  staff: User[];
  onAssign: (patientId: string, staffId: string, role: UserRole, time: string) => void;
}

const AssignStaffModal: React.FC<Props> = ({ isOpen, onClose, patients, staff, onAssign }) => {
  // Selections
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  // Doctor State
  const [selectedDoctorCategory, setSelectedDoctorCategory] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  // Staff State
  const [selectedStaffCategory, setSelectedStaffCategory] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  
  // Time State
  const [assignmentTime, setAssignmentTime] = useState('09:00 AM');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Filter Lists
  const staffStructure = getCategorizedStaff();
  
  const doctors = staff.filter(s => {
      const isDoctor = s.role === UserRole.DOCTOR;
      const matchesCategory = selectedDoctorCategory ? s.staffCategory === selectedDoctorCategory : true;
      return isDoctor && matchesCategory;
  });
  
  const medicalStaff = staff.filter(s => {
      const isStaff = s.role === UserRole.NURSE || s.role === UserRole.STAFF;
      const matchesCategory = selectedStaffCategory ? s.staffCategory === selectedStaffCategory : true;
      return isStaff && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    // 1. Assign Doctor if selected
    if (selectedDoctorId) {
        const doc = staff.find(s => s.id === selectedDoctorId);
        if (doc) onAssign(selectedPatientId, selectedDoctorId, doc.role, assignmentTime);
    }

    // 2. Assign Staff if selected
    if (selectedStaffId) {
        const member = staff.find(s => s.id === selectedStaffId);
        if (member) onAssign(selectedPatientId, selectedStaffId, member.role, assignmentTime);
    }

    onClose();
    // Reset
    setSelectedPatientId('');
    setSelectedDoctorId('');
    setSelectedDoctorCategory('');
    setSelectedStaffId('');
    setSelectedStaffCategory('');
  };

  // Helper to convert 24h HH:mm to 12h HH:mm AM/PM
  const formatTimeForDisplay = (time24: string) => {
      const [h, m] = time24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hours = h % 12 || 12;
      return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Helper to convert 12h HH:mm AM/PM to 24h HH:mm for the picker
  const getTimeForPicker = () => {
      const [time, period] = assignmentTime.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return (
    <>
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Assign Care Team"
        subtitle="Update patient coverage"
        icon={<UserPlus size={20} strokeWidth={2.5} />}
        className="w-[95%] max-w-2xl"
        footer={
            <>
                <button 
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-full text-white/70 font-bold text-sm hover:bg-white/10 transition-colors"
                >
                    Cancel
                </button>
                <RetroButton 
                    form="assign-form" 
                    type="submit" 
                    label="Confirm" 
                    disabled={!selectedPatientId || (!selectedDoctorId && !selectedStaffId)}
                />
            </>
        }
    >
        <form id="assign-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Select Patient */}
            <div className="bg-white/5 p-4 md:p-6 rounded-[24px] border border-white/10">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <UserIcon size={14} /> Select Patient
                </h4>
                
                <div className="relative group">
                    <select 
                        required
                        className="solid-input"
                        value={selectedPatientId}
                        onChange={e => setSelectedPatientId(e.target.value)}
                    >
                        <option value="">-- Choose Patient Record --</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Loc: {p.currentLocation})</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                </div>
            </div>

            {/* 2. Doctor Selection */}
            <div className="bg-white/5 p-4 md:p-6 rounded-[24px] border border-white/10">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Stethoscope size={14} /> Assign Doctor
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 ml-1 mb-1 block uppercase">Filter by Role</label>
                        <div className="relative group">
                            <select 
                                className="solid-input"
                                value={selectedDoctorCategory}
                                onChange={e => { setSelectedDoctorCategory(e.target.value); setSelectedDoctorId(''); }}
                            >
                                <option value="">All Roles</option>
                                {DOCTOR_CATEGORIES.map(category => {
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
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-500 ml-1 mb-1 block uppercase">Select Doctor</label>
                        <div className="relative group">
                            <select 
                                className="solid-input"
                                value={selectedDoctorId}
                                onChange={e => setSelectedDoctorId(e.target.value)}
                            >
                                <option value="">-- No Doctor --</option>
                                {doctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                        Dr. {doc.name} {doc.isOnline ? '●' : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Staff Selection */}
            <div className="bg-white/5 p-4 md:p-6 rounded-[24px] border border-white/10">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BriefcaseMedical size={14} /> Assign Medical Staff
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 ml-1 mb-1 block uppercase">Filter by Role</label>
                        <div className="relative group">
                            <select 
                                className="solid-input"
                                value={selectedStaffCategory}
                                onChange={e => { setSelectedStaffCategory(e.target.value); setSelectedStaffId(''); }}
                            >
                                <option value="">All Roles</option>
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
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-500 ml-1 mb-1 block uppercase">Select Staff</label>
                        <div className="relative group">
                            <select 
                                className="solid-input"
                                value={selectedStaffId}
                                onChange={e => setSelectedStaffId(e.target.value)}
                            >
                                <option value="">-- No Staff --</option>
                                {medicalStaff.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.staffCategory}) {s.isOnline ? '●' : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Time Picker */}
            <div className="bg-white/5 p-4 rounded-[24px] border border-white/10 flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} /> Effective Time
                </h4>
                <button 
                    type="button"
                    onClick={() => setShowTimePicker(true)}
                    className="bg-white text-[#4d4d4d] px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
                >
                    {assignmentTime} <ChevronDown size={14} className="opacity-50" />
                </button>
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
                padding: 0 1.5em; /* Adjusted padding */
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
            /* Add left padding if icon is present (like Filter) - manually adjusted in jsx via style if needed or css */
            .relative:has(.absolute.left-4) .solid-input {
                padding-left: 2.5rem;
            }
        `}</style>
    </Modal>

    {showTimePicker && (
        <ModernTimePicker 
        initialTime={getTimeForPicker()}
        onSave={(t) => { setAssignmentTime(formatTimeForDisplay(t)); setShowTimePicker(false); }}
        onCancel={() => setShowTimePicker(false)}
        />
    )}
    </>
  );
};

export default AssignStaffModal;
