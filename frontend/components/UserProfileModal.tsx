
import React, { useState, useRef, memo } from 'react';
import { User, UserRole } from '../types';
import { X, Mail, Phone, Hash, KeyRound, ChevronLeft, CheckCircle2, AlertCircle, AtSign, Camera, Briefcase, Building2, User as UserIcon } from 'lucide-react';

interface Props {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (user: User) => void;
}

const UserProfileModalComponent: React.FC<Props> = ({ user, isOpen, onClose, onUpdateUser }) => {
  const [view, setView] = useState<'PROFILE' | 'CHANGE_PASSWORD' | 'CHANGE_EMAIL'>('PROFILE');
  
  // Password State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  
  // Email State
  const [emailForm, setEmailForm] = useState({ current: user.email || '', new: '' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setView('PROFILE');
    setPasswords({ current: '', new: '', confirm: '' });
    setEmailForm({ current: user.email || '', new: '' });
    setError('');
    setSuccess('');
    onClose();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const newAvatar = reader.result as string;
            onUpdateUser({ ...user, avatar: newAvatar });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwords.current || !passwords.new || !passwords.confirm) {
        setError('All fields are required.');
        return;
    }
    if (passwords.new !== passwords.confirm) {
        setError('New passwords do not match.');
        return;
    }
    if (passwords.new.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
    }

    setSuccess('Password updated successfully!');
    setTimeout(() => {
        handleClose();
    }, 1500);
  };

  const handleChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!emailForm.new) {
        setError('New email is required.');
        return;
    }
    if (!emailForm.new.includes('@') || !emailForm.new.includes('.')) {
        setError('Please enter a valid email address.');
        return;
    }
    if (emailForm.new === user.email) {
        setError('New email cannot be the same as current email.');
        return;
    }

    setSuccess(`Email update link sent to ${emailForm.new}`);
    setTimeout(() => {
        handleClose();
    }, 2000);
  };

  const goBack = () => {
      setView('PROFILE');
      setError('');
      setSuccess('');
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md transition-all" 
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="User Profile Modal"
    >
      {/* Card Container */}
      <div 
        className="relative w-full max-w-[280px] min-h-[380px] rounded-[32px] shadow-2xl overflow-hidden animate-scale-in group bg-white/60 backdrop-blur-3xl border border-white/40" 
        onClick={e => e.stopPropagation()}
      >
        {/* Noise/Texture Overlay (Optional for feel) */}
        <div className="absolute inset-0 bg-white/5 z-0 pointer-events-none"></div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col h-full text-[#2D2D2D]">
            
            {/* Top Navigation / Close */}
            <div className="flex justify-between items-center p-4 pb-1">
                {view !== 'PROFILE' ? (
                    <button onClick={goBack} className="p-1.5 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 transition-colors text-[#2D2D2D]" aria-label="Go back to profile">
                        <ChevronLeft size={16} />
                    </button>
                ) : (
                    <div className="w-7"></div> // Spacer
                )}
                
                <button onClick={handleClose} className="p-1.5 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 transition-colors text-[#2D2D2D]" aria-label="Close modal">
                    <X size={16} />
                </button>
            </div>

            {view === 'PROFILE' ? (
                <div className="flex-1 flex flex-col px-4 pb-5">
                    
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-4">
                        <div 
                            className="relative w-16 h-16 rounded-full p-1 bg-white/30 backdrop-blur-sm cursor-pointer group shadow-lg hover:scale-105 transition-transform focus-visible:ring-2 focus-visible:ring-[#4B3FAE] outline-none"
                            onClick={handleAvatarClick}
                            role="button"
                            tabIndex={0}
                            aria-label="Change profile picture"
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAvatarClick(); } }}
                        >
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover border-2 border-white/50" />
                            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                <Camera size={18} />
                            </div>
                            <span className={`absolute bottom-1 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${user.isOnline !== false ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        
                        <h2 className="text-lg font-bold mt-2 text-[#1a1a1a] drop-shadow-sm text-center">{user.name}</h2>
                        <div className="mt-1 px-2 py-0.5 rounded-full bg-white/40 backdrop-blur-md border border-white/40 text-[9px] font-bold uppercase tracking-wider text-[#4a4a4a]">
                            {user.role.replace('_', ' ')}
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        
                        <div className="grid grid-cols-2 gap-2">
                            {/* ID */}
                            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-2 border border-white/40 flex flex-col items-center justify-center text-center">
                                <div className="p-1 bg-white/50 rounded-full mb-1 text-indigo-900"><Hash size={12} /></div>
                                <span className="text-[8px] uppercase font-bold text-gray-600">ID</span>
                                <span className="text-[10px] font-bold text-[#1a1a1a] font-mono">{user.id.length > 8 ? user.id.slice(0,8)+'...' : user.id}</span>
                            </div>
                            
                            {/* Dept */}
                            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-2 border border-white/40 flex flex-col items-center justify-center text-center">
                                <div className="p-1 bg-white/50 rounded-full mb-1 text-indigo-900"><Building2 size={12} /></div>
                                <span className="text-[8px] uppercase font-bold text-gray-600">Dept</span>
                                <span className="text-[10px] font-bold text-[#1a1a1a] truncate w-full">{user.department || 'General'}</span>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-2 border border-white/40 flex items-center gap-2">
                            <div className="p-1.5 bg-white/50 rounded-xl text-indigo-900"><Mail size={14} /></div>
                            <div className="min-w-0">
                                <p className="text-[8px] uppercase font-bold text-gray-600">Email</p>
                                <p className="text-[10px] font-bold text-[#1a1a1a] truncate">{user.email || 'No Email'}</p>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-2 border border-white/40 flex items-center gap-2">
                            <div className="p-1.5 bg-white/50 rounded-xl text-indigo-900"><Phone size={14} /></div>
                            <div>
                                <p className="text-[8px] uppercase font-bold text-gray-600">Phone</p>
                                <p className="text-[10px] font-bold text-[#1a1a1a]">{user.phone || 'N/A'}</p>
                            </div>
                        </div>

                        {user.specialization && (
                            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-2 border border-white/40 flex items-center gap-2">
                                <div className="p-1.5 bg-white/50 rounded-xl text-indigo-900"><Briefcase size={14} /></div>
                                <div>
                                    <p className="text-[8px] uppercase font-bold text-gray-600">Specialization</p>
                                    <p className="text-[10px] font-bold text-[#1a1a1a]">{user.specialization}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => setView('CHANGE_PASSWORD')}
                            className="bg-white/60 hover:bg-white/80 backdrop-blur-md text-[#1a1a1a] font-bold py-2 rounded-2xl flex items-center justify-center gap-2 text-[10px] transition-all shadow-sm"
                        >
                            <KeyRound size={12} /> Password
                        </button>
                        {user.role === UserRole.ADMIN && (
                            <button 
                                onClick={() => setView('CHANGE_EMAIL')}
                                className="bg-white/60 hover:bg-white/80 backdrop-blur-md text-[#1a1a1a] font-bold py-2 rounded-2xl flex items-center justify-center gap-2 text-[10px] transition-all shadow-sm"
                            >
                                <AtSign size={12} /> Email
                            </button>
                        )}
                        {user.role !== UserRole.ADMIN && (
                             <button disabled className="bg-white/20 text-gray-500 font-bold py-2 rounded-2xl flex items-center justify-center gap-2 text-[10px] cursor-not-allowed">
                                <UserIcon size={12} /> Edit Profile
                             </button>
                        )}
                    </div>

                </div>
            ) : (
                /* Edit Mode (Password/Email) */
                <div className="flex-1 flex flex-col px-5 pb-5 animate-fade-in">
                    
                    <div className="text-center mb-4 mt-1">
                        <div className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm text-[#1a1a1a]">
                            {view === 'CHANGE_PASSWORD' ? <KeyRound size={20} /> : <Mail size={20} />}
                        </div>
                        <h3 className="text-base font-bold text-[#1a1a1a]">
                            {view === 'CHANGE_PASSWORD' ? 'Update Password' : 'Change Email'}
                        </h3>
                        <p className="text-[10px] text-gray-700 font-medium opacity-80 mt-0.5">
                            {view === 'CHANGE_PASSWORD' ? 'Ensure your account stays secure.' : 'Update your administrative email.'}
                        </p>
                    </div>

                    <form onSubmit={view === 'CHANGE_PASSWORD' ? handleChangePassword : handleChangeEmail} className="space-y-2.5 flex-1">
                        
                        {error && (
                           <div className="flex items-center gap-2 text-[9px] font-bold text-rose-700 bg-rose-100/80 p-2 rounded-xl backdrop-blur-sm" role="alert">
                               <AlertCircle size={12} /> {error}
                           </div>
                        )}
                        {success && (
                           <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-800 bg-emerald-100/80 p-2 rounded-xl backdrop-blur-sm" role="alert">
                               <CheckCircle2 size={12} /> {success}
                           </div>
                        )}

                        {view === 'CHANGE_PASSWORD' ? (
                            <>
                                <input 
                                    type="password" 
                                    className="glass-input"
                                    placeholder="Current Password"
                                    value={passwords.current}
                                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                                    aria-label="Current Password"
                                />
                                <input 
                                    type="password" 
                                    className="glass-input"
                                    placeholder="New Password (min 6 chars)"
                                    value={passwords.new}
                                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                                    aria-label="New Password"
                                />
                                <input 
                                    type="password" 
                                    className="glass-input"
                                    placeholder="Confirm New Password"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                    aria-label="Confirm New Password"
                                />
                            </>
                        ) : (
                            <>
                                <input 
                                    type="email" 
                                    className="glass-input opacity-60 cursor-not-allowed"
                                    value={emailForm.current}
                                    readOnly
                                    aria-label="Current Email Address"
                                />
                                <input 
                                    type="email" 
                                    className="glass-input"
                                    placeholder="New Email Address"
                                    value={emailForm.new}
                                    onChange={e => setEmailForm({...emailForm, new: e.target.value})}
                                    aria-label="New Email Address"
                                />
                            </>
                        )}

                        <div className="pt-2 mt-auto">
                            <button 
                                type="submit"
                                className="w-full bg-[#1a1a1a] text-white font-bold py-2.5 rounded-[16px] hover:bg-black shadow-lg hover:shadow-xl transition-all active:scale-95 text-[11px]"
                            >
                                {view === 'CHANGE_PASSWORD' ? 'Update Password' : 'Verify & Update'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
      </div>
      
      <style>{`
        .glass-input {
            width: 100%;
            background-color: rgba(255, 255, 255, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(8px);
            border-radius: 12px;
            padding: 10px 12px;
            outline: none;
            color: #1a1a1a;
            font-weight: 600;
            font-size: 0.8rem;
            transition: all 0.2s;
        }
        .glass-input:focus {
            background-color: rgba(255, 255, 255, 0.7);
            border-color: #fff;
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
        }
        .glass-input::placeholder {
            color: rgba(0, 0, 0, 0.5);
        }
        @keyframes scale-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
            animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

const UserProfileModal = memo(UserProfileModalComponent);
export default UserProfileModal;
