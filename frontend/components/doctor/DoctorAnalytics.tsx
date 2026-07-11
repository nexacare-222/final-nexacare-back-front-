
import React from 'react';
import { BarChart2, ChevronRight, MapPin } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import { Patient } from '../../types';
import AnimatedInput from '../AnimatedInput';

interface Props {
  analyticsSearch: string;
  setAnalyticsSearch: (val: string) => void;
  analyticsPatients: Patient[];
  handleSelectPatient: (id: string, tab: string) => void;
}

const DoctorAnalytics: React.FC<Props> = ({ analyticsSearch, setAnalyticsSearch, analyticsPatients, handleSelectPatient }) => {
  return (
    <div className="flex flex-col h-full animate-fade-in">
    <div className="p-6 pb-2 flex-shrink-0 border-b border-[#EFF1E6]">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#FFEDCC] text-[#E65100] rounded-xl"><BarChart2 size={24} /></div>
            <div><h1 className="text-3xl font-bold text-[#191C1B]">Patient Analytics</h1><p className="text-sm text-[#44474F]">Monitor recovery trends and health scores.</p></div>
        </div>
        <div className="max-w-md mb-2"><AnimatedInput value={analyticsSearch} onChange={(e) => setAnalyticsSearch(e.target.value)} placeholder="Filter patients..." /></div>
    </div>
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsPatients.map(p => (
                <div key={p.id} onClick={() => handleSelectPatient(p.id, 'ANALYTICS')} className="bg-[#FCFDF6] p-4 rounded-2xl border border-[#DEE5D9] hover:border-[#FB8C00] hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-[#FFF3E0] text-[#EF6C00] flex items-center justify-center font-bold text-lg border border-[#FFE0B2]">{p.name.charAt(0)}</div>
                        <div><h4 className="font-bold text-[#191C1B] text-base">{p.name}</h4><SeverityBadge severity={p.severity} /></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#44474F] font-medium mt-2 bg-[#EFF1E6] p-2 rounded-lg">
                        <span>{p.currentLocation}</span>
                        <span className="flex items-center gap-1 font-bold text-[#191C1B]">View Graph <ChevronRight size={12} /></span>
                    </div>
                </div>
            ))}
        </div>
    </div>
    </div>
  );
};

export default DoctorAnalytics;
