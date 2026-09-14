'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';
import { Spinner } from './ui';

const CUSTOMER_TABS = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/explore', label: 'Explore', icon: '🔎' },
  { href: '/bookings', label: 'Bookings', icon: '📅' },
  { href: '/messages', label: 'Messages', icon: '💬' },
  { href: '/safety', label: 'Safety', icon: '🛟' },
];

const COMPANION_LINKS = [
  { href: '/companion-dashboard', label: 'Overview', icon: '📊' },
  { href: '/companion/bookings', label: 'Booking requests', icon: '📅' },
  { href: '/companion/availability', label: 'Availability', icon: '🗓️' },
  { href: '/companion/earnings', label: 'Earnings', icon: '💰' },
  { href: '/verification', label: 'Verification', icon: '🛡️' },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sand-600">
        <Spinner className="text-teal-700" />
      </div>
    );
  }

  const links = [
    ...CUSTOMER_TABS,
    ...(user?.companionProfile ? COMPANION_LINKS : []),
    { href: '/wallet', label: user?.companionProfile ? 'Wallet' : 'Payments', icon: '💳' },
    { href: '/favorites', label: 'Favorites', icon: '♡' },
    { href: '/notifications', label: 'Alerts', icon: '🔔' },
    { href: '/profile', label: 'Profile', icon: '👤' },
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-[220px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:block">
        {title && <h1 className="font-display text-2xl text-teal-900 mb-5">{title}</h1>}
        <nav className="space-y-1 sticky top-20">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                pathname === l.href ? 'bg-teal-700 text-white' : 'text-sand-600 hover:bg-sand-100',
              )}
            >
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile title + content */}
      <div className="pb-20 md:pb-0">
        {title && <h1 className="md:hidden font-display text-2xl text-teal-900 mb-5">{title}</h1>}
        {children}
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-sand-200 flex justify-around py-2">
        {CUSTOMER_TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              'flex flex-col items-center text-[11px] font-semibold px-2 py-1',
              pathname === t.href ? 'text-teal-700' : 'text-sand-400',
            )}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
