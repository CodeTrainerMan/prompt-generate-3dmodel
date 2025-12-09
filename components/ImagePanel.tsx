import React, { useState, useEffect } from 'react';
import { ImageIcon, ChevronUp, ChevronDown, X } from 'lucide-react';

interface ImagePanelProps {
  imageSrc: string | null;
  isVisible: boolean;
}

const ImagePanel: React.FC<ImagePanelProps> = ({ imageSrc, isVisible }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-expand when a new image arrives
  useEffect(() => {
    if (imageSrc) {
      setIsExpanded(true);
    }
  }, [imageSrc]);

  if (!imageSrc || !isVisible) return null;

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end pointer-events-auto transition-all duration-300">
      
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl shadow-lg backdrop-blur-md transition-all hover:border-slate-500 mb-2"
      >
        <ImageIcon className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium">Reference Image</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Image Content */}
      <div 
        className={`
          bg-slate-900/90 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-500 ease-in-out origin-top-right
          ${isExpanded ? 'opacity-100 scale-100 max-h-[500px]' : 'opacity-0 scale-95 max-h-0'}
        `}
      >
        <div className="p-2 w-64 md:w-80">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
             <img 
               src={`data:image/png;base64,${imageSrc}`} 
               alt="AI Generated Reference" 
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
               <p className="text-white text-xs font-medium">Gemini generated reference</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePanel;
