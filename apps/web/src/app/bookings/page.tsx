'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Card, EmptyState, Badge } from '@/components/ui';

interface BookingRow {
  id: string;
  status: string;
  startAt: string;
  meetingType: string;
  experience: { name: string; icon: string };
  companion?: { displayName: string; userId: string };
  customer?: { customerProfile?: { displayName: string } };
}

const TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'chip'> = {
  CONFIRMED: 'success',
  IN_PROGRESS: 'info',
  COMPLETED: 'chip',
  PENDING_PAYMENT: 'warning',
  REQUESTED: 'warning',
  CANCELLED: 'danger',
  REFUNDED: 'danger',
  DISPUTED: 'danger',
};

export default function BookingsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);

  useEffect(() => {
    api<BookingRow[]>('/bookings').then(setBookings).catch(() => setBookings([]));
  }, []);

  const upcoming = ['REQUESTED', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'];
  const filtered = (bookings ?? []).filter((b) =>
    tab === 'upcoming' ? upcoming.includes(b.status) : !upcoming.includes(b.status),
  );

  return (
    <AppShell title="My bookings">
      <div className="flex gap-2 mb-5">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${tab === t ? 'bg-teal-700 text-white' : 'bg-white border border-sand-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {bookings === null ? (
        <Card className="p-6 text-sand-600">Loading…</Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon="📅" title={`No ${tab} bookings`} hint="Your reservation history shows up here." /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Link key={b.id} href={`/booking/${b.id}`}>
              <Card className="p-4 flex items-center gap-4 hover:shadow-pop transition">
                <div className="text-2xl">{b.experience.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{b.experience.name}</div>
                  <div className="text-sm text-sand-600">
                    {b.companion?.displayName ?? b.customer?.customerProfile?.displayName ?? 'Companion'} ·{' '}
                    {new Date(b.startAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <Badge tone={TONE[b.status] ?? 'chip'}>{b.status.replace(/_/g, ' ')}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
