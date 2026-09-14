'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api('/auth/forgot-password', { method: 'POST', auth: false, body: { email } });
    setSent(true);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="font-display text-3xl text-teal-900 mb-2">Reset password</h1>
      {sent ? (
        <p className="text-sm text-sand-600">If an account exists for that email, a reset link is on its way.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4 mt-6">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button size="lg" className="w-full" type="submit">Send reset link</Button>
        </form>
      )}
      <p className="text-sm text-sand-600 mt-4"><Link href="/login" className="text-teal-700 font-bold">Back to sign in</Link></p>
    </div>
  );
}
