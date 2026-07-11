
import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon } from 'lucide-react';

interface Props {
  value: string; // Format: "HH:MM AM"
  onChange: (time: string) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const RollerTimePicker: React.FC<Props> = ({ value, onChange }) => {
  const [initialH, initialM, initialP] = value.split(/[:\s]/);
  
  const [hour, setHour] = useState(initialH || '09');
  const [minute, setMinute] = useState(initialM || '00');
  const [period, setPeriod] = useState<'AM' | 'PM'>((initialP as 'AM' | 'PM') || 'AM');

  useEffect(() => {
    onChange(`${hour}:${minute} ${period}`);
  }, [hour, minute, period]);

  return (
    <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm select-none w-full">
        
        {/* Display */}
        <div className="flex justify-center items-center gap-4 mb-6">
            <div className="text-4xl font-heading font-bold text-slate-800 tracking-wider bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 min-w-[180px] text-center">
                {hour}<span className="animate-pulse text-indigo-500">:</span>{minute}
            </div>
            <button 
                type="button"
                onClick={() => setPeriod(period === 'AM' ? 'PM' : 'AM')}
                className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all ${period === 'AM' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-indigo-900 border-indigo-800 text-indigo-100'}`}
            >
                {period === 'AM' ? <Sun size={20} /> : <Moon size={20} />}
                <span className="text-xs font-bold mt-1">{period}</span>
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Hours Grid */}
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Hour</p>
                <div className="grid grid-cols-4 sm:grid-cols-3 gap-2">
                    {HOURS.map(h => (
                        <button
                            type="button"
                            key={h}
                            onClick={() => setHour(h)}
                            className={`py-2 rounded-lg text-sm font-bold transition-all ${hour === h ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                            {h}
                        </button>
                    ))}
                </div>
            </div>

            {/* Minutes Grid */}
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Minute</p>
                <div className="grid grid-cols-4 sm:grid-cols-3 gap-2">
                    {MINUTES.map(m => (
                        <button
                            type="button"
                            key={m}
                            onClick={() => setMinute(m)}
                            className={`py-2 rounded-lg text-sm font-bold transition-all ${minute === m ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default RollerTimePicker;
