import React from 'react';

interface StatWidgetProps {
  label: string;
  value: string | number;
  subValue?: React.ReactNode;
  icon: React.ReactNode;
  theme: {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    hoverBorder: string;
  };
  onClick?: () => void;
  className?: string;
}

const StatWidget: React.FC<StatWidgetProps> = ({ label, value, subValue, icon, theme, onClick, className }) => {
  return (
    <div 
      onClick={onClick}
      className={`${theme.bg} p-4 md:p-5 rounded-[24px] border border-[#DEE5D9] dark:border-white/10 flex items-center gap-3 md:gap-4 hover:border-opacity-100 transition-all cursor-pointer group active:scale-[0.98] shadow-sm hover:shadow-lg ${className || ''}`}
    >
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${theme.iconBg} ${theme.iconColor} flex items-center justify-center border border-white/10 flex-shrink-0 group-hover:scale-105 transition-transform`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[10px] md:text-xs font-bold text-[#44474F] dark:text-slate-400 uppercase tracking-widest truncate">{label}</p>
            <p className="text-3xl md:text-4xl font-heading font-bold text-[#191C1B] dark:text-white leading-none mt-1 drop-shadow-sm">
                {value} {subValue}
            </p>
        </div>
    </div>
  );
};

export default StatWidget;