
import React from 'react';
import { Clock, MapPin, ClipboardList } from 'lucide-react';
import { CareEvent, Patient, User } from '../../types';

interface NurseTaskCardProps {
  task: CareEvent & { timeDue?: string; priority?: string };
  patient?: Patient;
  doctor?: User;
  onOpen?: () => void;
  onSelect?: () => void;
  timeStatus?: { text: string; color: string };
  timeText?: string;
  timeColor?: string;
}

const NurseTaskCard: React.FC<NurseTaskCardProps> = ({ 
  task, 
  patient, 
  doctor, 
  onOpen, 
  onSelect,
  timeStatus,
  timeText,
  timeColor
}) => {
  const displayTimeText = timeText || timeStatus?.text || '';
  const displayTimeColor = timeColor || timeStatus?.color || '';
  const handleOpen = onOpen || onSelect || (() => {});

  const doctorLastName = doctor?.name ? doctor.name.split(' ').pop() : 'Doctor';

  return (
    <div className="bg-[#FCFDF6] dark:bg-black/30 p-4 rounded-[20px] border border-[#DEE5D9] dark:border-white/10 hover:border-[#006E1C] transition-all shadow-sm group relative overflow-hidden flex flex-col h-full">
        {/* Left Status Line */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
            task.priority === 'URGENT' ? 'bg-[#BA1A1A]' : 'bg-[#426936]'
        }`}></div>

        <div className="pl-3 flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-2.5">
                <div className="min-w-0 pr-2">
                    <h4 className="font-bold text-[#191C1B] dark:text-white text-lg mt-0.5 group-hover:text-[#006E1C] transition-colors line-clamp-1 leading-tight">
                        {task.medications.length > 0 ? task.medications[0].name : (task.checks.join(', ') || 'General Task')}
                    </h4>
                    <span className="text-xs text-[#44474F] dark:text-slate-400 font-medium block mt-0.5">
                        Assigned by Dr. {doctorLastName}
                    </span>
                </div>
                <div className="text-right flex flex-col items-end flex-shrink-0">
                    <span className={`text-[10px] font-bold ${displayTimeColor} flex items-center gap-1 bg-[#EFF1E6] dark:bg-white/10 px-2 py-1 rounded-full whitespace-nowrap`}>
                        <Clock size={10} /> {displayTimeText}
                    </span>
                    {task.priority === 'URGENT' && (
                        <span className="text-[9px] font-bold text-[#410002] bg-[#FFDAD6] px-2 py-0.5 rounded mt-1">
                            URGENT
                        </span>
                    )}
                </div>
            </div>

            {/* Patient Info */}
            <div className="flex items-center gap-3 mb-3 p-2.5 bg-[#EFF1E6]/50 dark:bg-white/5 rounded-xl border border-[#DEE5D9] dark:border-white/10">
                <div className="w-9 h-9 rounded-full bg-[#E0F2F1] dark:bg-teal-900/30 flex items-center justify-center text-[#00695C] dark:text-teal-400 font-bold text-xs border border-[#B2DFDB] dark:border-teal-800 flex-shrink-0">
                    {patient?.name ? patient.name.charAt(0) : '?'}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-[#191C1B] dark:text-white truncate leading-tight">{patient?.name || 'Unknown Patient'}</p>
                    <p className="text-[10px] text-[#44474F] dark:text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={10}/> {patient?.currentLocation || 'Unknown'}</p>
                </div>
            </div>

            <div className="mt-auto pt-1">
                <button 
                onClick={handleOpen}
                className="w-full py-2.5 bg-[#C4ED9C] hover:bg-[#B8E090] text-[#072100] rounded-[14px] font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                    <ClipboardList size={16} /> Open Task Form
                </button>
            </div>
        </div>
    </div>
  );
};

export default NurseTaskCard;
