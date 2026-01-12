'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { PetSystem, setupComposer, PetType, PetState } from '@/lib/pet-system-3d';

interface Pet3DProps {
  tribe: string;
  stage: string;
  isNeglected?: boolean;
  isSleeping?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onPet?: () => void;
  state?: PetState;
}

const sizeMap = {
  sm: { width: 200, height: 200 },
  md: { width: 300, height: 300 },
  lg: { width: 400, height: 400 },
  xl: { width: 500, height: 500 },
};

export function Pet3D({
  tribe,
  stage,
  isNeglected = false,
  isSleeping = false,
  size = 'md',
  onPet,
  state,
}: Pet3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const petSystemRef = useRef<PetSystem | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<ReturnType<typeof setupComposer> | null>(null);
  const animationFrameRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const dimensions = sizeMap[size];

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !petSystemRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    petSystemRef.current.setMouseTarget(x, y);
  }, []);

  const handleClick = useCallback(() => {
    if (petSystemRef.current && onPet) {
      petSystemRef.current.pet();
      onPet();
    }
  }, [onPet]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, dimensions.width / dimensions.height, 0.1, 100);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 0.7, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(dimensions.width, dimensions.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup pet system
    const petSystem = new PetSystem(scene, camera);
    petSystemRef.current = petSystem;

    // Map tribe to pet type
    const petType = tribe.toUpperCase() as PetType;
    if (['FOFO', 'CAOS', 'CHAD', 'DEGEN'].includes(petType)) {
      petSystem.setType(petType);
    }

    // Setup post-processing
    const composerSetup = setupComposer(renderer, scene, camera);
    composerRef.current = composerSetup;

    // Animation loop
    const animate = () => {
      const delta = clockRef.current.getDelta();

      petSystem.update(delta);
      composerSetup.cinematicUniforms['uTime'].value = clockRef.current.elapsedTime;
      composerSetup.composer.render();

      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Event listeners
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      containerRef.current?.removeEventListener('mousemove', handleMouseMove);
      containerRef.current?.removeEventListener('click', handleClick);

      petSystem.dispose();
      renderer.dispose();
      composerSetup.composer.dispose();

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [dimensions, tribe, handleMouseMove, handleClick]);

  // Update pet type when tribe changes
  useEffect(() => {
    if (!petSystemRef.current) return;

    const petType = tribe.toUpperCase() as PetType;
    if (['FOFO', 'CAOS', 'CHAD', 'DEGEN'].includes(petType)) {
      petSystemRef.current.setType(petType);
    }
  }, [tribe]);

  // Handle state changes
  useEffect(() => {
    if (!petSystemRef.current) return;

    if (state) {
      petSystemRef.current.setState(state);
    } else if (isSleeping) {
      petSystemRef.current.sleep();
    } else {
      petSystemRef.current.wake();
    }
  }, [isSleeping, state]);

  // Handle neglected state visual
  useEffect(() => {
    if (!rendererRef.current) return;

    if (isNeglected) {
      rendererRef.current.domElement.style.filter = 'grayscale(50%) brightness(0.8)';
    } else {
      rendererRef.current.domElement.style.filter = 'none';
    }
  }, [isNeglected]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="cursor-pointer rounded-lg overflow-hidden"
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      />

      {/* Stage indicator for EGG */}
      {stage === 'EGG' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 border-4 border-black px-4 py-2 font-black text-sm">
            HATCHING SOON...
          </div>
        </div>
      )}

      {/* Neglected badge */}
      {isNeglected && (
        <div className="absolute -top-2 -right-2 bg-black text-white px-2 py-1 text-[8px] font-mono border-2 border-black z-10">
          NEGLECTED
        </div>
      )}

      {/* Sleeping indicator */}
      {isSleeping && (
        <div className="absolute top-2 right-2 text-2xl animate-pulse z-10">
          ZZZ
        </div>
      )}
    </div>
  );
}
