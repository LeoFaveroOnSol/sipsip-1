'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useProvidersReady } from '@/components/providers/ClientProviders';

// Import dinâmico do componente que usa hooks de wallet
const WalletButtonInner = dynamic(
  () => import('./WalletButtonInner').then((mod) => mod.WalletButtonInner),
  { 
    ssr: false,
    loading: () => (
      <div className="h-10 w-40 bg-zinc-200 animate-pulse border-4 border-black" />
    )
  }
);

// Componente exportado que verifica se os providers estão prontos
export function SafeWalletButton() {
  const providersReady = useProvidersReady();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Se não está montado ou providers não estão prontos, mostrar placeholder
  if (!mounted || !providersReady) {
    return (
      <div className="h-10 w-40 bg-zinc-200 animate-pulse border-4 border-black" />
    );
  }

  // Renderizar o componente real
  return <WalletButtonInner />;
}
