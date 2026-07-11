import React, { memo } from 'react';

interface Props {
  onClick: () => void;
  title?: string;
  className?: string;
}

const LogoutButtonComponent: React.FC<Props> = ({ onClick, title = "Logout", className }) => {
  return (
    <div className={`styled-wrapper ${className || ''}`}>
      <button className="button" onClick={onClick} title={title} aria-label={title}>
        <div className="button-box">
          <span className="button-elem">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="arrow-icon"
              aria-hidden="true"
            >
              <path
                d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
              ></path>
            </svg>
          </span>
          <span className="button-elem">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="arrow-icon"
              aria-hidden="true"
            >
              <path
                d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
              ></path>
            </svg>
          </span>
        </div>
      </button>

      <style>{`
        .styled-wrapper .button {
          display: block;
          position: relative;
          width: 56px; /* Scaled for header from 76px */
          height: 56px;
          margin: 0;
          overflow: hidden;
          outline: none;
          background-color: transparent;
          cursor: pointer;
          border: 0;
          transition: transform 0.2s;
        }
        
        .styled-wrapper .button:active {
            transform: scale(0.92);
        }

        .styled-wrapper .button:before {
          content: "";
          position: absolute;
          border-radius: 50%;
          inset: 4px;
          border: 3px solid #4B3FAE; /* Thinned to 3px as requested */
          transition:
            opacity 0.4s cubic-bezier(0.77, 0, 0.175, 1) 80ms,
            transform 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) 80ms;
        }
        
        :global(.dark) .styled-wrapper .button:before {
            border-color: #8b5cf6;
        }

        .styled-wrapper .button:after {
          content: "";
          position: absolute;
          border-radius: 50%;
          inset: 4px;
          border: 3px solid #599a53;
          transform: scale(1.3);
          transition:
            opacity 0.4s cubic-bezier(0.165, 0.84, 0.44, 1),
            transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          opacity: 0;
        }

        .styled-wrapper .button:hover:before,
        .styled-wrapper .button:focus:before {
          opacity: 0;
          transform: scale(0.7);
          transition:
            opacity 0.4s cubic-bezier(0.165, 0.84, 0.44, 1),
            transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .styled-wrapper .button:hover:after,
        .styled-wrapper .button:focus:after {
          opacity: 1;
          transform: scale(1);
          transition:
            opacity 0.4s cubic-bezier(0.77, 0, 0.175, 1) 80ms,
            transform 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) 80ms;
        }

        .styled-wrapper .button-box {
          display: flex;
          position: absolute;
          top: 0;
          left: 0;
        }

        .styled-wrapper .button-elem {
          display: block;
          width: 24px;
          height: 24px;
          margin: 16px 14px 0 16px;
          transform: rotate(360deg);
          fill: #1a1a1a;
        }
        
        :global(.dark) .styled-wrapper .button-elem {
            fill: #f0eeef;
        }

        .styled-wrapper .button:hover .button-box,
        .styled-wrapper .button:focus .button-box {
          transition: 0.4s;
          transform: translateX(-54px);
        }
        
        .arrow-icon {
            width: 100%;
            height: 100%;
        }
      `}</style>
    </div>
  );
};

const LogoutButton = memo(LogoutButtonComponent);
export default LogoutButton;