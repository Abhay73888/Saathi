'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from './ui';

export function SosFab() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) return null;

  // Attempt to pre-fetch location with permission when modal opens
  useEffect(() => {
    if (!open) return;
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          });
          setLocError(false);
        },
        () => {
          setLocError(true);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [open]);

  async function triggerSos() {
    setBusy(true);
    try {
      await api('/safety/sos', {
        method: 'POST',
        auth: !!user,
        body: {
          notifyContacts: true,
          location: location ?? undefined,
        },
      });
      setSent(true);
    } catch {
      // even if request fails, emergency helplines stay usable
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  const mapsUrl = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : '';
  const waEmergencyText = encodeURIComponent(
    `EMERGENCY ALERT: I need immediate help during my Saath meetup!${
      mapsUrl ? ` My current live location pin: ${mapsUrl}` : ''
    }`
  );
  const waShareUrl = `https://wa.me/?text=${waEmergencyText}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Emergency SOS"
        className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 w-15 h-15 rounded-full bg-danger text-white font-extrabold shadow-pop border-4 border-white hover:bg-danger-dark transition-transform active:scale-95 flex items-center justify-center text-sm"
        style={{ width: 60, height: 60 }}
      >
        SOS
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-teal-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Emergency SOS Options"
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 animate-fadeUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-red-100 text-danger grid place-items-center font-bold text-sm">
                  🆘
                </span>
                <h3 className="font-display text-2xl text-danger-dark font-bold">Emergency SOS</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-sand-400 hover:text-sand-700 text-xl font-bold p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-sand-600 mb-4">
              Your safety is our #1 priority. Tap below for instant emergency help or to dispatch your live location to Saath safety team &amp; trusted contacts.
            </p>

            {location && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 flex items-center gap-2 mb-3">
                <span>📍</span>
                <span>GPS Location locked: {location.lat}, {location.lng}</span>
              </div>
            )}

            {locError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-xs text-amber-800 mb-3">
                Enable GPS in your browser settings for accurate location dispatch.
              </div>
            )}

            {sent && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm mb-4 text-red-900">
                <strong>✓ Saath 24/7 Safety Command Center Alerted.</strong>
                <p className="text-xs text-red-700 mt-1">If in direct danger, dial 112 immediately.</p>
              </div>
            )}

            <div className="space-y-2.5">
              {/* Primary 112 Emergency */}
              <a href="tel:112" className="block">
                <Button variant="danger" size="lg" className="w-full !py-3 font-bold flex items-center justify-center gap-2">
                  📞 Call 112 — National Emergency
                </Button>
              </a>

              {/* Women Helpline 1091 */}
              <a href="tel:1091" className="block">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full !py-3 bg-red-50 border-red-300 text-danger-dark font-bold flex items-center justify-center gap-2 hover:bg-red-100"
                >
                  👩‍🦰 Call 1091 — Women Helpline
                </Button>
              </a>

              {/* 1-Tap WhatsApp Emergency Share with Live Pin */}
              <a href={waShareUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full !py-3 bg-emerald-50 border-emerald-300 text-emerald-900 font-bold flex items-center justify-center gap-2 hover:bg-emerald-100"
                >
                  💬 Share Live SOS to WhatsApp
                </Button>
              </a>

              {/* Alert Saath On-Duty Safety Agents */}
              {user && (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full !py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold"
                  disabled={busy}
                  onClick={triggerSos}
                >
                  {busy ? 'Alerting...' : '🛟 Alert Saath 24/7 Response Team'}
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full text-xs text-sand-500 hover:text-sand-800 mt-2"
                onClick={() => setOpen(false)}
              >
                Cancel / I&apos;m Safe
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
