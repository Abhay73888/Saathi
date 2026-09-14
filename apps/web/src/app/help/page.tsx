'use client';

import Link from 'next/link';
import { Card } from '@/components/ui';

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-teal-900 mb-6">Help &amp; demo logins</h1>
      <Card className="p-6 mb-6">
        <h2 className="font-bold text-lg mb-3">Demo accounts (development)</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-sand-600">
            <tr><th className="py-1">Role</th><th>Email</th><th>Password</th></tr>
          </thead>
          <tbody>
            {[
              ['Admin', 'admin@saath.app'],
              ['Companion', 'companion@saath.app'],
              ['Customer', 'customer@saath.app'],
            ].map(([role, email]) => (
              <tr key={email} className="border-t border-sand-100">
                <td className="py-2 font-bold">{role}</td>
                <td>{email}</td>
                <td>Password123!</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-6 mb-6">
        <h2 className="font-bold text-lg mb-3">Quick start</h2>
        <ol className="text-sm text-sand-600 space-y-2 list-decimal pl-5">
          <li><Link href="/explore" className="text-teal-700 font-bold">Explore</Link> companions — every live profile is verified.</li>
          <li>Open a profile, pick a free slot and <strong>Request a Booking</strong>.</li>
          <li>The companion accepts from the <Link href="/companion/bookings" className="text-teal-700 font-bold">requests page</Link>.</li>
          <li>Pay (mock checkout in dev) → confirmed → check in/out on the booking.</li>
          <li>After completion, leave a 5-category review.</li>
        </ol>
      </Card>
      <Card className="p-6">
        <h2 className="font-bold text-lg mb-3">Need urgent help?</h2>
        <p className="text-sm text-sand-600">
          Call <strong>112</strong> in an emergency, or use the <Link href="/safety" className="text-teal-700 font-bold">Safety center</Link>.
          Policies: <Link href="/community-guidelines" className="text-teal-700 font-bold">Community guidelines</Link> ·
          <Link href="/terms" className="text-teal-700 font-bold"> Terms</Link> ·
          <Link href="/privacy" className="text-teal-700 font-bold"> Privacy</Link>.
        </p>
      </Card>
    </div>
  );
}
