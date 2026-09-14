'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, formatINR } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { Button, Card, EmptyState } from '@/components/ui';

interface BookingRow {
  id: string;
  status: string;
  startAt: string;
  experience: { name: string; icon: string };
  companion: { displayName: string };
  totalPaise: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<BookingRow[] | null>(null);

  useEffect(() => {
    api<BookingRow[]>('/bookings?status=CONFIRMED')
      .then(setUpcoming)
      .catch(() => setUpcoming([]));
  }, []);

  return (
    <AppShell title={`Welcome, ${user?.customerProfile?.displayName ?? 'there'} 👋`}>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Card className="p-5">
          <h3 className="font-bold mb-1">Your next experience</h3>
          <p className="text-sm text-sand-600 mb-4">Discover verified companions for coffee, movies, events and more.</p>
          <Link href="/explore"><Button>Explore companions</Button></Link>
        </Card>
        <Card className="p-5 bg-teal-900 text-white border-teal-900">
          <h3 className="font-bold mb-1">🛟 Safety first</h3>
          <p className="text-sm text-teal-100 mb-4">Set up trusted contacts and check in during every meetup.</p>
          <Link href="/safety"><Button variant="light">Open safety center</Button></Link>
        </Card>
      </div>

      <h2 className="font-bold text-lg mb-3">Upcoming bookings</h2>
      {upcoming === null ? (
        <Card className="p-6 text-sand-600">Loading…</Card>
      ) : upcoming.length === 0 ? (
        <Card>
          <EmptyState
            icon="📅"
            title="No upcoming bookings"
            hint="When you book a companion, your schedule appears here."
            action={<Link href="/explore"><Button variant="secondary">Explore companions</Button></Link>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {upcoming.map((b) => (
            <Card key={b.id} className="p-4 flex items-center gap-4">
              <div className="text-2xl">{b.experience.icon}</div>
              <div className="flex-1">
                <div className="font-bold">{b.experience.name} with {b.companion.displayName}</div>
                <div className="text-sm text-sand-600">{new Date(b.startAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
              <Link href={`/booking/${b.id}`}><Button variant="secondary" size="sm">{formatINR(b.totalPaise)} · View</Button></Link>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
