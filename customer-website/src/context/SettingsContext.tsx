import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiClient } from '../services/api';
import { getSettings as getDefaultSettings, setLiveSettings } from '../services/products';
import type { Settings } from '../types';

interface SettingsContextValue extends Settings {
  loading: boolean;
}

// This is the ONLY place the storefront reads store identity, contact info,
// branding and payment details from. It fetches GET /settings (public,
// backed by Admin → Settings) once on app load. Before that resolves — or if
// the API is unreachable — it falls back to the generic placeholder shape in
// data/settings.json, never to a real store's hardcoded values.
const SettingsContext = createContext<SettingsContextValue>({
  ...getDefaultSettings(),
  loading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(getDefaultSettings());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/settings')
      .then(({ data }) => {
        if (cancelled) return;
        const store = (data?.data?.store ?? {}) as Partial<Settings>;
        // Payment fields (UPI/bank) live in their own Setting row server-side
        // so they can be restricted to SUPER_ADMIN in the admin dashboard —
        // see backend settings.controller.ts. Still merged into the same
        // flattened Settings shape here so every consumer (CheckoutPage etc.)
        // keeps reading settings.paymentUpiId unchanged.
        const paymentSettings = (data?.data?.paymentSettings ?? {}) as Partial<Settings>;
        const defaults = getDefaultSettings();
        const merged: Settings = {
          ...defaults,
          ...store,
          ...paymentSettings,
          socials: { ...defaults.socials, ...(store.socials ?? {}) },
          colors: { ...defaults.colors, ...(store.colors ?? {}) },
          featureFlags: { ...defaults.featureFlags, ...(store.featureFlags ?? {}) },
        };
        setLiveSettings(merged);
        setSettings(merged);
        if (merged.faviconUrl) {
          let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = merged.faviconUrl;
        }
      })
      .catch(() => {
        // Keep the generic fallback — never surface a stale/wrong store's data.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
