import React, { useState } from 'react';
import SceneRenderer from './components/SceneRenderer';
import ControlPanel from './components/ControlPanel';
import ImagePanel from './components/ImagePanel';
import { generateSceneFromPrompt, generateReferenceImage } from './services/geminiService';
import { SceneConfig, GenerationState } from './types';

const INITIAL_SCENE: SceneConfig = {
  backgroundColor: '#0f172a',
  ambientLightColor: '#ffffff',
  ambientLightIntensity: 0.5,
  shapes: []
};

function App() {
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>(INITIAL_SCENE);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    statusMessage: ''
  });

  const handleGenerate = async (prompt: string) => {
    setGenerationState({
      isGenerating: true,
      error: null,
      statusMessage: 'Visualizing concept...'
    });

    try {
      // Step 1: Generate Reference Image
      const imageBase64 = await generateReferenceImage(prompt);
      setReferenceImage(imageBase64);
      
      setGenerationState(prev => ({
        ...prev,
        statusMessage: 'Constructing 3D geometry...'
      }));

      // Step 2: Generate 3D Scene based on Image
      const config = await generateSceneFromPrompt(prompt, imageBase64);
      
      setSceneConfig(config);
      setGenerationState(prev => ({ ...prev, isGenerating: false, statusMessage: 'Done!' }));
      
    } catch (error: any) {
      console.error(error);
      setGenerationState({
        isGenerating: false,
        error: error.message || "Failed to generate content. Please try again.",
        statusMessage: ''
      });
    }
  };

  const handleClear = () => {
    setSceneConfig(INITIAL_SCENE);
    setReferenceImage(null);
  };

  return (
    <div className="w-screen h-screen relative bg-slate-950 text-white selection:bg-purple-500/30">
      
      {/* Background/Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <SceneRenderer sceneConfig={sceneConfig} />
      </div>

      {/* Foreground UI Layer */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        {/* Header */}
        <div className="absolute top-0 left-0 p-6 pointer-events-auto">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Gemini 3D
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-[200px]">
            Text → Image → 3D Primitives
          </p>
        </div>

        {/* Reference Image Panel */}
        <ImagePanel 
          imageSrc={referenceImage} 
          isVisible={!!referenceImage} 
        />

        {/* Input Controls */}
        <div className="pointer-events-auto">
           <ControlPanel 
             onGenerate={handleGenerate} 
             onClear={handleClear}
             generationState={generationState} 
           />
        </div>
      </div>
    </div>
  );
}

export default App;
