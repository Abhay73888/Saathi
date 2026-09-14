'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, formatINR } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, Spinner, ShieldIcon } from '@/components/ui';

interface Dash {
  totalUsers: number;
  activeUsers: number;
  verifiedCompanions: number;
  pendingVerifications: number;
  totalBookings: number;
  completedBookings: number;
  reportsOpen: number;
  disputesOpen: number;
  highRiskAccounts: number;
  revenuePaise: number;
  refundsPaise: number;
  commissionPaise: number;
  conversionRate: number;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    api<Dash>('/admin/dashboard').then(setData).catch(() => setData(null));
  }, []);

  if (loading) return <div className="min-h-[60vh] grid place-items-center"><Spinner /></div>;
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6 text-center">
        <Card className="p-8">
          <ShieldIcon className="w-10 h-10 text-danger mx-auto mb-3" />
          <h1 className="font-bold text-xl mb-1">Admins only</h1>
          <p className="text-sm text-sand-600 mb-4">You need administrator access for this area.</p>
          <Link href="/" className="text-teal-700 font-bold text-sm">Back to home</Link>
        </Card>
      </div>
    );
  }

  const kpis = data
    ? [
        { label: 'Total users', value: String(data.totalUsers) },
        { label: 'Active (30d)', value: String(data.activeUsers) },
        { label: 'Verified companions', value: String(data.verifiedCompanions) },
        { label: 'Pending verification', value: String(data.pendingVerifications), alert: data.pendingVerifications > 0 },
        { label: 'Bookings', value: String(data.totalBookings) },
        { label: 'Completed', value: String(data.completedBookings) },
        { label: 'Revenue', value: formatINR(data.revenuePaise) },
        { label: 'Commission', value: formatINR(data.commissionPaise) },
        { label: 'Refunds', value: formatINR(data.refundsPaise) },
        { label: 'Open reports', value: String(data.reportsOpen), alert: data.reportsOpen > 0 },
        { label: 'Open disputes', value: String(data.disputesOpen), alert: data.disputesOpen > 0 },
        { label: 'High-risk accounts', value: String(data.highRiskAccounts), alert: data.highRiskAccounts > 0 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-sand-100 flex">
      {/* Dark sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-teal-950 text-teal-100 p-5 gap-1 sticky top-0 h-screen">
        <div className="font-display font-bold text-xl text-white mb-6 flex items-center gap-2">
          <ShieldIcon className="w-6 h-6" /> Saath Admin
        </div>
        {[
          { href: '/admin', label: 'Dashboard', icon: '📊' },
          { href: '/admin/users', label: 'Users', icon: '👥' },
          { href: '/admin/queue', label: 'Moderation queue', icon: '🚨' },
          { href: '/admin/payouts', label: 'Payouts', icon: '💰' },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-teal-900">
            {l.icon} {l.label}
          </Link>
        ))}
        <Link href="/" className="mt-auto text-sm text-teal-300">← Back to app</Link>
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-6xl">
        <h1 className="font-display text-3xl text-teal-900 mb-6">Operations dashboard</h1>

        {!data ? (
          <Card className="p-6 flex items-center gap-2 text-sand-600"><Spinner /> Loading KPIs…</Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {kpis.map((k) => (
                <Card key={k.label} className="p-4">
                  <div className="text-[11px] uppercase tracking-wide text-sand-600 font-bold">{k.label}</div>
                  <div className={`text-2xl font-extrabold tabular mt-1 ${k.alert ? 'text-danger' : 'text-teal-900'}`}>{k.value}</div>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5">
                <h2 className="font-bold mb-3">Moderation</h2>
                <ul className="text-sm space-y-2 text-sand-600">
                  <li>• Reports are risk-classified automatically — HIGH pages the queue first.</li>
                  <li>• Flagged chat messages (off-platform payment, threats) await human review.</li>
                  <li>• AI never auto-punishes: every action is audited and reversible where possible.</li>
                </ul>
                <Link href="/admin/queue"><span className="inline-block mt-4 h-10 px-4 rounded-lg bg-teal-700 text-white text-sm font-bold leading-10">Open moderation queue</span></Link>
              </Card>
              <Card className="p-5">
                <h2 className="font-bold mb-3">Payments</h2>
                <ul className="text-sm space-y-2 text-sand-600">
                  <li>• Payments confirmed only via HMAC-verified webhooks.</li>
                  <li>• Earnings release to companions 48h after completed bookings.</li>
                  <li>• HIGH-risk payouts are held for manual approval.</li>
                </ul>
                <Link href="/admin/payouts"><span className="inline-block mt-4 h-10 px-4 rounded-lg bg-teal-700 text-white text-sm font-bold leading-10">Review payouts</span></Link>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
