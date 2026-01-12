'use client';

export function Footer() {
  return (
    <footer className="bg-black text-white py-6 border-t-4 border-black mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="font-black text-2xl tracking-tighter uppercase italic">
              SipSip
            </span>
            <span className="text-xl">🥚</span>
          </div>

          {/* Tribes */}
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider opacity-50">
            <span>🧸 FOFO</span>
            <span>💀 CAOS</span>
            <span>🛡️ CHAD</span>
            <span>👻 CRINGE</span>
          </div>

          {/* Credits */}
          <p className="font-mono text-[10px] opacity-30">
            Powered by Solana
          </p>
        </div>
      </div>
    </footer>
  );
}
