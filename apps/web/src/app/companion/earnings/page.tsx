'use client';

import { useEffect, useState } from 'react';
import { api, formatINR } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Button, Card, Spinner } from '@/components/ui';

interface WalletData {
  pendingPaise: number;
  availablePaise: number;
  withdrawnPaise: number;
  transactions: { id: string; type: string; state: string; amountPaise: number; createdAt: string }[];
  payouts: { id: string; amountPaise: number; status: string; createdAt: string }[];
}

export default function EarningsPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [amount, setAmount] = useState('');
  const [fund, setFund] = useState('bank_account');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api<WalletData>('/wallet').then(setData).catch(() => setData(null));
  }, []);

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api<{ id: string; status: string }>('/wallet/payouts', {
        method: 'POST',
        body: { amountPaise: Math.round(Number(amount) * 100), fundAccountId: fund },
      });
      setMsg(`Withdrawal ${res.status.replace(/_/g, ' ').toLowerCase()} — you'll be notified on completion.`);
      setAmount('');
      const fresh = await api<WalletData>('/wallet');
      setData(fresh);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Withdrawal failed');
    }
  }

  if (!data) return <AppShell title="Earnings"><Card className="p-6 flex items-center gap-2 text-sand-600"><Spinner /> Loading…</Card></AppShell>;

  return (
    <AppShell title="Earnings">
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-sand-600 font-bold">Available</div>
          <div className="text-2xl font-extrabold text-teal-900 tabular mt-1">{formatINR(data.availablePaise)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-sand-600 font-bold">Pending release</div>
          <div className="text-2xl font-extrabold text-warning tabular mt-1">{formatINR(data.pendingPaise)}</div>
          <p className="text-xs text-sand-600 mt-1">Releases 48h after completion</p>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-sand-600 font-bold">Withdrawn</div>
          <div className="text-2xl font-extrabold text-sand-600 tabular mt-1">{formatINR(data.withdrawnPaise)}</div>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="font-bold text-lg mb-3">Withdraw to bank</h2>
        <form onSubmit={withdraw} className="flex flex-wrap gap-3 items-end">
          <label className="flex-1 min-w-[160px]">
            <span className="block text-[13px] font-bold mb-1.5">Amount (₹)</span>
            <input
              type="number"
              min={100}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-sand-200 px-3 focus:outline-none focus:border-teal-600"
            />
          </label>
          <label>
            <span className="block text-[13px] font-bold mb-1.5">Bank account</span>
            <select value={fund} onChange={(e) => setFund(e.target.value)} className="h-11 rounded-lg border border-sand-200 px-3 bg-white">
              <option value="bank_account">Primary account (KYC-verified via Razorpay)</option>
            </select>
          </label>
          <Button type="submit">Request withdrawal</Button>
        </form>
        {msg && <p className="text-sm mt-3 font-semibold text-teal-700">{msg}</p>}
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-lg mb-3">Transaction history</h2>
        <div className="space-y-2 text-sm">
          {data.transactions.length === 0 && <p className="text-sand-600">No transactions yet.</p>}
          {data.transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between border-b border-sand-100 pb-2">
              <span className="capitalize font-semibold">{t.type.replace(/_/g, ' ').toLowerCase()} <span className="text-xs text-sand-400 font-normal">({t.state.toLowerCase()})</span></span>
              <span className={`tabular font-bold ${Number(t.amountPaise) >= 0 ? 'text-success' : 'text-danger'}`}>
                {Number(t.amountPaise) >= 0 ? '+' : ''}{formatINR(t.amountPaise)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
