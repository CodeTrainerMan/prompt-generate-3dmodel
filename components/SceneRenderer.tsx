import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SceneConfig, ShapeType, ShapeData } from '../types';

// Fix for TypeScript errors: Augmenting JSX IntrinsicElements for React Three Fiber
// We define the types explicitly to ensure TypeScript recognizes them in the JSX namespace.
type ThreeJSXElements = {
  boxGeometry: any;
  sphereGeometry: any;
  cylinderGeometry: any;
  coneGeometry: any;
  torusGeometry: any;
  dodecahedronGeometry: any;
  icosahedronGeometry: any;
  mesh: any;
  meshStandardMaterial: any;
  ambientLight: any;
  group: any;
  color: any;
  planeGeometry: any;
  shadowMaterial: any;
};

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeJSXElements {}
  }
}

// Also augment React.JSX for environments using 'react-jsx' transformation
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeJSXElements {}
  }
}

interface SceneRendererProps {
  sceneConfig: SceneConfig | null;
}

const ShapeMesh: React.FC<{ shape: ShapeData }> = ({ shape }) => {
  // Convert standard arrays to Three.js vectors/eulers
  const position = new THREE.Vector3(...shape.position);
  const rotation = new THREE.Euler(...shape.rotation);
  const scale = new THREE.Vector3(...shape.scale);

  // Material handling
  const materialProps = {
    color: shape.color,
    metalness: shape.metalness ?? 0.1,
    roughness: shape.roughness ?? 0.8,
    transparent: (shape.opacity || 1) < 1,
    opacity: shape.opacity ?? 1,
  };

  const Geometry = useMemo(() => {
    switch (shape.type) {
      case ShapeType.BOX: return <boxGeometry args={[1, 1, 1]} />;
      case ShapeType.SPHERE: return <sphereGeometry args={[0.5, 32, 32]} />;
      case ShapeType.CYLINDER: return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case ShapeType.CONE: return <coneGeometry args={[0.5, 1, 32]} />;
      case ShapeType.TORUS: return <torusGeometry args={[0.5, 0.2, 16, 100]} />;
      case ShapeType.DODECAHEDRON: return <dodecahedronGeometry args={[0.5, 0]} />;
      case ShapeType.ICOSAHEDRON: return <icosahedronGeometry args={[0.5, 0]} />;
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  }, [shape.type]);

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
    >
      {Geometry}
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
};

const SceneRenderer: React.FC<SceneRendererProps> = ({ sceneConfig }) => {
  const bgColor = sceneConfig?.backgroundColor || '#111827';
  
  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={[bgColor]} />
        
        {/* Camera Setup */}
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />

        {/* Lighting and Environment */}
        <ambientLight 
          intensity={sceneConfig?.ambientLightIntensity || 0.5} 
          color={sceneConfig?.ambientLightColor || '#ffffff'} 
        />
        <Environment preset="city" />
        
        {/* The Generated Content */}
        <group>
           {sceneConfig && sceneConfig.shapes.map((shape) => (
             <ShapeMesh key={shape.id} shape={shape} />
           ))}
        </group>

        {/* Floor/Grid for context */}
        <Grid 
          position={[0, -2, 0]} 
          args={[10.5, 10.5]} 
          cellColor="#64748b" 
          sectionColor="#94a3b8" 
          fadeDistance={20} 
          fadeStrength={1}
        />
        
        {/* Soft shadows contact plane */}
        <mesh position={[0, -2.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <shadowMaterial transparent opacity={0.4} />
        </mesh>

      </Canvas>
    </div>
  );
};

export default SceneRenderer;