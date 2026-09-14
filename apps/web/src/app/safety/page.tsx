'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { Button, Card, Input } from '@/components/ui';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
}

export default function SafetyPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', relationship: '' });
  const [sosResult, setSosResult] = useState('');
  const [locationStatus, setLocationStatus] = useState<string>('Ready to test');

  useEffect(() => {
    if (!user) return;
    api<Contact[]>('/safety/trusted-contacts').then(setContacts).catch(() => {});
  }, [user]);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    const c = await api<Contact>('/safety/trusted-contacts', { method: 'POST', body: form });
    setContacts((p) => [...p, c]);
    setForm({ name: '', phone: '', relationship: '' });
  }

  async function triggerSos() {
    let loc: { lat: number; lng: number } | undefined = undefined;
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        loc = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
      } catch {
        // proceed even if location fails
      }
    }

    const res = await api<{ safetyTeamAlerted: number; contactsNotified: number }>('/safety/sos', {
      method: 'POST',
      body: { notifyContacts: true, location: loc },
    });
    setSosResult(
      `Safety team alerted (${res.safetyTeamAlerted} on duty). ${res.contactsNotified} trusted contact(s) notified.${
        loc ? ' Live GPS coordinates included.' : ''
      }`
    );
  }

  function testGps() {
    setLocationStatus('Locating device GPS...');
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationStatus(`✓ GPS active: Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)} (Accuracy: ~${Math.round(pos.coords.accuracy)}m)`);
        },
        (err) => {
          setLocationStatus(`⚠️ Location error: ${err.message}. Please allow location permission in browser.`);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationStatus('Geolocation is not supported by your browser.');
    }
  }

  return (
    <AppShell title="Safety center">
      {/* SOS & Emergency Helplines */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-red-50 via-white to-red-50/40 border-red-200">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-danger text-white grid place-items-center font-extrabold text-xl shadow-pop flex-none">
            SOS
          </div>
          <div className="flex-1 min-w-[240px]">
            <h2 className="font-display text-xl text-teal-950 font-bold">24/7 Emergency Response System</h2>
            <p className="text-sm text-sand-600 mb-4 mt-1">
              If you ever feel unsafe or are in immediate danger, use the helplines below or alert the Saath Command Center immediately.
            </p>

            <div className="grid sm:grid-cols-3 gap-2.5 mb-3">
              <a href="tel:112" className="block">
                <Button variant="danger" size="md" className="w-full !py-2.5 font-bold">
                  📞 Call 112 (National Emergency)
                </Button>
              </a>
              <a href="tel:1091" className="block">
                <Button variant="secondary" size="md" className="w-full !py-2.5 bg-red-50 border-red-200 text-danger-dark font-bold hover:bg-red-100">
                  👩‍🦰 Call 1091 (Women Helpline)
                </Button>
              </a>
              <a href="tel:100" className="block">
                <Button variant="secondary" size="md" className="w-full !py-2.5 bg-sand-100 border-sand-300 text-sand-800 font-bold hover:bg-sand-200">
                  👮 Call 100 (Police)
                </Button>
              </a>
            </div>

            <div className="flex gap-2.5 flex-wrap pt-2 border-t border-red-100">
              <Button variant="primary" className="bg-teal-800 hover:bg-teal-900 text-white" onClick={triggerSos}>
                🛟 Dispatch Saath Safety Team Alert
              </Button>
            </div>
            {sosResult && <p className="text-sm text-success mt-3 font-semibold">✓ {sosResult}</p>}
          </div>
        </div>
      </Card>

      {/* Zero-Tolerance Legal & Safety Pledge */}
      <Card className="p-6 mb-6 bg-teal-900 text-white border-teal-800">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🛡️</div>
          <div>
            <h3 className="font-display text-lg font-bold text-teal-100">
              Zero-Tolerance Legal Safety Policy (Platonic Companionship Only)
            </h3>
            <p className="text-sm text-teal-200 mt-1 leading-relaxed">
              Saath is strictly designed for social, lifestyle, and professional companionship (coffee, events, dining, city walks, gaming, and study).
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4 text-xs text-teal-100">
              <div className="bg-teal-950/60 p-3 rounded-xl border border-teal-800">
                <strong>✓ Public Venues Only:</strong> Initial meetups must be in well-lit, public spaces (cafes, malls, restaurants). Private residences/hotel rooms are strictly disallowed.
              </div>
              <div className="bg-teal-950/60 p-3 rounded-xl border border-teal-800">
                <strong>✓ Zero Sexual Solicitation:</strong> Any commercial sex, escort request, or harassment triggers instant ban and reporting under the Immoral Traffic Prevention Act (ITPA).
              </div>
              <div className="bg-teal-950/60 p-3 rounded-xl border border-teal-800">
                <strong>✓ Identity &amp; Age Verified:</strong> All companions are government ID and selfie verified (18+ strictly enforced).
              </div>
              <div className="bg-teal-950/60 p-3 rounded-xl border border-teal-800">
                <strong>✓ Protected Escrow Payments:</strong> Off-platform cash/UPI exchanges are prohibited to safeguard from frauds and extortion.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Trusted Contacts */}
      <Card className="p-6 mb-6">
        <h2 className="font-bold text-lg mb-1">Trusted Contacts (Emergency Circle)</h2>
        <p className="text-sm text-sand-600 mb-4">
          Add up to 3 family members or friends. During active bookings, they can receive your check-in notices or emergency location updates with one tap.
        </p>
        <div className="space-y-2 mb-4">
          {contacts.length === 0 && (
            <p className="text-sm text-sand-500 italic bg-sand-50 p-3 rounded-lg">
              No contacts added yet. Add family or close friends below for peace of mind.
            </p>
          )}
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-sand-50 rounded-xl px-4 py-3 text-sm">
              <span className="font-semibold">
                👤 {c.name}{' '}
                <span className="text-sand-600 font-normal">
                  · {c.relationship ?? 'Contact'} · {c.phone}
                </span>
              </span>
            </div>
          ))}
        </div>
        {contacts.length < 3 && (
          <form onSubmit={addContact} className="grid sm:grid-cols-4 gap-2.5">
            <Input
              placeholder="Full Name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="+91 98XXXXXXXX"
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              placeholder="Relationship (e.g. Sister, Friend)"
              value={form.relationship}
              onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
            />
            <Button type="submit" variant="secondary" className="font-bold">
              + Add Contact
            </Button>
          </form>
        )}
      </Card>

      {/* GPS Location Readiness Check */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-lg">GPS Location Readiness Check</h2>
            <p className="text-sm text-sand-600 mt-0.5">
              Verify your phone or browser location sensor works properly before starting a booking session.
            </p>
            <p className="text-xs text-sand-700 mt-2 font-mono bg-sand-100 px-3 py-1.5 rounded-lg inline-block">
              {locationStatus}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={testGps}>
            📍 Test My Device GPS
          </Button>
        </div>
      </Card>

      {/* Safety Guidelines */}
      <Card className="p-6">
        <h2 className="font-bold text-lg mb-3">5 Golden Rules for Safe Companionship</h2>
        <ul className="text-sm text-sand-600 space-y-2.5">
          <li className="flex items-start gap-2">
            <span className="text-teal-700 font-bold">1.</span>
            <span><strong>Always meet in public:</strong> Recommended spots are prominent cafes (Starbucks, Blue Tokai, Third Wave), malls, art galleries, and cultural centers.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-700 font-bold">2.</span>
            <span><strong>Check in &amp; Check out:</strong> Use the in-app Check-in button as soon as you meet your companion, and Check-out when concluding.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-700 font-bold">3.</span>
            <span><strong>Keep conversation on Saath:</strong> Off-platform chats outside our moderated gateway cannot be protected or reviewed by our safety squad.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-700 font-bold">4.</span>
            <span><strong>No off-book cash payments:</strong> All fees are pre-calculated with GST and commission held in secure platform escrow until safe session completion.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-700 font-bold">5.</span>
            <span><strong>Trust your instincts:</strong> If anything feels uncomfortable at any point, exit the public venue and press the SOS button.</span>
          </li>
        </ul>
      </Card>
    </AppShell>
  );
}
