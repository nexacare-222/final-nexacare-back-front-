import React, { useState, useRef, useEffect, memo } from 'react';

interface PillSliderProps {
  options: { id: string; label: string; badge?: number | string }[];
  value: string;
  onChange: (id: string) => void;
  name: string; // Unique name for radio group
  className?: string;
  variant?: 'default' | 'ghost';
}

const PillSliderComponent: React.FC<PillSliderProps> = ({ options, value, onChange, name, className, variant = 'default' }) => {
  const [gliderStyle, setGliderStyle] = useState<{ left: string; width: string }>({ left: '0', width: '0' });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLLabelElement | null)[]>([]);

  useEffect(() => {
    // Keep itemsRef size aligned with options size
    itemsRef.current = itemsRef.current.slice(0, options.length);
    
    const activeIndex = options.findIndex(o => o.id === value);
    const activeItem = itemsRef.current[activeIndex];
    
    if (activeItem && containerRef.current) {
      const { offsetLeft, offsetWidth } = activeItem;
      setGliderStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      });
    }
  }, [value, options]);

  return (
    <div className={`tabs-wrapper ${className || ''}`}>
      <div className={`tabs ${variant}`} ref={containerRef} role="radiogroup" aria-label={name}>
        {options.map((option, index) => (
          <React.Fragment key={option.id}>
            <input 
              type="radio" 
              id={`${name}-${option.id}`} 
              name={name} 
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            <label 
              className="tab" 
              htmlFor={`${name}-${option.id}`} 
              ref={el => { itemsRef.current[index] = el; }}
            >
              {option.label}
            </label>
          </React.Fragment>
        ))}
        <span className="glider" style={gliderStyle}></span>
      </div>
      <style>{`
        .tabs-wrapper {
            display: flex;
            justify-content: center;
            width: fit-content;
        }
        .tabs {
          display: flex;
          position: relative;
          background-color: #fff;
          box-shadow: 0 0 1px 0 rgba(24, 94, 224, 0.15), 0 6px 12px 0 rgba(24, 94, 224, 0.15);
          padding: 0.5rem;
          border-radius: 99px;
          width: fit-content;
        }
        
        .tabs.ghost {
            background-color: transparent;
            box-shadow: none;
            padding: 0;
        }

        .tabs * {
          z-index: 2;
        }

        .tabs input[type="radio"] {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        .tabs input[type="radio"]:focus-visible + label {
          outline: 2px solid #185ee0;
          outline-offset: 2px;
        }

        .tab {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 1.5rem;
          font-size: 1rem;
          color: #555;
          font-weight: 600;
          border-radius: 99px;
          cursor: pointer;
          transition: color 0.15s ease-in;
          white-space: nowrap;
          user-select: none;
        }

        .tabs input[type="radio"]:checked + label {
          color: #185ee0;
          font-weight: 700;
        }

        .glider {
          position: absolute;
          display: flex;
          height: 38px;
          background-color: #e6eef9;
          z-index: 1;
          border-radius: 99px;
          transition: 0.25s ease-out;
          top: 0.5rem; /* Matches padding */
        }
        
        .tabs.ghost .glider {
            top: 0;
        }

        /* Dark Mode Support */
        :global(.dark) .tabs {
            background-color: #1e1e1e;
            box-shadow: 0 0 1px 0 rgba(255, 255, 255, 0.1), 0 6px 12px 0 rgba(0, 0, 0, 0.5);
        }
        :global(.dark) .tabs.ghost {
            background-color: transparent;
            box-shadow: none;
        }
        :global(.dark) .tab {
            color: #aaa;
        }
        :global(.dark) .tabs input[type="radio"]:checked + label {
            color: #62abff;
        }
        :global(.dark) .tabs input[type="radio"]:focus-visible + label {
          outline: 2px solid #62abff;
        }
        :global(.dark) .glider {
            background-color: #2a2a2a;
        }

        @media (max-width: 700px) {
          .tabs:not(.ghost) {
             padding: 0.25rem;
          }
          .tab {
             font-size: 0.875rem; /* Increased from 0.75rem (matching text-sm / 14px) */
             padding: 0 0.75rem;
             height: 32px;
          }
          .glider {
             height: 32px;
             top: 0.25rem;
          }
          .tabs.ghost .glider {
             top: 0;
          }
        }
      `}</style>
    </div>
  );
};

const PillSlider = memo(PillSliderComponent);
export default PillSlider;