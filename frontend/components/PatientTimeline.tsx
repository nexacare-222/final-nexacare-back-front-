
import React from 'react';
import { Patient } from '../types';

interface Props {
  patient: Patient;
}

const PatientTimeline: React.FC<Props> = ({ patient }) => {
  // Sort movements newest first for medical relevance
  const sortedMovements = [...patient.movements].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="w-full flex justify-center">
      <div className="w-full bg-[#eaf6ff] p-8 rounded-[15px] font-sans">
        <h1 className="text-[1.1rem] font-sans font-bold text-[#2a2839] mb-2">Patient Movement History</h1>
        
        <ul className="mt-8 relative list-none p-0">
          {sortedMovements.length === 0 ? (
            <li className="text-[#4f4f4f] opacity-80 text-sm font-semibold italic text-center py-4 bg-white/40 rounded-xl border border-black/5">
              No movement history recorded yet.
            </li>
          ) : sortedMovements.map((move) => {
            const date = new Date(move.timestamp);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString();

            return (
              <li 
                key={move.id} 
                className="relative pl-5 ml-2.5 pb-6 border-l border-[#abaaed] last:border-0 last:pb-0"
              >
                {/* The Custom CSS Dot */}
                <div
                  className="absolute -left-[9px] top-0 w-[15px] h-[15px] bg-white rounded-full border border-[#4e5ed3]"
                  style={{ boxShadow: '3px 3px 0px #bab5f8' }}
                />

                {/* Time Section */}
                <div className="text-[#2a2839] font-medium text-sm mb-1 font-sans">
                  {timeString} <span className="opacity-60 text-xs ml-1">• {dateString}</span>
                </div>

                {/* Content Section */}
                <div className="text-[#4f4f4f] font-sans leading-relaxed text-sm mt-1.5">
                  <p className="font-bold text-base mb-1 text-[#2a2839]">{move.toLocation}</p>
                  <p>{move.reason}</p>
                  
                  {move.fromLocation && (
                     <p className="text-xs mt-2 text-[#4f4f4f]/70 italic">
                        Transferred from {move.fromLocation}
                     </p>
                  )}
                  
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#4e5ed3] mt-2">
                      Auth: {move.movedByAdminId.split('@')[0]}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PatientTimeline;
