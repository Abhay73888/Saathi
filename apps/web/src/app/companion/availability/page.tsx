'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Button, Card, Spinner } from '@/components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
type Slot = { dayOfWeek: number; startTime: string; endTime: string };
type Service = { id: string; experience: { id: string; name: string; slug: string }; pricingModel: string; ratePaise: number; minDurationMinutes: number };
type Category = { id: string; name: string; slug: string; icon: string };

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Record<number, Slot | null>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ services: Service[] }>('/companions/me').then((p) => {
      setServices(p.services);
      const r: Record<string, string> = {};
      for (const s of p.services) r[s.experience.id] = String(Number(s.ratePaise) / 100);
      setRates(r);
    }).catch(() => {});
    api<Category[]>('/experience-categories').then(setCategories);
  }, []);

  function toggleDay(d: number, on: boolean) {
    setSlots((prev) => ({ ...prev, [d]: on ? { dayOfWeek: d, startTime: '10:00', endTime: '19:00' } : null }));
  }

  async function save() {
    setBusy(true);
    try {
      await api('/companions/me/availability', {
        method: 'PUT',
        body: { slots: Object.values(slots).filter(Boolean), overrides: [] },
      });
      const active = categories
        .filter((c) => rates[c.id] && Number(rates[c.id]) > 0)
        .map((c) => ({
          experienceId: c.id,
          pricingModel: 'HOURLY',
          ratePaise: Math.round(Number(rates[c.id]) * 100),
          minDurationMinutes: 60,
          isActive: true,
        }));
      await api('/companions/me/services', { method: 'PUT', body: { services: active } });
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Availability & pricing">
      <Card className="p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">Weekly hours</h2>
        <div className="space-y-3">
          {DAYS.map((day, d) => {
            const slot = slots[d];
            return (
              <div key={day} className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 w-32 font-semibold text-sm">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-teal-700"
                    checked={!!slot}
                    onChange={(e) => toggleDay(d, e.target.checked)}
                  />
                  {day}
                </label>
                {slot && (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => setSlots((p) => ({ ...p, [d]: { ...p[d]!, startTime: e.target.value } }))}
                      className="border border-sand-200 rounded px-2 py-1.5"
                    />
                    <span className="text-sand-400">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => setSlots((p) => ({ ...p, [d]: { ...p[d]!, endTime: e.target.value } }))}
                      className="border border-sand-200 rounded px-2 py-1.5"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="font-bold text-lg mb-1">Pricing (₹ per hour)</h2>
        <p className="text-sm text-sand-600 mb-4">Set rates only for experiences you offer.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-3 bg-sand-50 rounded-lg px-3 py-2">
              <span className="text-xl">{c.icon}</span>
              <span className="flex-1 text-sm font-semibold">{c.name}</span>
              <span className="text-sm">₹</span>
              <input
                type="number"
                min={99}
                placeholder="—"
                value={rates[c.id] ?? ''}
                onChange={(e) => setRates((r) => ({ ...r, [c.id]: e.target.value }))}
                className="w-20 border border-sand-200 rounded px-2 py-1 text-sm"
              />
            </label>
          ))}
        </div>
      </Card>

      {saved && <p className="text-sm text-success font-semibold mb-3">✓ Saved. Your availability is live for verified bookings.</p>}
      <Button size="lg" onClick={save} disabled={busy}>{busy ? <Spinner /> : 'Save & publish'}</Button>
    </AppShell>
  );
}
