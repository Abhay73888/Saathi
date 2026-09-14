'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Card, EmptyState } from '@/components/ui';

interface PaymentRow {
  id: string;
  amountPaise: number;
  status: string;
  createdAt: string;
  refunds: { amountPaise: number; status: string }[];
}

export default function WalletPage() {
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);

  useEffect(() => {
    api<PaymentRow[]>('/payments').then(setPayments).catch(() => setPayments([]));
  }, []);

  return (
    <AppShell title="Payments">
      <Card className="p-6">
        <h2 className="font-bold text-lg mb-4">Payment history</h2>
        {payments === null ? (
          <p className="text-sand-600 text-sm">Loading…</p>
        ) : payments.length === 0 ? (
          <EmptyState
            icon="💳"
            title="No payments yet"
            hint="Completed bookings and invoices will appear here."
            action={<Link href="/explore" className="text-teal-700 font-bold text-sm">Explore companions →</Link>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-sand-600">
              <tr><th className="py-2">Date</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-sand-100">
                  <td className="py-3">{new Date(p.createdAt).toLocaleString('en-IN', { dateStyle: 'medium' })}</td>
                  <td className="tabular font-bold">₹{(Number(p.amountPaise) / 100).toLocaleString('en-IN')}</td>
                  <td>{p.status}{p.refunds.length > 0 ? ` · refunded ${p.refunds.length}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <p className="text-xs text-sand-600 mt-3">
        Companions: see earnings, balances and withdrawals on the
        <Link href="/companion/earnings" className="text-teal-700 font-bold"> Earnings page</Link>.
      </p>
    </AppShell>
  );
}
