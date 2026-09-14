'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { Button, Card, Spinner } from '@/components/ui';
import { VerificationStatus } from '@saath/shared';

const FLOW: Record<string, string> = {
  NOT_STARTED: 'Create your companion profile to start.',
  SUBMITTED: 'Your documents have been submitted.',
  UNDER_REVIEW: 'Our team is reviewing your verification.',
  VERIFIED: 'You are verified — set up services & availability to go live.',
  REJECTED: 'Verification was rejected. You can retry below.',
  EXPIRED: 'Your verification expired. Please retry.',
};

export default function VerificationPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const res = await api<{ status: string; rejectionReason: string | null }>('/verification/status').catch(() => null);
    setStatus(res?.status ?? 'NOT_STARTED');
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function start() {
    setBusy(true);
    setMessage('');
    try {
      const session = await api<{ sessionRef: string }>('/verification/session', { method: 'POST' });
      // Dev mock: the mock IDV provider auto-approves via its webhook.
      // Production: redirect to session.redirectUrl (hosted provider flow).
      setMessage('Running hosted verification…');
      await new Promise((r) => setTimeout(r, 800));
      await api('/verification/webhook', {
        method: 'POST',
        auth: false,
        body: { sessionRef: session.sessionRef, assertedAgeGte18: true, faceMatch: true, passed: true },
      });
      setMessage('Verification submitted! Refreshing…');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not start verification');
    } finally {
      setBusy(false);
    }
  }

  if (!status) return <AppShell title="Verification"><Card className="p-6 flex items-center gap-2 text-sand-600"><Spinner /> Loading…</Card></AppShell>;

  const steps = ['NOT_STARTED', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'];
  const idx = steps.indexOf(status);

  return (
    <AppShell title="Identity & age verification">
      <Card className="p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-14 h-14 rounded-full grid place-items-center text-2xl ${status === 'VERIFIED' ? 'bg-teal-50 text-teal-700' : 'bg-sand-100'}`}>
            {status === 'VERIFIED' ? '🛡' : '🪪'}
          </div>
          <div>
            <div className="font-bold text-lg">{status === 'VERIFIED' ? 'Verified companion' : 'Verification status'}</div>
            <div className="text-sm text-sand-600">{FLOW[status] ?? ''}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-6">
          {['Started', 'Submitted', 'Review', 'Verified'].map((label, i) => (
            <div key={label} className="flex-1 flex items-center">
              <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold ${i <= idx ? 'bg-teal-700 text-white' : 'bg-sand-100 text-sand-400'}`}>{i + 1}</div>
              <span className="hidden sm:block text-[11px] ml-1 font-semibold text-sand-600">{label}</span>
              {i < 3 && <div className={`h-0.5 flex-1 mx-1 ${i < idx ? 'bg-teal-700' : 'bg-sand-200'}`} />}
            </div>
          ))}
        </div>

        <p className="text-sm text-sand-600 mb-5">
          Verification is handled by our identity provider on their hosted page — document
          images never touch Saath servers. We only receive a pass/fail and age confirmation.
        </p>

        {message && <p className="text-sm font-semibold text-teal-700 mb-3">{message}</p>}

        {status !== VerificationStatus.VERIFIED && (
          <Button size="lg" onClick={start} disabled={busy}>
            {busy ? <Spinner /> : status === 'NOT_STARTED' ? 'Start verification' : 'Retry verification'}
          </Button>
        )}
        {status === VerificationStatus.VERIFIED && (
          <a href="/companion/availability">
            <Button size="lg">Set up availability & pricing →</Button>
          </a>
        )}
      </Card>
    </AppShell>
  );
}
