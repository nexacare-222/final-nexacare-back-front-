import React, { useState, useEffect } from 'react';
import { Patient, UserRole } from '../types';
import { User, MapPin, Users, HeartPulse, Plus, ChevronDown, Clock } from 'lucide-react';
import { getCategorizedWards, generateId } from '../services/mockDataService';
import { useDoctorStore } from '../store/useDoctorStore';
import RetroButton from './RetroButton';
import AnimatedInput from './AnimatedInput';
import TranslucentDatePicker from './TranslucentDatePicker';
import Modal from './ui/Modal';
import ModernTimePicker from './ModernTimePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (patient: Partial<Patient>) => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", 
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const RegisterPatientModal: React.FC<Props> = ({ isOpen, onClose, onRegister }) => {
  const doctors = useDoctorStore(state => state.staff).filter(s => s.role === UserRole.DOCTOR);
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', dob: '', aadharNumber: '',
    initialWard: '', bedNumber: '', condition: '', bloodGroup: '', address: '', state: '',
    familyMemberName: '', familyMemberRelationship: '', familyMemberPhone: '',
    assignedDoctorId: '',
  });

  const [admissionTime, setAdmissionTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
        const now = new Date();
        setAdmissionTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }
  }, [isOpen]);

  const wardStructure = getCategorizedWards();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate admission timestamp from current date + selected time
    const now = new Date();
    const [h, m] = admissionTime.split(':').map(Number);
    now.setHours(h);
    now.setMinutes(m);
    now.setSeconds(0);
    now.setMilliseconds(0);

    // Format current location with bed number if provided
    const wardLocation = formData.bedNumber ? `${formData.initialWard} (Bed: ${formData.bedNumber})` : formData.initialWard;

    const newPatient: Partial<Patient> = {
        id: `PAT-${new Date().getFullYear()}-${generateId().toUpperCase()}`,
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender as Patient['gender'],
        currentLocation: wardLocation,
        condition: formData.condition,
        assignedDoctorId: formData.assignedDoctorId,
        admissionTimestamp: now.getTime(),
        movements: [],
        qrToken: generateId() + '-secure',
        dob: formData.dob,
        aadharNumber: formData.aadharNumber,
        bloodGroup: formData.bloodGroup || 'Unknown',
        address: formData.address,
        state: formData.state,
        emergencyContactName: formData.familyMemberName, 
        emergencyContactPhone: formData.familyMemberPhone,
        familyMemberName: formData.familyMemberName,
        familyMemberRelationship: formData.familyMemberRelationship,
        familyMemberPhone: formData.familyMemberPhone,
        allergies: [] 
    };
    onRegister(newPatient);
    onClose();
    setFormData({ name: '', age: '', gender: 'Male', dob: '', aadharNumber: '', initialWard: '', bedNumber: '', condition: '', bloodGroup: '', address: '', state: '', familyMemberName: '', familyMemberRelationship: '', familyMemberPhone: '', assignedDoctorId: '' });
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
        title="Admission"
        subtitle="Register a new patient record"
        icon={<Plus size={24} strokeWidth={2.5} />}
        className="w-[95%] max-w-3xl"
        footer={
            <>
                <button onClick={onClose} className="px-6 py-2.5 text-white/70 font-bold text-sm hover:bg-white/10 rounded-full transition-colors">Cancel</button>
                <RetroButton form="register-form" type="submit" label="Admit Patient" />
            </>
        }
    >
        <form id="register-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Details */}
            <div className="bg-white/5 p-4 md:p-6 rounded-[24px] border border-white/10">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User size={14} /> Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                    <AnimatedInput required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name *" />
                    </div>
                    <div className="relative">
                    <select className="solid-input" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                    <div>
                    <AnimatedInput required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder="Age *" />
                    </div>
                    <div>
                        <TranslucentDatePicker 
                            value={formData.dob} 
                            onChange={(date) => setFormData({...formData, dob: date})}
                            placeholder="DOB"
                        />
                    </div>
                    <div>
                    <AnimatedInput type="text" placeholder="Aadhar Number" value={formData.aadharNumber} onChange={e => setFormData({...formData, aadharNumber: e.target.value})} />
                    </div>
                </div>
            </div>

            {/* Address & Location */}
            <div className="bg-white/5 p-4 md:p-6 rounded-[24px] border border-white/10">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin size={14} /> Contact & Location
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                    <AnimatedInput type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full Address" />
                    </div>
                    <div className="relative">
                    <select className="solid-input" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}>
                        <option value="">-- Select State --</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Family & Emergency */}
            <div className="bg-white/5 p-4 md:p-6 rounded-[24px] border border-white/10">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={14} /> Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                    <AnimatedInput type="text" value={formData.familyMemberName} onChange={e => setFormData({...formData, familyMemberName: e.target.value})} placeholder="Contact Name" />
                    </div>
                    <div className="relative">
                    <select className="solid-input" value={formData.familyMemberRelationship} onChange={e => setFormData({...formData, familyMemberRelationship: e.target.value})}>
                        <option value="">Relationship</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Guardian">Guardian</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                    <div>
                    <AnimatedInput type="tel" value={formData.familyMemberPhone} onChange={e => setFormData({...formData, familyMemberPhone: e.target.value})} placeholder="Phone Number" />
                    </div>
                </div>
            </div>

            {/* Medical Admission Info */}
            <div className="bg-white/5 p-4 md:p-6 rounded-[24px] border border-white/10">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <HeartPulse size={14} /> Medical Context
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                    <select required className="solid-input" value={formData.initialWard} onChange={e => setFormData({...formData, initialWard: e.target.value})}>
                        <option value="">-- Assign Ward * --</option>
                        {Object.entries(wardStructure).map(([category, data]) => (
                            <optgroup label={category} key={category} className="text-black font-bold">
                                {data.wards.map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>

                    <div className="relative">
                    <select required className="solid-input" value={formData.assignedDoctorId} onChange={e => setFormData({...formData, assignedDoctorId: e.target.value})}>
                        <option value="">-- Assign Doctor * --</option>
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` (${d.specialization})` : ''}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                    
                    {/* Time of Admission Selection */}
                    <button 
                        type="button"
                        onClick={() => setShowTimePicker(true)}
                        className="bg-white text-[#4d4d4d] rounded-[2.5em] h-[2.5em] flex items-center justify-center font-bold text-sm shadow-sm hover:bg-gray-100 transition-colors"
                    >
                        <span className="opacity-50 mr-2 uppercase tracking-tighter text-[10px]">Admit Time:</span>
                        {formatDisplayTime(admissionTime)} <Clock size={16} className="ml-2 text-indigo-500" />
                    </button>

                    <div className="relative">
                    <select className="solid-input" value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})}>
                        <option value="">Blood Group</option>
                        <option>A+</option><option>A-</option>
                        <option>B+</option><option>B-</option>
                        <option>O+</option><option>O-</option>
                        <option>AB+</option><option>AB-</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>

                    <div className="relative">
                    <AnimatedInput 
                        type="text" 
                        value={formData.bedNumber} 
                        onChange={e => setFormData({...formData, bedNumber: e.target.value})} 
                        placeholder="Bed Number" 
                    />
                    </div>

                    <div className="md:col-span-2">
                    <AnimatedInput required value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} placeholder="Admission Reason / Symptoms *" />
                    </div>
                </div>
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
            initialTime={admissionTime}
            onSave={(t) => { setAdmissionTime(t); setShowTimePicker(false); }}
            onCancel={() => setShowTimePicker(false)}
        />
    )}
    </>
  );
};

export default RegisterPatientModal;