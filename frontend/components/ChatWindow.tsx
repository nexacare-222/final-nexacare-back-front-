import React, { useState, useEffect, useRef } from 'react';
import { Patient, User, UserRole, ChatMessage } from '../types';
import { Send, Lock, ShieldAlert, FileUp, Clock, Paperclip, Download, User as UserIcon, MessageSquare, Info } from 'lucide-react';
import AnimatedInput from './AnimatedInput';

interface ChatWindowProps {
  patient: Patient;
  currentUser: User;
  messages: ChatMessage[];
  onSendMessage: (text: string, isAttachment?: boolean) => void;
  className?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ patient, currentUser, messages, onSendMessage, className }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const is24HoursPassed = patient.admissionTimestamp ? (Date.now() - patient.admissionTimestamp) > (24 * 3600 * 1000) : true;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  
  // Patient Party Logic: Block if < 24h
  const isRestrictedParty = currentUser.role === UserRole.PATIENT_PARTY && !is24HoursPassed;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          onSendMessage(`Sent a file: ${file.name}`, true);
      }
  };

  const handleDownload = (filename: string) => {
    const content = `NexaCare Secure Archive\n\nFile: ${filename}\nTimestamp: ${new Date().toLocaleString()}\n\nThis is a secure mock download.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.includes('.') ? filename : `${filename}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isAdmin) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-8 text-center bg-[#f8fafd] dark:bg-[#1a1a1a] rounded-[40px] border border-slate-200 dark:border-white/10 ${className || ''}`}>
        <div className="bg-[#FFDAD6] dark:bg-red-950/40 p-5 rounded-[24px] mb-4 shadow-sm">
            <ShieldAlert size={48} className="text-[#BA1A1A] dark:text-red-400" />
        </div>
        <h3 className="text-xl font-heading font-bold text-[#191C1B] dark:text-white mb-2">Access Denied</h3>
        <p className="text-[#44474F] dark:text-slate-400 max-w-xs text-sm leading-relaxed">
          Administrative accounts are restricted from accessing clinical or private family communications.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-[#f8fafd] dark:bg-slate-900/40 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden font-sans border border-slate-100 dark:border-white/5 ${className || ''}`}>
      
      {/* Header Info (Subtle) */}
      <div className="px-8 py-3 bg-transparent flex justify-between items-center opacity-40">
           <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
               <Lock size={10} /> {patient.name} Secure Channel
           </span>
           {isRestrictedParty && (
               <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                   <Clock size={10} /> Locked
               </span>
           )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-transparent custom-scrollbar flex flex-col">
        {messages.length === 0 && (
            <div className="m-auto text-center animate-fade-in flex flex-col items-center max-w-[280px]">
                <div className="w-16 h-16 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center mb-6">
                    <Info size={32} className="text-slate-400/60" strokeWidth={1.5} />
                </div>
                <p className="text-[#8e9aa8] dark:text-slate-400 text-sm font-bold leading-relaxed">
                    Try asking: "What are the risks for discharge today?" or "Summarize vitals trend over the last 24h."
                </p>
            </div>
        )}
        
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.id;
          const prevMsg = idx > 0 ? messages[idx-1] : null;
          const showSender = !isMe && prevMsg?.senderId !== msg.senderId;

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {showSender && (
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-2">
                      {msg.senderName}
                  </span>
              )}
              <div 
                className={`max-w-[85%] p-4 shadow-sm transition-all relative group ${
                    isMe 
                    ? 'bg-[#2b333e] dark:bg-[#62abff] text-white rounded-[24px] rounded-tr-[4px]' 
                    : 'bg-white dark:bg-white/10 text-[#191C1B] dark:text-white rounded-[24px] rounded-tl-[4px] border border-slate-100 dark:border-white/5'
                }`}
              >
                {msg.isAttachment ? (
                    <div className={`flex items-center justify-between gap-4 p-3 rounded-xl ${isMe ? 'bg-white/10' : 'bg-slate-50 dark:bg-black/20'} border border-black/5 dark:border-white/10`}>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2.5 rounded-lg ${isMe ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30'} text-inherit shadow-sm`}>
                                <FileUp size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black truncate leading-tight">
                                    {msg.content.replace('Sent a file: ', '')}
                                </p>
                                <p className="text-[10px] font-bold opacity-60 uppercase tracking-wide mt-0.5">Attachment</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDownload(msg.content.replace('Sent a file: ', ''))}
                            className={`p-2 rounded-full transition-all active:scale-90 ${isMe ? 'hover:bg-white/20' : 'hover:bg-blue-50 dark:hover:bg-white/10'}`}
                            title="Download"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                ) : (
                    <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap">{msg.content}</p>
                )}
                
                <div className={`flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[9px] font-bold uppercase tracking-tighter opacity-60">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (Modern Pill Design) */}
      <div className="p-6 md:p-8 pt-0 bg-transparent">
        {isRestrictedParty ? (
             <div className="bg-[#FFDDB3] dark:bg-amber-950/40 border border-[#FFB951] dark:border-amber-900/50 rounded-[32px] p-6 flex items-start gap-4 text-xs text-[#291800] dark:text-amber-100 shadow-sm animate-fade-in">
                <Clock className="flex-shrink-0 text-[#825500] dark:text-amber-400 mt-1" size={20} />
                <div className="space-y-1">
                    <p className="font-black uppercase tracking-wider">Clinical Stabilization Lock</p>
                    <p className="font-medium leading-normal opacity-80">Messaging is paused for the stabilization period. Expected availability in {Math.ceil((24 * 3600 * 1000 - (Date.now() - patient.admissionTimestamp)) / (1000 * 3600))} hours.</p>
                </div>
             </div>
        ) : (
            <div className="flex gap-4 items-center bg-white dark:bg-slate-800 p-2 pl-6 pr-2 rounded-[50px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-white/5 group focus-within:border-slate-300 dark:focus-within:border-blue-500/30 transition-all">
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 text-slate-300 hover:text-blue-500 dark:text-slate-500 transition-colors"
                >
                    <Paperclip size={22} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                />
                
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask the AI about this case..."
                    className="flex-1 h-12 bg-transparent text-sm font-semibold text-[#191C1B] dark:text-white outline-none placeholder-[#8e9aa8] dark:placeholder-slate-500"
                />
                
                <button 
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-600 dark:bg-blue-600 text-white rounded-full hover:shadow-lg disabled:opacity-30 transition-all active:scale-90"
                >
                    <Send size={22} className="text-white fill-white" />
                </button>
            </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
};

export default ChatWindow;