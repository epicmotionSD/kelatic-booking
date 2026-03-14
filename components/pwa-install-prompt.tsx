'use client';

import { useEffect, useMemo, useState } from 'react';

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function isRunningStandalone() {
  if (typeof window === 'undefined') return false;
  const mediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const navigatorStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mediaStandalone || navigatorStandalone;
}

function isIosSafari() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  return isIos && isSafari;
}

function isIosDevice() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua);
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  const iosMode = useMemo(() => isIosSafari(), []);
  const iosDevice = useMemo(() => isIosDevice(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }

    if (isRunningStandalone()) {
      return;
    }

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const dismissedRecently = dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_TTL_MS;
    if (dismissedRecently) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    if (iosDevice) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [iosMode, iosDevice]);

  async function handleInstall() {
    if (!deferredPrompt) return;

    try {
      setInstalling(true);
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setVisible(false);
    } catch (error) {
      console.error('PWA install prompt failed:', error);
    } finally {
      setInstalling(false);
    }
  }

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setVisible(false);
  }

  if (!visible || isRunningStandalone()) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-[360px] z-[70]">
      <div className="rounded-2xl border border-white/15 bg-zinc-900/95 backdrop-blur p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-white font-semibold">Install App</p>
            <p className="text-white/70 text-sm mt-1">
              {iosMode
                ? 'On iPhone Safari: tap Share, then “Add to Home Screen”.'
                : iosDevice
                ? 'On iPhone, install works in Safari. Open this page in Safari first.'
                : 'Install this app for faster access and a better in-salon experience.'}
            </p>
            {iosMode && (
              <p className="text-white/60 text-xs mt-2">
                If you don’t see “Add to Home Screen,” scroll down in the Share menu.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-white/50 hover:text-white/80"
            aria-label="Dismiss install prompt"
            title="Dismiss"
          >
            ✕
          </button>
        </div>

        {!iosDevice && deferredPrompt && (
          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="mt-3 w-full rounded-xl px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
          >
            {installing ? 'Installing...' : 'Install'}
          </button>
        )}
      </div>
    </div>
  );
}
