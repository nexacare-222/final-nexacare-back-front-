
import React, { memo } from 'react';

interface NeuButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  form?: string;
  disabled?: boolean;
  isActive?: boolean;
}

const NeuButtonComponent: React.FC<NeuButtonProps> = ({ label, icon, onClick, className, type = "button", form, disabled, isActive }) => {
  return (
    <button 
        className={`neu-button ${isActive ? 'active' : ''} ${className || ''}`} 
        onClick={onClick} 
        type={type}
        form={form}
        disabled={disabled}
    >
      <div className="neu-button-outer">
        <div className="neu-button-inner">
          <span className="neu-button-content">
             {icon && <span className="neu-icon">{icon}</span>}
             <span className="neu-text">{label}</span>
          </span>
        </div>
      </div>
      <style>{`
        .neu-button {
          /* CSS Variables for Themeing */
          --inner-gradient: linear-gradient(135deg, rgba(230, 230, 230, 1), rgba(180, 180, 180, 1));
          --text-gradient: linear-gradient(135deg, rgba(25, 25, 25, 1), rgba(75, 75, 75, 1));
          
          /* Reset & Layout */
          appearance: none;
          outline: none;
          border: none;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          
          /* Visual Base */
          border-radius: 100em;
          background-color: rgba(0, 0, 0, 0.75);
          box-shadow:
            -0.15em -0.15em 0.15em -0.075em rgba(5, 5, 5, 0.25),
            0.0375em 0.0375em 0.0675em 0 rgba(5, 5, 5, 0.1);
            
          /* Sizing Strategy: Font-size controls the entire button scale via em units */
          font-size: 12px; /* Mobile base size */
        }

        .neu-button:focus-visible {
          outline: 2px solid #4B3FAE;
          outline-offset: 4px;
        }

        :global(.dark) .neu-button:focus-visible {
          outline: 2px solid #8b5cf6;
        }

        /* Active / Green State Override */
        .neu-button.active {
           --inner-gradient: linear-gradient(135deg, #dcfce7 0%, #86efac 100%);
           --text-gradient: linear-gradient(135deg, #064e3b 0%, #14532d 100%);
         }

        @media (min-width: 768px) {
          .neu-button {
            font-size: 16px; /* Desktop base size */
          }
        }

        .neu-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            filter: grayscale(1);
        }

        .neu-button::after {
          content: "";
          position: absolute;
          z-index: 0;
          width: calc(100% + 0.3em);
          height: calc(100% + 0.3em);
          top: -0.15em;
          left: -0.15em;
          border-radius: inherit;
          background: linear-gradient(
            -135deg,
            rgba(5, 5, 5, 0.5),
            transparent 20%,
            transparent 100%
          );
          filter: blur(0.0125em);
          opacity: 0.25;
          mix-blend-mode: multiply;
        }

        .neu-button-outer {
          position: relative;
          z-index: 1;
          border-radius: inherit;
          width: 100%;
          height: 100%;
          transition: box-shadow 300ms ease;
          will-change: box-shadow;
          box-shadow:
            0 0.05em 0.05em -0.01em rgba(5, 5, 5, 1),
            0 0.01em 0.01em -0.01em rgba(5, 5, 5, 0.5),
            0.15em 0.3em 0.1em -0.01em rgba(5, 5, 5, 0.25);
          display: flex;
        }

        .neu-button:hover .neu-button-outer {
          box-shadow:
            0 0 0 0 rgba(5, 5, 5, 1),
            0 0 0 0 rgba(5, 5, 5, 0.5),
            0 0 0 0 rgba(5, 5, 5, 0.25);
        }

        .neu-button-inner {
          --inset: 0.035em;
          position: relative;
          z-index: 1;
          border-radius: inherit;
          padding: 0.8em 1.5em; /* Adjusted padding for pill shape */
          width: 100%;
          background-image: var(--inner-gradient);
          transition:
            box-shadow 300ms ease,
            clip-path 250ms ease,
            background-image 250ms ease,
            transform 250ms ease;
          will-change: box-shadow, clip-path, background-image, transform;
          overflow: hidden;
          clip-path: inset(0 0 0 0 round 100em);
          box-shadow:
            0 0 0 0 inset rgba(5, 5, 5, 0.1),
            -0.05em -0.05em 0.05em 0 inset rgba(5, 5, 5, 0.25),
            0 0 0 0 inset rgba(5, 5, 5, 0.1),
            0 0 0.05em 0.2em inset rgba(255, 255, 255, 0.25),
            0.025em 0.05em 0.1em 0 inset rgba(255, 255, 255, 1),
            0.12em 0.12em 0.12em inset rgba(255, 255, 255, 0.25),
            -0.075em -0.25em 0.25em 0.1em inset rgba(5, 5, 5, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .neu-button:hover .neu-button-inner {
          clip-path: inset(
            clamp(1px, 0.0625em, 2px) clamp(1px, 0.0625em, 2px)
              clamp(1px, 0.0625em, 2px) clamp(1px, 0.0625em, 2px) round 100em
          );
          box-shadow:
            0.1em 0.15em 0.05em 0 inset rgba(5, 5, 5, 0.75),
            -0.025em -0.03em 0.05em 0.025em inset rgba(5, 5, 5, 0.5),
            0.25em 0.25em 0.2em 0 inset rgba(5, 5, 5, 0.5),
            0 0 0.05em 0.5em inset rgba(255, 255, 255, 0.15),
            0 0 0 0 inset rgba(255, 255, 255, 1),
            0.12em 0.12em 0.12em inset rgba(255, 255, 255, 0.25),
            -0.075em -0.12em 0.2em 0.1em inset rgba(5, 5, 5, 0.25);
        }

        .neu-button-content {
          position: relative;
          z-index: 4;
          font-family: "Myriad Pro", "Source Sans 3", sans-serif;
          letter-spacing: -0.02em;
          font-weight: 700;
          color: transparent;
          background-image: var(--text-gradient);
          -webkit-background-clip: text;
          background-clip: text;
          transition: transform 250ms ease;
          display: flex;
          align-items: center;
          gap: 0.6em;
          will-change: transform;
          text-shadow: rgba(0, 0, 0, 0.1) 0 0 0.1em;
          white-space: nowrap;
        }
        
        .neu-icon {
            display: flex;
            color: #333;
        }
        
        /* Ensure icon color matches gradient text feel roughly */
        .neu-button.active .neu-icon {
            color: #064e3b;
        }

        .neu-button:hover .neu-button-content {
          transform: scale(0.975);
        }

        .neu-button:active .neu-button-inner {
          transform: scale(0.975);
        }
      `}</style>
    </button>
  );
};

const NeuButton = memo(NeuButtonComponent);
export default NeuButton;
