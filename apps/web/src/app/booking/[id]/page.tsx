'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, formatINR } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Spinner } from '@/components/ui';

interface BookingFull {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  meetingType: string;
  meetingArea: string | null;
  note: string | null;
  basePaise: number;
  commissionPaise: number;
  taxPaise: number;
  totalPaise: number;
  experience: { name: string; icon: string };
  companion: { id: string; displayName: string; userId: string };
  conversation: { id: string } | null;
  checkin: { status: string } | null;
  payments: { id: string; status: string; providerOrderId: string | null }[];
  meetupPin?: string;
}

const STEPS = ['REQUESTED', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];

export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingFull | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [reviewDone, setReviewDone] = useState(false);
  const [review, setReview] = useState({ overall: 5, communication: 5, punctuality: 5, respect: 5, experience: 5, comment: '' });

  const load = useCallback(async () => {
    try {
      setBooking(await api<BookingFull>(`/bookings/${id}`));
    } catch {
      setError('Booking not found.');
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function act(path: string, body?: unknown, label?: string) {
    setBusy(label ?? path);
    setError('');
    try {
      await api(path, { method: 'POST', body });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy('');
    }
  }

  async function pay() {
    setBusy('pay');
    try {
      const order = await api<{ order: { orderId: string; amountPaise: number } }>(`/bookings/${id}/payment-order`, { method: 'POST' });

      let payConfig = { mock: true, keyId: 'mock_key' };
      try {
        const cfgRes = await api<{ data: { mock: boolean; keyId: string } }>('/payments/config');
        payConfig = cfgRes.data;
      } catch {
        // fallback to dev mock
      }

      if (payConfig.mock) {
        await api('/payments/mock-capture', { method: 'POST', body: { orderId: order.order.orderId } });
        await load();
      } else {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            const rzp = new (window as any).Razorpay({
              key: payConfig.keyId,
              amount: order.order.amountPaise,
              currency: 'INR',
              name: 'Saath Companionship',
              description: `Booking #${id.slice(0, 8)}`,
              order_id: order.order.orderId,
              handler: async () => {
                await load();
                resolve();
              },
              modal: {
                ondismiss: () => {
                  resolve();
                },
              },
              theme: { color: '#0f766e' },
            });
            rzp.open();
          };
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(script);
        });
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setBusy('');
    }
  }

  async function submitReview() {
    setBusy('review');
    try {
      await api('/reviews', { method: 'POST', body: { bookingId: id, ...review } });
      setReviewDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setBusy('');
    }
    void review;
  }

  const isCompanion = booking?.companion.userId === user?.id;

  if (error) return <div className="max-w-2xl mx-auto p-8 text-center"><p className="text-danger mb-4">{error}</p><Button onClick={() => router.push('/bookings')}>Back to bookings</Button></div>;
  if (!booking) return <div className="min-h-[40vh] flex items-center justify-center text-sand-600"><Spinner /></div>;

  const stepIndex = STEPS.indexOf(booking.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/bookings" className="text-sm font-bold text-teal-700">← Back to bookings</Link>

      <div className="flex items-start justify-between mt-3 mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-teal-900">{booking.experience.icon} {booking.experience.name}</h1>
          <p className="text-sand-600 mt-1">
            with <Link href={`/companion/${booking.companion.id}`} className="text-teal-700 font-bold">{booking.companion.displayName}</Link>
            {' · '}{new Date(booking.startAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>
        <span className="rounded-xl bg-teal-50 text-teal-800 px-3 py-1.5 text-sm font-bold">{booking.status.replace(/_/g, ' ')}</span>
      </div>

      {/* Stepper */}
      <Card className="p-5 mb-6">
        <div className="flex items-center gap-1">
          {['Requested', 'Payment', 'Confirmed', 'In progress', 'Completed'].map((label, i) => (
            <div key={label} className="flex-1 flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-none ${i <= stepIndex ? 'bg-teal-700 text-white' : 'bg-sand-100 text-sand-400'}`}>
                {i + 1}
              </div>
              <span className="hidden sm:block text-[11px] ml-1.5 font-semibold text-sand-600">{label}</span>
              {i < 4 && <div className={`h-0.5 flex-1 mx-1 ${i < stepIndex ? 'bg-teal-700' : 'bg-sand-200'}`} />}
            </div>
          ))}
        </div>
      </Card>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-bold mb-3">Details</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-sand-600">Type</dt><dd className="font-semibold">{booking.meetingType === 'IN_PERSON' ? 'In person' : 'Online'}</dd></div>
            {booking.meetingArea && <div className="flex justify-between"><dt className="text-sand-600">Area</dt><dd className="font-semibold">{booking.meetingArea}</dd></div>}
            <div className="flex justify-between"><dt className="text-sand-600">Duration</dt><dd className="font-semibold">{booking.durationMinutes} min</dd></div>
            {booking.note && <div className="pt-2 border-t border-sand-100"><dt className="text-sand-600 mb-1">Note</dt><dd>{booking.note}</dd></div>}
          </dl>
          <div className="border-t border-sand-200 mt-4 pt-3 text-sm">
            <div className="flex justify-between py-0.5 text-sand-600"><span>Base</span><span className="tabular">{formatINR(booking.basePaise)}</span></div>
            <div className="flex justify-between py-0.5 text-sand-600"><span>Platform fee</span><span className="tabular">{formatINR(booking.commissionPaise)}</span></div>
            <div className="flex justify-between py-1 font-extrabold"><span>Total</span><span className="tabular text-teal-800">{formatINR(booking.totalPaise)}</span></div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold mb-3">Actions</h2>
          <div className="flex flex-col gap-2">
            {booking.conversation && (
              <Link href={`/messages?c=${booking.conversation.id}`}><Button variant="secondary" className="w-full">💬 Open chat</Button></Link>
            )}

            {booking.status === 'REQUESTED' && isCompanion && (
              <>
                <Button disabled={busy !== ''} onClick={() => act(`/bookings/${id}/accept`, {}, 'accept')}>
                  {busy === 'accept' ? <Spinner /> : 'Accept request'}
                </Button>
                <Button variant="danger" className="bg-white !text-danger border border-red-200" disabled={busy !== ''} onClick={() => act(`/bookings/${id}/reject`, {}, 'reject')}>
                  Decline
                </Button>
              </>
            )}

            {booking.status === 'PENDING_PAYMENT' && !isCompanion && (
              <Button size="lg" disabled={busy === 'pay'} onClick={pay}>
                {busy === 'pay' ? <Spinner /> : `Pay securely — ${formatINR(booking.totalPaise)}`}
              </Button>
            )}

            {(booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') && (
              <>
                {booking.checkin?.status === 'NOT_STARTED' && (
                  <div className="space-y-3">
                    {isCompanion ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                        <span className="text-xs uppercase tracking-wider text-emerald-800 font-bold block">
                          🔑 Your Secret Meetup Handshake PIN
                        </span>
                        <div className="text-3xl font-black text-emerald-950 tracking-widest my-1 font-mono">
                          {booking.meetupPin ?? '----'}
                        </div>
                        <p className="text-xs text-emerald-700">
                          Tell this 4-digit PIN to your client when you meet at the public venue. Once they enter it, the session will unlock!
                        </p>
                      </div>
                    ) : (
                      <div className="bg-sand-50 border border-sand-200 rounded-xl p-4">
                        <span className="text-xs uppercase tracking-wider text-sand-800 font-bold block mb-1">
                          🤝 Meetup Handshake Verification
                        </span>
                        <p className="text-xs text-sand-600 mb-3">
                          Ask your companion for their 4-digit secret PIN upon meeting in person to verify their identity and start the meetup:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={4}
                            value={enteredPin}
                            onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="4-digit PIN"
                            className="w-32 h-11 text-center font-mono font-bold text-lg rounded-lg border border-sand-300 focus:outline-none focus:border-teal-600"
                          />
                          <Button
                            className="flex-1 font-bold"
                            disabled={busy === 'checkin' || enteredPin.length !== 4}
                            onClick={() => act(`/bookings/${id}/checkin`, { pin: enteredPin }, 'checkin')}
                          >
                            {busy === 'checkin' ? <Spinner /> : 'Verify PIN & Start'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Online fallback check-in or companion checkin */}
                    {booking.meetingType === 'ONLINE' && (
                      <Button onClick={() => act(`/bookings/${id}/checkin`, {}, 'checkin')} disabled={busy === 'checkin'}>
                        {busy === 'checkin' ? <Spinner /> : '🟢 Start Online Session'}
                      </Button>
                    )}
                  </div>
                )}

                {booking.checkin?.status === 'CHECKED_IN' && (
                  <div className="space-y-2">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center text-xs font-bold text-emerald-800">
                      🟢 Meetup in progress — Have a wonderful time!
                    </div>
                    <Button onClick={() => act(`/bookings/${id}/checkout`, {}, 'checkout')} disabled={busy === 'checkout'}>
                      {busy === 'checkout' ? <Spinner /> : '🔴 Check out — Meetup ended safely'}
                    </Button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const lat = pos.coords.latitude.toFixed(5);
                          const lng = pos.coords.longitude.toFixed(5);
                          const text = encodeURIComponent(
                            `EMERGENCY ALERT: I am on a Saath booking (#${id.slice(0, 8)}) and need assistance. My live GPS location: https://maps.google.com/?q=${lat},${lng}`
                          );
                          window.open(`https://wa.me/?text=${text}`, '_blank');
                        },
                        () => {
                          const text = encodeURIComponent(
                            `EMERGENCY ALERT: I am on a Saath booking (#${id.slice(0, 8)}) and need assistance.`
                          );
                          window.open(`https://wa.me/?text=${text}`, '_blank');
                        },
                        { timeout: 5000 }
                      );
                    }
                  }}
                  className="w-full text-xs font-bold py-2.5 px-3 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 flex items-center justify-center gap-1.5 transition"
                >
                  <span>🆘 1-Tap Emergency WhatsApp with Live GPS</span>
                </button>

                <Button variant="secondary" onClick={() => {
                  const reason = prompt('Reason for cancellation?');
                  if (reason) act(`/bookings/${id}/cancel`, { reason }, 'cancel');
                }} disabled={!!busy}>
                  Cancel booking
                </Button>
              </>
            )}

            {booking.status === 'COMPLETED' && !isCompanion && !reviewDone && (
              <div className="border-t border-sand-200 pt-3 mt-1">
                <h3 className="font-bold text-sm mb-2">Rate this experience</h3>
                {(['communication', 'punctuality', 'respect', 'experience', 'overall'] as const).map((k) => (
                  <label key={k} className="flex items-center justify-between text-sm mb-1.5 capitalize">
                    {k}
                    <select
                      value={review[k]}
                      onChange={(e) => setReview((r) => ({ ...r, [k]: Number(e.target.value) }))}
                      className="border border-sand-200 rounded px-2 py-1"
                    >
                      {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                    </select>
                  </label>
                ))}
                <textarea
                  value={review.comment}
                  onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
                  placeholder="Share a short review…"
                  className="w-full border border-sand-200 rounded-lg p-2 text-sm mb-2"
                />
                <Button className="w-full" disabled={busy === 'review'} onClick={submitReview}>
                  {busy === 'review' ? <Spinner /> : 'Submit review'}
                </Button>
              </div>
            )}
            {(booking.status === 'COMPLETED' || reviewDone) && reviewDone && (
              <p className="text-sm text-success font-semibold">✓ Thanks for reviewing!</p>
            )}

            <Link href="/safety"><Button variant="ghost" className="w-full">🛟 Safety tools &amp; report</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
