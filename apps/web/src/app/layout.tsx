import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { SosFab } from '@/components/SosFab';
import { InstallPrompt } from '@/components/InstallPrompt';
import { MobileAppNav } from '@/components/MobileAppNav';

export const viewport: Viewport = {
  themeColor: '#0f766e',
};

export const metadata: Metadata = {
  title: 'Saath — Verified companions for safe, memorable social experiences',
  description:
    'Discover identity-verified companions for coffee, dinner, movies, events and city exploration. Safe payments, moderated chat and 24/7 safety support.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Saath',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
  openGraph: {
    title: 'Saath — Find your perfect companion',
    description: 'Verified companions for safe and memorable social experiences.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-sand-50" suppressHydrationWarning>
        <AuthProvider>
          <NavBar />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <Footer />
          <SosFab />
          <InstallPrompt />
          <MobileAppNav />
        </AuthProvider>
      </body>
    </html>
  );
}
