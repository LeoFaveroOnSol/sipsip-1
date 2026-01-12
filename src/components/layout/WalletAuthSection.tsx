'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useProvidersReady } from '@/components/providers/ClientProviders';
import { useWallet } from '@solana/wallet-adapter-react';
import { User, LogOut } from 'lucide-react';

export function WalletAuthSection() {
  const providersReady = useProvidersReady();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Não renderizar até estar montado no cliente e providers prontos
  if (!mounted || !providersReady) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-10 w-32 bg-zinc-200 animate-pulse border-2 border-black" />
      </div>
    );
  }

  // Renderizar conteúdo real
  return <WalletAuthInner />;
}

// Componente interno que só renderiza quando providers estão prontos
function WalletAuthInner() {
  const { isAuthenticated, login, logout, isLoading, user } = useAuth();
  const { connected, publicKey, disconnect, connecting, wallets, select } = useWallet();
  const [copied, setCopied] = useState(false);
  const [showWallets, setShowWallets] = useState(false);

  const handleCopy = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  }, [publicKey]);

  const handleSelectWallet = useCallback((walletName: string) => {
    const selectedWallet = wallets.find(w => w.adapter.name === walletName);
    if (selectedWallet) {
      select(selectedWallet.adapter.name);
      setShowWallets(false);
    }
  }, [wallets, select]);

  const handleDisconnect = useCallback(async () => {
    await logout();
    await disconnect();
  }, [logout, disconnect]);

  const buttonClass = `
    bg-black text-white px-4 py-2 font-black text-[10px] uppercase tracking-widest 
    border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] 
    hover:shadow-none hover:translate-x-1 hover:translate-y-1 
    transition-all disabled:opacity-50
  `;

  // Conectando
  if (connecting) {
    return (
      <div className="flex items-center gap-3">
        <button disabled className={buttonClass}>
          CONECTANDO...
        </button>
      </div>
    );
  }

  // Autenticado - mostrar link para pet e botão de logout
  if (isAuthenticated && connected) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          className="bg-black text-white px-4 py-2 font-black text-[10px] uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2"
        >
          <User size={14} />
          MEU PET
        </Link>
        <button
          onClick={handleDisconnect}
          className="p-2 border-2 border-black hover:bg-zinc-100 transition-colors"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  // Wallet conectada mas não autenticado - mostrar botão de login
  if (connected && publicKey && !isAuthenticated) {
    const address = publicKey.toBase58();
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="px-3 py-2 border-2 border-black font-mono text-[10px]"
        >
          {copied ? 'COPIADO!' : `${address.slice(0, 4)}...${address.slice(-4)}`}
        </button>
        <button
          onClick={login}
          disabled={isLoading}
          className={buttonClass}
        >
          {isLoading ? '...' : 'ENTRAR'}
        </button>
        <button
          onClick={handleDisconnect}
          className="p-2 border-2 border-black hover:bg-zinc-100 transition-colors"
          title="Desconectar"
        >
          ✕
        </button>
      </div>
    );
  }

  // Não conectado - mostrar botão de conectar wallet
  const availableWallets = wallets.filter(w => w.readyState === 'Installed' || w.readyState === 'Loadable');

  return (
    <div className="relative flex items-center gap-3">
      <button 
        onClick={() => setShowWallets(!showWallets)} 
        className={buttonClass}
      >
        CONECTAR WALLET
      </button>

      {showWallets && (
        <>
          {/* Backdrop para fechar ao clicar fora */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowWallets(false)}
          />
          
          {/* Lista de wallets */}
          <div className="absolute top-full right-0 mt-2 z-50 bg-white border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] min-w-[200px]">
            {availableWallets.length > 0 ? (
              availableWallets.map((w) => (
                <button
                  key={w.adapter.name}
                  onClick={() => handleSelectWallet(w.adapter.name)}
                  className="w-full px-4 py-3 text-left font-mono text-xs uppercase hover:bg-zinc-100 border-b border-black last:border-b-0 flex items-center gap-3"
                >
                  {w.adapter.icon && (
                    <img 
                      src={w.adapter.icon} 
                      alt={w.adapter.name} 
                      className="w-5 h-5"
                    />
                  )}
                  {w.adapter.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-3">
                <p className="font-mono text-xs mb-2">Nenhuma wallet encontrada.</p>
                <a 
                  href="https://phantom.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold underline"
                >
                  Instalar Phantom →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
