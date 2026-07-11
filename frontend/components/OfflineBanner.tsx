import React, { memo } from 'react';
import { WifiOff, AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  isUpdateAvailable: boolean;
  onRefresh: () => void;
  isOnline: boolean;
}

const OfflineBannerComponent: React.FC<Props> = ({ isUpdateAvailable, onRefresh, isOnline }) => {
  if (isUpdateAvailable) {
    return (
      <div className="bg-brand-purple text-white px-4 py-2 flex items-center justify-center gap-3 animate-fade-in text-sm font-bold z-[60] sticky top-0 shadow-lg" role="alert">
        <RefreshCcw size={16} className="animate-spin-slow" />
        <span>New version of NexaCare is available.</span>
        <button 
          onClick={onRefresh}
          className="bg-white text-brand-purple px-3 py-1 rounded-full text-xs uppercase tracking-wider hover:bg-brand-green transition-colors"
        >
          Update Now
        </button>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="bg-[#BA1A1A] text-white px-4 py-2 flex items-center justify-center gap-3 animate-fade-in text-sm font-bold z-[60] sticky top-0 shadow-lg" role="alert">
        <WifiOff size={16} />
        <span>NexaCare is currently Offline. Critical actions are restricted.</span>
        <div className="flex items-center gap-1 opacity-80 text-[10px] uppercase">
          <AlertCircle size={10} />
          Read-Only Mode
        </div>
      </div>
    );
  }

  return null;
};

const OfflineBanner = memo(OfflineBannerComponent);
export default OfflineBanner;