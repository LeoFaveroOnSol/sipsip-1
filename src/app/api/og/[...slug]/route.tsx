import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TRIBES, SHARE_CARDS, PET_FORMS } from '@/lib/constants';

// Unicode symbols for OG images (can't use React components here)
const TRIBE_SYMBOLS: Record<string, string> = {
  FOFO: '♥',
  CAOS: '🔥',
  CHAD: '🛡',
  DEGEN: '⚡',
};

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const [type, id] = slug;

    if (type === 'pet' && id) {
      return generatePetCard(id);
    }

    if (type === 'card' && id) {
      return generateShareCard(id, request);
    }

    if (type === 'tribe' && id) {
      return generateTribeCard(id);
    }

    // Default card
    return generateDefaultCard();
  } catch (error) {
    console.error('OG error:', error);
    return generateDefaultCard();
  }
}

async function generatePetCard(petId: string) {
  // Nota: Em edge runtime não podemos usar Prisma diretamente
  // Esta é uma versão simplificada que usa dados mockados
  // Em produção, você faria uma chamada fetch interna

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          backgroundImage: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a24 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px',
            borderRadius: '24px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🥚</div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '10px',
            }}
          >
            SipSip Pet
          </div>
          <div style={{ fontSize: '18px', color: '#888' }}>
            Tamagotchi de Tribos na Solana
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '24px' }}>🥚</div>
          <div style={{ color: '#ec4899', fontWeight: 'bold', fontSize: '20px' }}>
            SipSip
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

async function generateShareCard(cardType: string, request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const petName = searchParams.get('name') || 'Pet';
  const tribe = searchParams.get('tribe') || 'FOFO';

  const card = SHARE_CARDS.find((c) => c.id === cardType);
  const tribeInfo = TRIBES[tribe as keyof typeof TRIBES];

  const gradients: Record<string, string[]> = {
    'from-green-600 to-emerald-800': ['#16a34a', '#065f46'],
    'from-gray-700 to-gray-900': ['#374151', '#111827'],
    'from-purple-600 to-pink-600': ['#9333ea', '#db2777'],
    'from-yellow-500 to-orange-500': ['#eab308', '#f97316'],
    'from-amber-400 to-yellow-600': ['#fbbf24', '#ca8a04'],
    'from-violet-600 to-purple-800': ['#7c3aed', '#6b21a8'],
    'from-cyan-500 to-blue-600': ['#06b6d4', '#2563eb'],
    'from-red-500 to-orange-600': ['#ef4444', '#ea580c'],
    'from-pink-500 to-rose-600': ['#ec4899', '#e11d48'],
    'from-amber-500 to-red-600': ['#f59e0b', '#dc2626'],
  };

  const bgColors = card?.bgGradient
    ? gradients[card.bgGradient] || ['#ec4899', '#db2777']
    : ['#ec4899', '#db2777'];

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `linear-gradient(135deg, ${bgColors[0]} 0%, ${bgColors[1]} 100%)`,
        }}
      >
        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '60px',
          }}
        >
          <div style={{ fontSize: '80px', marginBottom: '30px' }}>
            {TRIBE_SYMBOLS[tribeInfo?.id || ''] || '🥚'}
          </div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '20px',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {card?.title || 'SipSip'}
          </div>
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '30px',
            }}
          >
            {card?.subtitle || 'Tamagotchi de Tribos'}
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              padding: '15px 30px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '16px',
            }}
          >
            {petName}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '10px 20px',
            borderRadius: '100px',
          }}
        >
          <div style={{ fontSize: '24px' }}>🥚</div>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
            sipsip.game
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

async function generateTribeCard(tribe: string) {
  const tribeInfo = TRIBES[tribe.toUpperCase() as keyof typeof TRIBES];

  if (!tribeInfo) {
    return generateDefaultCard();
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          backgroundImage: `linear-gradient(135deg, ${tribeInfo.color}22 0%, #0a0a0f 100%)`,
        }}
      >
        <div style={{ fontSize: '120px', marginBottom: '30px' }}>
          {TRIBE_SYMBOLS[tribeInfo.id] || '⚡'}
        </div>
        <div
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: tribeInfo.color,
            marginBottom: '15px',
          }}
        >
          Tribo {tribeInfo.name}
        </div>
        <div
          style={{
            fontSize: '24px',
            color: '#888',
            maxWidth: '600px',
            textAlign: 'center',
          }}
        >
          {tribeInfo.description}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '24px' }}>🥚</div>
          <div style={{ color: '#ec4899', fontWeight: 'bold', fontSize: '20px' }}>
            SipSip
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function generateDefaultCard() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          backgroundImage: 'linear-gradient(135deg, #ec489922 0%, #0a0a0f 50%, #7c3aed22 100%)',
        }}
      >
        <div style={{ fontSize: '100px', marginBottom: '30px' }}>🥚</div>
        <div
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #ec4899, #8b5cf6)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '20px',
          }}
        >
          SipSip
        </div>
        <div style={{ fontSize: '28px', color: '#888', marginBottom: '40px' }}>
          Tamagotchi de Tribos na Solana
        </div>
        <div
          style={{
            display: 'flex',
            gap: '20px',
            fontSize: '40px',
          }}
        >
          <span>🧸</span>
          <span>🔥</span>
          <span>🗿</span>
          <span>🤡</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

