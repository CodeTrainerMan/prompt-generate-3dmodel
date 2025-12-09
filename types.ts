export enum ShapeType {
  BOX = 'BOX',
  SPHERE = 'SPHERE',
  CYLINDER = 'CYLINDER',
  CONE = 'CONE',
  TORUS = 'TORUS',
  DODECAHEDRON = 'DODECAHEDRON',
  ICOSAHEDRON = 'ICOSAHEDRON'
}

export interface ShapeData {
  id: string;
  type: ShapeType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
}

export interface SceneConfig {
  backgroundColor: string;
  ambientLightColor: string;
  ambientLightIntensity: number;
  shapes: ShapeData[];
}

export interface ReferenceImages {
  front: string;
  back: string;
  left: string;
  right: string;
}

export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  statusMessage: string;
  currentStageId?: number; 
}

export interface StageLog {
  title: string;
  details: string[];
  status: 'pending' | 'active' | 'completed';
}

export interface ProcessStage {
  id: number;
  name: string;
  description: string;
  logs: string[];
  status: 'pending' | 'processing' | 'completed';
}
