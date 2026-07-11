
import React from 'react';
import { ArrowRight, Clock, MapPin, Activity } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import { Patient, User } from '../../types';

interface Props {
  filteredPatients: Patient[];
  handleSelectPatient: (id: string) => void;
  user: User;
  listFilter: string;
}

const PatientGrid: React.FC<Props> = ({ filteredPatients, handleSelectPatient, user, listFilter }) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 pt-6 space-y-3">
    {filteredPatients.map(p => (
        <div key={p.id} onClick={() => handleSelectPatient(p.id)} className="bg-[#FCFDF6] p-5 rounded-[24px] border border-[#DEE5D9] hover:bg-[#F5F9FF] hover:border-[#D7E3FF] transition-all cursor-pointer group relative overflow-hidden">
            {listFilter === 'ASSIGNED' && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${p.assignedDoctorId === user.id ? 'bg-[#006492]' : 'bg-[#90A4AE]'}`}></div>}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 pl-2">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#E1EBF3] text-[#00325B] flex items-center justify-center font-heading font-bold text-xl group-hover:bg-[#C4ED9C] group-hover:text-[#072100] transition-colors flex-shrink-0 shadow-sm">{p.name.charAt(0)}</div>
                    <div className="min-w-0 sm:hidden">
                        <h4 className="font-bold text-[#191C1B] text-lg truncate">{p.name}</h4>
                        <span className="text-xs text-[#44474F] font-mono bg-[#EFF1E6] px-2 py-0.5 rounded-md">{p.id}</span>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="hidden sm:flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-[#191C1B] text-lg truncate flex items-center gap-2 group-hover:text-[#006492] transition-colors">
                                {p.name}
                                {p.assignedDoctorId === user.id && <span className="text-[10px] bg-[#D1F0C0] text-[#072100] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-[#BCE4A8]"><Clock size={10} /> Active</span>}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[#44474F] font-mono bg-[#EFF1E6] px-2 py-0.5 rounded-md">{p.id}</span>
                                <SeverityBadge severity={p.severity} />
                            </div>
                        </div>
                        <button className="p-2 bg-[#EFF1E6] rounded-full text-[#44474F] group-hover:bg-[#C4ED9C] group-hover:text-[#072100] transition-colors"><ArrowRight size={18} /></button>
                    </div>
                    <div className="mt-2 sm:mt-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6 text-xs text-[#44474F] font-medium">
                        <div className="flex items-center gap-1.5 min-w-0 truncate"><MapPin size={14} className="text-[#006492] flex-shrink-0" /><span className="truncate">{p.currentLocation}</span></div>
                        <div className="flex items-center gap-1.5 min-w-0 truncate"><Activity size={14} className="text-[#006492] flex-shrink-0" /><span className="truncate sm:max-w-[200px]">{p.diagnosis || 'Under Evaluation'}</span></div>
                    </div>
                </div>
            </div>
        </div>
    ))}
    </div>
  );
};

export default PatientGrid;
