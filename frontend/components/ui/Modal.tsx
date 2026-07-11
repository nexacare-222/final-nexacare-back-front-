import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, subtitle, icon, children, footer, className }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[32px] transition-all duration-500" onClick={onClose}>
      <div 
        className={`bg-white/10 backdrop-blur-3xl rounded-[48px] shadow-2xl relative z-10 flex flex-col max-h-[94vh] overflow-hidden animate-scale-in font-sans text-white border border-white/20 will-change-transform ${className || 'w-[95%] max-w-4xl'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Thinned */}
        {(title || icon) && (
            <div className="px-10 py-4 flex justify-between items-center flex-shrink-0 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-4">
                {icon && (
                    <div className="h-10 w-10 rounded-[14px] bg-brand-green text-neutral-textPrimary flex items-center justify-center shadow-lg">
                        {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
                    </div>
                )}
                <div>
                    {title && <h3 className="font-heading font-bold text-xl tracking-tight text-white">{title}</h3>}
                    {subtitle && <p className="text-xs text-gray-300 opacity-80">{subtitle}</p>}
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors group">
                <X size={18} className="group-hover:rotate-90 transition-transform" />
            </button>
            </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar">
            {children}
        </div>

        {/* Footer - Thinned */}
        {footer && (
            <div className="px-10 py-4 flex items-center justify-end gap-4 bg-white/5 border-t border-white/10">
                {footer}
            </div>
        )}
      </div>
    </div>
  );
};

export default Modal;