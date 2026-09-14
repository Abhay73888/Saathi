'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { api, formatINR } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Spinner } from './ui';

interface BookingCompanion {
  id: string;
  services: {
    id: string;
    experience: { id: string; name: string; icon?: string };
    pricingModel: 'HOURLY' | 'SESSION';
    ratePaise: number;
    minDurationMinutes: number;
  }[];
}

interface Slot { startAt: string; endAt: string }

export function BookingWidget({ companion, isAuthenticated }: { companion: BookingCompanion; isAuthenticated: boolean }) {
  const { user } = useAuth();
  const [experienceId, setExperienceId] = useState(companion.services[0]?.experience.id ?? '');
  const [duration, setDuration] = useState(120);
  const [meetingType, setMeetingType] = useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON');
  const [date, setDate] = useState('');
  const [slotStart, setSlotStart] = useState('');
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'creating' | 'created' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);

  const service = companion.services.find((s) => s.experience.id === experienceId) ?? companion.services[0];
  const rate = service ? Number(service.ratePaise) : 0;
  const price = useMemo(() => {
    if (!service) return { base: 0, commission: 0 };
    const base =
      service.pricingModel === 'HOURLY'
        ? rate * Math.max(1, Math.ceil(duration / 60))
        : rate;
    const commission = Math.round(base * 0.15);
    return { base, commission };
  }, [service, rate, duration]);

  async function fetchSlots(d: string) {
    setDate(d);
    setSlotStart('');
    if (!d) return;
    setLoadingSlots(true);
    try {
      const res = await api<Slot[]>(`/companions/${companion.id}/availability?date=${d}&duration=${duration}`);
      setSlots(res);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function requestBooking() {
    if (!isAuthenticated) return;
    if (!slotStart) {
      setMessage('Please choose an available time slot.');
      setState('error');
      return;
    }
    setState('creating');
    setMessage('');
    try {
      const booking = await api<{ id: string }>('/bookings', {
        method: 'POST',
        body: {
          companionId: companion.id,
          experienceId,
          startAt: slotStart,
          durationMinutes: duration,
          meetingType,
          note: note || undefined,
        },
      });
      setBookingId(booking.id);
      setState('created');
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : 'Could not create booking.');
    }
  }

  const today = new Date();
  const maxDate = new Date(Date.now() + 60 * 86400e3);

  if (state === 'created' && bookingId) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-sand-200/60 p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-3xl mb-3">✓</div>
        <h3 className="font-display text-2xl text-teal-900 mb-1">Booking requested!</h3>
        <p className="text-sm text-sand-600 mb-5">
          The companion will accept shortly. You&apos;ll pay securely once they confirm.
        </p>
        <Link href={`/booking/${bookingId}`}><Button className="w-full">Go to booking</Button></Link>
        <p className="mt-3 text-xs text-sand-600">Free cancellation up to 48 hours before.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-sand-200/60 p-6">
      <h3 className="font-display text-xl mb-4">Request a booking</h3>

      <label className="block mb-4">
        <span className="block text-sm font-bold mb-1.5">Experience</span>
        <select
          value={experienceId}
          onChange={(e) => setExperienceId(e.target.value)}
          className="w-full h-11 rounded-lg border border-sand-200 px-3 text-base bg-white focus:outline-none focus:border-teal-600"
        >
          {companion.services.map((s) => (
            <option key={s.id} value={s.experience.id}>
              {s.experience.icon ?? ""} {s.experience.name} — {formatINR(s.ratePaise)}{s.pricingModel === 'HOURLY' ? '/hr' : ''}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-4">
        <span className="block text-sm font-bold mb-1.5">Meeting type</span>
        <div className="flex bg-sand-100 rounded-lg p-1 gap-1">
          {(['IN_PERSON', 'ONLINE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMeetingType(t)}
              className={`flex-1 h-9 rounded-md text-sm font-bold transition ${meetingType === t ? 'bg-white shadow-sm text-teal-800' : 'text-sand-600'}`}
            >
              {t === 'IN_PERSON' ? 'In person' : 'Online'}
            </button>
          ))}
        </div>
      </div>

      <label className="block mb-3">
        <span className="block text-sm font-bold mb-1.5">Duration</span>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full h-11 rounded-lg border border-sand-200 px-3 text-base bg-white focus:outline-none focus:border-teal-600"
        >
          {[60, 90, 120, 180, 240].map((m) => (
            <option key={m} value={m}>{m / 60} hour{m > 60 ? 's' : ''}</option>
          ))}
        </select>
      </label>

      <label className="block mb-3">
        <span className="block text-sm font-bold mb-1.5">Date</span>
        <input
          type="date"
          value={date}
          min={today.toISOString().slice(0, 10)}
          max={maxDate.toISOString().slice(0, 10)}
          onChange={(e) => fetchSlots(e.target.value)}
          className="w-full h-11 rounded-lg border border-sand-200 px-3 text-base focus:outline-none focus:border-teal-600"
        />
      </label>

      {date && (
        <div className="mb-4">
          <span className="block text-sm font-bold mb-1.5">Available slots</span>
          {loadingSlots ? (
            <div className="flex items-center gap-2 text-sm text-sand-600"><Spinner /> Checking availability…</div>
          ) : slots && slots.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {slots.map((s) => {
                const label = new Date(s.startAt).toLocaleString('en-IN', {
                  hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric', hour12: true,
                });
                return (
                  <button
                    key={s.startAt}
                    onClick={() => setSlotStart(s.startAt)}
                    className={`rounded-full px-3.5 py-2 text-sm font-bold border transition ${
                      slotStart === s.startAt ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-sand-200 hover:border-teal-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-sand-600">No free slots that long on this date.</p>
          )}
        </div>
      )}

      <label className="block mb-4">
        <span className="block text-[13px] font-bold mb-1.5">Note (optional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="Anything your companion should know — e.g. café preference."
          className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm focus:outline-none focus:border-teal-600 min-h-[70px]"
        />
      </label>

      <div className="border-t border-sand-200 pt-3 mb-4 text-sm">
        <div className="flex justify-between py-0.5 text-sand-600">
          <span>Base</span><span className="tabular">{formatINR(price.base)}</span>
        </div>
        <div className="flex justify-between py-0.5 text-sand-600">
          <span>Platform fee</span><span className="tabular">included</span>
        </div>
        <div className="flex justify-between py-1 font-extrabold text-base border-t border-dashed border-sand-200 mt-1">
          <span>You pay</span><span className="tabular text-teal-800">{formatINR(price.base)}</span>
        </div>
      </div>

      {state === 'error' && <p className="text-sm text-danger mb-3">{message}</p>}

      {isAuthenticated ? (
        <>
          {user?.companionProfile?.id === companion.id ? (
            <p className="text-sm text-sand-600 text-center">This is your own profile.</p>
          ) : (
            <Button size="lg" className="w-full" disabled={state === 'creating'} onClick={requestBooking}>
              {state === 'creating' ? <Spinner /> : 'Request a Booking'}
            </Button>
          )}
        </>
      ) : (
        <Link href="/login"><Button size="lg" className="w-full">Sign in to book</Button></Link>
      )}
    </div>
  );
}
