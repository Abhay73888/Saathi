'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if already installed / opened in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone || dismissed || !promptEvent) return null;

  async function handleInstall() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setPromptEvent(null);
    } else {
      setDismissed(true);
    }
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-teal-900 text-white rounded-2xl p-4 shadow-pop border border-teal-700/80 animate-fadeUp">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center flex-none text-xl shadow-sm">
          📱
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-white">Get the Saath App</h4>
          <p className="text-xs text-teal-100/90 mt-0.5 leading-relaxed">
            Install on your phone for instant chat notifications, live GPS safety tracking &amp; 1-tap SOS.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              variant="primary"
              size="sm"
              className="bg-marigold-500 hover:bg-marigold-600 !text-teal-950 font-bold px-3.5 py-1.5 text-xs"
              onClick={handleInstall}
            >
              Add to Home Screen
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-teal-200/80 hover:text-white px-2 py-1"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
