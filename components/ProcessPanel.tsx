import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  BrainCircuit, 
  Cuboid, 
  Palette, 
  Aperture 
} from 'lucide-react';
import { ProcessStage } from '../types';

interface ProcessPanelProps {
  stages: ProcessStage[];
  isVisible: boolean;
}

const STAGE_ICONS = [
  BrainCircuit, // Analysis
  Cuboid,       // Modeling
  Palette,      // Texturing
  Aperture      // Rendering
];

const ProcessPanel: React.FC<ProcessPanelProps> = ({ stages, isVisible }) => {
  const [expandedStageId, setExpandedStageId] = useState<number | null>(null);

  // Auto-expand the currently processing stage
  useEffect(() => {
    const activeStage = stages.find(s => s.status === 'processing');
    if (activeStage) {
      setExpandedStageId(activeStage.id);
    } else if (stages.every(s => s.status === 'completed')) {
        // Keep the last one or close all? Let's keep the last one open for a bit then user can toggle
        setExpandedStageId(4); 
    }
  }, [stages]);

  if (!isVisible) return null;

  return (
    <div className="w-full pointer-events-auto flex flex-col gap-2">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
             Production Pipeline
          </h2>
        </div>

        <div className="flex flex-col">
          {stages.map((stage, index) => {
            const Icon = STAGE_ICONS[index] || Circle;
            const isProcessing = stage.status === 'processing';
            const isCompleted = stage.status === 'completed';
            const isExpanded = expandedStageId === stage.id;

            return (
              <div key={stage.id} className="border-b border-slate-800 last:border-0">
                {/* Header */}
                <button
                  onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                  className={`w-full flex items-center justify-between p-3 transition-colors ${
                    isProcessing ? 'bg-purple-500/10' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-lg border 
                      ${isCompleted ? 'bg-green-500/20 border-green-500/50 text-green-400' : 
                        isProcessing ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 
                        'bg-slate-800 border-slate-700 text-slate-500'}
                    `}>
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                       isCompleted ? <CheckCircle2 className="w-4 h-4" /> : 
                       <Icon className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className={`text-sm font-semibold ${isProcessing || isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                        {stage.name}
                      </span>
                      <span className="text-[10px] text-slate-500">{stage.description}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {/* Logs / Content */}
                <div className={`
                  overflow-hidden transition-all duration-300 bg-slate-950/30
                  ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}
                `}>
                  <div className="p-3 pl-14 text-xs font-mono space-y-1 text-slate-400 overflow-y-auto max-h-[480px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/20 pr-2">
                    {stage.logs.length === 0 && stage.status === 'pending' && (
                        <span className="text-slate-600 italic">Waiting to start...</span>
                    )}
                    {stage.logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-purple-500 mt-0.5">›</span>
                        <span className="break-words">{log}</span>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex items-center gap-2 pt-1 opacity-50">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProcessPanel;