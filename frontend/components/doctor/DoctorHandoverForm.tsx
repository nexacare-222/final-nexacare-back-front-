
import React, { useState, useEffect, useRef } from 'react';
import { User, Patient, UserRole } from '../../types';
import { FileText, Send, Search, Plus, User as UserIcon, ChevronDown, Stethoscope, Filter, Building2, Check, X } from 'lucide-react';
import AnimatedInput from '../AnimatedInput';
import { getCategorizedStaff, getCategorizedWards, DOCTOR_CATEGORIES } from '../../services/mockDataService';

interface Props {
  user: User;
  patients: Patient[];
  staff: User[];
  onSubmit: (targetStaffId: string, patientIds: string[], notes: string) => void;
}

const DoctorHandoverForm: React.FC<Props> = ({ user, patients, staff, onSubmit }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
  
  // Ward Filter State
  const [selectedWard, setSelectedWard] = useState('');

  // Staff Selection State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [targetStaffId, setTargetStaffId] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const staffDropdownRef = useRef<HTMLDivElement>(null);

  const [notes, setNotes] = useState('');
  
  const staffStructure = getCategorizedStaff();
  const wardStructure = getCategorizedWards();

  // Handle click outside to close staff dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target as Node)) {
              setIsStaffDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Filter Patients Logic
  const filteredPatientsByWard = selectedWard 
      ? patients.filter(p => p.currentLocation === selectedWard)
      : patients;

  const searchResults = searchQuery.length > 0 
    ? filteredPatientsByWard.filter(p => 
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         p.currentLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !selectedPatients.find(sp => sp.id === p.id) // Exclude already selected
      )
    : [];

  // 2. Filter Doctors Logic
  const availableDoctors = staff.filter(s => 
      s.role === UserRole.DOCTOR && 
      s.id !== user.id
  );

  const filteredStaff = availableDoctors.filter(s => 
      (!selectedCategory || s.staffCategory === selectedCategory || s.specialization === selectedCategory) &&
      (s.name.toLowerCase().includes(staffSearch.toLowerCase()) || 
       (s.specialization || '').toLowerCase().includes(staffSearch.toLowerCase()))
  );

  const handleAddPatient = (patient: Patient) => {
      setSelectedPatients([...selectedPatients, patient]);
      setSearchQuery('');
  };

  const handleRemovePatient = (patientId: string) => {
      setSelectedPatients(selectedPatients.filter(p => p.id !== patientId));
  };

  const handleSelectStaff = (staffMember: User) => {
      setTargetStaffId(staffMember.id);
      setStaffSearch(staffMember.name);
      setIsStaffDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!targetStaffId || selectedPatients.length === 0) return;
      
      const patientIds = selectedPatients.map(p => p.id);
      onSubmit(targetStaffId, patientIds, notes);
      
      // Reset form after submit
      setSearchQuery('');
      setSelectedPatients([]);
      setSelectedWard('');
      setSelectedCategory('');
      setTargetStaffId('');
      setStaffSearch('');
      setNotes('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-scale-in p-4 md:p-6">
      <div className="bg-[#1a1a1a]/95 backdrop-blur-2xl w-full max-w-2xl mx-auto rounded-[32px] shadow-2xl font-sans text-white flex flex-col border border-white/10 h-full overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-3">
                <div className="bg-[#C4ED9C] p-2 rounded-full text-[#072100]">
                    <FileText size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="font-bold text-xl tracking-tight">Shift Transfer</h3>
                    <p className="text-xs text-gray-300">Transfer patient responsibility to another doctor</p>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
            <form id="doctor-handover-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Patient Selection */}
                <div className="bg-white/5 p-5 rounded-[24px] border border-white/10">
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                        <Search size={14} /> Search Patient
                    </label>
                    
                    <div className="space-y-3">
                        {/* Ward Filter */}
                        <div className="relative group">
                            <select 
                                className="solid-input !pl-12"
                                value={selectedWard}
                                onChange={(e) => { setSelectedWard(e.target.value); setSearchQuery(''); }}
                            >
                                <option value="">All Wards / Locations</option>
                                {Object.entries(wardStructure).map(([category, data]) => (
                                    <optgroup label={category} key={category} className="text-black font-bold">
                                        {data.wards.map(w => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                        </div>

                        {/* Search Input */}
                        <div className="relative z-20">
                            <div className="relative flex-1">
                                <AnimatedInput 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={selectedWard ? `Search bed in ${selectedWard}...` : "e.g. Bed 03"}
                                    className="!pl-12"
                                    style={{ textAlign: 'left', paddingLeft: '3rem' }} 
                                />
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>

                            {/* Search Suggestions Dropdown */}
                            {searchQuery && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E1E1E] border border-white/20 rounded-[20px] shadow-xl overflow-hidden max-h-48 overflow-y-auto z-30">
                                    {searchResults.length === 0 ? (
                                        <div className="p-4 text-xs text-gray-500 text-center italic">No patients found in this location</div>
                                    ) : (
                                        searchResults.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleAddPatient(p)}
                                                className="w-full text-left p-3 hover:bg-white/10 flex items-center justify-between transition-colors border-b border-white/5 last:border-0"
                                            >
                                                <span className="font-bold text-sm text-white">{p.currentLocation} <span className="text-gray-400 font-normal">– {p.name}</span></span>
                                                <Plus size={16} className="text-emerald-400" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Patient Chips */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {selectedPatients.length === 0 && <p className="text-xs text-gray-500 italic w-full text-center py-2">No patients selected yet.</p>}
                        {selectedPatients.map(p => (
                            <div key={p.id} className="bg-emerald-500/20 text-emerald-100 pl-3 pr-2 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30 flex items-center gap-2 animate-fade-in">
                                <span>{p.name}</span>
                                <button type="button" onClick={() => handleRemovePatient(p.id)} className="bg-black/20 hover:bg-black/40 rounded-full p-0.5 transition-colors">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Doctor Selection */}
                <div className="bg-white/5 p-5 rounded-[24px] border border-white/10">
                    <label className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                        <UserIcon size={14} /> Select Doctor
                    </label>
                    
                    <div className="grid grid-cols-1 gap-3">
                        {/* Category Dropdown */}
                        <div className="relative group">
                            <select 
                                className="solid-input !pl-12"
                                value={selectedCategory}
                                onChange={(e) => { setSelectedCategory(e.target.value); setTargetStaffId(''); setStaffSearch(''); }}
                            >
                                <option value="">All Specializations</option>
                                {DOCTOR_CATEGORIES.map(category => (
                                    <option key={category} value={category} className="text-black font-bold">
                                        {category}
                                    </option>
                                ))}
                            </select>
                            <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                        </div>

                        {/* Searchable Staff Dropdown */}
                        <div className="relative group" ref={staffDropdownRef}>
                            <div className="relative">
                                <input 
                                    type="text"
                                    className="solid-input !pl-12 w-full"
                                    placeholder="Search Doctor Name..."
                                    value={staffSearch}
                                    onChange={(e) => { setStaffSearch(e.target.value); setTargetStaffId(''); setIsStaffDropdownOpen(true); }}
                                    onFocus={() => setIsStaffDropdownOpen(true)}
                                    style={{ textAlign: 'left' }}
                                />
                                <Stethoscope size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-transform ${isStaffDropdownOpen ? 'rotate-180' : ''}`} size={18} />
                            </div>

                            {/* Custom Dropdown List */}
                            {isStaffDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E1E1E] border border-white/20 rounded-[20px] shadow-2xl overflow-hidden max-h-48 overflow-y-auto z-40 animate-fade-in">
                                    {filteredStaff.length === 0 ? (
                                        <div className="p-4 text-xs text-gray-500 text-center italic">No doctors found matching "{staffSearch}"</div>
                                    ) : (
                                        filteredStaff.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => handleSelectStaff(s)}
                                                className={`w-full text-left p-3 hover:bg-white/10 flex items-center justify-between transition-colors border-b border-white/5 last:border-0 ${targetStaffId === s.id ? 'bg-white/10' : ''}`}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-white">{s.name}</span>
                                                        {s.isOnline ? (
                                                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" title="Online"></span>
                                                        ) : (
                                                            <span className="text-[9px] font-medium text-white/50 bg-white/10 px-1.5 rounded" title="Offline">Offline</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400">{s.specialization || s.staffCategory}</p>
                                                </div>
                                                {targetStaffId === s.id && <Check size={16} className="text-blue-400" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Notes */}
                <div className="bg-white/5 p-5 rounded-[24px] border border-white/10">
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 block">Transfer Notes</label>
                    <textarea 
                        className="w-full bg-white rounded-[20px] p-4 text-sm font-semibold text-[#4d4d4d] outline-none shadow-sm resize-none h-32 focus:shadow-md transition-all placeholder-gray-400 border-none"
                        placeholder="Clinical summary, pending tasks, critical alerts..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>

            </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5">
            <button 
                type="submit" 
                form="doctor-handover-form"
                disabled={!targetStaffId || selectedPatients.length === 0}
                className="w-full py-4 bg-[#C4ED9C] text-[#072100] rounded-[20px] font-bold flex items-center justify-center gap-2 hover:bg-[#B8E090] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
                <Send size={18} /> Confirm Transfer
            </button>
        </div>

      </div>
      
      <style>{`
        .solid-input {
            width: 100%;
            height: 3em;
            border-radius: 3em;
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
    </div>
  );
};

export default DoctorHandoverForm;
