import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { X, Camera, Save } from 'lucide-react';
import { getCategorizedWards } from '../services/mockDataService';

interface Props {
  staff: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedStaff: User) => void;
}

const StaffDetailModal: React.FC<Props> = ({ staff, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wardStructure = getCategorizedWards();

  useEffect(() => {
    if (staff) {
      setFormData({ ...staff });
    }
  }, [staff]);

  if (!isOpen || !formData) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result as string;
        setFormData({ ...formData, avatar: newAvatar });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300" onClick={onClose}>
      <div 
        className="bg-black rounded-[40px] shadow-[0_0_30px_5px_rgba(255,255,255,0.2)] w-full max-w-[440px] relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in text-white border border-white/10 font-sans" 
        onClick={e => e.stopPropagation()}
      >
        {/* macOS Style Traffic Lights */}
        <div className="flex gap-2 px-8 pt-8 pb-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm"></div>
        </div>

        {/* Header Area */}
        <div className="p-8 pt-2 pb-4 flex flex-col items-center relative">
             {/* Avatar */}
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <div className="w-28 h-28 rounded-full p-1 bg-white/10 shadow-xl border-2 border-white/20 overflow-hidden">
                    <img 
                        src={formData.avatar} 
                        alt={formData.name} 
                        className="w-full h-full rounded-full object-cover" 
                    />
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <Camera size={24} />
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            
            <h2 className="text-2xl font-black text-white mt-4 text-center tracking-tight leading-tight uppercase">{formData.name}</h2>
            <div className="mt-2 px-4 py-1 bg-brand-purple/30 text-brand-purpleSoft text-[11px] font-black rounded-full uppercase tracking-[0.2em] border border-brand-purple/40">
                {formData.staffCategory || 'STAFF'}
            </div>
        </div>

        {/* Integrated Edit Form */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
            <form id="edit-staff-form" onSubmit={handleSave} className="space-y-1">
                
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 mt-4">Profile Configuration</p>

                <div className="edit-row">
                    <label>Full Name</label>
                    <input 
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                <div className="edit-row">
                    <label>Department</label>
                    <select 
                        value={formData.department}
                        onChange={e => setFormData({...formData, department: e.target.value})}
                    >
                        <option value="">Select Dept</option>
                        {Object.entries(wardStructure).map(([category, data]) => (
                            <optgroup label={category} key={category}>
                                {data.wards.map(w => <option key={w} value={w}>{w}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </div>

                <div className="edit-row">
                    <label>Role / Spec</label>
                    <input 
                        type="text"
                        placeholder="e.g. Cardiology"
                        value={formData.specialization || formData.staffCategory || ''}
                        onChange={e => setFormData({...formData, staffCategory: e.target.value})}
                    />
                </div>

                <div className="edit-row">
                    <label>Shift Time</label>
                    <input 
                        type="text"
                        placeholder="09:00 AM - 05:00 PM"
                        value={formData.timings || ''}
                        onChange={e => setFormData({...formData, timings: e.target.value})}
                    />
                </div>

                <div className="edit-row">
                    <label>Email ID</label>
                    <input 
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                <div className="edit-row">
                    <label>Phone No</label>
                    <input 
                        type="tel"
                        value={formData.phone || ''}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>

                <div className="edit-row border-none">
                    <label>Staff ID</label>
                    <input 
                        type="text"
                        readOnly
                        className="opacity-50 cursor-not-allowed"
                        value={formData.id}
                    />
                </div>

                <div className="pt-8">
                    <button 
                        type="submit"
                        className="w-full py-4 bg-white text-black font-black text-sm rounded-full flex items-center justify-center gap-3 hover:bg-brand-purple hover:text-white transition-all shadow-xl active:scale-95 uppercase tracking-widest"
                    >
                        Save Changes
                    </button>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="w-full py-3 mt-2 text-white/30 hover:text-white/60 font-bold text-[11px] uppercase tracking-widest transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
      </div>
      <style>{`
        @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
            animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .edit-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }
        
        .edit-row label {
            font-size: 11px;
            font-weight: 800;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
            flex-shrink: 0;
        }
        
        .edit-row input, .edit-row select {
            background: transparent;
            border: none;
            text-align: right;
            font-size: 13px;
            font-weight: 700;
            color: #fff;
            outline: none;
            width: 70%;
            cursor: pointer;
        }
        
        .edit-row input:focus {
            color: #8b5cf6;
        }
        
        .edit-row select {
            appearance: none;
        }
        
        .edit-row select option {
            background: #111;
            color: #fff;
        }
      `}</style>
    </div>
  );
};

export default StaffDetailModal;