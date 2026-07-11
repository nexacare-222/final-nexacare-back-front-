import React, { useState, useEffect } from 'react';

interface Props {
  initialTime: string; // Format "HH:mm" (24h)
  onSave: (time: string) => void;
  onCancel: () => void;
}

const ModernTimePicker: React.FC<Props> = ({ initialTime, onSave, onCancel }) => {
  // Parse initial time
  const [initH, initM] = initialTime ? initialTime.split(':').map(Number) : [12, 0];
  
  // State
  const [mode, setMode] = useState<'HOURS' | 'MINUTES'>('HOURS');
  const [period, setPeriod] = useState<'AM' | 'PM'>(initH >= 12 && initH < 24 ? 'PM' : 'AM');
  
  // Convert 24h to 12h for display state
  const displayH = initH % 12 === 0 ? 12 : initH % 12;
  const [hour, setHour] = useState(displayH);
  const [minute, setMinute] = useState(initM);

  // Clock Face Numbers
  const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const handleSave = () => {
    let finalHour = hour;
    if (period === 'AM' && hour === 12) finalHour = 0;
    if (period === 'PM' && hour !== 12) finalHour = hour + 12;
    
    const timeString = `${String(finalHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onSave(timeString);
  };

  // Calculate rotation for the clock hand
  const getRotation = () => {
    if (mode === 'HOURS') {
      const idx = HOURS.indexOf(hour);
      return idx * 30; // 360 / 12
    } else {
      return minute * 6; // 360 / 60
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="w-[320px] bg-[#ECEFE5] rounded-[28px] shadow-2xl overflow-hidden select-none transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
        
        {/* Header / Digital Display */}
        <div className="p-6 pb-0 flex flex-col items-center">
            <p className="text-xs font-bold text-[#45483D] tracking-widest uppercase w-full text-left mb-4 opacity-70">Enter Time</p>
            
            <div className="flex items-center gap-1 mb-6">
                {/* Hour Box */}
                <button 
                    onClick={() => setMode('HOURS')}
                    className={`text-[56px] leading-none font-sans font-normal p-4 rounded-xl transition-colors ${mode === 'HOURS' ? 'bg-[#C4F0A5] text-[#1D3700]' : 'bg-transparent text-[#45483D]'}`}
                >
                    {String(hour).padStart(2, '0')}
                </button>
                
                <span className="text-[56px] leading-none text-[#45483D] -mt-2">:</span>
                
                {/* Minute Box */}
                <button 
                    onClick={() => setMode('MINUTES')}
                    className={`text-[56px] leading-none font-sans font-normal p-4 rounded-xl transition-colors ${mode === 'MINUTES' ? 'bg-[#C4F0A5] text-[#1D3700]' : 'bg-transparent text-[#45483D]'}`}
                >
                    {String(minute).padStart(2, '0')}
                </button>

                {/* AM/PM Selector */}
                <div className="flex flex-col ml-4 border border-[#75776B] rounded-lg overflow-hidden bg-[#E0E5D9]">
                    <button 
                        onClick={() => setPeriod('AM')}
                        className={`px-3 py-2 text-sm font-bold transition-colors ${period === 'AM' ? 'bg-[#DCE5CD] text-[#151D0B]' : 'bg-transparent text-[#45483D] hover:bg-[#E0E5D9]'}`}
                    >
                        AM
                    </button>
                    <div className="h-[1px] bg-[#75776B]"></div>
                    <button 
                        onClick={() => setPeriod('PM')}
                        className={`px-3 py-2 text-sm font-bold transition-colors ${period === 'PM' ? 'bg-[#DCE5CD] text-[#151D0B]' : 'bg-transparent text-[#45483D] hover:bg-[#E0E5D9]'}`}
                    >
                        PM
                    </button>
                </div>
            </div>
        </div>

        {/* Clock Face */}
        <div className="relative w-[256px] h-[256px] mx-auto bg-[#E0E5D9] rounded-full mb-6 shadow-inner">
            {/* Center Dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#406836] rounded-full -translate-x-1/2 -translate-y-1/2 z-10"></div>
            
            {/* Clock Hand */}
            <div 
                className="absolute top-1/2 left-1/2 w-0.5 h-[42%] bg-[#406836] origin-bottom -translate-x-1/2 -translate-y-full z-0 transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
                style={{ transform: `translate(-50%, -100%) rotate(${getRotation()}deg)` }}
            >
                {/* Tip Connector - Ensures smooth visual join with the selected circle */}
                <div className="absolute -top-0 left-1/2 w-1 h-1 bg-[#406836] rounded-full -translate-x-1/2"></div>
            </div>
            
            {/* Numbers */}
            {(mode === 'HOURS' ? HOURS : MINUTES).map((num, i) => {
                const angle = (i * 30) - 90; // Start from top (12)
                const radius = 100; // px
                const x = Math.cos(angle * (Math.PI / 180)) * radius;
                const y = Math.sin(angle * (Math.PI / 180)) * radius;

                const isSelected = mode === 'HOURS' ? num === hour : num === minute;

                return (
                    <button
                        key={num}
                        onClick={() => mode === 'HOURS' ? setHour(num) : setMinute(num)}
                        className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 z-10
                            ${isSelected ? 'bg-[#406836] text-white scale-110 shadow-md' : 'text-[#45483D] hover:bg-[#DCE5CD]'}`}
                        style={{ 
                            top: `calc(50% + ${y}px)`, 
                            left: `calc(50% + ${x}px)`, 
                            transform: 'translate(-50%, -50%)' 
                        }}
                    >
                        {mode === 'MINUTES' ? String(num).padStart(2, '0') : num}
                    </button>
                )
            })}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 p-6 pt-2">
            <button onClick={onCancel} className="text-sm font-bold text-[#406836] hover:bg-[#DCE5CD] px-4 py-2 rounded-full transition-colors">
                Cancel
            </button>
            <button onClick={handleSave} className="text-sm font-bold text-[#1D3700] bg-[#C4F0A5] hover:bg-[#B3E690] px-6 py-2 rounded-full transition-colors shadow-sm">
                OK
            </button>
        </div>

      </div>
    </div>
  );
};

export default ModernTimePicker;