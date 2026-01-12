'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PetSystem, setupComposer, PET_TYPES } from '@/lib/pet-system';

interface Pet3DProps {
  tribe: string;
  stage: string;
  isNeglected?: boolean;
  isSleeping?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onLoad?: () => void;
}

const TRIBE_MAP: Record<string, keyof typeof PET_TYPES> = {
  FOFO: 'FOFO',
  CAOS: 'CAOS',
  CHAD: 'CHAD',
  DEGEN: 'DEGEN',
};

const SIZE_MAP = {
  sm: { width: 150, height: 150 },
  md: { width: 200, height: 200 },
  lg: { width: 300, height: 300 },
  xl: { width: 400, height: 400 },
};

export function Pet3D({
  tribe,
  stage,
  isNeglected = false,
  isSleeping = false,
  size = 'md',
  interactive = true,
  onLoad,
}: Pet3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const petSystemRef = useRef<PetSystem | null>(null);
  const composerRef = useRef<any>(null);
  const frameRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dimensions = SIZE_MAP[size];

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(
        45,
        dimensions.width / dimensions.height,
        0.1,
        100
      );
      camera.position.set(0, 1.5, 4);
      camera.lookAt(0, 0.5, 0);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(dimensions.width, dimensions.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Post-processing
      const { composer, cinematicUniforms } = setupComposer(renderer, scene, camera);
      composerRef.current = { composer, cinematicUniforms };

      // Pet System
      const petSystem = new PetSystem(scene, camera);
      petSystemRef.current = petSystem;

      // Set initial tribe
      const tribeType = TRIBE_MAP[tribe] || 'FOFO';
      petSystem.setType(tribeType);

      // Set initial state based on props
      if (isSleeping) {
        petSystem.sleep();
      } else if (isNeglected) {
        petSystem.setState('idle'); // Sad idle
      }

      setIsLoaded(true);
      onLoad?.();
    } catch (err) {
      console.error('Failed to initialize Pet3D:', err);
      setError('Falha ao carregar pet 3D');
    }

    return () => {
      // Cleanup
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [dimensions.width, dimensions.height, onLoad]);

  // Update tribe when prop changes
  useEffect(() => {
    if (petSystemRef.current && isLoaded) {
      const tribeType = TRIBE_MAP[tribe] || 'FOFO';
      petSystemRef.current.setType(tribeType);
    }
  }, [tribe, isLoaded]);

  // Update state when props change
  useEffect(() => {
    if (petSystemRef.current && isLoaded) {
      if (isSleeping) {
        petSystemRef.current.sleep();
      } else {
        petSystemRef.current.wake();
      }
    }
  }, [isSleeping, isLoaded]);

  // Animation loop
  useEffect(() => {
    if (!isLoaded) return;

    const animate = () => {
      const delta = clockRef.current.getDelta();

      if (petSystemRef.current) {
        petSystemRef.current.update(delta);
      }

      if (composerRef.current) {
        composerRef.current.cinematicUniforms.uTime.value = clockRef.current.elapsedTime;
        composerRef.current.composer.render();
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isLoaded]);

  // Mouse interaction
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive || !petSystemRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      petSystemRef.current.setMouseTarget(x, y);
    },
    [interactive]
  );

  const handleClick = useCallback(() => {
    if (!interactive || !petSystemRef.current) return;
    petSystemRef.current.pet();
  }, [interactive]);

  // Fallback for EGG stage (show 2D)
  if (stage === 'EGG') {
    return (
      <div
        className={`relative flex items-center justify-center`}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <div className="text-[100px] animate-pulse">🥚</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-zinc-100 border-2 border-black"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <p className="font-mono text-xs text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer ${isNeglected ? 'grayscale opacity-75' : ''}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {!isLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-zinc-100"
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          <div className="text-4xl animate-pulse">⌛</div>
        </div>
      )}

      {/* Neglected overlay */}
      {isNeglected && isLoaded && (
        <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-[8px] font-mono z-10">
          VERGONHA
        </div>
      )}

      {/* Sleeping indicator */}
      {isSleeping && isLoaded && (
        <div className="absolute top-2 right-2 text-2xl animate-pulse z-10">💤</div>
      )}
    </div>
  );
}
