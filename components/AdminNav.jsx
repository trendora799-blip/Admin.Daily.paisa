'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();

  // ✅ ALL icons are now correctly filled in
  const links = [
    { href: '/dashboard', label: 'Overview', icon: '📊' },
    { href: '/users', label: 'Users', icon: '👥' },
    { href: '/transactions', label: 'Deposits', icon: '💰' },
    { href: '/withdrawals', label: 'Withdrawals', icon: '💸' },
    { href: '/qr-codes', label: 'QR Codes', icon: '🔳' },
    { href: '/referrals', label: 'Referrals', icon: '🤝' },
    { href: '/support', label: 'Support', icon: '🎧' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 px-2 py-2 z-50 bg-slate-900/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex justify-start items-center overflow-x-auto gap-1">
        {links.map((l) => (
          <Link 
            key={l.href} 
            href={l.href}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[65px] ${
              pathname === l.href 
                ? 'text-brand-400 scale-105 bg-white/5' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-xl mb-0.5">{l.icon}</span>
            <span className="text-[9px] font-medium whitespace-nowrap">{l.label}</span>
          </Link>
        ))}

        {/* Logout Button */}
        <Link 
          href="/" 
          onClick={() => { localStorage.removeItem('dailypaisa_admin'); }}
          className="flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[65px] text-red-400 hover:text-red-300"
        >
          <span className="text-xl mb-0.5">🚪</span>
          <span className="text-[9px] font-medium whitespace-nowrap">Logout</span>
        </Link>
      </div>
    </nav>
  );
            }
