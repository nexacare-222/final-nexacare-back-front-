import React from 'react';
import { Patient, User } from '../../types';
import { MapPin, Calendar, User as UserIcon, Edit, QrCode, ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge';

interface PatientListCardProps {
  patient: Patient;
  doctorName?: string;
  isAdmin: boolean;
  onEdit: (p: Patient) => void;
  onQr: (p: Patient) => void;
  onNavigate: (path: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

const PatientListCard: React.FC<PatientListCardProps> = ({ patient, doctorName, isAdmin, onEdit, onQr, onNavigate, style, className }) => {
  return (
    <div 
        className={`group relative bg-[#FCFDF6] rounded-[20px] border border-[#DEE5D9] hover:border-[#006D42] hover:shadow-md transition-all duration-300 overflow-hidden ${className || ''}`}
        style={style}
    >
        <div className="p-3 md:p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            
            {/* Avatar / ID Section */}
            <div className="flex items-center gap-3 min-w-[170px]">
                <div className="h-10 w-10 rounded-xl bg-[#E0F2F1] text-[#004D40] flex items-center justify-center font-heading font-bold text-lg border border-[#B2DFDB] flex-shrink-0 group-hover:bg-[#C4ED9C] group-hover:text-[#072100] transition-colors">
                    {patient.name.charAt(0)}
                </div>
                <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-heading font-bold text-[#191C1B] group-hover:text-[#006D42] transition-colors truncate leading-tight">{patient.name}</h3>
                    <span className="text-[10px] font-bold text-[#44474F] font-mono bg-[#EFF1E6] px-1.5 py-0.5 rounded border border-[#DEE5D9]">{patient.id}</span>
                </div>
            </div>

            {/* Details Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 w-full">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#747871] uppercase tracking-widest mb-0.5">Location</span>
                    <div className="flex items-center gap-1 text-xs font-bold text-[#191C1B] truncate bg-[#EFF1E6] px-2 py-0.5 rounded-lg w-fit">
                        <MapPin size={12} className="text-[#006D42] flex-shrink-0" />
                        <span className="truncate">{patient.currentLocation}</span>
                    </div>
                </div>
                <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-[#747871] uppercase tracking-widest mb-0.5">Admitted</span>
                        <div className="flex items-center gap-1 text-xs font-medium text-[#44474F]">
                        <Calendar size={12} className="text-[#006D42] flex-shrink-0" />
                        {new Date(patient.admissionTimestamp).toLocaleDateString()}
                    </div>
                </div>
                <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-[#747871] uppercase tracking-widest mb-0.5">Doctor</span>
                        <div className="flex items-center gap-1 text-xs font-medium text-[#44474F] truncate">
                        <UserIcon size={12} className="text-[#006D42] flex-shrink-0" />
                        {doctorName || 'Unassigned'}
                    </div>
                </div>
                <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-[#747871] uppercase tracking-widest mb-0.5">Severity</span>
                        <Badge 
                            label={patient.severity || 'Stable'} 
                            type={patient.severity?.toUpperCase() as 'CRITICAL' | 'MONITOR' | 'STABLE' | 'NEUTRAL'}
                            className="!py-0 !px-1.5 text-[9px]"
                        />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[#EFF1E6] mt-1 sm:mt-0">
                {isAdmin && (
                    <>
                        <button 
                            onClick={(e) => { e.preventDefault(); onEdit(patient); }}
                            className="p-2 text-[#44474F] hover:text-[#191C1B] hover:bg-[#EFF1E6] rounded-full transition-colors" 
                            title="Edit"
                        >
                            <Edit size={18} />
                        </button>
                        <button 
                            onClick={(e) => { e.preventDefault(); onQr(patient); }}
                            className="p-2 text-[#44474F] hover:text-[#191C1B] hover:bg-[#EFF1E6] rounded-full transition-colors"
                            title="QR Code"
                        >
                            <QrCode size={18} />
                        </button>
                    </>
                )}
                <button 
                    onClick={() => onNavigate(`/patient/${patient.id}`)}
                    className="px-4 py-1.5 bg-[#C4ED9C] text-[#072100] hover:bg-[#B8E090] rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                >
                    <span>View</span> <ChevronRight size={14} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default PatientListCard;