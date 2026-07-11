import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

type ViewMode = 'DAYS' | 'MONTHS' | 'YEARS';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TranslucentDatePicker: React.FC<Props> = ({ value, onChange, placeholder = "Select Date", className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('DAYS');
  const [viewDate, setViewDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle auto-reset to DAYS when closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setViewMode('DAYS'), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const shiftMonth = (step: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + step, 1));
  };

  const shiftYear = (step: number) => {
    setViewDate(new Date(viewDate.getFullYear() + step, viewDate.getMonth(), 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
    onChange(newDate.toLocaleDateString('en-CA')); // YYYY-MM-DD
    setIsOpen(false);
  };

  const handleMonthSelect = (monthIdx: number) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIdx, 1));
    setViewMode('DAYS');
  };

  const handleYearSelect = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setViewMode('MONTHS'); 
  };

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const range = [];
    for (let i = currentYear - 100; i <= currentYear + 20; i++) {
      range.push(i);
    }
    return range; // Keep it chronological or reverse if preferred
  }, []);

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = selectedDate && 
                        selectedDate.getDate() === d && 
                        selectedDate.getMonth() === month && 
                        selectedDate.getFullYear() === year;
      
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      cells.push(
        <button
          key={`day-${d}`}
          type="button"
          onClick={() => handleDateClick(d)}
          className={`w-8 h-8 rounded-full text-[11px] font-bold flex items-center justify-center transition-all duration-200 relative
            ${isSelected 
              ? 'bg-[#8b5cf6] text-white shadow-md' 
              : 'text-white/80 hover:bg-white/10'
            }
            ${isToday && !isSelected ? 'text-[#c4b5fd] ring-1 ring-inset ring-white/20' : ''}
          `}
        >
          {d}
        </button>
      );
    }
    return cells;
  };

  const displayInputValue = selectedDate 
    ? selectedDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : '';

  return (
    <div className={`relative w-full max-w-[220px] sm:max-w-[240px] ${className || ''}`} ref={containerRef}>
      {/* MUI Style Compact Input */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full h-[46px] px-3 rounded-2xl border bg-black/20 backdrop-blur-md transition-all duration-300 flex items-center cursor-pointer group
          ${isOpen ? 'border-[#c4b5fd] ring-1 ring-[#c4b5fd]/50' : 'border-white/10 hover:border-white/30'}
        `}
      >
        <label className={`absolute left-3 transition-all duration-200 pointer-events-none
          ${(isOpen || displayInputValue) 
            ? '-top-2 left-2 px-1.5 bg-[#212121] text-[9px] font-black text-[#c4b5fd] uppercase tracking-wider' 
            : 'top-3.5 text-white/30 text-xs'}
        `}>
          {placeholder}
        </label>

        <div className="flex-1 text-white text-xs font-bold tracking-wide mt-0.5">
          {displayInputValue || (isOpen ? 'MM/DD/YYYY' : '')}
        </div>

        <CalendarIcon size={14} className={`transition-colors ${isOpen ? 'text-[#c4b5fd]' : 'text-white/20'}`} />
      </div>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-[100] w-[260px] bg-[#1a1a1a] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-white/10 p-3.5 animate-fade-in origin-top-left overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-0.5">
                <button 
                  onClick={() => setViewMode(viewMode === 'MONTHS' ? 'DAYS' : 'MONTHS')}
                  className="text-white font-bold text-xs hover:bg-white/5 px-1.5 py-1 rounded-lg transition-colors flex items-center gap-1 group"
                >
                  {MONTHS_FULL[viewDate.getMonth()]}
                  <ChevronDown size={10} className={`transition-transform opacity-30 group-hover:opacity-60 ${viewMode === 'MONTHS' ? 'rotate-180' : ''}`} />
                </button>
                <button 
                  onClick={() => setViewMode(viewMode === 'YEARS' ? 'DAYS' : 'YEARS')}
                  className="text-white/60 font-bold text-xs hover:bg-white/5 px-1.5 py-1 rounded-lg transition-colors flex items-center gap-1 group"
                >
                  {viewDate.getFullYear()}
                  <ChevronDown size={10} className={`transition-transform opacity-30 group-hover:opacity-60 ${viewMode === 'YEARS' ? 'rotate-180' : ''}`} />
                </button>
            </div>
            
            {viewMode === 'DAYS' && (
                <div className="flex gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); shiftMonth(-1); }} className="p-1 rounded-full hover:bg-white/10 text-white/40 transition-colors">
                        <ChevronLeft size={14}/>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); shiftMonth(1); }} className="p-1 rounded-full hover:bg-white/10 text-white/40 transition-colors">
                        <ChevronRight size={14}/>
                    </button>
                </div>
            )}
            
            {viewMode === 'YEARS' && (
                <div className="flex gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); shiftYear(-10); }} className="p-1 rounded-full hover:bg-white/10 text-white/40 transition-colors">
                        <ChevronsLeft size={14}/>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); shiftYear(10); }} className="p-1 rounded-full hover:bg-white/10 text-white/40 transition-colors">
                        <ChevronsRight size={14}/>
                    </button>
                </div>
            )}
          </div>

          <div className="relative min-h-[190px]">
            {/* Days View */}
            {viewMode === 'DAYS' && (
                <div className="animate-fade-in">
                    <div className="grid grid-cols-7 mb-2">
                        {DAYS.map((day, idx) => (
                        <div key={`${day}-${idx}`} className="text-center text-[9px] font-black text-white/20 uppercase">
                            {day}
                        </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-0.5 justify-items-center">
                        {renderCalendarDays()}
                    </div>
                </div>
            )}

            {/* Months View */}
            {viewMode === 'MONTHS' && (
                <div className="grid grid-cols-3 gap-2 animate-fade-in py-1">
                    {MONTHS_SHORT.map((m, idx) => (
                        <button 
                            key={m}
                            onClick={() => handleMonthSelect(idx)}
                            className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${viewDate.getMonth() === idx ? 'bg-[#8b5cf6] text-white shadow-lg' : 'text-white/60 hover:bg-white/5'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            )}

            {/* Years View */}
            {viewMode === 'YEARS' && (
                <div className="h-[180px] overflow-y-auto custom-scrollbar pr-1 animate-fade-in">
                    <div className="grid grid-cols-3 gap-2">
                        {years.slice().reverse().map(y => (
                            <button 
                                key={y}
                                onClick={() => handleYearSelect(y)}
                                className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${viewDate.getFullYear() === y ? 'bg-[#8b5cf6] text-white shadow-lg' : 'text-white/60 hover:bg-white/5'}`}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default TranslucentDatePicker;