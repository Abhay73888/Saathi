'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, formatINR } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Badge, Button, Card, ShieldIcon, Spinner, Stars } from '@/components/ui';
import { BookingWidget } from '@/components/BookingWidget';

interface ServiceInfo {
  id: string;
  experience: { id: string; slug: string; name: string; icon: string };
  pricingModel: 'HOURLY' | 'SESSION';
  ratePaise: number;
  minDurationMinutes: number;
}
interface ReviewInfo {
  id: string;
  overall: number;
  communication: number;
  punctuality: number;
  respect: number;
  experience: number;
  comment: string | null;
  createdAt: string;
  author: string;
}
interface CompanionFull {
  id: string;
  displayName: string;
  tagline: string | null;
  bio: string;
  galleryKeys: string[];
  city: string;
  area: string | null;
  languages: string[];
  interests: string[];
  personalityTags: string[];
  meetingTypes: string[];
  verified: boolean;
  ratingAvg: number;
  ratingCount: number;
  ratingBreakdown: { communication: number; punctuality: number; respect: number; experience: number };
  completedCount: number;
  responseRate: number;
  services: ServiceInfo[];
  reviews: ReviewInfo[];
}

export default function CompanionProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanionFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setProfile(await api<CompanionFull>(`/companions/${id}`));
    } catch {
      setError('This profile is unavailable.');
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-4xl mb-3">🛡</div>
        <h1 className="font-display text-2xl mb-2">Profile unavailable</h1>
        <p className="text-sand-600 mb-6">{error}</p>
        <Button onClick={() => router.push('/explore')}>Back to explore</Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 flex items-center gap-3 text-sand-600">
        <Spinner /> Loading profile…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] items-start">
        <div>
          {/* Header */}
          <div className="flex items-start gap-5 mb-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-800 flex items-center justify-center font-display text-4xl text-white font-semibold">
              {profile.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl text-teal-900 flex items-center gap-2 flex-wrap">
                {profile.displayName}
                {profile.verified && <Badge tone="verified">Verified</Badge>}
              </h1>
              <p className="text-sand-600 mt-1">📍 {profile.city}{profile.area ? ` · ${profile.area}` : ''} · {profile.meetingTypes.map(t => t === 'IN_PERSON' ? 'In person' : 'Online').join(' / ')}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-sand-600 flex-wrap">
                <Stars value={profile.ratingAvg} />
                <span>{profile.ratingCount} reviews</span>
                <span>·</span>
                <span>{profile.completedCount} bookings</span>
                <span>·</span>
                <span>{Math.round(profile.responseRate * 100)}% response rate</span>
              </div>
            </div>
          </div>

          <Card className="p-6 mb-6">
            <h2 className="font-bold text-lg mb-2">About</h2>
            <p className="text-[15px] text-sand-600 leading-relaxed">{profile.bio}</p>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Experiences &amp; pricing</h2>
            <div className="space-y-3">
              {profile.services.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b border-sand-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-semibold">{s.experience.icon} {s.experience.name}</div>
                    <div className="text-xs text-sand-600">Min {s.minDurationMinutes} min · {s.pricingModel === 'HOURLY' ? 'hourly rate' : 'flat session rate'}</div>
                  </div>
                  <div className="font-extrabold text-teal-800 tabular">
                    {formatINR(s.ratePaise)}{s.pricingModel === 'HOURLY' ? '/hr' : ''}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="font-bold text-lg mb-3">Interests &amp; languages</h2>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {profile.interests.map((i) => (
                <span key={i} className="bg-sand-100 rounded-full px-3 py-1 text-sm font-semibold capitalize">{i}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.languages.map((l) => (
                <span key={l} className="bg-teal-50 text-teal-800 rounded-full px-3 py-1 text-sm font-semibold">🗣 {l}</span>
              ))}
            </div>
          </Card>

          {/* Verification panel */}
          <Card className="p-6 mb-6">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><ShieldIcon className="w-5 h-5 text-teal-700" /> Verification</h2>
            <ul className="space-y-2 text-sm">
              {[
                { ok: profile.verified, label: 'Government ID verified' },
                { ok: profile.verified, label: 'Age confirmed 18+' },
                { ok: true, label: 'Phone &amp; email verified' },
                { ok: true, label: 'Profile moderated &amp; approved' },
              ].map((v) => (
                <li key={v.label} className="flex items-center gap-2">
                  <span className={v.ok ? 'text-success' : 'text-sand-400'}>{v.ok ? '✓' : '○'}</span>
                  <span className={v.ok ? '' : 'text-sand-400'}>{v.label}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Reviews */}
          <Card className="p-6">
            <h2 className="font-bold text-lg mb-4">Reviews</h2>
            {profile.reviews.length === 0 ? (
              <p className="text-sm text-sand-600">No reviews yet — reviews appear after completed bookings.</p>
            ) : (
              <div className="space-y-5">
                {profile.reviews.map((r) => (
                  <div key={r.id} className="border-b border-sand-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{r.author}</span>
                      <Stars value={r.overall} />
                    </div>
                    {r.comment && <p className="text-sm text-sand-600 mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Booking rail */}
        <div className="lg:sticky lg:top-20">
          <BookingWidget
            companion={profile}
            isAuthenticated={!!user}
          />
        </div>
      </div>
    </div>
  );
}
