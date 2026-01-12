'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { WalletProvider } from './WalletProvider';
import { AuthProvider } from './AuthProvider';
import { Header } from '../layout/Header';

// Context para verificar se os providers estão prontos
const ProvidersReadyContext = createContext<boolean>(false);

export function useProvidersReady(): boolean {
  return useContext(ProvidersReadyContext);
}

interface ClientProvidersProps {
  children: ReactNode;
}

function ClientProviders({ children }: ClientProvidersProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Garantir que estamos no cliente
    setIsClient(true);
  }, []);

  // Durante SSR ou antes de montar, não renderizar providers
  if (!isClient) {
    return (
      <>
        {/* Placeholder do Header durante SSR */}
        <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b-4 border-black" />
        {children}
      </>
    );
  }

  // No cliente após mount, renderizar com todos os providers
  return (
    <WalletProvider>
      <AuthProvider>
        <ProvidersReadyContext.Provider value={true}>
          <Header />
          {children}
        </ProvidersReadyContext.Provider>
      </AuthProvider>
    </WalletProvider>
  );
}

export default ClientProviders;
