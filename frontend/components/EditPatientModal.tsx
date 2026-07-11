import React, { useState, useEffect, useRef } from 'react';
import { Patient, User, UserRole, LabReport } from '../types';
import { X, Camera, Save, ChevronDown, UploadCloud, CheckCircle2 } from 'lucide-react';
import { getCategorizedWards } from '../services/mockDataService';
import TranslucentDatePicker from './TranslucentDatePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  staff: User[];
  onUpdate: (updatedPatient: Patient) => void;
  onAddReport?: (report: LabReport) => void;
}

const EditPatientModal: React.FC<Props> = ({ isOpen, onClose, patient, staff, onUpdate, onAddReport }) => {
  const [formData, setFormData] = useState<Patient>(patient);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState<{
      testName: string;
      category: LabReport['category'];
      date: string;
      file: File | null;
  }>({
      testName: '',
      category: 'Pathology',
      date: new Date().toISOString().split('T')[0],
      file: null
  });
  const [reportSuccess, setReportSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wardStructure = getCategorizedWards();

  useEffect(() => {
    setFormData(patient);
    setReportSuccess('');
    setShowReportForm(false);
  }, [patient]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  const handleReportSubmit = () => {
      if (!reportForm.testName || !onAddReport) return;
      const newReport: LabReport = {
          id: `REP-${Date.now()}`,
          patientId: patient.id,
          testName: reportForm.testName,
          category: reportForm.category,
          date: new Date(reportForm.date).toLocaleDateString(),
          timestamp: Date.now(),
          status: 'COMPLETED',
          doctorName: 'Admin Upload',
          resultSummary: 'Uploaded',
          data: {}
      };
      onAddReport(newReport);
      setReportSuccess(`Uploaded: ${reportForm.testName}`);
      setShowReportForm(false);
      setTimeout(() => setReportSuccess(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300" onClick={onClose}>
      <div 
        className="bg-black rounded-[40px] shadow-[0_0_30px_5px_rgba(255,255,255,0.2)] w-full max-w-[460px] relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in text-white border border-white/10 font-sans" 
        onClick={e => e.stopPropagation()}
      >
        {/* macOS Style Traffic Lights */}
        <div className="flex gap-2 px-8 pt-8 pb-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
        </div>

        <div className="p-8 pt-2 pb-4 flex flex-col items-center relative">
            <div className="w-24 h-24 rounded-3xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-4xl font-black text-white shadow-xl">
                {formData.name.charAt(0)}
            </div>
            <h2 className="text-2xl font-black text-white mt-4 text-center tracking-tight leading-tight uppercase">{formData.name}</h2>
            <p className="text-[10px] font-bold text-white/40 tracking-[0.3em] uppercase mt-2">Patient Profile Edit</p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
            <form id="edit-patient-form" onSubmit={handleSubmit} className="space-y-1">
                
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4 mt-6">General Info</p>

                <div className="edit-row">
                    <label>Full Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="edit-row">
                    <label>Age / Gender</label>
                    <div className="flex gap-2 justify-end items-center">
                        <input className="!w-12" type="number" value={formData.age} onChange={e => setFormData({...formData, age: Number(e.target.value)})} />
                        <span className="opacity-30">/</span>
                        <select className="!w-20" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Patient['gender']})}>
                            <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                    </div>
                </div>

                <div className="edit-row">
                    <label>Ward Location</label>
                    <select value={formData.currentLocation} onChange={e => setFormData({...formData, currentLocation: e.target.value})}>
                        {Object.entries(wardStructure).map(([cat, data]) => (
                            <optgroup label={cat} key={cat}>
                                {data.wards.map(w => <option key={w} value={w}>{w}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </div>

                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 mt-8">Medical Context</p>

                <div className="edit-row">
                    <label>Condition</label>
                    <input type="text" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} />
                </div>

                <div className="edit-row">
                    <label>Blood Group</label>
                    <select value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})}>
                        <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                        <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                    </select>
                </div>

                <div className="edit-row">
                    <label>Primary Doc</label>
                    <select value={formData.assignedDoctorId} onChange={e => setFormData({...formData, assignedDoctorId: e.target.value})}>
                        {staff.filter(s => s.role === UserRole.DOCTOR).map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                {reportSuccess && (
                    <div className="mt-4 p-3 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={14}/> {reportSuccess}
                    </div>
                )}

                <div className="pt-10">
                    <button type="submit" className="w-full py-4 bg-white text-black font-black text-sm rounded-full shadow-xl hover:bg-emerald-400 transition-all uppercase tracking-widest">
                        Save Patient Data
                    </button>
                    <button type="button" onClick={onClose} className="w-full py-4 mt-2 text-white/30 font-bold text-[11px] uppercase tracking-widest">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
      </div>
      <style>{`
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .edit-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.15); }
        .edit-row label { font-size: 11px; font-weight: 800; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 1px; }
        .edit-row input, .edit-row select { background: transparent; border: none; text-align: right; font-size: 13px; font-weight: 700; color: #fff; outline: none; width: 65%; cursor: pointer; }
        .edit-row select { appearance: none; }
        .edit-row select option { background: #111; color: #fff; }
      `}</style>
    </div>
  );
};

export default EditPatientModal;