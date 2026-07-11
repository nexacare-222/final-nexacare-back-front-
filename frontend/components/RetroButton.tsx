
import React, { memo } from 'react';

interface Props {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  form?: string;
}

const RetroButtonComponent: React.FC<Props> = ({ label, onClick, type = "button", disabled, icon, className, form }) => {
  return (
    <button 
        type={type} 
        onClick={onClick} 
        disabled={disabled}
        form={form}
        className={`retro-btn ${className || ''}`}
    >
      {icon && <span className="mr-2 flex items-center">{icon}</span>}
      {label}
      <style>{`
        .retro-btn {
          background: #94fb1f;
          font-family: inherit;
          padding: 0.6em 1.3em;
          font-weight: 900;
          font-size: 18px;
          border: 3px solid black;
          border-radius: 0.4em;
          box-shadow: 0.1em 0.1em;
          cursor: pointer;
          color: black;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.1s ease;
          line-height: 1.2;
        }
        
        .retro-btn:focus-visible {
          outline: 3px solid #4B3FAE;
          outline-offset: 4px;
        }

        :global(.dark) .retro-btn:focus-visible {
          outline: 3px solid #8b5cf6;
        }

        .retro-btn:hover:not(:disabled) {
          transform: translate(-0.05em, -0.05em);
          box-shadow: 0.15em 0.15em;
        }
        .retro-btn:active:not(:disabled) {
          transform: translate(0.05em, 0.05em);
          box-shadow: 0.05em 0.05em;
        }
        .retro-btn:disabled {
            background: #e2e8f0;
            color: #94a3b8;
            border-color: #cbd5e1;
            box-shadow: none;
            cursor: not-allowed;
            transform: none;
        }
      `}</style>
    </button>
  );
};

const RetroButton = memo(RetroButtonComponent);
export default RetroButton;
