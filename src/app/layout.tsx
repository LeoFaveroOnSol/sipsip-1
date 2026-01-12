import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';
import { Footer } from '@/components/layout/Footer';

// Dynamic import of ClientProviders to avoid SSR
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
  title: 'SipSip - Tribal Tamagotchi',
  description: 'The first tribal survival simulation on Solana. Your wallet is your destiny.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
