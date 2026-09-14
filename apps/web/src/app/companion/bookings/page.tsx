'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, formatINR } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Button, Card, Spinner } from '@/components/ui';

interface ReqRow {
  id: string;
  status: string;
  startAt: string;
  totalPaise: number;
  experience: { name: string; icon: string };
  customer?: { customerProfile?: { displayName: string } };
}

export default function CompanionBookingsPage() {
  const [rows, setRows] = useState<ReqRow[] | null>(null);
  const [busy, setBusy] = useState('');

  function load() {
    api<ReqRow[]>('/bookings?role=companion').then(setRows).catch(() => setRows([]));
  }
  useEffect(load, []);

  async function respond(id: string, accept: boolean) {
    setBusy(id);
    await api(`/bookings/${id}/${accept ? 'accept' : 'reject'}`, { method: 'POST' });
    setBusy('');
    load();
  }

  return (
    <AppShell title="My bookings">
      {!rows ? (
        <Card className="p-6 flex items-center gap-2 text-sand-600"><Spinner /> Loading…</Card>
      ) : (
        <div className="space-y-3">
          {rows.length === 0 && <Card className="p-8 text-center text-sm text-sand-600">No bookings yet — set your availability to start receiving requests.</Card>}
          {rows.map((b) => (
            <Card key={b.id} className="p-4 flex items-center gap-4 flex-wrap">
              <div className="text-2xl">{b.experience.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">{b.experience.name} · {b.customer?.customerProfile?.displayName ?? 'Customer'}</div>
                <div className="text-sm text-sand-600">{new Date(b.startAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {b.status.replace(/_/g, ' ').toLowerCase()}</div>
              </div>
              <span className="font-bold tabular text-teal-800">{formatINR(b.totalPaise)}</span>
              {b.status === 'REQUESTED' && (
                <>
                  <Button size="sm" disabled={busy === b.id} onClick={() => respond(b.id, true)}>{busy === b.id ? <Spinner /> : 'Accept'}</Button>
                  <Button size="sm" variant="danger" className="bg-white !text-danger border border-red-200" onClick={() => respond(b.id, false)}>Decline</Button>
                </>
              )}
              <Link href={`/booking/${b.id}`}><Button size="sm" variant="ghost">View</Button></Link>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
