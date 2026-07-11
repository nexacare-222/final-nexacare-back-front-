import React from 'react';
import { Users, Activity, HeartPulse, BedDouble } from 'lucide-react';
import { Patient, User, UserRole } from '../../types';

interface Props {
  patients: Patient[];
  staff: User[];
  setActiveStatModal: (type: 'PATIENTS' | 'DOCTORS' | 'STAFF' | 'BEDS') => void;
}

const DoctorStats: React.FC<Props> = ({ patients, staff, setActiveStatModal }) => {
  const totalPatients = patients.length;
  
  const allDoctors = staff.filter(s => s.role === UserRole.DOCTOR);
  const totalDoctors = allDoctors.length;
  const activeDoctors = allDoctors.filter(s => s.isOnline).length;

  const allNurses = staff.filter(s => s.role === UserRole.NURSE || s.role === UserRole.STAFF);
  const totalNurses = allNurses.length;
  const activeNurses = allNurses.filter(s => s.isOnline).length;

  const totalCapacity = 120;
  const bedsLeft = totalCapacity - totalPatients;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div 
        onClick={() => setActiveStatModal('PATIENTS')}
        className="bg-[#FCFDF6] dark:bg-white/5 p-5 rounded-[24px] border border-[#DEE5D9] dark:border-white/10 flex items-center gap-4 hover:border-[#98D6EA] transition-all cursor-pointer group active:scale-[0.98] shadow-sm"
        >
            <div className="w-14 h-14 rounded-2xl bg-[#E0F7FA] dark:bg-cyan-900/30 text-[#006064] dark:text-cyan-400 flex items-center justify-center border border-[#B2EBF2] dark:border-cyan-800/50 flex-shrink-0 group-hover:scale-105 transition-transform">
                <Users size={28} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-bold text-[#44474F] dark:text-slate-400 uppercase tracking-widest truncate">Total Patients</p>
                <p className="text-4xl font-heading font-bold text-[#191C1B] dark:text-white leading-none mt-1">{totalPatients}</p>
            </div>
        </div>

        <div 
        onClick={() => setActiveStatModal('DOCTORS')}
        className="bg-[#FCFDF6] dark:bg-white/5 p-5 rounded-[24px] border border-[#DEE5D9] dark:border-white/10 flex items-center gap-4 hover:border-[#A5D6A7] transition-all cursor-pointer group active:scale-[0.98] shadow-sm"
        >
            <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] dark:bg-emerald-900/30 text-[#1B5E20] dark:text-emerald-400 flex items-center justify-center border border-[#C8E6C9] dark:border-emerald-800/50 flex-shrink-0 group-hover:scale-105 transition-transform">
                <Activity size={28} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-bold text-[#44474F] dark:text-slate-400 uppercase tracking-widest truncate">Doctors Active</p>
                <p className="text-4xl font-heading font-bold text-[#191C1B] dark:text-white leading-none mt-1">
                {activeDoctors} <span className="text-sm text-[#747871] dark:text-slate-500 font-medium align-middle opacity-60">/ {totalDoctors}</span>
                </p>
            </div>
        </div>

        <div 
        onClick={() => setActiveStatModal('STAFF')}
        className="bg-[#FCFDF6] dark:bg-white/5 p-5 rounded-[24px] border border-[#DEE5D9] dark:border-white/10 flex items-center gap-4 hover:border-[#EF9A9A] transition-all cursor-pointer group active:scale-[0.98] shadow-sm"
        >
            <div className="w-14 h-14 rounded-2xl bg-[#FFEBEE] dark:bg-red-900/30 text-[#B71C1C] dark:text-red-400 flex items-center justify-center border border-[#FFCDD2] dark:border-red-800/50 flex-shrink-0 group-hover:scale-105 transition-transform">
                <HeartPulse size={28} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-bold text-[#44474F] dark:text-slate-400 uppercase tracking-widest truncate">Nurses Active</p>
                <p className="text-4xl font-heading font-bold text-[#191C1B] dark:text-white leading-none mt-1">
                {activeNurses} <span className="text-sm text-[#747871] dark:text-slate-500 font-medium align-middle opacity-60">/ {totalNurses}</span>
                </p>
            </div>
        </div>

        <div 
        onClick={() => setActiveStatModal('BEDS')}
        className="bg-[#FCFDF6] dark:bg-white/5 p-5 rounded-[24px] border border-[#DEE5D9] dark:border-white/10 flex items-center gap-4 hover:border-[#FFE082] transition-all cursor-pointer group active:scale-[0.98] shadow-sm"
        >
            <div className="w-14 h-14 rounded-2xl bg-[#FFF8E1] dark:bg-amber-900/30 text-[#FF6F00] dark:text-amber-400 flex items-center justify-center border border-[#FFECB3] dark:border-amber-800/50 flex-shrink-0 group-hover:scale-105 transition-transform">
                <BedDouble size={28} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-bold text-[#44474F] dark:text-slate-400 uppercase tracking-widest truncate">Beds Left</p>
                <p className="text-4xl font-heading font-bold text-[#191C1B] dark:text-white leading-none mt-1">{bedsLeft} <span className="text-sm text-[#747871] dark:text-slate-500 font-medium align-middle opacity-60">/ {totalCapacity}</span></p>
            </div>
        </div>
    </div>
  );
};

export default DoctorStats;