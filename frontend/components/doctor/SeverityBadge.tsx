
import React from 'react';

const SeverityBadge: React.FC<{ severity?: string }> = ({ severity }) => {
  const styles: Record<string, string> = {
    'Critical': 'bg-[#FFDAD6] text-[#410002] border-[#FFB4AB]',
    'Monitor': 'bg-[#FFDDB3] text-[#291800] border-[#FFB951]',
    'Stable': 'bg-[#C4ED9C] text-[#072100] border-[#A6D37E]'
  };
  const s = (severity && styles[severity]) ? severity : 'Stable';
  return (
    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border rounded-full ${styles[s]}`}>
      {s}
    </span>
  );
};

export default SeverityBadge;
