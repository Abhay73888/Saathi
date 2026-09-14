'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import clsx from 'clsx';

export function MobileAppNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // If in admin dashboard, keep it clean
  if (pathname?.startsWith('/admin')) return null;

  const NAV_ITEMS = [
    {
      href: '/',
      label: 'Home',
      icon: (active: boolean) => (
        <svg className={clsx('w-6 h-6 transition-transform', active && 'scale-110')} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      active: pathname === '/',
    },
    {
      href: '/explore',
      label: 'Explore',
      icon: (active: boolean) => (
        <svg className={clsx('w-6 h-6 transition-transform', active && 'scale-110')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.5' : '2'}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      active: pathname === '/explore',
    },
    {
      href: user ? '/bookings' : '/login',
      label: 'Bookings',
      icon: (active: boolean) => (
        <svg className={clsx('w-6 h-6 transition-transform', active && 'scale-110')} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      active: pathname === '/bookings' || pathname?.startsWith('/booking/'),
    },
    {
      href: '/safety',
      label: 'Safety',
      icon: (active: boolean) => (
        <svg className={clsx('w-6 h-6 transition-transform', active && 'scale-110')} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      active: pathname === '/safety',
    },
    {
      href: user ? '/profile' : '/login',
      label: user ? 'Account' : 'Sign in',
      icon: (active: boolean) => (
        <svg className={clsx('w-6 h-6 transition-transform', active && 'scale-110')} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      active: pathname === '/profile' || pathname === '/login' || pathname === '/companion-dashboard',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-sand-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe transition-all duration-200"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const isCurrent = item.active;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                'relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-150 active:scale-90',
                isCurrent ? 'text-teal-700 font-extrabold' : 'text-sand-500 hover:text-teal-800 font-medium'
              )}
            >
              {/* Active top pill indicator */}
              {isCurrent && (
                <span className="absolute top-0 w-8 h-1 bg-teal-600 rounded-full shadow-sm animate-fadeUp" />
              )}
              <div className="flex items-center justify-center h-6">
                {item.icon(isCurrent)}
              </div>
              <span className="text-[11px] tracking-tight mt-0.5 leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
