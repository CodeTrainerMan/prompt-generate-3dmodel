import React, { useState } from 'react';
import { Send, Loader2, Sparkles, Box, Trash2 } from 'lucide-react';
import { GenerationState } from '../types';

interface ControlPanelProps {
  onGenerate: (prompt: string) => void;
  onClear: () => void;
  generationState: GenerationState;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onGenerate, onClear, generationState }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-10">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-4 flex flex-col gap-3">
        
        {/* Status Indicator */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Gemini 3D Architect</span>
          </div>
          {generationState.isGenerating && (
            <div className="flex items-center gap-2 text-blue-400 text-xs animate-pulse">
               <Loader2 className="w-3 h-3 animate-spin" />
               {generationState.statusMessage}
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a 3D object (e.g., 'A futuristic flying car', 'A medieval castle')"
            className="flex-1 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            disabled={generationState.isGenerating}
          />
          <button
            type="submit"
            disabled={generationState.isGenerating || !prompt.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl px-6 py-3 font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-purple-500/25 active:scale-95"
          >
            {generationState.isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">Generate</span>
          </button>
        </form>

        {/* Helper Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
             {['Cyberpunk City', 'Dragon', 'Space Station', 'Fruit Basket'].map((suggestion) => (
               <button
                 key={suggestion}
                 onClick={() => setPrompt(suggestion)}
                 className="whitespace-nowrap px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-slate-300 transition-colors"
               >
                 {suggestion}
               </button>
             ))}
             <div className="flex-1"></div>
             <button onClick={onClear} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Clear Scene">
                <Trash2 className="w-4 h-4" />
             </button>
        </div>
      </div>
      
      {/* Error Message */}
      {generationState.error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/50 backdrop-blur text-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
           <span className="font-bold">Error:</span> {generationState.error}
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
