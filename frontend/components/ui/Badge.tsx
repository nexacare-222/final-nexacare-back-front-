
import React from 'react';

interface BadgeProps {
  label: string;
  type?: 'CRITICAL' | 'MONITOR' | 'STABLE' | 'NEUTRAL';
  className?: string;
  icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ label, type = 'NEUTRAL', className, icon }) => {
  const getStyles = () => {
    switch (type) {
      case 'CRITICAL': return 'bg-[#FFDAD6] text-[#410002] border-[#FFB4AB]';
      case 'MONITOR': return 'bg-[#FFDDB3] text-[#291800] border-[#FFB951]';
      case 'STABLE': return 'bg-[#C4ED9C] text-[#072100] border-[#A6D37E]';
      default: return 'bg-[#E0E5D9] text-[#44474F] border-[#C2C8BC]';
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1 w-fit ${getStyles()} ${className || ''}`}>
      {icon}
      {label}
    </span>
  );
};

export default Badge;
