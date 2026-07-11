
import React from 'react';
import { CalendarPlus, Calendar, TestTube, ArrowRightLeft } from 'lucide-react';

interface Props {
  isOpen: boolean;
  toggle: () => void;
  onClose: () => void;
  onOpenCareEvent: () => void;
  onOpenViewEvents: () => void;
  onOpenReports: () => void;
  onOpenTransfer: () => void;
}

const QuickActions: React.FC<Props> = ({ 
  isOpen, 
  toggle, 
  onClose,
  onOpenCareEvent, 
  onOpenViewEvents, 
  onOpenReports, 
  onOpenTransfer 
}) => {

  const handleAction = (action: () => void) => {
    action();
    if (isOpen) onClose(); 
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose}></div>
      <div className="quick-actions-wrapper absolute top-full left-1/2 -translate-x-1/2 mt-4 z-40">
        <div className="tooltip-custom animate-fade-in shadow-2xl border border-slate-200 dark:border-white/10 flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-full">
            <button 
                onClick={() => handleAction(onOpenCareEvent)} 
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all"
                title="Add Event"
            >
                <CalendarPlus size={22} />
            </button>
            <button 
                onClick={() => handleAction(onOpenViewEvents)} 
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all"
                title="View Events"
            >
                <Calendar size={22} />
            </button>
            <button 
                onClick={() => handleAction(onOpenReports)} 
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all"
                title="Reports"
            >
                <TestTube size={22} />
            </button>
            <button 
                onClick={() => handleAction(onOpenTransfer)} 
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all"
                title="Transfer"
            >
                <ArrowRightLeft size={22} />
            </button>
        </div>
        {/* Tooltip Arrow */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 rotate-45 border-l border-t border-slate-200 dark:border-white/10"></div>
      </div>
    </>
  );
};

export default QuickActions;
