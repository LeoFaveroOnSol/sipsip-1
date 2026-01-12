'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Carregamento dinâmico do Pet3D para evitar SSR issues com Three.js
const Pet3D = dynamic(
  () => import('./Pet3D').then((mod) => mod.Pet3D),
  {
    ssr: false,
    loading: () => <Pet2DFallback tribe="FOFO" stage="EGG" size="md" />,
  }
);

interface PetSpriteProps {
  tribe: string;
  stage: string;
  isNeglected?: boolean;
  isSleeping?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  use3D?: boolean;
}

// Componente 2D como fallback
function Pet2DFallback({
  tribe,
  stage,
  isNeglected = false,
  isSleeping = false,
  size = 'md',
  animate = true,
}: Omit<PetSpriteProps, 'use3D'>) {
  const sizes = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
  };

  const viewBoxSize = 100;

  // Cores baseadas na tribo
  const tribeColors: Record<string, string> = {
    FOFO: '#f472b6',
    CAOS: '#dc2626',
    CHAD: '#757575',
    DEGEN: '#00ff88',
  };

  const bodyColor = tribeColors[tribe] || '#a3a3a3';

  // Forma do corpo baseada na tribo
  const renderBody = () => {
    if (stage === 'EGG') {
      return (
        <ellipse
          cx="50"
          cy="50"
          rx="25"
          ry="30"
          fill="#fafafa"
          stroke="black"
          strokeWidth="3"
        />
      );
    }

    switch (tribe) {
      case 'FOFO':
        // Forma arredondada/coração
        return (
          <path
            d="M50 20 C20 20 20 80 50 80 C80 80 80 20 50 20"
            fill={bodyColor}
            stroke="black"
            strokeWidth="3"
          />
        );
      case 'CAOS':
        // Forma icosaedro/cristal
        return (
          <polygon
            points="50,15 75,35 75,65 50,85 25,65 25,35"
            fill={bodyColor}
            stroke="black"
            strokeWidth="3"
            className={animate && !isSleeping ? 'animate-pulse' : ''}
          />
        );
      case 'CHAD':
        // Forma retangular/robusta
        return (
          <rect
            x="25"
            y="20"
            width="50"
            height="60"
            fill={bodyColor}
            stroke="black"
            strokeWidth="3"
          />
        );
      case 'DEGEN':
        // Forma de pílula/cápsula
        return (
          <>
            <rect
              x="25"
              y="20"
              width="50"
              height="60"
              rx="25"
              ry="25"
              fill={bodyColor}
              stroke="black"
              strokeWidth="3"
            />
            {/* Linha divisória da pílula */}
            <line
              x1="25"
              y1="50"
              x2="75"
              y2="50"
              stroke="#003311"
              strokeWidth="2"
              opacity="0.5"
            />
          </>
        );
      default:
        return (
          <circle cx="50" cy="50" r="30" fill={bodyColor} stroke="black" strokeWidth="3" />
        );
    }
  };

  // Olhos
  const renderEyes = () => {
    if (stage === 'EGG') {
      return null; // Ovo não tem olhos
    }

    if (isSleeping) {
      return (
        <>
          <path d="M35 45 L45 45" stroke="black" strokeWidth="3" strokeLinecap="round" />
          <path d="M55 45 L65 45" stroke="black" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    }

    // Olhos especiais para DEGEN (olheiras/bloodshot)
    if (tribe === 'DEGEN') {
      return (
        <>
          <circle cx="40" cy="45" r="5" fill="white" stroke="black" strokeWidth="2" />
          <circle cx="60" cy="45" r="5" fill="white" stroke="black" strokeWidth="2" />
          <circle cx="40" cy="45" r="2" fill={bodyColor} />
          <circle cx="60" cy="45" r="2" fill={bodyColor} />
          {/* Olheiras */}
          <path
            d="M35 50 Q40 53 45 50"
            fill="none"
            stroke="#aa0000"
            strokeWidth="1"
            opacity="0.3"
          />
          <path
            d="M55 50 Q60 53 65 50"
            fill="none"
            stroke="#aa0000"
            strokeWidth="1"
            opacity="0.3"
          />
        </>
      );
    }

    return (
      <>
        <circle cx="40" cy="45" r="4" fill="black" />
        <circle cx="60" cy="45" r="4" fill="black" />
        {isNeglected && (
          <path d="M40 55 Q50 48 60 55" fill="none" stroke="black" strokeWidth="2" />
        )}
        {!isNeglected && tribe === 'FOFO' && (
          <path d="M40 55 Q50 62 60 55" fill="none" stroke="black" strokeWidth="2" />
        )}
      </>
    );
  };

  // Decorações baseadas no estágio
  const renderDecorations = () => {
    if (stage === 'LEGENDARY') {
      return (
        <path
          d="M50 5 L55 15 L65 15 L57 22 L60 32 L50 26 L40 32 L43 22 L35 15 L45 15 Z"
          fill="#fbbf24"
          stroke="black"
          strokeWidth="2"
        />
      );
    }

    // Candlesticks para DEGEN
    if (tribe === 'DEGEN' && stage !== 'EGG') {
      return (
        <>
          <rect x="80" y="30" width="8" height="20" fill="#00ff88" stroke="black" strokeWidth="1" />
          <rect x="85" y="25" width="2" height="30" fill="#888" />
          <rect x="10" y="45" width="8" height="15" fill="#ff0044" stroke="black" strokeWidth="1" />
          <rect x="13" y="40" width="2" height="25" fill="#888" />
        </>
      );
    }

    return null;
  };

  return (
    <div className={`relative ${sizes[size]} ${animate && !isSleeping ? 'animate-float' : ''}`}>
      {/* Sombra */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/10 rounded-full blur-sm"
        style={{ transform: 'translateX(-50%) scaleY(0.3)' }}
      />

      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className={`
          w-full h-full 
          drop-shadow-[8px_8px_0px_rgba(0,0,0,0.2)]
          ${isSleeping ? 'opacity-50 grayscale scale-90' : ''}
          ${isNeglected ? 'grayscale' : ''}
          transition-all duration-500
        `}
      >
        {/* Sombra no chão */}
        <ellipse cx="50" cy="92" rx="25" ry="6" fill="rgba(0,0,0,0.1)" />

        {/* Corpo */}
        {renderBody()}

        {/* Olhos */}
        {renderEyes()}

        {/* Decorações de estágio */}
        {renderDecorations()}
      </svg>

      {/* Badge de estado */}
      {isNeglected && (
        <div className="absolute -top-2 -right-2 bg-black text-white px-2 py-1 text-[8px] font-mono border-2 border-black">
          VERGONHA
        </div>
      )}

      {isSleeping && (
        <div className="absolute top-0 right-0 text-2xl animate-pulse">💤</div>
      )}
    </div>
  );
}

export function PetSprite({
  tribe,
  stage,
  isNeglected = false,
  isSleeping = false,
  size = 'md',
  animate = true,
  use3D = false, // Agora 3D é opt-in por padrão
}: PetSpriteProps) {
  const [has3DError, setHas3DError] = useState(false);

  // Usar 3D se solicitado e não for ovo
  const shouldUse3D = use3D && stage !== 'EGG' && !has3DError;

  if (shouldUse3D) {
    return (
      <Pet3D
        tribe={tribe}
        stage={stage}
        isNeglected={isNeglected}
        isSleeping={isSleeping}
        size={size}
        onLoad={() => {}}
      />
    );
  }

  return (
    <Pet2DFallback
      tribe={tribe}
      stage={stage}
      isNeglected={isNeglected}
      isSleeping={isSleeping}
      size={size}
      animate={animate}
    />
  );
}
