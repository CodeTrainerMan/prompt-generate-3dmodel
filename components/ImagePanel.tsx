import React, { useState, useEffect } from 'react';
import { ImageIcon, ChevronUp, ChevronDown, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReferenceImages } from '../types';

interface ImagePanelProps {
  images: ReferenceImages | null;
  isVisible: boolean;
}

// Navigation order requested: Front -> Left -> Right -> Back
const VIEW_ORDER: (keyof ReferenceImages)[] = ['front', 'left', 'right', 'back'];

const VIEW_LABELS: Record<keyof ReferenceImages, string> = {
  front: 'Front View',
  left: 'Left View',
  right: 'Right View',
  back: 'Back View'
};

const ImagePanel: React.FC<ImagePanelProps> = ({ images, isVisible }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedViewKey, setSelectedViewKey] = useState<keyof ReferenceImages | null>(null);

  // Auto-expand when a new image arrives
  useEffect(() => {
    if (images) {
      setIsExpanded(true);
    }
  }, [images]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!selectedViewKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setSelectedViewKey(null);
          break;
        case 'ArrowLeft':
          navigate(-1);
          break;
        case 'ArrowRight':
          navigate(1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedViewKey]);

  if (!images || !isVisible) return null;

  const navigate = (direction: number) => {
    setSelectedViewKey((currentKey) => {
      if (!currentKey) return null;
      const currentIndex = VIEW_ORDER.indexOf(currentKey);
      // Calculate new index with wrapping
      const newIndex = (currentIndex + direction + VIEW_ORDER.length) % VIEW_ORDER.length;
      return VIEW_ORDER[newIndex];
    });
  };

  const closeOverlay = () => {
    setSelectedViewKey(null);
  };

  const ViewCard = ({ viewKey }: { viewKey: keyof ReferenceImages }) => {
    const src = images[viewKey];
    const label = VIEW_LABELS[viewKey];
    
    return (
      <div 
        className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 group aspect-square cursor-pointer hover:border-purple-500 transition-all"
        onClick={() => setSelectedViewKey(viewKey)}
      >
        <img 
          src={`data:image/png;base64,${src}`} 
          alt={label} 
          className="w-full h-full object-cover"
        />
        {/* Hover Overlay with Zoom Icon */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
        </div>
        {/* Label Badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 backdrop-blur-sm">
          <p className="text-white text-[10px] text-center font-medium uppercase tracking-wider">{label}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-2 transition-all duration-300">
      
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl shadow-lg backdrop-blur-md transition-all hover:border-slate-500"
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">Reference Views</span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Thumbnail Grid */}
      <div 
        className={`
          bg-slate-900/90 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-500 ease-in-out origin-top
          ${isExpanded ? 'opacity-100 scale-100 max-h-[800px]' : 'opacity-0 scale-95 max-h-0'}
        `}
      >
        <div className="p-3 grid grid-cols-2 gap-2">
          <ViewCard viewKey="front" />
          <ViewCard viewKey="back" />
          <ViewCard viewKey="left" />
          <ViewCard viewKey="right" />
        </div>
      </div>

      {/* Full Screen Lightbox Overlay */}
      {selectedViewKey && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200 pointer-events-auto"
          onClick={closeOverlay}
        >
          {/* Navigation Container */}
          <div className="relative w-full max-w-7xl h-full flex items-center justify-between pointer-events-none z-40">
            
            {/* Prev Button */}
            <button
               onClick={(e) => { e.stopPropagation(); navigate(-1); }}
               className="pointer-events-auto p-4 rounded-full bg-slate-800/50 hover:bg-purple-600/80 text-white transition-all backdrop-blur-sm -ml-2 md:ml-0 group"
               title="Previous (Left Arrow)"
            >
               <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Main Image Area */}
            <div 
               className="pointer-events-auto relative flex flex-col items-center justify-center flex-1 px-4 md:px-12 h-full"
               onClick={(e) => e.stopPropagation()} 
            >
               <img 
                 key={selectedViewKey} // Key ensures fresh render/animation on switch
                 src={`data:image/png;base64,${images[selectedViewKey]}`}
                 alt={VIEW_LABELS[selectedViewKey]}
                 className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl ring-1 ring-slate-800"
               />
               <div className="mt-6 flex flex-col items-center gap-2">
                  <span className="px-6 py-2 bg-slate-900/80 rounded-full border border-slate-600 text-white font-semibold uppercase tracking-widest shadow-lg text-sm">
                    {VIEW_LABELS[selectedViewKey]}
                  </span>
                  <div className="flex gap-1">
                    {VIEW_ORDER.map((key) => (
                      <div 
                        key={key} 
                        className={`w-2 h-2 rounded-full ${key === selectedViewKey ? 'bg-purple-500' : 'bg-slate-700'}`}
                      />
                    ))}
                  </div>
               </div>
            </div>

            {/* Next Button */}
            <button
               onClick={(e) => { e.stopPropagation(); navigate(1); }}
               className="pointer-events-auto p-4 rounded-full bg-slate-800/50 hover:bg-purple-600/80 text-white transition-all backdrop-blur-sm -mr-2 md:mr-0 group"
               title="Next (Right Arrow)"
            >
               <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
            </button>
            
          </div>

          {/* Close Button - Fixed Position on top of everything */}
          <button 
             onClick={(e) => { e.stopPropagation(); closeOverlay(); }}
             className="fixed top-6 right-6 z-[60] text-slate-400 hover:text-white bg-slate-800/50 hover:bg-red-500/80 p-4 rounded-full transition-all cursor-pointer shadow-lg border border-slate-700 pointer-events-auto"
             title="Close (Esc)"
          >
             <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImagePanel;