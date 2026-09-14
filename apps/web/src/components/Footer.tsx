import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-teal-950 text-teal-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="font-display font-bold text-xl text-white mb-2">Saath</div>
          <p className="text-sm text-teal-200/80">
            A safe marketplace for booking verified companions for social experiences. 18+ only.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/explore" className="hover:text-white">Explore companions</Link></li>
            <li><Link href="/become-a-companion" className="hover:text-white">Become a companion</Link></li>
            <li><Link href="/safety" className="hover:text-white">Safety center</Link></li>
            <li><Link href="/help" className="hover:text-white">Help</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Policies</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/terms" className="hover:text-white">Terms &amp; conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy policy</Link></li>
            <li><Link href="/community-guidelines" className="hover:text-white">Community guidelines</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Emergency</h4>
          <p className="text-sm text-teal-200/80">
            In an emergency, call <strong className="text-white">112</strong>. Saath safety
            support is available 24/7 from the SOS button in any active booking.
          </p>
        </div>
      </div>
      <div className="border-t border-teal-900 py-4 text-center text-xs text-teal-300/60">
        © 2026 Saath · Adults only · Prohibited services policy: no sexual or illegal services of any kind.
      </div>
    </footer>
  );
}
