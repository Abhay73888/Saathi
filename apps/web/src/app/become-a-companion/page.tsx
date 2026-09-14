'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Input, Spinner } from '@/components/ui';

export default function BecomeCompanionPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(user?.companionProfile ? 4 : 1);
  const [form, setForm] = useState({
    displayName: user?.customerProfile?.displayName ?? '',
    tagline: '',
    bio: '',
    city: user?.customerProfile?.city ?? '',
    area: '',
    languages: 'English',
    interests: '',
    meetingTypes: ['IN_PERSON'] as string[],
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/companions/apply', {
        method: 'POST',
        body: {
          ...form,
          languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
          interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
        },
      });
      await refresh();
      setStep(4);
      router.push('/verification');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="min-h-[50vh] grid place-items-center"><Spinner /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-4xl text-teal-900 mb-2">Become a companion</h1>
      <p className="text-sand-600 mb-8">Earn on your schedule — every companion is identity &amp; age verified before going live.</p>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        {['Benefits', 'Eligibility', 'Profile', 'Verification'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full grid place-items-center font-bold text-xs ${step > i ? 'bg-teal-700 text-white' : step === i + 1 ? 'bg-teal-700 text-white' : 'bg-sand-200 text-sand-600'}`}>{i + 1}</span>
            <span className={step >= i + 1 ? 'font-bold' : 'text-sand-400'}>{s}</span>
            {i < 3 && <span className="w-6 h-px bg-sand-200 mx-1" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-7">
          <h2 className="font-bold text-lg mb-4">Why companions choose Saath</h2>
          <ul className="space-y-3 text-sm text-sand-600 mb-6">
            <li>💰 Transparent earnings — you set your own rates, commission is shown up front</li>
            <li>🛡 Verified-only marketplace — every customer is phone &amp; email verified</li>
            <li>🆘 Safety tools built in — check-ins, trusted contacts and SOS on every booking</li>
            <li>💬 Moderated chat keeps payments on-platform and scams out</li>
          </ul>
          <Button size="lg" onClick={() => setStep(2)}>Continue →</Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-7">
          <h2 className="font-bold text-lg mb-4">Eligibility</h2>
          <ul className="space-y-3 text-sm mb-6">
            {['You are 18 or older', 'You can complete government ID + liveness verification', 'You offer legitimate social companionship only — no prohibited services', 'You meet in public places for in-person sessions'].map((r) => (
              <li key={r} className="flex gap-2"><span className="text-success">✓</span> {r}</li>
            ))}
          </ul>
          <Button size="lg" onClick={() => setStep(3)}>I meet the requirements →</Button>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-7">
          <form onSubmit={submit} className="space-y-4">
            <Input label="Display name" required value={form.displayName} onChange={(e) => set('displayName', e.target.value)} />
            <Input label="Tagline (short hook)" required value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Coffee, long walks and indie films" />
            <label className="block">
              <span className="block text-[13px] font-bold mb-1.5">Bio (min 30 characters)</span>
              <textarea
                required minLength={30} maxLength={2000}
                value={form.bio} onChange={(e) => set('bio', e.target.value)}
                className="w-full rounded-lg border border-sand-200 px-3.5 py-2.5 min-h-[110px] focus:outline-none focus:border-teal-600"
              />
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="City" required value={form.city} onChange={(e) => set('city', e.target.value)} />
              <Input label="Area (optional)" value={form.area} onChange={(e) => set('area', e.target.value)} />
            </div>
            <Input label="Languages (comma separated)" required value={form.languages} onChange={(e) => set('languages', e.target.value)} placeholder="English, Hindi" />
            <Input label="Interests (comma separated)" required value={form.interests} onChange={(e) => set('interests', e.target.value)} placeholder="coffee, movies, gaming" />
            <div>
              <span className="block text-[13px] font-bold mb-1.5">Offering</span>
              <div className="flex gap-2">
                {['IN_PERSON', 'ONLINE'].map((t) => (
                  <button type="button" key={t}
                    onClick={() => set('meetingTypes', form.meetingTypes.includes(t) ? form.meetingTypes.filter((x) => x !== t) : [...form.meetingTypes, t])}
                    className={`rounded-full px-4 py-2 text-sm font-bold border ${form.meetingTypes.includes(t) ? 'bg-teal-700 text-white border-teal-700' : 'bg-sand-100 border-transparent'}`}>
                    {t === 'IN_PERSON' ? 'In person' : 'Online'}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button size="lg" type="submit" disabled={busy}>{busy ? <Spinner /> : 'Submit application'}</Button>
          </form>
        </Card>
      )}

      {step === 4 && (
        <Card className="p-7 text-center">
          <div className="text-4xl mb-3">🛡</div>
          <h2 className="font-bold text-xl mb-2">Application received</h2>
          <p className="text-sm text-sand-600 mb-5">Next step: complete identity &amp; age verification. It takes about 2 minutes.</p>
          <Button size="lg" onClick={() => router.push('/verification')}>Start verification →</Button>
        </Card>
      )}
    </div>
  );
}
