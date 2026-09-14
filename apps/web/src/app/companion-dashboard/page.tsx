'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, formatINR } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Button, Card, Badge, Spinner } from '@/components/ui';

interface Stats {
  availablePaise: number;
  pendingPaise: number;
  withdrawnPaise: number;
  completedBookings: number;
  upcomingBookings: number;
}
interface ReqRow {
  id: string;
  status: string;
  startAt: string;
  experience: { name: string; icon: string };
  totalPaise: number;
}

export default function CompanionDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api<Stats>('/earnings').then(setStats).catch(() => null);
    api<ReqRow[]>('/bookings?role=companion&status=REQUESTED').then(setRequests).catch(() => {});
  }, []);

  async function respond(bookingId: string, accept: boolean) {
    setBusy(bookingId);
    try {
      await api(`/bookings/${bookingId}/${accept ? 'accept' : 'reject'}`, { method: 'POST' });
      setRequests((r) => r.filter((b) => b.id !== bookingId));
    } finally {
      setBusy('');
    }
  }

  return (
    <AppShell title="Companion dashboard">
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {[
          { label: 'Available balance', value: stats ? formatINR(stats.availablePaise) : '…' },
          { label: 'Pending (post-completion)', value: stats ? formatINR(stats.pendingPaise) : '…' },
          { label: 'Completed bookings', value: stats ? String(stats.completedBookings) : '…' },
        ].map((k) => (
          <Card key={k.label} className="p-5">
            <div className="text-xs uppercase tracking-wide text-sand-600 font-bold">{k.label}</div>
            <div className="text-2xl font-extrabold text-teal-900 tabular mt-1">{k.value}</div>
          </Card>
        ))}
      </div>

      <h2 className="font-bold text-lg mb-3">Booking requests</h2>
      {!requests && <Card className="p-5 text-sand-600"><Spinner /> Loading…</Card>}
      {requests && requests.length === 0 && (
        <Card className="p-5 text-sm text-sand-600">
          No pending requests. Make sure your <Link href="/companion/availability" className="text-teal-700 font-bold">availability</Link> and <Link href="/companion/availability" className="text-teal-700 font-bold">services</Link> are set.
        </Card>
      )}
      <div className="space-y-3">
        {requests.map((b) => (
          <Card key={b.id} className="p-4 flex items-center gap-4 flex-wrap">
            <div className="text-2xl">{b.experience.icon}</div>
            <div className="flex-1">
              <div className="font-bold">{b.experience.name}</div>
              <div className="text-sm text-sand-600">{new Date(b.startAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>
            <Badge tone="warning">{formatINR(b.totalPaise)}</Badge>
            <Button size="sm" disabled={busy === b.id} onClick={() => respond(b.id, true)}>
              {busy === b.id ? <Spinner /> : 'Accept'}
            </Button>
            <Button size="sm" variant="danger" className="bg-white !text-danger border border-red-200" disabled={busy === b.id} onClick={() => respond(b.id, false)}>
              Decline
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex gap-3 flex-wrap">
        <Link href="/companion/availability"><Button variant="secondary">🗓️ Manage availability</Button></Link>
        <Link href="/companion/earnings"><Button variant="secondary">💰 Earnings & withdrawals</Button></Link>
      </div>
    </AppShell>
  );
}
