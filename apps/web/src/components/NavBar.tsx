'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button, ShieldIcon } from './ui';

export function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname?.startsWith('/admin')) return null; // admin has its own shell

  const CITIES = ['Bengaluru', 'Delhi NCR', 'Mumbai', 'Hyderabad', 'Pune'];
  const [city, setCity] = useState('Bengaluru');
  const [cityMenuOpen, setCityMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-sand-50/90 backdrop-blur-md border-b border-sand-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4 sm:gap-6">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl text-teal-800 flex-none">
          <ShieldIcon className="w-6 h-6 text-teal-700" />
          Saath
        </Link>

        {/* Quick City Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setCityMenuOpen(!cityMenuOpen)}
            className="flex items-center gap-1.5 bg-teal-50/80 hover:bg-teal-100 border border-teal-200/80 rounded-full px-3 py-1 text-xs font-bold text-teal-800 transition shadow-sm"
            aria-label="Change city"
          >
            <span>📍 {city}</span>
            <span className="text-[10px] text-teal-600">▼</span>
          </button>

          {cityMenuOpen && (
            <div className="absolute left-0 mt-2 w-44 bg-white rounded-2xl shadow-pop border border-sand-200 p-1.5 z-50 animate-pop">
              <span className="block px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sand-400">Select City</span>
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCity(c);
                    setCityMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${
                    city === c ? 'bg-teal-700 text-white' : 'text-sand-700 hover:bg-sand-100'
                  }`}
                >
                  📍 {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-6 text-[15px] font-semibold text-sand-700">
          <Link href="/explore" className="hover:text-teal-700 transition-colors">Explore</Link>
          <Link href="/safety" className="hover:text-teal-700 transition-colors">Safety</Link>
          <Link href="/become-a-companion" className="hover:text-teal-700 transition-colors">Become a companion</Link>
          <Link href="/help" className="hover:text-teal-700 transition-colors">Help</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Quick Search Shortcut */}
          <Link
            href="/explore"
            aria-label="Search companions"
            className="hidden sm:flex items-center gap-2 bg-sand-100/90 hover:bg-sand-200/80 rounded-full px-3 py-1.5 text-xs text-sand-600 font-semibold border border-sand-200 transition"
          >
            <span>🔍</span>
            <span>Search vibe or activity</span>
          </Link>
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link href="/admin"><Button variant="ghost" size="sm">Admin</Button></Link>
              )}
              {user.companionProfile && (
                <Link href="/companion-dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
              )}
              <Link href="/bookings"><Button variant="ghost" size="sm">My bookings</Button></Link>
              <Link href="/messages"><Button variant="ghost" size="sm">Messages</Button></Link>
              <Link href="/profile"><Button variant="secondary" size="sm">
                {user.customerProfile?.displayName ?? user.email.split('@')[0]}
              </Button></Link>
              <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
            </>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/register"><Button size="sm">Get started</Button></Link>
            </>
          )}
        </div>
        <button
          className="ml-auto md:hidden p-2 text-teal-800"
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-sand-200 px-4 py-3 flex flex-col gap-2 bg-white animate-fadeUp">
          <Link href="/explore" onClick={() => setOpen(false)} className="py-2 font-semibold">Explore</Link>
          <Link href="/safety" onClick={() => setOpen(false)} className="py-2 font-semibold">Safety center</Link>
          <Link href="/become-a-companion" onClick={() => setOpen(false)} className="py-2 font-semibold">Become a companion</Link>
          {user ? (
            <>
              <Link href="/bookings" onClick={() => setOpen(false)} className="py-2 font-semibold">My bookings</Link>
              <Link href="/messages" onClick={() => setOpen(false)} className="py-2 font-semibold">Messages</Link>
              <Link href="/profile" onClick={() => setOpen(false)} className="py-2 font-semibold">Profile</Link>
              <Button variant="ghost" onClick={() => { setOpen(false); logout(); }}>Sign out</Button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1"><Button variant="secondary" className="w-full">Sign in</Button></Link>
              <Link href="/register" className="flex-1"><Button className="w-full">Get started</Button></Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
