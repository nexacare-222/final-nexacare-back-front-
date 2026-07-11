
import React from 'react';
import { Patient } from '../../types';

const DetailedRecoveryChart: React.FC<{ patient: Patient }> = ({ patient }) => {
  // Mock data generation
  const days = 14;
  const dataPoints: number[] = [];
  const labels: string[] = [];
  const now = new Date();

  // Seed based on patient ID to be consistent but random-looking
  const seed = patient.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pseudoRandom = (i: number) => {
      const x = Math.sin(seed + i) * 10000;
      return x - Math.floor(x);
  };

  const baseScore = patient.severity === 'Critical' ? 40 : patient.severity === 'Monitor' ? 65 : 85;

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    // Trend calculation
    const trend = (days - i) * (patient.severity === 'Critical' ? 1.5 : 0.5); 
    const noise = (pseudoRandom(i) * 10) - 5;
    let score = baseScore + trend + noise;
    
    // Cap at 100
    if (score > 98) score = 98 + noise/2;
    if (score < 20) score = 20;
    
    dataPoints.push(Math.round(score));
  }

  // SVG Dimensions
  const width = 800;
  const height = 300;
  const paddingX = 60;
  const paddingY = 40;
  
  const maxY = 100;
  const minY = 0;
  
  const xStep = (width - paddingX * 2) / (dataPoints.length - 1);
  const yRatio = (height - paddingY * 2) / (maxY - minY);

  const points = dataPoints.map((val, idx) => {
      const x = paddingX + idx * xStep;
      const y = height - paddingY - (val * yRatio);
      return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const fillD = `M ${points[0]} L ${points.join(' L ')} L ${points[points.length-1].split(',')[0]},${height - paddingY} L ${points[0].split(',')[0]},${height - paddingY} Z`;

  return (
    <div className="w-full bg-white rounded-[24px] p-6 border border-[#DEE5D9] shadow-sm">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-3xl font-bold text-[#191C1B]">Recovery Trajectory</h3>
                <p className="text-sm text-[#44474F]">AI-Generated Health Score based on vitals stability (Last 15 Days)</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#426936]"></div>
                    <span className="text-sm font-bold text-[#191C1B]">Health Score</span>
                </div>
                <select className="bg-[#EFF1E6] border-none text-xs font-bold rounded-lg px-2 py-1 text-[#44474F] outline-none">
                    <option>Last 15 Days</option>
                    <option>Last 30 Days</option>
                </select>
            </div>
        </div>

        <div className="relative w-full aspect-[21/9] min-h-[250px]">
            <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0, 25, 50, 75, 100].map(val => {
                     const y = height - paddingY - (val * yRatio);
                     return (
                         <g key={val}>
                             <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#E0E5D9" strokeDasharray="4 4" />
                             <text x={paddingX - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-[#747871] font-bold">{val}</text>
                         </g>
                     )
                })}

                {/* Area Fill */}
                <defs>
                    <linearGradient id="recoveryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#426936" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#426936" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={fillD} fill="url(#recoveryGradient)" />

                {/* Line */}
                <path d={pathD} fill="none" stroke="#426936" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Points */}
                {points.map((p, i) => {
                    const [cx, cy] = p.split(',');
                    return (
                        <circle 
                            key={i} 
                            cx={cx} 
                            cy={cy} 
                            r="4" 
                            fill="#FCFDF6" 
                            stroke="#426936" 
                            strokeWidth="2" 
                            className="hover:r-6 transition-all cursor-crosshair"
                        >
                            <title>Day: {labels[i]}, Score: {dataPoints[i]}</title>
                        </circle>
                    )
                })}

                {/* X Axis Labels (Skip some to fit) */}
                {labels.map((label, i) => {
                    if (i % 2 !== 0 && i !== labels.length - 1) return null; 
                    const x = paddingX + i * xStep;
                    return (
                         <text key={i} x={x} y={height - 10} textAnchor="middle" className="text-[10px] fill-[#747871] font-bold">{label}</text>
                    )
                })}
            </svg>
        </div>
    </div>
  );
};

export default DetailedRecoveryChart;
