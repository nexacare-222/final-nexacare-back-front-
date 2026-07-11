
import React, { useState } from 'react';
import { Patient } from '../types';
import { Download, Share2, X, Copy, Mail, MessageCircle, Printer, CheckCircle2 } from 'lucide-react';

interface Props {
    patient: Patient;
    onClose: () => void;
}

const QRCodeDisplay: React.FC<Props> = ({ patient, onClose }) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock QR URL
  const qrData = JSON.stringify({id: patient.id, token: patient.qrToken});
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
  const shareLink = `https://nexacare.app/access/${patient.id}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: `NexaCare Access Pass - ${patient.name}`,
                text: `Here is the secure access pass for patient ${patient.name} (ID: ${patient.id}).`,
                url: shareLink
            });
        } catch (error) {
            console.log('Error sharing', error);
        }
    } else {
        setIsShareOpen(!isShareOpen);
    }
  };

  const handleCopyLink = () => {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
      const printWindow = window.open('', '', 'height=800,width=600');
      if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>NexaCare Patient Pass - ${patient.id}</title>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                  body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background-color: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                  }
                  .pass-card {
                    background: white;
                    width: 350px;
                    padding: 40px;
                    border-radius: 20px;
                    border: 2px solid #e2e8f0;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                  }
                  .logo {
                    color: #4f46e5;
                    font-size: 24px;
                    font-weight: 800;
                    margin-bottom: 30px;
                    letter-spacing: -0.5px;
                  }
                  .qr-container {
                    background: white;
                    padding: 15px;
                    border: 4px solid #1e293b;
                    border-radius: 15px;
                    display: inline-block;
                    margin-bottom: 20px;
                  }
                  .qr-img {
                    width: 200px;
                    height: 200px;
                  }
                  .label {
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #94a3b8;
                    font-weight: 700;
                    letter-spacing: 1px;
                    margin-bottom: 5px;
                  }
                  .value {
                    font-size: 18px;
                    color: #1e293b;
                    font-weight: 700;
                    margin-bottom: 15px;
                    font-family: monospace;
                  }
                  .patient-name {
                    font-size: 22px;
                    color: #0f172a;
                    font-weight: 700;
                    margin-bottom: 5px;
                  }
                  .footer {
                    margin-top: 30px;
                    border-top: 1px dashed #cbd5e1;
                    padding-top: 20px;
                    font-size: 12px;
                    color: #64748b;
                  }
                </style>
              </head>
              <body>
                <div class="pass-card">
                  <div class="logo">NexaCare.</div>
                  <div class="qr-container">
                    <img src="${qrDataUrl}" class="qr-img" />
                  </div>
                  
                  <div class="patient-name">${patient.name}</div>
                  <div style="color: #64748b; font-size: 14px; margin-bottom: 20px;">Visitor Access Pass</div>

                  <div class="label">PATIENT ID</div>
                  <div class="value">${patient.id}</div>

                  <div class="label">WARD LOCATION</div>
                  <div class="value">${patient.currentLocation}</div>

                  <div class="footer">
                    Scan this QR code at the hospital kiosk or login via the NexaCare Family App to access real-time updates.
                  </div>
                </div>
                <script>
                  window.onload = function() { window.print(); window.close(); }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white p-0 rounded-3xl max-w-sm w-full text-center shadow-2xl overflow-hidden relative animate-fade-in" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-100">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white rounded-full text-slate-400 hover:text-slate-800 transition-colors shadow-sm">
                    <X size={18} />
                </button>
                <h2 className="text-xl font-heading font-bold text-slate-900">Access Pass</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Scan to login as Patient Party</p>
            </div>
            
            {/* QR Content */}
            <div className="p-8 pb-6">
                <div className="bg-white p-3 border-4 border-slate-900 rounded-2xl inline-block mb-6 shadow-lg">
                    <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-2 border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold mb-1">Patient ID</p>
                    <p className="text-xl font-mono font-bold text-indigo-600 tracking-wider">{patient.id}</p>
                </div>
                <p className="text-xs text-slate-400 font-medium">{patient.name}</p>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0 flex gap-3 justify-center relative">
                <div className="relative">
                    <button 
                        onClick={handleNativeShare}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <Share2 size={18} /> Share
                    </button>

                    {/* Share Popup Menu */}
                    {isShareOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1 z-50 animate-fade-in">
                            <button onClick={() => alert('Opened WhatsApp')} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left">
                                <MessageCircle size={16} className="text-emerald-500" /> WhatsApp
                            </button>
                            <button onClick={() => alert('Opened Email Client')} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left">
                                <Mail size={16} className="text-sky-500" /> Email
                            </button>
                            <button onClick={handleCopyLink} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left">
                                {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} className="text-slate-400" />}
                                {copied ? 'Copied' : 'Copy Link'}
                            </button>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                >
                    <Printer size={18} /> Print PDF
                </button>
            </div>
            
            <div className="pb-6">
                <button onClick={onClose} className="text-xs text-slate-400 font-bold hover:text-slate-600 transition-colors">Close Window</button>
            </div>
        </div>
    </div>
  );
};

export default QRCodeDisplay;
