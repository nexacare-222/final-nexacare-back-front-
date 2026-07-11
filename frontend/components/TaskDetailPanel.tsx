

import React, { useState, useEffect } from 'react';
import { CareEvent, Patient, User, CareEventChecklistItem } from '../types';
import { X, Clock, User as UserIcon, FileText, CheckSquare, Play, MapPin, CheckCircle2, AlertTriangle, Paperclip, Upload, Calendar } from 'lucide-react';
import HeartCheckbox from './HeartCheckbox';

interface Props {
  task: CareEvent | null;
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
  doctor?: User;
  onAction: (taskId: string, action: 'START' | 'COMPLETE', data?: { notes?: string, checklist?: CareEventChecklistItem[], attachments?: string[] }) => void;
}

const TaskDetailPanel: React.FC<Props> = ({ task, isOpen, onClose, patient, doctor, onAction }) => {
  const [notes, setNotes] = useState('');
  
  // Checklist State with Value field
  const [checklistState, setChecklistState] = useState<CareEventChecklistItem[]>([]);
  
  // File Upload State
  const [attachments, setAttachments] = useState<string[]>([]);
  
  // Timing State
  const [localStartTime, setLocalStartTime] = useState<number | null>(null);

  useEffect(() => {
      if (isOpen && task) {
          setNotes(task.nurseNotes || '');
          setLocalStartTime(task.startTime || null);
          setAttachments(task.attachments || []);

          // Initialize checklist
          if (task.checklist && task.checklist.length > 0) {
              setChecklistState(task.checklist);
          } else {
              // Build initial checklist from requirements
              const items = [
                  ...(task.checks || []),
                  ...(task.medications || []).map(m => `Administer: ${m.name} (${m.dose})`)
              ];
              setChecklistState(items.map(item => ({ item, completed: false, value: '' })));
          }
      }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const isCompleted = task.status === 'COMPLETED';
  const isStarted = !!localStartTime || task.status === 'IN_PROGRESS';

  // Handlers
  const handleStart = () => {
      setLocalStartTime(Date.now());
      onAction(task.id, 'START');
  };

  const handleCheckItem = (index: number) => {
      if (isCompleted) return;
      
      // Auto-start if not started
      if (!localStartTime) {
          handleStart();
      }

      const updated = [...checklistState];
      updated[index].completed = !updated[index].completed;
      updated[index].timestamp = updated[index].completed ? Date.now() : undefined;
      setChecklistState(updated);
  };

  const handleValueChange = (index: number, val: string) => {
      const updated = [...checklistState];
      updated[index].value = val;
      setChecklistState(updated);
  };

  const handleFileUpload = () => {
      // Mock upload
      const fileName = `wound_img_${Date.now()}.jpg`;
      setAttachments([...attachments, fileName]);
  };

  const handleSubmit = () => {
      onAction(task.id, 'COMPLETE', { 
          notes, 
          checklist: checklistState,
          attachments 
      });
      onClose();
  };

  const allChecked = checklistState.length > 0 && checklistState.every(i => i.completed);

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="fixed inset-y-0 right-0 z-[70] w-full md:w-[550px] bg-[#EFF1E6] shadow-2xl transform transition-transform duration-300 flex flex-col font-sans text-[#191C1B]">
          
          {/* Header */}
          <div className="p-6 border-b border-[#DEE5D9] bg-[#FCFDF6] flex justify-between items-start">
              <div>
                  <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                          task.priority === 'URGENT' ? 'bg-[#FFDAD6] text-[#410002] border-[#FFB4AB]' : 'bg-[#C4ED9C] text-[#072100] border-[#A6D37E]'
                      }`}>
                          {task.priority}
                      </span>
                      <span className="text-[10px] text-[#747871] font-mono bg-[#EFF1E6] px-2 py-0.5 rounded">
                          ID: {task.id.split('-').pop()}
                      </span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#191C1B]">Task Form</h2>
                  <p className="text-sm text-[#44474F]">Assigned by Dr. {doctor?.name.split(' ').pop()}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-[#EFF1E6] rounded-full hover:bg-[#DEE5D9] transition-colors"><X size={24}/></button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Patient Context */}
              <div className="bg-[#FCFDF6] p-5 rounded-[24px] border border-[#DEE5D9] shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-heading font-bold text-xl">
                      {patient?.name.charAt(0)}
                  </div>
                  <div>
                      <h3 className="font-bold text-[#191C1B] text-lg">{patient?.name}</h3>
                      <div className="flex items-center gap-4 text-xs text-[#44474F] font-medium mt-1">
                          <span className="flex items-center gap-1"><MapPin size={12}/> {patient?.currentLocation}</span>
                          <span className="flex items-center gap-1"><UserIcon size={12}/> ID: {patient?.id}</span>
                      </div>
                  </div>
              </div>

              {/* Instructions */}
              <div>
                  <h4 className="text-xs font-bold text-[#44474F] uppercase tracking-widest mb-3 ml-1">Doctor's Instructions</h4>
                  <div className="bg-[#FFECB3]/30 p-5 rounded-[24px] border border-[#FFE082] text-sm text-[#191C1B] italic leading-relaxed relative">
                      <div className="absolute top-4 left-4 text-[#FF6F00] opacity-20"><FileText size={32} /></div>
                      <p className="relative z-10 pl-2">"{task.notes || 'No specific notes provided. Follow standard procedure.'}"</p>
                  </div>
              </div>

              {/* Checklist Section */}
              <div>
                  <div className="flex justify-between items-end mb-3 px-1">
                      <h4 className="text-xs font-bold text-[#44474F] uppercase tracking-widest">Procedural Checklist</h4>
                      {isStarted && !isCompleted && (
                          <span className="text-[10px] text-[#00695C] font-bold bg-[#E0F2F1] px-2 py-0.5 rounded animate-pulse">In Progress</span>
                      )}
                  </div>
                  
                  <div className="bg-[#FCFDF6] rounded-[24px] border border-[#DEE5D9] overflow-hidden">
                      {checklistState.length === 0 ? (
                          <div className="p-8 text-center text-[#747871] text-sm">No specific checklist items.</div>
                      ) : (
                          <div className="divide-y divide-[#EFF1E6]">
                              {checklistState.map((item, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`p-4 flex flex-col gap-3 transition-colors ${item.completed ? 'bg-[#F1F8E9]' : ''}`}
                                  >
                                      <div className="flex items-start gap-3">
                                          {/* New Heart Checkbox */}
                                          <div className="flex-shrink-0 -mt-1 -ml-2">
                                              <HeartCheckbox 
                                                checked={item.completed} 
                                                onChange={() => handleCheckItem(idx)} 
                                                size={40} 
                                              />
                                          </div>
                                          
                                          <div className="flex-1 pt-1.5">
                                              <p className={`text-sm font-medium transition-colors ${item.completed ? 'text-[#191C1B]' : 'text-[#191C1B]'}`}>
                                                  {item.item}
                                              </p>
                                              {item.timestamp && (
                                                  <p className="text-[10px] text-[#426936] font-mono mt-1">
                                                      Checked at {new Date(item.timestamp).toLocaleTimeString()}
                                                  </p>
                                              )}
                                          </div>
                                      </div>
                                      
                                      {/* Value Input */}
                                      <div className="pl-10 pr-2">
                                          <input 
                                            type="text" 
                                            placeholder="Enter value/reading (e.g. 120/80)"
                                            className={`w-full bg-white/50 border border-[#DEE5D9] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#426936] transition-all ${item.completed ? 'opacity-100' : 'opacity-60'}`}
                                            value={item.value || ''}
                                            onChange={(e) => handleValueChange(idx, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={isCompleted}
                                          />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>

              {/* Nurse Inputs */}
              <div>
                  <h4 className="text-xs font-bold text-[#44474F] uppercase tracking-widest mb-3 ml-1">Observations & Evidence</h4>
                  <div className="space-y-3">
                      <textarea 
                          className="w-full bg-[#FCFDF6] border border-[#DEE5D9] rounded-[24px] p-4 text-sm outline-none focus:border-[#426936] focus:ring-1 focus:ring-[#426936] resize-none h-28 transition-all"
                          placeholder="Add clinical notes, complications, or observations..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          disabled={isCompleted}
                      />
                      
                      {/* Attachment Area */}
                      <div className="flex flex-wrap gap-2">
                          {attachments.map((file, i) => (
                              <div key={i} className="bg-[#E0F2F1] text-[#00695C] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-[#B2DFDB]">
                                  <Paperclip size={12} /> {file}
                              </div>
                          ))}
                          {!isCompleted && (
                              <button 
                                onClick={handleFileUpload}
                                className="bg-[#EFF1E6] text-[#44474F] px-4 py-2 rounded-xl text-xs font-bold border border-[#DEE5D9] hover:bg-[#E2E8E0] transition-colors flex items-center gap-2"
                              >
                                  <Upload size={14} /> Upload Photo/File
                              </button>
                          )}
                      </div>
                  </div>
              </div>

              {/* Timestamps Readout */}
              {isCompleted && (
                  <div className="bg-[#E8F5E9] p-4 rounded-[20px] border border-[#C8E6C9] flex justify-between items-center text-xs">
                      <div>
                          <p className="font-bold text-[#1B5E20] uppercase tracking-wide mb-1">Task Timeline</p>
                          <p className="text-[#2E7D32] flex items-center gap-1"><Clock size={12}/> Started: {localStartTime ? new Date(localStartTime).toLocaleTimeString() : 'N/A'}</p>
                          <p className="text-[#2E7D32] flex items-center gap-1"><CheckCircle2 size={12}/> Completed: {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : 'N/A'}</p>
                      </div>
                  </div>
              )}

          </div>

          {/* Footer Actions */}
          {!isCompleted && (
              <div className="p-6 border-t border-[#DEE5D9] bg-[#FCFDF6] flex flex-col gap-3">
                  {!isStarted ? (
                      <button 
                        onClick={handleStart} 
                        className="w-full py-4 bg-[#191C1B] text-[#C4ED9C] font-bold rounded-[20px] flex items-center justify-center gap-2 hover:bg-[#2F312E] transition-all shadow-lg active:scale-95"
                      >
                          <Play size={20} fill="currentColor" /> Start Task
                      </button>
                  ) : (
                      <button 
                        onClick={handleSubmit}
                        disabled={!allChecked}
                        className="w-full py-4 bg-[#C4ED9C] text-[#072100] font-bold rounded-[20px] flex items-center justify-center gap-2 hover:bg-[#B8E090] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                          <CheckCircle2 size={20} /> Mark Task as Complete
                      </button>
                  )}
                  {!allChecked && isStarted && (
                      <p className="text-center text-[10px] text-[#BA1A1A] font-bold animate-pulse">
                          * Please complete all checklist items to submit.
                      </p>
                  )}
              </div>
          )}
          
          {isCompleted && (
              <div className="p-6 border-t border-[#DEE5D9] bg-[#FCFDF6]">
                  <button onClick={onClose} className="w-full py-4 bg-[#E0E5D9] text-[#44474F] font-bold rounded-[20px] hover:bg-[#D2D9CD] transition-colors">
                      Close
                  </button>
              </div>
          )}
      </div>
    </>
  );
};

export default TaskDetailPanel;