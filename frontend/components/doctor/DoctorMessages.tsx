import React, { useState } from 'react';
import { Users, MessageSquare, Search, MapPin, ChevronRight, Clock, Filter } from 'lucide-react';
// Add User to types import
import { Patient, ChatMessage, User } from '../../types';
import PillSlider from '../PillSlider';
import ModernSearchBar from '../ModernSearchBar';

interface Props {
  patients: Patient[];
  messages: Record<string, ChatMessage[]>;
  handleSelectPatient: (id: string, tab: string, channel: 'TEAM' | 'FAMILY') => void;
  // Add missing user prop to interface
  user: User;
}

// Destructure user from props
const DoctorMessages: React.FC<Props> = ({ patients, messages, handleSelectPatient, user }) => {
  const [activeChannel, setActiveChannel] = useState<'TEAM' | 'FAMILY'>('TEAM');
  const [searchQuery, setSearchQuery] = useState('');

  const getThreads = () => {
    return patients.map(p => {
        const msgs = messages[p.id] || [];
        const channelMsgs = msgs.filter(m => 
            activeChannel === 'TEAM' ? (m.channel === 'TEAM' || !m.channel) : m.channel === 'FAMILY'
        );
        if (channelMsgs.length === 0 && !searchQuery) return null;
        
        const lastMsg = channelMsgs.length > 0 ? channelMsgs[channelMsgs.length - 1] : null;
        
        // Filter by search
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (lastMsg?.content.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        
        if (searchQuery && !matchesSearch) return null;
        if (!searchQuery && !lastMsg) return null;

        return { patient: p, lastMsg };
    }).filter((item): item is {patient: Patient, lastMsg: ChatMessage | null} => item !== null)
      .sort((a, b) => (b.lastMsg?.timestamp || 0) - (a.lastMsg?.timestamp || 0));
  };

  const threads = getThreads();

  return (
    <div className="flex flex-col h-full animate-fade-in bg-[#FCFDF6] dark:bg-transparent">
        {/* Header Section */}
        <div className="p-6 pb-4 flex-shrink-0 border-b border-[#EFF1E6] dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-heading font-black text-[#191C1B] dark:text-white tracking-tight">Communications</h1>
                    <p className="text-sm text-[#44474F] dark:text-slate-400 font-medium">Coordinate with care teams and family members.</p>
                </div>
                <div className="w-full md:w-auto">
                    <PillSlider 
                        name="msg-channel-toggle"
                        options={[
                            { id: 'TEAM', label: 'Care Team' },
                            { id: 'FAMILY', label: 'Family' }
                        ]}
                        value={activeChannel}
                        onChange={(val) => setActiveChannel(val as 'TEAM' | 'FAMILY')}
                    />
                </div>
            </div>
            
            <div className="max-w-2xl">
                <ModernSearchBar 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by patient name or message content..."
                />
            </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#FCFDF6] dark:bg-transparent">
            <div className="max-w-4xl mx-auto space-y-3">
                {threads.length === 0 ? (
                    <div className="text-center py-24 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 border border-slate-200 dark:border-white/10">
                            <MessageSquare size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">No conversations found</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                            {searchQuery ? "Try refining your search terms." : `No active messages in the ${activeChannel.toLowerCase()} channel yet.`}
                        </p>
                    </div>
                ) : (
                    threads.map(({patient, lastMsg}) => (
                        <div 
                            key={patient.id} 
                            onClick={() => handleSelectPatient(patient.id, 'CHAT', activeChannel)} 
                            className="group bg-white dark:bg-white/5 p-4 md:p-5 rounded-[28px] border border-[#DEE5D9] dark:border-white/10 hover:border-[#62abff] hover:shadow-lg transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden active:scale-[0.98]"
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${activeChannel === 'TEAM' ? 'bg-[#00695C] dark:bg-emerald-500' : 'bg-[#FF6F00] dark:bg-orange-500'}`}></div>
                            
                            {/* Patient Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-14 h-14 rounded-2xl bg-[#EFF1E6] dark:bg-white/10 text-[#191C1B] dark:text-white flex items-center justify-center font-heading font-bold text-2xl border border-[#DEE5D9] dark:border-white/10 shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                    {patient.name.charAt(0)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-[#FCFDF6] dark:border-slate-800 flex items-center justify-center text-blue-500 shadow-sm">
                                    {activeChannel === 'TEAM' ? <Users size={12} /> : <MessageSquare size={12} />}
                                </div>
                            </div>

                            {/* Thread Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <h4 className="font-bold text-[#191C1B] dark:text-white text-lg truncate group-hover:text-[#62abff] transition-colors">
                                            {patient.name}
                                        </h4>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#747871] dark:text-slate-400 bg-[#EFF1E6] dark:bg-white/10 px-2 py-0.5 rounded-full border border-[#DEE5D9] dark:border-white/5">
                                            <MapPin size={10} /> {patient.currentLocation}
                                        </span>
                                    </div>
                                    {lastMsg && (
                                        <span className="text-[10px] font-bold text-[#747871] dark:text-slate-500 flex items-center gap-1 whitespace-nowrap">
                                            <Clock size={10} /> {new Date(lastMsg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </span>
                                    )}
                                </div>
                                
                                {lastMsg ? (
                                    <p className="text-sm text-[#44474F] dark:text-slate-300 line-clamp-1 font-medium opacity-90">
                                        {/* user is now available in scope */}
                                        <span className="font-bold text-[#191C1B] dark:text-white">{lastMsg.senderId === user.id ? 'You' : lastMsg.senderName}:</span> {lastMsg.content}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400 dark:text-slate-500 italic">No messages yet. Start a conversation.</p>
                                )}
                            </div>

                            <div className="hidden sm:flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <ChevronRight size={20} className="text-slate-400" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export default DoctorMessages;