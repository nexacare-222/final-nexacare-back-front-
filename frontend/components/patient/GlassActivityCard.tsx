
import React from 'react';
import { Pill, Activity, Thermometer, Wind, Syringe, CheckCircle2 } from 'lucide-react';
import { CareEvent } from '../../types';

interface GlassActivityCardProps {
  event: CareEvent;
  idx: number;
}

const getTaskIcon = (name: string) => {
    if (name.includes('BP')) return <Activity size={32} className="text-rose-400" />;
    if (name.includes('Temp')) return <Thermometer size={32} className="text-orange-400" />;
    if (name.includes('SpO2')) return <Wind size={32} className="text-sky-400" />;
    if (name.includes('Blood')) return <Syringe size={32} className="text-red-400" />;
    return <CheckCircle2 size={32} className="text-emerald-400" />;
};

const GlassActivityCard: React.FC<GlassActivityCardProps> = ({ event, idx }) => {
  const isMed = event.medications.length > 0;
  const title = isMed ? event.medications[0].name : (event.checklist?.[0]?.item || event.checks[0] || 'Care Task');
  const value = isMed ? event.medications[0].dose : (event.checklist?.[0]?.value || 'Done');
  const time = new Date(event.completedAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const rotations = [-15, 5, 25];
  const r = rotations[idx] || 0;

  return (
    <div 
        className="glass-card" 
        style={{ '--r': r } as React.CSSProperties}
        data-text={title}
    >
        <div className="flex flex-col items-center justify-center text-center gap-3 p-4">
            {isMed ? <Pill size={48} className="text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" /> : getTaskIcon(title)}
            <div className="font-bold text-2xl text-white tracking-wider mt-2 drop-shadow-md">{value}</div>
            <div className="text-[10px] text-gray-300 font-mono bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">{time}</div>
            {event.nurseNotes && (
                <div className="text-[9px] text-gray-400 max-w-[140px] truncate mt-2 italic opacity-80">
                    {event.nurseNotes}
                </div>
            )}
        </div>
    </div>
  );
};

export default GlassActivityCard;
