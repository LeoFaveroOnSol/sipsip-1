'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import dinâmico do componente que usa hooks de wallet
const WalletButtonInner = dynamic(
  () => import('./WalletButtonInner').then((mod) => mod.WalletButtonInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-12 w-full bg-zinc-200 animate-pulse border-4 border-black" />
    )
  }
);

// Componente exportado que verifica se está montado no cliente
export function SafeWalletButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Se não está montado, mostrar placeholder
  if (!mounted) {
    return (
      <div className="h-12 w-full bg-zinc-200 animate-pulse border-4 border-black" />
    );
  }

  // Renderizar o componente real
  return <WalletButtonInner />;
}
