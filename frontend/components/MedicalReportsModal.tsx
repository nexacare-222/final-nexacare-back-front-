
import React, { useState, useEffect } from 'react';
import { LabReport, Patient } from '../types';
import { X, FileText, ChevronRight, TestTube, Search, Download, AlertTriangle, CheckCircle2, Calendar, User } from 'lucide-react';
import ModernSearchBar from './ModernSearchBar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  reports: LabReport[];
  selectedPatientId?: string | null;
  initialReportId?: string | null; // New prop to open specific report
}

const MedicalReportsModal: React.FC<Props> = ({ isOpen, onClose, patients, reports, selectedPatientId, initialReportId }) => {
  const [activePatientId, setActivePatientId] = useState(selectedPatientId || '');
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
      if (isOpen) {
          setActivePatientId(selectedPatientId || '');
          setSearchQuery('');
          
          // If a specific report is requested, find and select it
          if (initialReportId) {
              const report = reports.find(r => r.id === initialReportId);
              if (report) {
                  setSelectedReport(report);
                  // Also ensure the correct patient is selected if not already
                  // if (!selectedPatientId) setActivePatientId(report.patientId); // Removed to allow "All" view
              }
          } else {
              setSelectedReport(null);
          }
      }
  }, [isOpen, selectedPatientId, initialReportId, reports]);

  if (!isOpen) return null;

  const activePatient = patients.find(p => p.id === activePatientId);
  const getPatientName = (pid: string) => patients.find(p => p.id === pid)?.name || 'Unknown';
  
  // Filter Reports
  // CHANGED: If activePatientId is empty, show all reports (filtered by search)
  const filteredReports = reports.filter(r => {
      const matchesPatient = activePatientId ? r.patientId === activePatientId : true;
      const matchesSearch = r.testName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (activePatientId ? false : getPatientName(r.patientId).toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesPatient && matchesSearch;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const handleDownloadPDF = (report: LabReport) => {
      if (report.fileUrl) {
          const a = document.createElement('a');
          a.href = report.fileUrl;
          a.download = `${report.testName.replace(/\s+/g, '_')}_${report.date}`; // Browser handles extension usually
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
      }

      // Mock PDF Download for generated/mock data
      const content = `
        NEXACARE MEDICAL REPORT
        -----------------------
        Patient: ${getPatientName(report.patientId)}
        Test: ${report.testName}
        Date: ${report.date}
        Category: ${report.category}
        Result: ${report.resultSummary}
        
        DATA:
        ${JSON.stringify(report.data, null, 2)}
        
        (Signed Electronically)
      `;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.testName.replace(/\s+/g, '_')}_${report.date}.txt`; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
  };

  const renderReportDetail = () => {
      if (!selectedReport) return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-10 text-center">
              <FileText size={64} className="mb-4 opacity-30" />
              <p className="text-lg font-normal">Select a report to view details</p>
              <p className="text-sm opacity-70">Choose from the list on the left.</p>
          </div>
      );

      return (
          <div className="animate-fade-in h-full flex flex-col font-sans text-white">
              {/* Report Header */}
              <div className="bg-white/5 p-6 md:p-8 border-b border-white/10 backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div>
                          <h2 className="text-2xl md:text-3xl font-normal tracking-tight text-white">{selectedReport.testName}</h2>
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                              <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-full font-bold uppercase text-xs tracking-wide">
                                  {selectedReport.category}
                              </span>
                              <span className="text-gray-600">|</span>
                              <span className="flex items-center gap-2 text-gray-400">
                                  <Calendar size={16} /> {selectedReport.date}
                              </span>
                              {/* Show Patient Name in Detail if listing all */}
                              {!activePatientId && (
                                  <>
                                    <span className="text-gray-600">|</span>
                                    <span className="flex items-center gap-2 text-emerald-400 font-bold">
                                        <User size={16} /> {getPatientName(selectedReport.patientId)}
                                    </span>
                                  </>
                              )}
                          </div>
                      </div>
                      <div className="text-right w-full md:w-auto">
                          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${selectedReport.resultSummary === 'Normal' ? 'bg-[#C4ED9C] text-[#072100]' : 'bg-[#FFDAD6] text-[#410002]'}`}>
                              {selectedReport.resultSummary === 'Normal' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                              {selectedReport.resultSummary}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 font-mono">Ref: {selectedReport.id}</p>
                      </div>
                  </div>
              </div>

              {/* Report Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent custom-scrollbar">
                  <div className="bg-white/5 rounded-[24px] border border-white/10 overflow-hidden shadow-sm backdrop-blur-sm">
                      <div className="bg-white/5 px-4 md:px-6 py-4 border-b border-white/10 grid grid-cols-3 md:grid-cols-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          <div className="col-span-1 md:col-span-2">Parameter</div>
                          <div className="text-center">Result</div>
                          <div className="text-right">Ref. Range</div>
                      </div>
                      <div className="divide-y divide-white/10">
                          {Object.keys(selectedReport.data).length === 0 && (
                              <div className="p-8 text-center text-gray-500 italic text-sm">
                                  No structured data available. Please download the file to view report content.
                              </div>
                          )}
                          {Object.entries(selectedReport.data).map(([param, rawDetails]) => {
                              const details = rawDetails as { value: string; unit: string; range: string; flag?: string };
                              return (
                              <div key={param} className="px-4 md:px-6 py-4 grid grid-cols-3 md:grid-cols-4 items-center text-sm hover:bg-white/5 transition-colors">
                                  <div className="col-span-1 md:col-span-2 font-bold text-white truncate pr-2">{param}</div>
                                  <div className="text-center font-bold flex flex-col md:block">
                                      <span className={details.flag ? 'text-red-400' : 'text-white'}>
                                          {details.value} <span className="text-xs font-normal text-gray-500 ml-1">{details.unit}</span>
                                      </span>
                                      {details.flag && (
                                          <span className="md:ml-2 text-[10px] bg-red-900/50 text-red-200 px-1.5 py-0.5 rounded font-bold uppercase border border-red-500/30 inline-block w-fit mx-auto md:mx-0 mt-1 md:mt-0">
                                              {details.flag}
                                          </span>
                                      )}
                                  </div>
                                  <div className="text-right text-gray-400 text-xs font-mono">
                                      {details.range || '-'}
                                  </div>
                              </div>
                          )})}
                      </div>
                  </div>
              </div>

              {/* Report Footer */}
              <div className="bg-white/5 p-6 border-t border-white/10 flex justify-end gap-4 backdrop-blur-sm flex-wrap">
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 md:flex-none px-6 py-3 text-sm font-bold text-gray-300 hover:bg-white/10 rounded-full transition-colors text-center"
                  >
                      Print
                  </button>
                  <button 
                    onClick={() => handleDownloadPDF(selectedReport)}
                    className="flex-1 md:flex-none px-6 py-3 bg-[#C4ED9C] text-[#072100] text-sm font-bold rounded-[16px] hover:bg-[#B8E090] flex items-center justify-center gap-2 shadow-lg"
                  >
                      <Download size={18} /> {selectedReport.fileUrl ? 'Download File' : 'Download Report'}
                  </button>
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all duration-300 p-0 md:p-4">
      <div className="bg-white/10 w-full md:w-[95%] max-w-5xl rounded-none md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full md:h-[85vh] animate-scale-in text-white font-sans border border-white/20 backdrop-blur-2xl will-change-transform">
        
        {/* Left Panel - List */}
        <div className={`${selectedReport ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 bg-black/20 border-r border-white/10 flex-col`}>
            
            {/* Header */}
            <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-normal text-xl tracking-tight text-white flex items-center gap-3">
                        <div className="bg-[#C4ED9C] p-1.5 rounded-lg text-[#072100]"><TestTube size={18} /></div>
                        Medical Reports
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Patient Selector */}
                <div className="mb-4 relative">
                    <select 
                        className="w-full p-3 pl-4 rounded-2xl bg-white/10 border-none text-sm font-bold text-white outline-none focus:ring-2 focus:ring-white/30 transition-all appearance-none cursor-pointer"
                        value={activePatientId}
                        onChange={e => setActivePatientId(e.target.value)}
                    >
                        <option value="" className="text-black">All Patients</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                        ))}
                    </select>
                    <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Search */}
                <ModernSearchBar 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tests..."
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredReports.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-sm font-medium">No reports found.</div>
                ) : (
                    filteredReports.map(report => (
                        <button
                            key={report.id}
                            onClick={() => setSelectedReport(report)}
                            className={`w-full text-left p-4 rounded-[20px] border transition-all group ${selectedReport?.id === report.id ? 'bg-[#C4ED9C] border-[#C4ED9C] shadow-sm' : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${selectedReport?.id === report.id ? 'bg-[#072100]/10 text-[#072100]' : 'bg-white/10 text-gray-400'}`}>
                                    {report.category}
                                </span>
                                <span className={`text-[10px] font-mono ${selectedReport?.id === report.id ? 'text-[#072100]' : 'text-gray-500'}`}>{report.date}</span>
                            </div>
                            <h4 className={`font-bold text-sm mb-1 truncate ${selectedReport?.id === report.id ? 'text-[#072100]' : 'text-white'}`}>
                                {report.testName}
                            </h4>
                            
                            {/* Patient Name Badge if showing All */}
                            {!activePatientId && (
                                <div className={`text-[10px] mb-2 truncate ${selectedReport?.id === report.id ? 'text-[#072100]/80' : 'text-gray-400'}`}>
                                    {getPatientName(report.patientId)}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                {report.resultSummary === 'Normal' ? (
                                    <span className={`flex items-center gap-1 text-[10px] font-bold ${selectedReport?.id === report.id ? 'text-[#072100]' : 'text-[#426936]'}`}>
                                        <CheckCircle2 size={12} /> Normal
                                    </span>
                                ) : report.resultSummary === 'Uploaded' ? (
                                    <span className={`flex items-center gap-1 text-[10px] font-bold ${selectedReport?.id === report.id ? 'text-[#072100]' : 'text-blue-300'}`}>
                                        <FileText size={12} /> File
                                    </span>
                                ) : (
                                    <span className={`flex items-center gap-1 text-[10px] font-bold ${selectedReport?.id === report.id ? 'text-[#410002]' : 'text-red-400'}`}>
                                        <AlertTriangle size={12} /> Abnormal
                                    </span>
                                )}
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>

        {/* Right Panel - Detail */}
        <div className={`${selectedReport ? 'flex' : 'hidden md:flex'} flex-1 bg-transparent rounded-none md:rounded-tl-[32px] md:rounded-bl-[32px] shadow-[-10px_0_30px_rgba(0,0,0,0.2)] overflow-hidden flex-col relative z-10`}>
            <div className="md:hidden absolute top-4 left-4 z-30">
                <button onClick={() => setSelectedReport(null)} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md">
                    <ChevronRight className="rotate-180" size={20} />
                </button>
            </div>
            {/* Show Patient Name Overlay only if in single patient mode, otherwise header handles it */}
            {activePatient && (
                <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 pointer-events-none">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                        <User size={14} className="text-gray-300" />
                        <span className="text-xs font-bold text-white">{activePatient.name}</span>
                    </div>
                </div>
            )}
            {renderReportDetail()}
        </div>

      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
      `}</style>
    </div>
  );
};

export default MedicalReportsModal;
