'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

interface User {
  id: string;
  walletPubkey: string;
}

interface Pet {
  id: string;
  name: string;
  tribe: string;
  stage: string;
  formId: string;
}

interface AuthContextType {
  user: User | null;
  pet: Pet | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const { publicKey, signMessage, disconnect } = wallet;
  const [user, setUser] = useState<User | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sessão existente
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.success && data.data.user) {
        setUser(data.data.user);
        setPet(data.data.pet || null);
      } else {
        setUser(null);
        setPet(null);
      }
    } catch (error) {
      console.error('Check session error:', error);
      setUser(null);
      setPet(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Login com assinatura
  const login = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      console.error('Wallet not connected');
      return false;
    }

    try {
      setIsLoading(true);

      // 1. Obter nonce
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });

      const nonceData = await nonceRes.json();

      if (!nonceData.success) {
        throw new Error(nonceData.error || 'Failed to get nonce');
      }

      const { nonce, message } = nonceData.data;

      // 2. Assinar mensagem
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signature);

      // 3. Fazer login
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          signature: signatureBase58,
          nonce,
        }),
      });

      const loginData = await loginRes.json();

      if (!loginData.success) {
        throw new Error(loginData.error || 'Login failed');
      }

      // 4. Atualizar estado
      await checkSession();

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage, checkSession]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setPet(null);
      await disconnect();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [disconnect]);

  // Atualizar dados do usuário
  const refreshUser = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        pet,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  // Retornar valores default se não houver provider (durante SSR ou antes do mount)
  if (context === undefined) {
    return {
      user: null,
      pet: null,
      isLoading: true,
      isAuthenticated: false,
      login: async () => false,
      logout: async () => {},
      refreshUser: async () => {},
    };
  }
  
  return context;
}
