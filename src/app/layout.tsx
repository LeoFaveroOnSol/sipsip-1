import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';
import { Footer } from '@/components/layout/Footer';

// Import dinâmico do ClientProviders para evitar SSR
const ClientProviders = dynamic(
  () => import('@/components/providers/ClientProviders'),
  { 
    ssr: false,
    loading: () => (
      <>
        {/* Header placeholder */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b-4 border-black" />
      </>
    )
  }
);

export const metadata: Metadata = {
  title: 'SipSip - Tamagotchi de Tribos',
  description: 'A primeira simulação de sobrevivência tribal na Solana. Sua carteira é seu destino.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        {/* Noise Overlay */}
        <div className="noise-overlay" />
        
        <ClientProviders>
          <main className="flex-1 pt-20 pb-4">{children}</main>
          <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}
