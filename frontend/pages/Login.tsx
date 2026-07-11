import React, { useState, useRef, useEffect } from 'react';
import { MOCK_USERS } from '../services/mockDataService';
import { User, UserRole } from '../types';
import { QrCode, Image, ChevronRight, LogIn, Key, Mail, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import Aurora from '../components/Aurora';
import AnimatedInput from '../components/AnimatedInput';
import Logo from '../components/Logo';

interface Props {
  onLogin?: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const login = useAuthStore(state => state.login);
  const loginWithQr = useAuthStore(state => state.loginWithQr);
  const authLoading = useAuthStore(state => state.isLoading);
  const [activeRole, setActiveRole] = useState<UserRole | 'QR_FLOW'>(UserRole.ADMIN);
  
  // Login Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Patient Party QR States
  const [qrScanning, setQrScanning] = useState(false);
  
  // Aurora State
  const [auroraAmplitude, setAuroraAmplitude] = useState(1.0);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Responsive Aurora Adjustment
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setAuroraAmplitude(isMobile ? 0.3 : 0.6);
    };

    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update email field based on selected role as a helpful hint (WITHOUT passwords!)
  useEffect(() => {
    if (activeRole === 'QR_FLOW') return;
    setError(null);

    const mockUser = MOCK_USERS.find(u => u.role === activeRole);
    if (mockUser && mockUser.email) {
        setEmail(mockUser.email);
    } else {
        setEmail(`demo.${activeRole.toLowerCase()}@nexacare.com`);
    }
    // Clear password - no hardcoded credentials auto-filled!
    setPassword('');
  }, [activeRole]);

  const switchRole = (role: UserRole) => {
      setActiveRole(role);
  };

  const completeMockAuth = (user: User) => {
    useAuthStore.setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('nexacare_mock_session', JSON.stringify(user));
    }

    if (onLogin) {
      onLogin(user);
    }
  };

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Email address is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const success = await login(email, password);
    if (success) {
      const loggedInUser = MOCK_USERS.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
      if (loggedInUser && onLogin) {
        onLogin(loggedInUser);
      }
    } else {
      setError('Authentication failed. Please verify that you entered a registered NexaCare email.');
    }
  };

  const handleQrScan = async () => {
    setError(null);
    setQrScanning(true);
    const familyUser = MOCK_USERS.find(u => u.role === UserRole.PATIENT_PARTY);
    if (familyUser) {
      completeMockAuth(familyUser);
      setQrScanning(false);
      return;
    }

    const success = await loginWithQr('simulated_access_qr');
    setQrScanning(false);
    if (success) {
      const loggedInFamilyUser = MOCK_USERS.find(u => u.role === UserRole.PATIENT_PARTY);
      if (loggedInFamilyUser && onLogin) {
        onLogin(loggedInFamilyUser);
      }
    } else {
      setError('Invalid QR Access Pass.');
    }
  };

  const handleGalleryImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        setError(null);
        setQrScanning(true);
        const familyUser = MOCK_USERS.find(u => u.role === UserRole.PATIENT_PARTY);
        if (familyUser) {
          completeMockAuth(familyUser);
          setQrScanning(false);
          return;
        }

        const success = await loginWithQr('simulated_gallery_qr');
        setQrScanning(false);
        if (success) {
          const loggedInFamilyUser = MOCK_USERS.find(u => u.role === UserRole.PATIENT_PARTY);
          if (loggedInFamilyUser && onLogin) {
            onLogin(loggedInFamilyUser);
          }
        } else {
          setError('Invalid QR Access Pass image.');
        }
    }
  };

  // Helper to quickly fill the email field for the selected role
  const handleQuickFillEmail = (emailAddress: string) => {
    setEmail(emailAddress);
    setPassword('demo_pass_123'); // Set a mock secure password for ease of test
    setError(null);
  };

  // Role Slider Helpers
  const roles = [
      { id: UserRole.ADMIN, label: 'Admin' },
      { id: UserRole.DOCTOR, label: 'Doctor' },
      { id: UserRole.NURSE, label: 'Staff' }
  ];
  const activeRoleIndex = roles.findIndex(r => r.id === activeRole);

  return (
    <div className="relative min-h-screen w-full bg-black font-sans text-white overflow-hidden">
      
      {/* Background Aurora */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Aurora
            colorStops={["#7cff67", "#b19eef", "#5227ff"]}
            blend={0.5}
            amplitude={auroraAmplitude}
            speed={1.5}
        />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 min-h-screen flex flex-col md:flex-row items-center justify-center md:justify-around p-6 md:p-12 gap-8 md:gap-12">
          
          {/* Left Section: Branding - Using Unified Logo Component */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
             <Logo size="xl" showText={true} className="mb-6" textClassName="text-white" />
          </div>

          {/* Right Section: Login Form */}
          <div id="login-card" className="w-full max-w-[350px] bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-[50px] shadow-2xl animate-fade-in-up relative" style={{ animationDelay: '0.2s' }}>
              
              {activeRole !== 'QR_FLOW' && (
                  <div className="role-switch mb-6">
                      {roles.map((role) => (
                          <label 
                            key={role.id} 
                            className={`role-option ${activeRole === role.id ? 'active' : ''}`}
                            onClick={() => switchRole(role.id)}
                          >
                              {role.label}
                          </label>
                      ))}
                      <span 
                        className="glider" 
                        style={{ transform: `translateX(${activeRoleIndex * 100}%)` }}
                      ></span>
                  </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-xs text-red-200 text-center animate-fade-in">
                  {error}
                </div>
              )}

              {activeRole !== 'QR_FLOW' ? (
                  <form onSubmit={handleDirectLogin} className="space-y-5">
                      
                      <div className="space-y-4 pt-1">
                          <div className="relative">
                            <AnimatedInput 
                                type="email" 
                                required
                                value={email}
                                onChange={e => {
                                  setEmail(e.target.value);
                                  setError(null);
                                }}
                                placeholder="Email Address"
                            />
                          </div>
                          <div className="relative">
                            <AnimatedInput 
                                type="password" 
                                required
                                value={password}
                                onChange={e => {
                                  setPassword(e.target.value);
                                  setError(null);
                                }}
                                placeholder="Password"
                            />
                          </div>
                      </div>

                      <div className="pt-1">
                          <button 
                            type="submit" 
                            disabled={authLoading || qrScanning}
                            className="button w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                              {authLoading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                              ) : (
                                <LogIn size={18} className="mr-2" />
                              )}
                              <span>{authLoading ? 'Signing In...' : 'Sign In'}</span>
                          </button>
                      </div>

                      {/* Interactive click-to-fill registered accounts helper */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-[11px] text-white/70 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-white/90 border-b border-white/10 pb-1.5">
                          <ShieldCheck size={13} className="text-[#7cff67]" />
                          <span>Registered NexaCare Accounts</span>
                        </div>
                        <p className="text-[10px] text-white/50 leading-tight">Click an account below to pre-fill credentials for clinical testing:</p>
                        
                        <div className="space-y-1.5 pt-1">
                          {MOCK_USERS.filter(u => u.role === activeRole).map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => handleQuickFillEmail(u.email || '')}
                              className="w-full flex items-center justify-between text-left p-1 px-2 hover:bg-white/10 rounded-lg text-[10px] transition-all group"
                            >
                              <span className="truncate max-w-[140px] font-semibold text-white/80 group-hover:text-white">{u.name}</span>
                              <span className="text-[9px] text-[#b19eef] truncate max-w-[120px]">{u.email}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-center text-white/30">
                          Authorized Personnel Only • Simulated JWT Auth
                      </p>
                  </form>
              ) : (
                  <div className="space-y-3 text-center pt-1">
                      <div className="flex justify-between items-center mb-1 px-1">
                          <button onClick={() => setActiveRole(UserRole.ADMIN)} className="p-1.5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
                              <ChevronRight className="rotate-180" size={16} />
                          </button>
                          <div className="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-full text-white/70">Family Login</div>
                          <div className="w-7"></div>
                      </div>

                      <div className="space-y-4 animate-fade-in">
                          <p className="text-white/70 text-xs px-2">Scan your hospital access pass to view patient updates instantly.</p>
                          <div 
                            onClick={handleQrScan}
                            className="aspect-square bg-white/5 border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-[#7cff67] hover:bg-white/10 transition-all group relative overflow-hidden backdrop-blur-sm w-full"
                          >
                              {qrScanning ? (
                                  <>
                                    <div className="absolute inset-0 bg-[#7cff67]/10 animate-pulse"></div>
                                    <div className="w-full h-0.5 bg-[#7cff67] absolute top-1/2 shadow-[0_0_15px_#7cff67]"></div>
                                    <p className="relative z-10 text-[10px] font-bold text-[#7cff67]">Authenticating...</p>
                                  </>
                              ) : (
                                  <>
                                    <QrCode size={48} className="text-white/50 group-hover:text-white mb-2 transition-colors" />
                                    <p className="text-sm font-bold text-white/60 group-hover:text-white">Tap to Scan QR Pass</p>
                                  </>
                              )}
                          </div>

                          {/* Quick Family login helper to remove hardcoded credential barriers */}
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-[10px] text-white/60">
                            <span className="font-semibold text-white/80">Family Member:</span> Susan Downey (<span className="text-[#b19eef]">susan.downey@nexacare.com</span>)
                          </div>

                          <button onClick={() => galleryInputRef.current?.click()} className="w-full py-4 bg-white/10 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm">
                              <Image size={16} /> Upload Pass from Gallery
                          </button>
                          <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleGalleryImport} />
                      </div>
                  </div>
              )}

              {activeRole !== 'QR_FLOW' && (
                  <div className="mt-5 pt-3 border-t border-white/10">
                      <button 
                          onClick={() => setActiveRole('QR_FLOW')}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 hover:bg-white/10 text-[10px] font-bold text-white/80 hover:text-white transition-all backdrop-blur-sm"
                      >
                          Visitor / Family Access
                      </button>
                  </div>
              )}
          </div>

      </div>

      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .role-switch {
            position: relative;
            display: flex;
            align-items: center;
            height: 50px; 
            width: 100%;
            background-color: rgba(0, 0, 0, 0.25);
            border-radius: 50px;
            padding: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
        }

        .role-option {
            flex: 1;
            text-align: center;
            cursor: pointer;
            z-index: 2;
            font-weight: 500;
            font-size: 14px;
            color: #a1a1aa; 
            transition: color 0.3s;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
        }

        .role-option.active {
            color: #000; 
            font-weight: 800;
        }

        .glider {
            position: absolute;
            top: 4px;
            left: 4px;
            height: calc(100% - 8px);
            width: calc((100% - 8px) / 3);
            background-color: #ffffff;
            border-radius: 50px;
            z-index: 1;
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .button {
          --main-size: 14px; 
          --color-text: #ffffff;
          --color-background: #681fef;
          --color-background-hover: #361377;
          --color-outline: #63169340;
          --color-shadow: #00000040;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          border: none;
          border-radius: 2em;
          padding: 0.75em 1em;
          font-family: inherit;
          font-weight: 600;
          font-size: var(--main-size);
          color: var(--color-text);
          background: var(--color-background);
          box-shadow: 0 0 0.2em 0 var(--color-background);
          transition: 1s;
          width: 100%;
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 768px) {
            .role-switch {
                height: 50px;
            }
            .role-option {
                font-size: 14px;
            }
            .button {
                --main-size: 16px; 
            }
        }
        @media (max-width: 768px) {
            .role-switch {
                height: 45px; 
            }
            .role-option {
                font-size: 12px;
            }
        }

        .button:active {
          transform: scale(0.95);
        }

        .button:hover {
          outline: 0.1em solid transparent;
          outline-offset: 0.2em;
          box-shadow: 0 0 1em 0 var(--color-background);
          transition: 0.5s;
        }
      `}</style>
    </div>
  );
};

export default Login;
