
import React, { memo } from 'react';
import AnimatedInput from './AnimatedInput';
import { Search } from 'lucide-react';

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

const ModernSearchBarComponent: React.FC<Props> = ({ value, onChange, placeholder, className }) => {
  return (
    <div className={`modern-search-wrapper ${className || ''}`}>
        <div className="w-full relative flex items-center">
            <AnimatedInput 
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="pr-12 pl-4" // Space for icon and padding
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                aria-label={placeholder || 'Search'}
            />
            {/* Search Icon Overlay */}
            <div className="absolute right-4 pointer-events-none flex items-center justify-center text-[#747871] opacity-50 transition-opacity duration-300 group-hover:opacity-80">
                <Search size={18} className="modern-search-icon-svg" />
            </div>
        </div>
      <style>{`
        .modern-search-wrapper {
            position: relative;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modern-search-wrapper:hover .modern-search-icon-svg {
            opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

const ModernSearchBar = memo(ModernSearchBarComponent);
export default ModernSearchBar;
