'use client';

import { useState } from 'react';
import { Badge, Button, ShieldIcon } from './ui';

export function DualPinDemo() {
  const [pinEntered, setPinEntered] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const handleSimulate = () => {
    setPinEntered(true);
    setTimeout(() => {
      setUnlocked(true);
    }, 700);
  };

  const handleReset = () => {
    setPinEntered(false);
    setUnlocked(false);
  };

  return (
    <div className="bg-gradient-to-br from-teal-950 via-teal-900 to-sand-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-teal-700/40 relative overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider mb-2">
            <ShieldIcon className="w-3.5 h-3.5" />
            Safety In Action
          </span>
          <h3 className="font-display font-bold text-2xl md:text-3xl text-white">
            Dual-PIN Mutual Safety Handshake
          </h3>
          <p className="text-teal-200/90 text-sm mt-1 max-w-xl">
            Meetups only begin once both client and companion enter their secret 4-digit matching codes in public. Zero ambiguity.
          </p>
        </div>

        <Badge tone={unlocked ? 'success' : 'warning'} className="text-xs py-1 px-3">
          {unlocked ? '🟢 Session Verified & Active' : '🟡 Awaiting Mutual Verification'}
        </Badge>
      </div>

      {/* Simulator Device Box */}
      <div className="grid md:grid-cols-2 gap-6 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
        {/* Client side */}
        <div className="bg-white/10 rounded-xl p-4 border border-white/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold text-teal-300 tracking-wider">Client Screen</span>
            <span className="text-xs text-white/80">Aakash (Bengaluru)</span>
          </div>
          <div className="text-center py-4">
            <span className="text-xs text-teal-200 block mb-1">Your Mutual Start PIN</span>
            <div className="inline-flex gap-2">
              {['7', '4', '9', '2'].map((digit, i) => (
                <span
                  key={i}
                  className={`w-10 h-12 rounded-lg flex items-center justify-center font-display font-black text-xl border transition-all ${
                    unlocked
                      ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 scale-105'
                      : 'bg-white/20 border-white/30 text-white'
                  }`}
                >
                  {digit}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-teal-200/70 mt-2">
              Show this 4-digit code to your companion upon meeting at cafe.
            </p>
          </div>
        </div>

        {/* Companion side */}
        <div className="bg-white/10 rounded-xl p-4 border border-white/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold text-teal-300 tracking-wider">Companion App</span>
            <span className="text-xs text-white/80">Ananya (Verified Companion)</span>
          </div>
          <div className="text-center py-4">
            <span className="text-xs text-teal-200 block mb-1">Companion Verification Input</span>
            <div className="inline-flex gap-2">
              {['7', '4', '9', '2'].map((digit, i) => (
                <span
                  key={i}
                  className={`w-10 h-12 rounded-lg flex items-center justify-center font-display font-black text-xl border transition-all ${
                    unlocked
                      ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                      : pinEntered
                      ? 'bg-teal-500/30 border-teal-400 text-teal-200'
                      : 'bg-black/30 border-white/20 text-sand-400'
                  }`}
                >
                  {pinEntered || unlocked ? digit : '•'}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-teal-200/70 mt-2">
              Companion enters client&apos;s PIN into their app to unlock session timer.
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Actions */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          {!unlocked ? (
            <Button
              variant="light"
              size="md"
              onClick={handleSimulate}
              className="text-teal-950 font-black shadow-lg hover:scale-105 transition-transform"
            >
              ⚡ Test Verification Handshake
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={handleReset}
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              🔄 Reset Demo
            </Button>
          )}

          {unlocked && (
            <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5 animate-fadeUp">
              ✓ Both parties validated! Live GPS SOS armed.
            </span>
          )}
        </div>

        <span className="text-xs text-teal-300/80">
          📍 Meetups strictly in public zones (cafes, malls, public venues).
        </span>
      </div>
    </div>
  );
}
