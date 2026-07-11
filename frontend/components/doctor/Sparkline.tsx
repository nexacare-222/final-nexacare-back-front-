
import React from 'react';

const Sparkline: React.FC<{ color?: string }> = ({ color = "text-[#426936]" }) => (
  <svg className={`w-24 h-10 ${color}`} viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 15 L20 15 L25 5 L35 25 L45 10 L55 20 L65 15 L100 15" />
  </svg>
);

export default Sparkline;
