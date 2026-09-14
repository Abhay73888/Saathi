'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Card, Button } from '@/components/ui';

interface Notif {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

const LABELS: Record<string, string> = {
  BOOKING_REQUESTED: 'New booking request',
  BOOKING_ACCEPTED: 'Booking accepted',
  BOOKING_REJECTED: 'Booking declined',
  PAYMENT_SUCCESS: 'Payment successful',
  PAYMENT_FAILED: 'Payment failed',
  NEW_MESSAGE: 'New message',
  REVIEW_RECEIVED: 'New review',
  VERIFICATION_UPDATE: 'Verification update',
  REFUND_PROCESSED: 'Refund processed',
  SAFETY_ALERT: 'Safety alert',
  PAYOUT_UPDATE: 'Payout update',
  BOOKING_REMINDER: 'Booking reminder',
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[] | null>(null);

  useEffect(() => {
    api<Notif[]>('/notifications').then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <AppShell title="Notifications">
      <div className="flex justify-end mb-3">
        <Button variant="ghost" size="sm" onClick={() => {
          api('/notifications/read-all', { method: 'POST' }).then(() =>
            setItems((p) => p?.map((n) => ({ ...n, readAt: new Date().toISOString() })) ?? p),
          );
        }}>Mark all read</Button>
      </div>
      {items === null ? (
        <Card className="p-6 text-sand-600">Loading…</Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-sand-600">No notifications yet.</Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.id} className={`p-4 flex items-center gap-3 ${!n.readAt ? 'border-teal-300 bg-teal-50/40' : ''}`}>
              <span className="font-bold text-sm">{LABELS[n.type] ?? n.type}</span>
              <span className="text-xs text-sand-600 ml-auto">{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
