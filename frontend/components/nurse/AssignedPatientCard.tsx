
import React from 'react';
import { Activity, MapPin } from 'lucide-react';
import { Patient } from '../../types';

interface AssignedPatientCardProps {
  patient: Patient;
  assignmentTime?: string;
  onRecordVitals: () => void;
  onViewProfile?: () => void;
}

const AssignedPatientCard: React.FC<AssignedPatientCardProps> = ({ patient, assignmentTime, onRecordVitals, onViewProfile }) => {
  return (
    <div 
        onClick={onViewProfile}
        className="bg-slate-900/5 backdrop-blur-2xl rounded-[32px] border border-white/30 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group flex flex-col h-full hover:border-[#1565C0] min-h-[300px] cursor-pointer"
    >
      {/* Left Accent Bar */}
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#1565C0]"></div>
      
      <div className="p-6 pl-9 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[22px] bg-white/80 text-[#1565C0] flex items-center justify-center font-heading font-bold text-3xl border border-white/50 shadow-sm backdrop-blur-md">
                    {patient.name.charAt(0)}
                </div>
                <div className="flex flex-col justify-center">
                    <h3 className="text-xl font-heading font-bold text-[#191C1B] leading-tight group-hover:text-[#1565C0] transition-colors">{patient.name}</h3>
                    <p className="text-xs text-[#44474F] font-mono mt-1 font-medium tracking-wide opacity-80 uppercase">ID: {patient.id}</p>
                </div>
            </div>
            {assignmentTime && (
                <span className="bg-white/60 text-[#1565C0] text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/40 shadow-sm whitespace-nowrap backdrop-blur-md">
                    {assignmentTime}
                </span>
            )}
        </div>

        {/* Body Info */}
        <div className="space-y-4 mb-8">
            <div className="bg-white/40 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold text-[#44474F] border border-white/30 backdrop-blur-md shadow-sm">
                <MapPin size={18} className="text-[#00695C]" />
                {patient.currentLocation}
            </div>
            <div className="px-2 flex items-center gap-3 text-sm text-[#44474F]">
                <Activity size={20} className="text-[#00695C]" />
                <span className="font-medium">Condition: <span className="font-bold text-[#191C1B]">{patient.condition}</span></span>
            </div>
        </div>

        {/* Footer Button */}
        <div className="mt-auto">
            <button 
                onClick={(e) => { e.stopPropagation(); onRecordVitals(); }}
                className="w-full py-4 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-[20px] font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 group-hover:shadow-xl hover:-translate-y-0.5"
            >
                <Activity size={20} /> Record Vitals
            </button>
        </div>
      </div>
    </div>
  );
};

export default AssignedPatientCard;
