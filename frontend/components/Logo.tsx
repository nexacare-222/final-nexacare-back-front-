import React, { memo } from 'react';
import { Activity } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

const LogoComponent: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 
  showText = false,
  textClassName = "text-[#191C1B] dark:text-white"
}) => {
  const containerSizes = {
    sm: 'h-9 w-9 rounded-[10px] p-1.5',
    md: 'h-11 w-11 rounded-[14px] p-2',
    lg: 'h-16 w-16 rounded-[24px] p-3',
    xl: 'h-20 w-20 md:h-24 md:w-24 rounded-[28px] md:rounded-[36px] p-4 md:p-5'
  };

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 36,
    xl: 48
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl md:text-7xl'
  };

  return (
    <div className={`flex items-center gap-3 md:gap-4 ${className}`} role="img" aria-label="NexaCare Logo">
      <div className={`
        ${containerSizes[size]}
        bg-[#0a0a0a]/60 dark:bg-black/40
        backdrop-blur-md 
        border border-[#333]/50 dark:border-white/10 
        shadow-[0_4px_12px_rgba(0,0,0,0.15)] 
        flex items-center justify-center 
        transition-all duration-500
        hover:scale-105 hover:shadow-glow
      `}>
        <Activity 
          size={iconSizes[size]} 
          className="text-[#7cff67] animate-pulse-slow" 
          strokeWidth={2.5}
        />
      </div>
      
      {showText && (
        <span className={`font-heading font-bold tracking-tighter transition-colors ${textSizes[size]} ${textClassName}`}>
          NexaCare
        </span>
      )}

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .shadow-glow {
          box-shadow: 0 0 20px rgba(124, 255, 103, 0.3);
        }
      `}</style>
    </div>
  );
};

const Logo = memo(LogoComponent);
export default Logo;