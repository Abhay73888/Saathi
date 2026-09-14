'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button, Input, Spinner, ShieldIcon } from '@/components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ displayName: '', email: '', phone: '', dateOfBirth: '', password: '' });
  const [ack, setAck] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!ack) {
      setError('You must confirm you are 18 or older.');
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, ageAcknowledged: true });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] grid md:grid-cols-2">
      <div className="hidden md:flex bg-gradient-to-br from-teal-800 to-teal-600 text-white p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <ShieldIcon className="w-7 h-7" /> Saath
        </Link>
        <div>
          <h2 className="font-display text-3xl mb-3">Find your people, safely.</h2>
          <ul className="text-white/85 space-y-2">
            <li>✓ Every member is 18+ with phone-verified accounts</li>
            <li>✓ Companions pass ID &amp; age verification</li>
            <li>✓ Payments, chat and safety tools all in one place</li>
          </ul>
        </div>
        <div className="text-sm text-white/70">Prohibited: sexual services, illegal activity — see community guidelines.</div>
      </div>
      <div className="flex items-center justify-center p-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="font-display text-3xl text-teal-900 mb-1">Create account</h1>
          <p className="text-sm text-sand-600 mb-6">Adults only — 18+ platform.</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3 mb-4">{error}</div>}
          <div className="space-y-3.5">
            <Input label="Display name" required value={form.displayName} onChange={set('displayName')} placeholder="Your name" />
            <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
            <Input label="Phone (Indian, +91)" required value={form.phone} onChange={set('phone')} placeholder="+9198XXXXXXXX" />
            <Input label="Date of birth" type="date" required value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            <Input label="Password (min 10 chars)" type="password" required value={form.password} onChange={set('password')} />
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1 w-4 h-4 accent-teal-700" />
              <span>I confirm I am 18 or older and agree to the Terms &amp; Community Guidelines.</span>
            </label>
          </div>
          <Button size="lg" className="w-full mt-5" disabled={loading}>
            {loading ? <Spinner /> : 'Create account'}
          </Button>
          <p className="text-sm text-sand-600 mt-4 text-center">
            Already have an account? <Link href="/login" className="text-teal-700 font-bold">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
