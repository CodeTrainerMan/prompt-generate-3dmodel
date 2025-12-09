import React, { useState } from 'react';
import SceneRenderer from './components/SceneRenderer';
import ControlPanel from './components/ControlPanel';
import ImagePanel from './components/ImagePanel';
import ProcessPanel from './components/ProcessPanel';
import { generateReferenceImages, generateSceneWorkflow } from './services/geminiService';
import { SceneConfig, GenerationState, ReferenceImages, ProcessStage } from './types';

const INITIAL_SCENE: SceneConfig = {
  backgroundColor: '#0f172a',
  ambientLightColor: '#ffffff',
  ambientLightIntensity: 0.5,
  shapes: []
};

const INITIAL_STAGES: ProcessStage[] = [
  { 
    id: 1, 
    name: 'Analysis', 
    description: 'Pre-production & Geometry Breakdown', 
    logs: [], 
    status: 'pending' 
  },
  { 
    id: 2, 
    name: 'Modeling', 
    description: 'CSG Construction & Topology', 
    logs: [], 
    status: 'pending' 
  },
  { 
    id: 3, 
    name: 'Texturing', 
    description: 'Baking, Shading & UVs', 
    logs: [], 
    status: 'pending' 
  },
  { 
    id: 4, 
    name: 'Rendering', 
    description: 'Lighting, VFX & Post-processing', 
    logs: [], 
    status: 'pending' 
  }
];

function App() {
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>(INITIAL_SCENE);
  const [referenceImages, setReferenceImages] = useState<ReferenceImages | null>(null);
  const [stages, setStages] = useState<ProcessStage[]>(INITIAL_STAGES);
  
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    statusMessage: ''
  });

  const handleGenerate = async (prompt: string) => {
    // Reset state
    setStages(INITIAL_STAGES.map(s => ({ ...s, logs: [], status: 'pending' })));
    setGenerationState({
      isGenerating: true,
      error: null,
      statusMessage: 'Initializing pipeline...'
    });

    try {
      // Step 0: Initial Image Generation (Before the 3D pipeline formally starts)
      // We can consider this "Stage 0" or just a pre-requisite.
      // Let's treat it as a loading state before the ProcessPanel activates or update stage 1 immediately.
      
      setGenerationState(prev => ({ ...prev, statusMessage: 'Generating reference blueprints...' }));
      const images = await generateReferenceImages(prompt);
      setReferenceImages(images);
      
      // Start 3D Workflow
      const generator = generateSceneWorkflow(prompt, images);
      
      for await (const update of generator) {
        setStages(prevStages => {
          return prevStages.map(stage => {
            // Update current stage
            if (stage.id === update.stageId) {
               return {
                 ...stage,
                 status: update.logs[update.logs.length - 1]?.includes('complete') || update.logs[update.logs.length - 1]?.includes('finished') ? 'completed' : 'processing',
                 logs: update.logs // Replace or append? Generator sends accumulating logs or fresh batch? 
                 // Our service sends a batch of logs for that step. Let's merge unique ones or just replace if simple.
                 // For this implementation, the service yields the full list for that stage so far usually, but let's just use what's sent.
               };
            }
            // Mark previous stages as completed if we moved past them
            if (stage.id < update.stageId) {
              return { ...stage, status: 'completed' };
            }
            return stage;
          });
        });

        // If we got a scene config update (preview or final), render it
        if (update.sceneConfig) {
          setSceneConfig(update.sceneConfig);
        }
      }

      // Ensure final stage is marked complete
      setStages(prev => prev.map(s => s.id === 4 ? { ...s, status: 'completed' } : s));
      
      setGenerationState(prev => ({ ...prev, isGenerating: false, statusMessage: 'Done!' }));
      
    } catch (error: any) {
      console.error(error);
      setGenerationState({
        isGenerating: false,
        error: error.message || "Pipeline failed.",
        statusMessage: ''
      });
    }
  };

  const handleClear = () => {
    setSceneConfig(INITIAL_SCENE);
    setReferenceImages(null);
    setStages(INITIAL_STAGES);
  };

  return (
    <div className="w-screen h-screen relative bg-slate-950 text-white selection:bg-purple-500/30">
      
      {/* Background/Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <SceneRenderer sceneConfig={sceneConfig} />
      </div>

      {/* Foreground UI Layer */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        
        {/* Right Sidebar Container */}
        <div className="absolute top-4 right-4 bottom-20 z-20 flex flex-col gap-4 w-80 pointer-events-none overflow-y-auto scrollbar-hide pr-1">
          {referenceImages && (
            <>
              {/* Image Panel (Reference Views) */}
              <div className="pointer-events-auto">
                <ImagePanel 
                  images={referenceImages} 
                  isVisible={true} 
                />
              </div>

              {/* Process Panel (Production Pipeline) */}
              <div className="pointer-events-auto">
                <ProcessPanel 
                  stages={stages} 
                  isVisible={true} 
                />
              </div>
            </>
          )}
        </div>

        {/* Center/Bottom: Input Controls */}
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