'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { WalletAuthSection } from './WalletAuthSection';
import { 
  Egg, 
  Swords, 
  Trophy, 
  Landmark,
  User,
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { href: '/tribes', label: 'Tribos', icon: Swords },
    { href: '/week', label: 'Guerra', icon: Trophy },
    { href: '/council', label: 'Council', icon: Landmark },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-black flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
            <Egg size={20} className="text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase italic hidden sm:block">
            SipSip
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2
                  font-black text-[10px] uppercase tracking-widest
                  border-2 border-transparent
                  transition-all duration-100
                  ${isActive
                    ? 'bg-black text-white'
                    : 'hover:border-black'
                  }
                `}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth Section */}
        <WalletAuthSection />
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black flex">
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center gap-1 py-3 ${pathname === '/' ? 'bg-black text-white' : ''}`}
        >
          <Egg size={20} />
          <span className="text-[8px] font-black uppercase">Home</span>
        </Link>
        {isAuthenticated && (
          <Link
            href="/app"
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${pathname === '/app' ? 'bg-black text-white' : ''}`}
          >
            <User size={20} />
            <span className="text-[8px] font-black uppercase">Pet</span>
          </Link>
        )}
        <Link
          href="/week"
          className={`flex-1 flex flex-col items-center gap-1 py-3 ${pathname === '/week' ? 'bg-black text-white' : ''}`}
        >
          <Trophy size={20} />
          <span className="text-[8px] font-black uppercase">Guerra</span>
        </Link>
        <Link
          href="/tribes"
          className={`flex-1 flex flex-col items-center gap-1 py-3 ${pathname === '/tribes' ? 'bg-black text-white' : ''}`}
        >
          <Swords size={20} />
          <span className="text-[8px] font-black uppercase">Tribos</span>
        </Link>
        <Link
          href="/council"
          className={`flex-1 flex flex-col items-center gap-1 py-3 ${pathname === '/council' ? 'bg-black text-white' : ''}`}
        >
          <Landmark size={20} />
          <span className="text-[8px] font-black uppercase">Council</span>
        </Link>
      </nav>
    </header>
  );
}
