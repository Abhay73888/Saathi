'use client';

import { useEffect, useState } from 'react';
import { api, formatINR } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, Spinner, Badge, Button } from '@/components/ui';

interface PayoutRow {
  id: string;
  amountPaise: number;
  status: string;
  riskHoldReason: string | null;
  user: { companionProfile?: { displayName: string }; customerProfile?: { displayName: string } };
}

export default function AdminPayoutsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PayoutRow[] | null>(null);

  function load() {
    api<PayoutRow[]>('/admin/payouts').then(setRows).catch(() => setRows([]));
  }
  useEffect(() => { if (user?.role === 'ADMIN') load(); }, [user]);

  if (user?.role !== 'ADMIN') return <p className="p-8">Admins only.</p>;

  async function decide(id: string, approve: boolean) {
    await api(`/admin/payouts/${id}/${approve ? 'approve' : 'reject'}`, {
      method: 'POST',
      body: approve ? {} : { reason: 'Manual review: insufficient confidence' },
    });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="font-display text-3xl text-teal-900 mb-6">Payout approvals</h1>
      <Card className="p-5">
        {!rows ? <Spinner /> : rows.length === 0 ? (
          <p className="text-sm text-sand-600">No payouts awaiting review.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-sand-600">
                <th className="py-2">Companion</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-sand-100">
                  <td className="py-3 font-semibold">
                    {p.user.companionProfile?.displayName ?? p.user.customerProfile?.displayName ?? 'Companion'}
                    {p.riskHoldReason && <div className="text-xs text-danger font-normal">{p.riskHoldReason}</div>}
                  </td>
                  <td className="tabular font-bold">{formatINR(p.amountPaise)}</td>
                  <td><Badge tone={p.status === 'ON_HOLD' ? 'danger' : 'warning'}>{p.status.replace(/_/g, ' ')}</Badge></td>
                  <td>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => decide(p.id, true)}>Approve & pay</Button>
                      <Button size="sm" variant="danger" className="bg-white !text-danger border border-red-200" onClick={() => decide(p.id, false)}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
