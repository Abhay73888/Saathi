'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button, Input, Spinner, ShieldIcon } from '@/components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
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
          <h2 className="font-display text-3xl mb-3">Welcome back.</h2>
          <p className="text-white/85">Your bookings, messages and safety tools are one tap away.</p>
        </div>
        <div className="text-sm text-white/70">🛡 Verified companions · 🔒 Secure payments · 🆘 24/7 safety</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="font-display text-3xl text-teal-900 mb-1">Sign in</h1>
          <p className="text-sm text-sand-600 mb-6">Demo logins are on the help page.</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3 mb-4">{error}</div>}
          <div className="space-y-4">
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button size="lg" className="w-full mt-6" disabled={loading}>
            {loading ? <Spinner /> : 'Sign in'}
          </Button>
          <p className="text-sm text-sand-600 mt-4 text-center">
            New to Saath? <Link href="/register" className="text-teal-700 font-bold">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
