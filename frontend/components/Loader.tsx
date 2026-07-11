import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#C6D5DE] dark:bg-[#212121] transition-colors duration-300" role="status" aria-live="polite">
      <div className="loading-container">
        <div className="loading">
          <svg width="64px" height="48px" role="img" aria-label="ECG heart rate indicator">
            <polyline
              points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"
              id="back"
            ></polyline>
            <polyline
              points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"
              id="front"
            ></polyline>
          </svg>
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-[#4B3FAE] dark:text-[#E9E7F8] animate-pulse text-center">
            Initializing NexaCare
        </p>
      </div>
      <style>{`
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .loading svg polyline {
          fill: none;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .loading svg polyline#back {
          fill: none;
          stroke: #a5c4d9f8;
        }
        
        :global(.dark) .loading svg polyline#back {
          stroke: #333333;
        }

        .loading svg polyline#front {
          fill: none;
          stroke: #4B3FAE; /* Brand Purple instead of Red to match theme, or #e80f13 as requested */
          stroke-dasharray: 48, 144;
          stroke-dashoffset: 192;
          animation: dash_682 1.4s linear infinite;
        }
        
        /* If you strictly want the red requested: */
        .loading svg polyline#front {
          stroke: #e80f13;
        }

        @keyframes dash_682 {
          72.5% {
            opacity: 0;
          }

          to {
            stroke-dashoffset: 0;
          }
        }

        /* Scale up slightly for better visibility */
        .loading svg {
            transform: scale(1.5);
        }
      `}</style>
    </div>
  );
};

export default Loader;