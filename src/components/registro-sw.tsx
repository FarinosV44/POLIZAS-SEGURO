'use client';

import { useEffect } from 'react';

/** Registra el service worker (notificaciones y página sin conexión). */
export function RegistroSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);
  return null;
}
