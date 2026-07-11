import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { X, User as UserIcon, Briefcase, Clock, Phone, Mail, MapPin, Shield, Calendar, Plus, ChevronDown, Search } from 'lucide-react';
import NeuButton from './NeuButton';
import AnimatedInput from './AnimatedInput';
import TranslucentDatePicker from './TranslucentDatePicker';
import { getCategorizedWards, getCategorizedStaff, DOCTOR_CATEGORIES, MEDICAL_STAFF_CATEGORIES } from '../services/mockDataService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (staff: User, password: string) => void;
  categoryType: 'DOCTOR' | 'MEDICAL_STAFF';
}

const AddStaffModal: React.FC<Props> = ({ isOpen, onClose, onAdd, categoryType }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    staffCategory: '',
    specialization: '',
    department: '',
    timings: '',
    aadharNumber: '',
    dob: '',
    address: ''
  });
  
  const [roleSearch, setRoleSearch] = useState('');

  const wardStructure = getCategorizedWards();
  const staffStructure = getCategorizedStaff();

  const categoryKeys = categoryType === 'DOCTOR' ? DOCTOR_CATEGORIES : MEDICAL_STAFF_CATEGORIES;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let role = UserRole.STAFF;
    if (categoryType === 'DOCTOR') role = UserRole.DOCTOR;
    else if (formData.staffCategory.includes('Nurse') || formData.staffCategory.includes('Nursing')) role = UserRole.NURSE;
    
    const newStaff: User = {
        id: `${formData.name.split(' ')[0].toLowerCase()}${Math.floor(Math.random()*1000)}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
        staffCategory: formData.staffCategory,
        specialization: formData.specialization,
        department: formData.department,
        timings: formData.timings,
        isOnline: false,
        aadharNumber: formData.aadharNumber,
        dob: formData.dob,
        address: formData.address
    };
    onAdd(newStaff, formData.password);
    onClose();
    setFormData({ name: '', email: '', password: '', phone: '', staffCategory: '', specialization: '', department: '', timings: '', aadharNumber: '', dob: '', address: '' });
    setRoleSearch('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-[32px] transition-all duration-300">
      <div className="bg-white/10 backdrop-blur-3xl rounded-[48px] shadow-2xl w-[95%] max-w-4xl relative z-10 flex flex-col max-h-[94vh] overflow-hidden animate-scale-in font-sans text-white border border-white/20 will-change-transform">
        
        {/* Header - Thinned */}
        <div className="px-10 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-[14px] bg-brand-green text-neutral-textPrimary flex items-center justify-center shadow-lg">
                <Plus size={20} strokeWidth={2.5} />
            </div>
            <div>
                <h3 className="text-xl font-heading font-bold text-white tracking-tight">Add New {categoryType === 'DOCTOR' ? 'Doctor' : 'Staff'}</h3>
                <p className="text-xs text-gray-300 opacity-80">Create a comprehensive professional profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white/70 hover:bg-white/20 transition-colors"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar">
            <form id="add-staff-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Professional Info */}
                <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 space-y-4">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3 mb-1">
                        <Briefcase size={12} /> Professional Credentials
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1.5 block uppercase tracking-wide">Role Category</label>
                            <div className="bg-white rounded-[24px] overflow-hidden shadow-md border border-transparent focus-within:border-emerald-300 transition-all p-1">
                                <div className="flex items-center px-3 border-b border-gray-100">
                                    <Search size={14} className="text-gray-400" />
                                    <input 
                                        type="text"
                                        className="w-full text-xs p-2 outline-none text-gray-600 font-bold bg-transparent"
                                        placeholder="Filter roles..."
                                        value={roleSearch}
                                        onChange={(e) => setRoleSearch(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <select 
                                        required
                                        className="w-full h-[2.2em] px-3 bg-transparent text-[#1F2937] font-black text-sm outline-none appearance-none cursor-pointer"
                                        value={formData.staffCategory}
                                        onChange={e => setFormData({...formData, staffCategory: e.target.value})}
                                    >
                                        <option value="">Select Primary Role...</option>
                                        {categoryKeys.map((category) => {
                                            const data = staffStructure[category];
                                            if (!data) return null;
                                            const filteredRoles = data.roles.filter(r => r.toLowerCase().includes(roleSearch.toLowerCase()));
                                            if (filteredRoles.length === 0) return null;
                                            return (
                                                <optgroup label={category} key={category} className={`font-black ${data.color.replace('text-', 'text-opacity-80 text-')}`}>
                                                    {filteredRoles.map(role => (
                                                        <option key={role} value={role} className="text-black pl-4 font-bold">
                                                            {role}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            );
                                        })}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1.5 block uppercase tracking-wide">Primary Department</label>
                            <div className="relative">
                                <select 
                                    required
                                    className="solid-input h-[45px] text-sm px-5"
                                    value={formData.department}
                                    onChange={e => setFormData({...formData, department: e.target.value})}
                                >
                                    <option value="">Select Ward / Dept</option>
                                    {Object.entries(wardStructure).map(([category, data]) => (
                                        <optgroup label={category} key={category} className="text-black font-black">
                                            {data.wards.map(w => (
                                                <option key={w} value={w} className="font-bold">{w}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                            </div>
                        </div>
                        {categoryType === 'DOCTOR' && (
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase tracking-wide">Specialization Field</label>
                                <AnimatedInput className="h-[45px] text-sm" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} placeholder="e.g. Interventional Cardiology" />
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase tracking-wide flex items-center gap-2"><Clock size={12}/> Shift Schedule</label>
                            <AnimatedInput className="h-[45px] text-sm" value={formData.timings} onChange={e => setFormData({...formData, timings: e.target.value})} placeholder="e.g. 09:00 AM - 05:00 PM" />
                        </div>
                    </div>
                </div>

                {/* Personal Info */}
                <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 space-y-4">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3 mb-1">
                        <UserIcon size={12} /> Personal Identification
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase tracking-wide">Full Legal Name</label>
                            <AnimatedInput className="h-[45px] text-sm" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Official name" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase tracking-wide">Email</label>
                            <AnimatedInput className="h-[45px] text-sm" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@nexacare.com" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase tracking-wide">Password</label>
                            <AnimatedInput className="h-[45px] text-sm" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Min 8 characters" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase tracking-wide">Contact</label>
                            <AnimatedInput className="h-[45px] text-sm" type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91..." />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase tracking-wide">Birth Date</label>
                            <TranslucentDatePicker 
                                className="h-[45px]"
                                value={formData.dob} 
                                onChange={(date) => setFormData({...formData, dob: date})}
                                placeholder="YYYY-MM-DD"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase tracking-wide">Govt ID</label>
                            <AnimatedInput className="h-[45px] text-sm" type="text" value={formData.aadharNumber} onChange={e => setFormData({...formData, aadharNumber: e.target.value})} placeholder="XXXX-XXXX-XXXX" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase tracking-wide">Address</label>
                            <AnimatedInput className="h-[45px] text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full residential address" />
                        </div>
                    </div>
                </div>

            </form>
        </div>

        {/* Footer - Thinned */}
        <div className="px-10 py-4 flex items-center justify-end gap-4 bg-white/5 border-t border-white/10">
            <button onClick={onClose} className="px-6 py-2 rounded-full text-white/70 font-bold text-sm hover:bg-white/10 transition-colors">
                Cancel
            </button>
            <NeuButton 
                form="add-staff-form" 
                type="submit" 
                label="Confirm & Add" 
                isActive={true} 
                className="px-8 py-3 text-base"
            />
        </div>

      </div>
      <style>{`
        .solid-input {
            width: 100%;
            height: 3em;
            border-radius: 3em;
            border: none;
            background-color: white;
            color: #1F2937;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 0 1.5em;
            font-size: 0.875rem;
            font-weight: 700;
            outline: none;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            appearance: none;
            cursor: pointer;
        }
        .solid-input:focus {
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default AddStaffModal;